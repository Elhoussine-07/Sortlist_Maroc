import frappe
from frappe.model.document import Document
from frappe.utils import add_days, nowdate


class Invoice(Document):
    """Logique cœur Frappe : calculs financiers déterministes et cycle de facturation
    (CDC 2.5.1). Purement transactionnel — aucune dépendance microservice.
    """

    def validate(self):
        # Calcul des montants
        self.total = (self.amount or 0) + (self.tax or 0)
        self.commission_amount = (self.amount or 0) * ((self.commission_rate or 0) / 100)
        self.amount_due = self.total - (self.credit_applied or 0)

        # Vérifications
        if self.amount_due < 0:
            frappe.throw("Le montant net dû ne peut pas être négatif.")

        if self.commission_rate and self.commission_rate < 0:
            frappe.throw("Le taux de commission ne peut pas être négatif.")

        if self.amount and self.amount <= 0:
            frappe.throw("Le montant de la facture doit être supérieur à 0.")

    def before_insert(self):
        self.invoice_number = self._generate_invoice_number()
        self.issue_date = nowdate()

        invoice_due_days = frappe.db.get_single_value("PlatformSettings", "invoice_due_days") or 7
        self.due_date = add_days(self.issue_date, invoice_due_days)

        # Si le statut n'est pas défini, le mettre en "Pending"
        if not self.status:
            self.status = "Pending"

    def after_insert(self):
        """Applique automatiquement les crédits de commission disponibles de
        l'agence sur cette facture (CDC §2.5.2, « Application du crédit »)."""
        self._apply_commission_credits()

    def _apply_commission_credits(self):
        from platform_core.platform_core.doctype.commissioncredit.commissioncredit import (
            apply_available_credits,
        )

        # Le crédit est plafonné à la commission effectivement due (et jamais
        # au-delà du montant net déjà calculé), pour rester fidèle au CDC
        # (« déduit de la commission due ») même si `total` porte, sur ce
        # périmètre, un montant plus large que la seule commission.
        ceiling = min(self.commission_amount or 0, self.amount_due or 0)
        if ceiling <= 0:
            return

        applied = apply_available_credits(self.agency, self.name, ceiling)
        if not applied:
            return

        frappe.db.set_value(self.doctype, self.name, {
            "credit_applied": (self.credit_applied or 0) + applied,
            "amount_due": (self.amount_due or 0) - applied,
        })
        self.reload()

        self._notify_agency(
            title="Crédit de commission appliqué",
            message=(
                f"Un crédit de commission de {applied} a été automatiquement appliqué "
                f"à la facture {self.invoice_number}."
            ),
        )

    def mark_paid(self, payment_method=None):
        """Appelée par api.payment.pay_invoice après création du Payment. La
        cascade (Payment lié, Project.payment_status, notifications) est déjà
        portée par on_update()/_handle_payment(), déclenchée par save().
        `payment_method` est accepté pour compatibilité d'appel mais n'est pas
        persisté ici : Invoice n'a pas de champ dédié (le moyen de paiement
        est déjà tracé sur le Payment lui-même, cf. payment.json)."""
        self.status = "Paid"
        # payment_date est un champ Date (pas Datetime, cf. invoice.json) :
        # nowdate() reste cohérent avec _handle_payment(), qui fait de même.
        self.payment_date = nowdate()
        self.save(ignore_permissions=True)
        return self

    def _generate_invoice_number(self):
        """Génère un numéro de facture unique au format INV-YYYY-XXXXX"""
        year = nowdate()[:4]
        count = frappe.db.count("Invoice", filters={"invoice_number": ["like", f"INV-{year}-%"]})
        return f"INV-{year}-{count + 1:05d}"

    def on_update(self):
        """Gère les changements de statut de la facture"""
        # BUG CORRIGÉ : `frappe.db.get_value` relit la DB APRÈS que save() ait
        # déjà écrit le nouveau statut (on_update tourne après l'écriture) —
        # il renvoyait donc toujours `self.status`, jamais l'ancien statut, ce
        # qui empêchait `_handle_payment`/`_handle_overdue`/`_handle_cancellation`
        # de jamais se déclencher. `get_doc_before_save()` donne le vrai état
        # d'avant modification.
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        # Si le statut passe à "Paid"
        if self.status == "Paid" and old_status != "Paid":
            self._handle_payment()

        # Si le statut passe à "Overdue"
        elif self.status == "Overdue" and old_status != "Overdue":
            self._handle_overdue()

        # Si le statut passe à "Cancelled"
        elif self.status == "Cancelled" and old_status != "Cancelled":
            self._handle_cancellation()

    def _handle_payment(self):
        """Gère le passage au statut 'Paid'"""
        # Définir la date de paiement
        frappe.db.set_value(self.doctype, self.name, "payment_date", nowdate())

        # Mettre à jour le paiement associé
        self._update_associated_payment()

    def _handle_overdue(self):
        """Gère le passage au statut 'Overdue' (facture en retard)"""
        # Envoyer une notification à l'agence
        self._notify_agency(
            title="Facture en retard",
            message=f"La facture {self.invoice_number} est en retard de paiement."
        )

    def _handle_cancellation(self):
        """Gère le passage au statut 'Cancelled'"""
        # Rétablir le statut de l'opportunité si nécessaire
        # (à implémenter selon la logique métier)

    def _update_associated_payment(self):
        """Met à jour le statut du paiement associé"""
        payment = frappe.get_all("Payment", filters={"invoice": self.name}, limit=1)
        if payment:
            frappe.db.set_value("Payment", payment[0].name, "status", "Completed")
            frappe.db.set_value("Payment", payment[0].name, "payment_date", nowdate())

    def _notify_agency(self, title, message):
        """Notifie l'agence propriétaire de la facture"""
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Invoice",
                "title": title,
                "body": message,
                "reference_doctype": "Invoice",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)
