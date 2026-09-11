import frappe

MODULE = "platform_core"

CUSTOM_ROLES = ["Moderator", "Client", "Agency"]

def ensure_role(role_name):
    if frappe.db.exists("Role", role_name):
        return
    frappe.get_doc({
        "doctype": "Role",
        "role_name": role_name,
        "desk_access": 1,
    }).insert(ignore_permissions=True)
    print(f"✓ Rôle {role_name} créé")

def f(fieldname, label, fieldtype, options=None, default=None,
      reqd=0, unique=0, read_only=0, permlevel=0):
    d = {
        "fieldname": fieldname,
        "label": label,
        "fieldtype": fieldtype,
    }
    if options is not None:
        d["options"] = options
    if default is not None:
        d["default"] = default
    if reqd:
        d["reqd"] = 1
    if unique:
        d["unique"] = 1
    if read_only:
        d["read_only"] = 1
    if permlevel:
        d["permlevel"] = permlevel
    return d

def p(role, read=1, write=0, create=0, delete=0, if_owner=0, permlevel=0):
    return {
        "role": role,
        "permlevel": permlevel,
        "read": read,
        "write": write,
        "create": create,
        "delete": delete,
        "if_owner": if_owner,
    }

def create_doctype(name, fields, permissions=None, istable=0, is_single=0):
    if frappe.db.exists("DocType", name):
        print(f"✓ {name} existe déjà")
        return

    doc = frappe.get_doc({
        "doctype": "DocType",
        "name": name,
        "module": MODULE,
        "custom": 0,
        "istable": istable,
        "issingle": is_single,
        "track_changes": 1,
        "engine": "InnoDB",
        "fields": fields,
        "permissions": permissions or [],
    })

    doc.insert(ignore_permissions=True)
    print(f"✓ {name} créé")

def execute():
    for role in CUSTOM_ROLES:
        ensure_role(role)

    create_doctype(
        "CountryLegalIDRule",
        [
            f("country", "Pays", "Link", options="Country", reqd=1, unique=1),
            
            f("id_label", "Nom de l'identifiant", "Data", reqd=1),
            
            f("validation_regex", "Regex de validation", "Data", reqd=1),
            
            f("example_format", "Exemple de format", "Data"),
            
            f("registry_api_url", "URL API de vérification", "Data"),
            
            f("registry_api_key", "Clé API du registre", "Password", permlevel=1),
            
            f("registry_check_enabled", "Vérification externe activée", "Check", default=0),
            
            f("is_active", "Règle active", "Check", default=1),
        ],
        permissions=[
            p("System Manager", read=1, write=1, create=1, delete=1),
            p("Moderator", read=1, write=1),
            p("Client", read=1),
            p("Agency", read=1),
        ],
        istable=0,
        is_single=0,
    )

    frappe.db.commit()
    print("✅ DocType CountryLegalIDRule créé avec succès !")
