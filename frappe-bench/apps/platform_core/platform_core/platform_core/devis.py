"""Génération du devis PDF détaillé (désignation/quantité/prix par ligne),
sur le même mécanisme que cdc.py (cf. platform_core/cdc.py)."""

import frappe
from frappe.utils import now_datetime
from frappe.utils.pdf import get_pdf


def generate_devis(proposal_name):
        proposal = frappe.get_doc("Proposal", proposal_name)
        project = frappe.get_doc("Project", proposal.project)
        agency = frappe.get_doc("AgencyProfile", proposal.agency)
        client = frappe.get_doc("ClientProfile", project.client)

        client_name = (client.company_name or "").strip() or (
                (client.first_name or "") + " " + (client.last_name or "")
        ).strip() or "Client"

        items = proposal.items or []
        total_ht = sum((item.quantity or 0) * (item.unit_price or 0) for item in items)
        vat_rate = proposal.vat_rate or 0
        total_vat = total_ht * vat_rate / 100
        total_ttc = total_ht + total_vat

        html = frappe.render_template("platform_core/templates/devis.html", {
                "proposal": proposal,
                "project": project,
                "agency": agency,
                "client": client,
                "client_name": client_name,
                "items": items,
                "total_ht": total_ht,
                "vat_rate": vat_rate,
                "total_vat": total_vat,
                "total_ttc": total_ttc,
                "generated_at": now_datetime().strftime("%d/%m/%Y à %H:%M"),
        })

        pdf_content = get_pdf(html)

        file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": f"Devis-{proposal.name}.pdf",
                "attached_to_doctype": "Proposal",
                "attached_to_name": proposal.name,
                "attached_to_field": "devis_file",
                "content": pdf_content,
                "is_private": 1,
        })
        file_doc.insert(ignore_permissions=True)

        proposal.devis_file = file_doc.file_url
        proposal.save(ignore_permissions=True)
        return file_doc.file_url
