
import frappe

def generate_devis(proposal_name):
	proposal = frappe.get_doc("Proposal", proposal_name)

	previous_user = frappe.session.user
	frappe.set_user("Administrator")
	try:
		pdf_content = frappe.get_print(
			"Proposal", proposal_name, print_format="Devis", as_pdf=True, no_letterhead=1
		)
	finally:
		frappe.set_user(previous_user)

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
