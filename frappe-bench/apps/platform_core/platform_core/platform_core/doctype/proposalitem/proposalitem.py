# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class ProposalItem(Document):
    """Ligne de devis (désignation/quantité/prix unitaire) — table enfant de
    Proposal.items, utilisée pour le détail du PDF devis (cf. devis.py)."""

    pass
