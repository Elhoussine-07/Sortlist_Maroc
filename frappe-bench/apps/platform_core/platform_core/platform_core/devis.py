
import frappe
import frappe.utils

def generate_devis(proposal_name):
    proposal = frappe.get_doc("Proposal", proposal_name)

    previous_user = frappe.session.user
    frappe.set_user("Administrator")

    try:
        generated_display = frappe.utils.now_datetime().strftime("%d/%m/%Y à %H:%M")

        pdf_options = {
            "disable-external-links": True,
            "disable-internal-links": True,

            "disable-javascript": True,

            "load-error-handling": "ignore",
            "load-media-error-handling": "ignore",

            "disable-smart-shrinking": True,

            "quiet": True,

            "margin-top": "15mm",
            "margin-bottom": "20mm",
            "margin-left": "15mm",
            "margin-right": "15mm",
            "page-size": "A4",

            "disable-forms": True,
            "no-outline": True,
            "image-quality": 94,

            "footer-left": f"Devis — {proposal.name}",
            "footer-center": f"Généré le {generated_display}",
            "footer-right": "Page [page] / [topage]",
            "footer-font-size": "8",
            "footer-spacing": "5",
        }

        pdf_content = frappe.get_print(
            "Proposal",
            proposal_name,
            print_format="Devis",
            as_pdf=True,
            no_letterhead=1,
            pdf_options=pdf_options
        )

        if not pdf_content:
            raise ValueError("Le PDF généré est vide")

        frappe.logger().info(f"Devis généré avec succès pour {proposal_name} (taille: {len(pdf_content)} octets)")

    except Exception as e:
        error_message = f"Erreur génération devis pour {proposal_name}: {str(e)}"
        frappe.log_error(error_message, "Devis Generation Error")

        import traceback
        frappe.log_error(traceback.format_exc(), "Devis Generation Traceback")

        raise RuntimeError(f"Échec de la génération du devis: {str(e)}")

    finally:
        frappe.set_user(previous_user)

    try:
        _delete_existing_devis_files(proposal.name)

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

        frappe.logger().info(f"Fichier devis sauvegardé: {file_doc.file_url}")

        return file_doc.file_url

    except Exception as e:
        error_message = f"Erreur sauvegarde fichier devis pour {proposal_name}: {str(e)}"
        frappe.log_error(error_message, "Devis File Save Error")

        import traceback
        frappe.log_error(traceback.format_exc(), "Devis File Save Traceback")

        raise RuntimeError(f"Échec de la sauvegarde du fichier devis: {str(e)}")

def _delete_existing_devis_files(proposal_name):
    existing_files = frappe.get_all(
        "File",
        filters={
            "attached_to_doctype": "Proposal",
            "attached_to_name": proposal_name,
            "attached_to_field": "devis_file",
        },
        pluck="name",
    )
    for file_name in existing_files:
        frappe.delete_doc("File", file_name, ignore_permissions=True, delete_permanently=True)
