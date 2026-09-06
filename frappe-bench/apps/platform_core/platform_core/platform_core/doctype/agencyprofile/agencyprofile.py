import frappe
from frappe.model.document import Document


class AgencyProfile(Document):
    """Logique cœur Frappe : onboarding (unicité du nom), PQI qualitatif déterministe
    (CDC 2.4) et complétion de profil. Le score de pertinence/matching (Opportunity)
    et les recommandations IA (2.4 "Recommandations IA") restent hors Frappe — le
    microservice correspondant écrit ses résultats directement via l'API REST.
    """

    def before_insert(self):
        user_roles = frappe.get_roles(frappe.session.user)
        if "Agency" not in user_roles and "Administrator" not in user_roles:
            frappe.throw("Seuls les Agences et Administrateurs peuvent créer un profil Agence.")

        if frappe.db.exists("AgencyProfile", {"agency_name": self.agency_name}):
            frappe.throw(f"Une agence nommée « {self.agency_name} » existe déjà.")

    def validate(self):
        self._calculate_pqi_score()
        self._calculate_profile_completion()

    def refresh_pqi(self):
        """Recalcul qualitatif complet du PQI (CDC 2.4.1 : Netteté des visuels,
        Structuration du nom, Cohérence des informations, Complétude qualifiée,
        Sécurité du compte) — remplit `pqi_details` (recommandations IA par
        critère, cf. 2.4) et notifie les propriétaires en cas de baisse
        significative. Contrairement au score rapide calculé à chaque
        sauvegarde par `validate()`/`_calculate_pqi_score`, cette méthode est
        appelée périodiquement (cf. `tasks.recompute_pqi_alerts`) et à la
        demande (cf. `api.agency`), et est la source de vérité pour
        `pqi_details` consommé par `api.agency.analytics`.
        """
        from platform_core.platform_core.scoring import update_agency_pqi

        updated = update_agency_pqi(self.name)
        self.reload()
        return updated

    def _calculate_pqi_score(self):
        """Score rapide recalculé à chaque sauvegarde — BUG CORRIGÉ (demande
        explicite) : utilisait auparavant sa propre grille à 5 critères
        (Transparence/Talent/Équipe/Portfolio/Confiance), complètement
        différente de celle de `scoring.py::compute_pqi` (Netteté des
        visuels/Structuration du nom/Cohérence des informations/Complétude
        qualifiée/Sécurité du compte — celle affichée par `api.agency.
        analytics` dans `pqi_details`). Comme `refresh_pqi()` appelle
        `doc.save()` après avoir posé le score détaillé, ce `validate()`
        l'écrasait IMMÉDIATEMENT avec l'ancien calcul : le nombre affiché
        dans l'anneau PQI ne correspondait jamais à la somme des barres par
        critère affichées juste à côté (ex. barres = 80, anneau = 46). Les
        deux utilisent désormais exactement la même grille, pour ne plus
        jamais diverger.
        """
        from platform_core.platform_core.scoring import compute_pqi

        self.pqi_score, _ = compute_pqi(self)

    def _calculate_profile_completion(self):
        """Calcule le taux de complétion du profil (0-100)"""
        weights = {
            "agency_name": 10,
            "description": 10,
            "logo": 10,
            "website": 5,
            "location": 10,
            "country": 10,
            "legal_id": 15,
            "email": 10,
            "phone": 10,
            "social_links": 10,
        }
        self.profile_completion = min(
            sum(weight for field, weight in weights.items() if getattr(self, field, None)),
            100
        )
