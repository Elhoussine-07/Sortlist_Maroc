
import frappe

from platform_core.platform_core.auth import current_claims, require_body_arg

GUIDE_STEPS = {
	"client": [
		{"step": 0, "title": "Bienvenue", "video_url": "/files/WhatsAppVideoDemo0.mp4"},
		{"step": 1, "title": "Postuler un projet (Smart Briefing IA)", "video_url": "/files/demo/client-1-briefing.mp4"},
		{"step": 2, "title": "Suivre Mes Projets", "video_url": "/files/demo/client-2-projects.mp4"},
		{"step": 3, "title": "Actions rapides : Unicast & Multicast", "video_url": "/files/demo/client-3-quick-actions.mp4"},
		{"step": 4, "title": "Collaborations & avis", "video_url": "/files/demo/client-4-collaborations.mp4"},
	],
	"agency": [
		{"step": 0, "title": "Bienvenue", "video_url": "/files/demo/agency-0-welcome.mp4"},
		{"step": 1, "title": "Compléter votre profil (PQI)", "video_url": "/files/demo/agency-1-profile.mp4"},
		{"step": 2, "title": "Gérer vos Opportunités", "video_url": "/files/demo/agency-2-opportunities.mp4"},
		{"step": 3, "title": "Analytics & Prospection", "video_url": "/files/demo/agency-3-analytics.mp4"},
		{"step": 4, "title": "Facturation", "video_url": "/files/demo/agency-4-billing.mp4"},
	],
}

@frappe.whitelist()
def get_guide(account_type=None):
	account_type = require_body_arg(account_type, "account_type", "Type de compte manquant")
	claims = current_claims()
	steps = GUIDE_STEPS.get(account_type, [])
	progress = frappe.db.get_value("User", claims["sub"], ["demo_guide_step", "demo_guide_completed"], as_dict=True)
	return {"steps": steps, "current_step": progress.demo_guide_step, "completed": progress.demo_guide_completed}

@frappe.whitelist()
def set_progress(step=None, completed=0):
	step = require_body_arg(step, "step", "Étape manquante")
	claims = current_claims()
	frappe.db.set_value("User", claims["sub"], {
		"demo_guide_step": step,
		"demo_guide_completed": 1 if int(completed) else 0,
	})
	return {"step": step, "completed": bool(int(completed))}
