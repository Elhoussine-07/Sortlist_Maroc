import frappe
from frappe.model.document import Document
from frappe.utils import now


class Notification(Document):
    """Rôle Frappe : source de vérité + cycle de vie (créée -> lue -> archivée,
    cf. cahier des charges module 7). Créée via `platform_core.platform_core.notify.notify()`,
    jamais directement. Le relais temps réel (Socket.IO) et l'envoi email sont
    déclenchés par le hook `doc_events.after_insert` -> `notify.on_notification_insert`
    (cf. hooks.py), pas par ce contrôleur.
    """

    def before_insert(self):
        # Une notification est toujours créée non lue / non archivée.
        self.is_read = 0
        self.is_archived = 0
        self.read_on = None
        self.archived_date = None
        self._validate_data()

    def _validate_data(self):
        """Valide les champs obligatoires"""
        if not self.recipient:
            frappe.throw("Le destinataire de la notification est obligatoire.")

        if not self.title:
            frappe.throw("Le titre de la notification est obligatoire.")

        if not self.category:
            frappe.throw("La catégorie de la notification est obligatoire.")

        if self.reference_doctype and self.reference_name:
            if not frappe.db.exists(self.reference_doctype, self.reference_name):
                frappe.throw(
                    f"Le document de référence {self.reference_doctype}/{self.reference_name} n'existe pas."
                )

    def mark_read(self):
        """cf. module 7.1 : consultation = retrait de la vue active + archivage
        automatique — jamais de suppression définitive, seulement un déplacement
        vers l'historique (is_read=1 reste consultable indéfiniment)."""
        if not self.is_read:
            self.is_read = 1
            self.read_on = now()
            self.is_archived = 1
            self.archived_date = now()
            self.save(ignore_permissions=True)
        return self


def mark_all_read(recipient, agency_context=None):
    """Utilisé par `platform_core.platform_core.api.notification.mark_all_active_read`."""
    filters = {"recipient": recipient, "is_read": 0}
    if agency_context:
        filters["agency_context"] = agency_context
    names = frappe.get_all("Notification", filters=filters, pluck="name")
    for name in names:
        frappe.get_doc("Notification", name).mark_read()
    return len(names)
