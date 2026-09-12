
from __future__ import annotations

import json
import os
from typing import Any, Optional

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "ollama")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

is_configured = bool(OPENAI_API_KEY)

_client = None
if is_configured:
    try:
        from openai import OpenAI

        _client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL or None)
    except Exception:
        _client = None
        is_configured = False

def _chat(messages: list[dict[str, str]], *, json_mode: bool = False, temperature: float = 0.4) -> Optional[str]:
    if not _client:
        return None
    try:
        kwargs: dict[str, Any] = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        completion = _client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content
    except Exception:
        return None

def generate_next_question(missing_field: str, brief: dict[str, Any], conversation_history: list[dict[str, str]]) -> Optional[str]:
    system = (
        "Tu es l'assistant de briefing d'une marketplace B2B qui met en relation des "
        "entreprises clientes avec des prestataires/agences. Tu aides le client à "
        "structurer son besoin en posant UNE seule question courte et naturelle en "
        "français, pour obtenir le champ manquant indiqué. Ne pose qu'une question, "
        "sans salutation superflue si la conversation est déjà engagée."
    )
    user = (
        f"Brief déjà collecté: {json.dumps(brief, ensure_ascii=False)}\n"
        f"Champ manquant à demander: {missing_field}\n"
        "Formule uniquement la question à poser au client."
    )
    messages = [{"role": "system", "content": system}]
    for turn in conversation_history[-6:]:
        messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    messages.append({"role": "user", "content": user})
    return _chat(messages)

def extract_fields(user_message: str, current_brief: dict[str, Any], target_field: str) -> Optional[dict[str, Any]]:
    system = (
        "Tu extrais des informations structurées depuis un message libre d'un client "
        "d'une marketplace B2B, pour compléter un brief de projet. Réponds UNIQUEMENT "
        "avec un objet JSON. Les clés possibles sont: need_type (Projet|Stage|Job), "
        "description, budget_min, budget_max (nombres, en euros), location, "
        "delivery_delay_days (entier, en jours), title. N'inclus que les clés que tu "
        "peux déduire avec confiance du message ; pour le champ visé en priorité "
        f"('{target_field}'), fais de ton mieux même si l'info est approximative."
    )
    user = f"Brief actuel: {json.dumps(current_brief, ensure_ascii=False)}\nMessage du client: {user_message}"
    raw = _chat(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        json_mode=True,
        temperature=0.1,
    )
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None

def categorize(text: str, categories: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if not categories:
        return None
    catalog = [
        {
            "category": c.get("name"),
            "category_name": c.get("category_name"),
            "sub_categories": [
                {"sub_category": s.get("name"), "sub_category_name": s.get("sub_category_name")}
                for s in c.get("sub_categories", [])
            ],
        }
        for c in categories
    ]
    system = (
        "Tu classes le besoin d'un client de marketplace B2B dans une catégorie et "
        "sous-catégorie de service. Réponds UNIQUEMENT en JSON avec les clés: "
        "category, category_name, sub_category, sub_category_name, confidence (0 à 1). "
        "Choisis exclusivement parmi le catalogue fourni. Si rien ne correspond bien, "
        "renvoie confidence proche de 0."
    )
    user = f"Catalogue: {json.dumps(catalog, ensure_ascii=False)}\nTexte du besoin: {text}"
    raw = _chat(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        json_mode=True,
        temperature=0.1,
    )
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None

def enrich_description(description: str, category_name: Optional[str]) -> Optional[str]:
    system = (
        "Tu reformules et complètes le besoin exprimé par un client d'une marketplace "
        "B2B en un paragraphe clair et professionnel de 2 à 4 phrases, en français, "
        "prêt à être inséré dans un cahier des charges. Ne fabrique pas de contraintes "
        "précises non mentionnées (budget, délai...), reste sur le contenu métier."
    )
    user = f"Catégorie: {category_name or 'inconnue'}\nBesoin exprimé par le client: {description}"
    return _chat([{"role": "system", "content": system}, {"role": "user", "content": user}], temperature=0.5)

def chatbot_reply(message: str, context: dict[str, Any]) -> Optional[dict[str, Any]]:
    system = (
        "Tu es l'assistant conversationnel d'une marketplace B2B mettant en relation "
        "entreprises et prestataires/agences. Tu réponds aux questions sur le "
        "fonctionnement de la plateforme, la facturation, les délais, et tu aides à "
        "clarifier un brief de projet mal défini. Réponds UNIQUEMENT en JSON avec les "
        "clés: reply (string, réponse en français, concise), escalate (bool, true si "
        "la question sort du périmètre de la plateforme ou nécessite un conseiller "
        "humain)."
    )
    user = f"Contexte: {json.dumps(context, ensure_ascii=False)}\nQuestion du client: {message}"
    raw = _chat(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        json_mode=True,
        temperature=0.3,
    )
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None