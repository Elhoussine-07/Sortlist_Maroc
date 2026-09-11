app_name = "platform_core"
app_title = "platform_core"
app_publisher = "lahoussine"
app_description = "PLateforme B2B"
app_email = "ellahoussine1@gmail.com"
app_license = "mit"

after_install = "platform_core.platform_core.setup.after_install"
after_migrate = "platform_core.platform_core.setup.after_migrate"

doc_events = {
	"Notification": {
		"after_insert": "platform_core.platform_core.notify.on_notification_insert",
	},
}

scheduler_events = {
	"hourly": [
		"platform_core.platform_core.tasks.process_quote_deadlines",
		"platform_core.platform_core.tasks.suspend_projects_for_unpaid_commission",
	],
	"daily": [
		"platform_core.platform_core.tasks.process_invoice_reminders",
		"platform_core.platform_core.tasks.recompute_pqi_alerts",
		"platform_core.platform_core.tasks.complete_overdue_projects",
	],
}

before_request = ["platform_core.platform_core.auth.validate_jwt"]

