# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Génération du CDC (cahier des charges) PDF — cf. docs/INTEGRATION.md §7.

Mécanisme unique partagé par le Smart Briefing IA (ia-service) et les
formulaires Unicast/Multicast (quick_actions) : seule la donnée d'entrée
change, le rendu est strictement identique.

AJOUTÉ (demande explicite, migration) : le rendu passe désormais par le
Print Format Frappe "CDC" (cf. platform_core/print_format/cdc/cdc.json,
DocType Project) au lieu d'un template Jinja construit et rendu à la main
via `frappe.render_template`/`get_pdf` — le contexte (client, description
nettoyée, livrables/exclusions/échéances...) est calculé côté Print Format
via `Project.get_cdc_context()`, appelé depuis son HTML Jinja."""

import frappe
import frappe.utils


def generate_cdc(project_name):
    """
    Génère le PDF du Cahier des Charges pour un projet donné.

    Args:
        project_name (str): Nom du projet (ID)

    Returns:
        str: URL du fichier PDF généré

    Raises:
        Exception: Si la génération du PDF échoue
    """
    project = frappe.get_doc("Project", project_name)

    # BUG CORRIGÉ : `frappe.get_print()` passe par printview.py ->
    # `validate_print_permission()`, qui retombe sur `check_doctype_permission()`
    # -> `frappe.has_permission()` (fonction MODULE, pas `doc.has_permission()`)
    # — un contrôle de rôle strict qui NE RESPECTE PAS `frappe.flags.
    # ignore_permissions` (essayé d'abord, sans effet : ce flag ne contourne
    # que les vérifications document-level, pas le contrôle "ce rôle a-t-il
    # accès à ce DocType"). Appelé depuis `api.ia.py::create_project_from_briefing`
    # (`allow_guest=True` + `require_internal_token()`, cf. ia-service), le
    # user reste "Guest" : `PermissionError`. Seul un changement d'utilisateur
    # effectif (`frappe.set_user`, qu'Administrator contourne intégralement)
    # fonctionne ici — restauré juste après.
    previous_user = frappe.session.user
    frappe.set_user("Administrator")

    try:
        # Options PDF pour résoudre l'erreur wkhtmltopdf "HostNotFoundError"
        # Ces options désactivent les requêtes réseau externes qui causent
        # l'erreur DNS/Network dans wkhtmltopdf.
        # NOTE: L'option "no-network" a été retirée car elle n'est pas supportée
        # par la version actuelle de wkhtmltopdf installée sur le serveur.
        pdf_options = {
            # Désactiver les liens externes (cause principale de l'erreur)
            "disable-external-links": True,
            "disable-internal-links": True,

            # Désactiver JavaScript (non nécessaire pour le PDF)
            "disable-javascript": True,

            # Ignorer les erreurs de chargement des ressources
            "load-error-handling": "ignore",
            "load-media-error-handling": "ignore",

            # Éviter les problèmes de mise en page
            "disable-smart-shrinking": True,

            # Réduire les logs
            "quiet": True,

            # Configuration de la page
            "margin-top": "15mm",
            "margin-bottom": "15mm",
            "margin-left": "15mm",
            "margin-right": "15mm",
            "page-size": "A4",

            # Optimisations
            "disable-forms": True,
            "no-outline": True,
            "image-quality": 94,
        }

        # Génération du PDF avec les options
        pdf_content = frappe.get_print(
            "Project",
            project_name,
            print_format="CDC",
            as_pdf=True,
            no_letterhead=1,
            pdf_options=pdf_options
        )

        # Vérification que le contenu PDF n'est pas vide
        if not pdf_content:
            raise ValueError("Le PDF généré est vide")

        # BUG CORRIGÉ : `frappe.log_info` n'existe pas dans l'API Frappe
        # (AttributeError) — `frappe.logger()` renvoie un logger Python
        # standard, `.info()` est la bonne méthode.
        frappe.logger().info(f"CDC généré avec succès pour {project_name} (taille: {len(pdf_content)} octets)")

    except Exception as e:
        # Log de l'erreur pour debugging
        error_message = f"Erreur génération CDC pour {project_name}: {str(e)}"
        frappe.log_error(error_message, "CDC Generation Error")

        # Journalisation supplémentaire pour faciliter le debugging
        import traceback
        frappe.log_error(traceback.format_exc(), "CDC Generation Traceback")

        raise RuntimeError(f"Échec de la génération du CDC: {str(e)}")

    finally:
        # Restaurer l'utilisateur original
        frappe.set_user(previous_user)

    # Sauvegarde du PDF en tant que fichier attaché au projet
    try:
        # Création du document File
        # BUG CORRIGÉ : "folder": "Home/Attachments" suppose que ce dossier
        # existe déjà dans le gestionnaire de fichiers — sinon `insert()`
        # échoue avec une erreur de validation sur le lien Folder. Retiré :
        # sans ce champ, Frappe range le fichier normalement (comportement
        # par défaut, déjà utilisé avec succès jusqu'ici).
        file_doc = frappe.get_doc({
            "doctype": "File",
            "file_name": f"CDC-{project.name}.pdf",
            "attached_to_doctype": "Project",
            "attached_to_name": project.name,
            "attached_to_field": "cdc_file",
            "content": pdf_content,
            "is_private": 1,
        })

        # Insertion du fichier avec permissions ignorées
        file_doc.insert(ignore_permissions=True)

        # Mise à jour du projet avec le lien vers le fichier
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
    """
    Version alternative avec des options PDF supplémentaires
    au cas où la version standard échoue.

    Args:
        project_name (str): Nom du projet (ID)

    Returns:
        str: URL du fichier PDF généré
    """
    project = frappe.get_doc("Project", project_name)

    previous_user = frappe.session.user
    frappe.set_user("Administrator")

    try:
        # Options alternatives avec plus de paramètres
        pdf_options = {
            # Résolution du problème réseau
            "disable-external-links": True,
            "disable-internal-links": True,
            "load-error-handling": "ignore",
            "load-media-error-handling": "ignore",

            # Désactivation des fonctionnalités inutiles
            "disable-javascript": True,
            "disable-forms": True,
            "disable-smart-shrinking": True,
            "disable-pdf-compression": False,

            # Accès aux fichiers locaux uniquement
            "enable-local-file-access": True,

            # Configuration d'affichage
            "default-header": False,
            "no-outline": True,
            "viewport-size": "1280x1024",
            "window-status": "done",
            "redirect-delay": 0,

            # Qualité et format
            "image-dpi": 150,
            "image-quality": 94,
            "page-size": "A4",
            "margin-top": "15mm",
            "margin-bottom": "15mm",
            "margin-left": "15mm",
            "margin-right": "15mm",

            # Silence
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

    # Sauvegarde du fichier (identique à la fonction principale)
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


# Fonction de diagnostic pour tester wkhtmltopdf
def test_wkhtmltopdf():
    """
    Fonction de diagnostic pour tester si wkhtmltopdf fonctionne correctement.
    À utiliser pour déboguer les problèmes de génération PDF.
    """
    import subprocess
    import tempfile
    import os

    try:
        # Vérifier la version de wkhtmltopdf
        result = subprocess.run(
            ["wkhtmltopdf", "--version"],
            capture_output=True,
            text=True
        )
        frappe.logger().info(f"wkhtmltopdf version: {result.stdout}")

        # Tester la génération d'un PDF simple
        html_content = "<html><body><h1>Test</h1></body></html>"

        with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as html_file:
            html_file.write(html_content.encode('utf-8'))
            html_path = html_file.name

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as pdf_file:
            pdf_path = pdf_file.name

        # Tester avec les options
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
        # Nettoyage
        try:
            if 'html_path' in locals() and os.path.exists(html_path):
                os.unlink(html_path)
            if 'pdf_path' in locals() and os.path.exists(pdf_path):
                os.unlink(pdf_path)
        except Exception:
            pass
