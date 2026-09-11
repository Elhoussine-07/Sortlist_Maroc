
import frappe
import frappe.utils

def generate_cdc(project_name):
    project = frappe.get_doc("Project", project_name)

    previous_user = frappe.session.user
    frappe.set_user("Administrator")

    try:
        pdf_options = {
            "disable-external-links": True,
            "disable-internal-links": True,

            "disable-javascript": True,

            "load-error-handling": "ignore",
            "load-media-error-handling": "ignore",

            "disable-smart-shrinking": True,

            "quiet": True,

            "margin-top": "15mm",
            "margin-bottom": "15mm",
            "margin-left": "15mm",
            "margin-right": "15mm",
            "page-size": "A4",

            "disable-forms": True,
            "no-outline": True,
            "image-quality": 94,
        }

        pdf_content = frappe.get_print(
            "Project",
            project_name,
            print_format="CDC",
            as_pdf=True,
            no_letterhead=1,
            pdf_options=pdf_options
        )

        if not pdf_content:
            raise ValueError("Le PDF généré est vide")

        frappe.logger().info(f"CDC généré avec succès pour {project_name} (taille: {len(pdf_content)} octets)")

    except Exception as e:
        error_message = f"Erreur génération CDC pour {project_name}: {str(e)}"
        frappe.log_error(error_message, "CDC Generation Error")

        import traceback
        frappe.log_error(traceback.format_exc(), "CDC Generation Traceback")

        raise RuntimeError(f"Échec de la génération du CDC: {str(e)}")

    finally:
        frappe.set_user(previous_user)

    try:
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

        frappe.logger().info(f"Fichier CDC sauvegardé: {file_doc.file_url}")

        return file_doc.file_url

    except Exception as e:
        error_message = f"Erreur sauvegarde fichier CDC pour {project_name}: {str(e)}"
        frappe.log_error(error_message, "CDC File Save Error")

        import traceback
        frappe.log_error(traceback.format_exc(), "CDC File Save Traceback")

        raise RuntimeError(f"Échec de la sauvegarde du fichier CDC: {str(e)}")

def generate_cdc_with_alternative_options(project_name):
    project = frappe.get_doc("Project", project_name)

    previous_user = frappe.session.user
    frappe.set_user("Administrator")

    try:
        pdf_options = {
            "disable-external-links": True,
            "disable-internal-links": True,
            "load-error-handling": "ignore",
            "load-media-error-handling": "ignore",

            "disable-javascript": True,
            "disable-forms": True,
            "disable-smart-shrinking": True,
            "disable-pdf-compression": False,

            "enable-local-file-access": True,

            "default-header": False,
            "no-outline": True,
            "viewport-size": "1280x1024",
            "window-status": "done",
            "redirect-delay": 0,

            "image-dpi": 150,
            "image-quality": 94,
            "page-size": "A4",
            "margin-top": "15mm",
            "margin-bottom": "15mm",
            "margin-left": "15mm",
            "margin-right": "15mm",

            "quiet": True,
        }

        pdf_content = frappe.get_print(
            "Project",
            project_name,
            print_format="CDC",
            as_pdf=True,
            no_letterhead=1,
            pdf_options=pdf_options
        )

        if not pdf_content:
            raise ValueError("Le PDF généré est vide")

    except Exception as e:
        error_message = f"Erreur génération CDC (alternative) pour {project_name}: {str(e)}"
        frappe.log_error(error_message, "CDC Alternative Generation Error")
        raise
    finally:
        frappe.set_user(previous_user)

    try:
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

    except Exception as e:
        error_message = f"Erreur sauvegarde fichier CDC (alternative) pour {project_name}: {str(e)}"
        frappe.log_error(error_message, "CDC Alternative File Save Error")
        raise

def test_wkhtmltopdf():
    import subprocess
    import tempfile
    import os

    try:
        result = subprocess.run(
            ["wkhtmltopdf", "--version"],
            capture_output=True,
            text=True
        )
        frappe.logger().info(f"wkhtmltopdf version: {result.stdout}")

        html_content = "<html><body><h1>Test</h1></body></html>"

        with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as html_file:
            html_file.write(html_content.encode('utf-8'))
            html_path = html_file.name

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as pdf_file:
            pdf_path = pdf_file.name

        cmd = [
            "wkhtmltopdf",
            "--disable-external-links",
            "--quiet",
            html_path,
            pdf_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0 and os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
            frappe.logger().info("Test wkhtmltopdf RÉUSSI")
            return True
        else:
            frappe.log_error(f"Test wkhtmltopdf ÉCHOUÉ: {result.stderr}", "wkhtmltopdf Test Failed")
            return False

    except Exception as e:
        frappe.log_error(f"Erreur test wkhtmltopdf: {str(e)}", "wkhtmltopdf Test Error")
        return False
    finally:
        try:
            if 'html_path' in locals() and os.path.exists(html_path):
                os.unlink(html_path)
            if 'pdf_path' in locals() and os.path.exists(pdf_path):
                os.unlink(pdf_path)
        except Exception:
            pass
