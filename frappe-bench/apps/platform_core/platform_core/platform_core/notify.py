
import os

import frappe
import requests

from platform_core.platform_core.auth import _internal_token

def notifications_service_url():
	return frappe.conf.get("notifications_url") or os.environ.get("NOTIFICATIONS_URL") or "http://notifications-service:8085"

def notify(
	recipient,
	category,
	title,
	body=None,
	link=None,
	agency_context=None,
	reference_doctype=None,
	reference_name=None,
	channel="Both",
):
	doc = frappe.get_doc({
		"doctype": "Notification",
		"recipient": recipient,
		"agency_context": agency_context,
		"category": category,
		"title": title,
		"body": body,
		"link": link,
		"reference_doctype": reference_doctype,
		"reference_name": reference_name,
		"channel": channel,
		"is_read": 0,
	})
	doc.insert(ignore_permissions=True)
	return doc

def on_notification_insert(doc, method=None):
	if doc.channel in ("Platform", "Both"):
		_push_realtime(doc)
	if doc.channel in ("Email", "Both"):
		_send_email(doc)

def _push_realtime(doc):
	try:
		requests.post(
			f"{notifications_service_url()}/internal/notify",
			json={
				"recipient_email": doc.recipient,
				"type": doc.category,
				"title": doc.title,
				"body": doc.body,
				"link": doc.link,
				"notification_id": doc.name,
			},
			headers={"X-Internal-Token": _internal_token()},
			timeout=3,
		)
	except requests.RequestException:
		frappe.log_error(title="notifications-service unreachable", message=frappe.get_traceback())

def _send_email(doc):
	try:
		frappe.sendmail(
			recipients=[doc.recipient],
			subject=doc.title,
			message=doc.body or doc.title,
			reference_doctype="Notification",
			reference_name=doc.name,
			now=True,
		)
	except Exception:
		frappe.log_error(title="Notification email failed", message=frappe.get_traceback())
