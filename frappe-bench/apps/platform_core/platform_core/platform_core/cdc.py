# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Génération du CDC (cahier des charges) PDF — cf. docs/INTEGRATION.md §7.

Mécanisme unique partagé par le Smart Briefing IA (ia-service) et les
formulaires Unicast/Multicast (quick_actions) : seule la donnée d'entrée
change, le rendu est strictement identique."""

import frappe
from frappe.utils import now_datetime
from frappe.utils.pdf import get_pdf


def generate_cdc(project_name):
        project = frappe.get_doc("Project", project_name)
        # NOTE : project.client porte déjà le nom du document ClientProfile (cf.
        # Project.before_insert), pas l'email de l'utilisateur — filtrer par
        # {"user": project.client} ne trouvait donc jamais le bon profil.
        client = frappe.get_doc("ClientProfile", project.client)

        client_email = frappe.db.get_value("User", client.user, "email") if client.user else None

        html = frappe.render_template("platform_core/templates/cdc.html", {
                "project": project,
                "client": client,
                "client_email": client_email,
                "generated_at": now_datetime().strftime("%d/%m/%Y à %H:%M"),
                "description_text": frappe.utils.strip_html(project.description or ""),
                "deliverables_text": frappe.utils.strip_html(project.deliverables or ""),
                "exclusions_text": frappe.utils.strip_html(project.exclusions or ""),
                "deadlines_text": frappe.utils.strip_html(project.deadlines or ""),
        })

        pdf_content = get_pdf(html)

        file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": f"CDC-{project.name}.pdf",
                "attached_to_doctype": "Project",
                "attached_to_name": project.name,
                "attached_to_field": "cdc_file",
                "content": pdf_content,
                "is_private": 1,
        })
        file_doc.insert(ignore_permissions=True)

        project.cdc_file = file_doc.file_url
        project.save(ignore_permissions=True)
        return file_doc.file_url
