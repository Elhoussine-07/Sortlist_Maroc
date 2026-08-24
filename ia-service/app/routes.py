"""Endpoints HTTP de ia-service, préfixés `/api/ia/` par le Gateway (cf.
docs/INTEGRATION.md §5). Le Gateway a déjà validé le JWT de l'utilisateur
final et transmet `X-User-Email` / `X-User-Type` : ce service leur fait
confiance sans re-vérifier la signature."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from app import frappe_client, nlp_service, openai_client
from app.frappe_client import FrappeClientError
from app.models import (
    BriefingTurnRequest,
    BriefingTurnResponse,
    CategorizeRequest,
    CategorizeResponse,
    ChatbotRequest,
    ChatbotResponse,
    ConfirmRequest,
    ConfirmResponse,
    EnrichRequest,
    EnrichResponse,
)

logger = logging.getLogger("ia-service")

router = APIRouter(prefix="/api/ia")

_CATEGORIZE_AUTO_THRESHOLD = 0.2


def _validate_category_result(result: Optional[dict], categories: list[dict]) -> bool:
    """Garde-fou anti-hallucination : une catégorie/sous-catégorie renvoyée
    par le LLM doit exister dans le catalogue Frappe, sinon on ignore le
    résultat et on retombe sur l'heuristique par mots-clés."""
    if not result or not result.get("category"):
        return False
    cat_match = next((c for c in categories if c.get("name") == result["category"]), None)
    if not cat_match:
        return False
    sub = result.get("sub_category")
    if sub and not any(s.get("name") == sub for s in cat_match.get("sub_categories", [])):
        return False
    return True


@router.get("/health")
async def health():
    return {"status": "ok", "service": "ia-service"}


# --------------------------------------------------------------------------
# 1. Smart Briefing IA — étape conversationnelle (cahier §1.2)
# --------------------------------------------------------------------------


@router.post("/briefing/turn", response_model=BriefingTurnResponse)
async def briefing_turn(payload: BriefingTurnRequest):
    brief: dict = dict(payload.current_brief or {})
    provider = "stub"
    user_message = (payload.user_message or "").strip()
    history = [m.model_dump() for m in payload.conversation_history]

    if user_message:
        prev_slot = nlp_service.next_missing_slot(brief)
        category_hint = None

        # Mode assisté LLM : tente une extraction structurée à partir du
        # message libre. Peut remplir plusieurs champs d'un coup si le
        # client les a tous mentionnés dans un seul message (cf. prompt
        # système d'`extract_fields`) — pas seulement le slot en cours.
        # Toujours complété par la logique déterministe ci-dessous pour
        # garantir qu'un slot n'est jamais laissé vide.
        if prev_slot and openai_client.is_configured:
            extracted = openai_client.extract_fields(user_message, brief, prev_slot)
            if extracted:
                provider = "openai"
                for key in (
                    "need_type", "description", "budget_min", "budget_max",
                    "location", "delivery_delay_days", "title",
                ):
                    value = extracted.get(key)
                    if value not in (None, ""):
                        brief[key] = value
                # `category_hint` n'est PAS un identifiant Frappe valide (le
                # LLM ne connaît pas le catalogue) : c'est juste une
                # expression en langage naturel ("design graphique"...) qui
                # sert à améliorer le matching par mots-clés ci-dessous,
                # jamais écrite telle quelle dans `brief["category"]`.
                hint = extracted.get("category_hint")
                if isinstance(hint, str) and hint.strip():
                    category_hint = hint.strip()

        if prev_slot == "description" and not brief.get("description"):
            brief["description"] = user_message
        elif prev_slot == "need_type" and not brief.get("need_type"):
            brief["need_type"] = nlp_service.infer_need_type(user_message) or "Projet"
        elif prev_slot == "budget" and (not brief.get("budget_min") or not brief.get("budget_max")):
            lo, hi = nlp_service.parse_budget(user_message)
            if lo is not None:
                brief["budget_min"] = brief.get("budget_min") or lo
                brief["budget_max"] = brief.get("budget_max") or hi
        elif prev_slot == "location" and not brief.get("location"):
            brief["location"] = user_message
        elif prev_slot == "delivery_delay_days" and not brief.get("delivery_delay_days"):
            days = nlp_service.parse_delay_days(user_message)
            if days is not None:
                brief["delivery_delay_days"] = days
        elif prev_slot == "category" and not brief.get("category"):
            categories = await frappe_client.get_categories()
            # `category_hint` (LLM, si dispo) est un signal plus propre que
            # le message brut pour le matching par mots-clés (moins de bruit
            # que la phrase complète du client) : on le combine au message
            # brut plutôt que de le remplacer, au cas où le LLM aurait
            # manqué une partie du texte.
            category_query = f"{category_hint} {user_message}" if category_hint else user_message
            result = nlp_service.categorize_text(category_query, categories)
            if result.get("category"):
                brief["category"] = result["category"]
                brief["sub_category"] = result.get("sub_category")
            else:
                # Garde-fou anti-boucle infinie : `category` n'est pas un
                # champ obligatoire côté Project (cf. next_missing_slot). Si
                # le catalogue Frappe est vide/injoignable (get_categories()
                # se dégrade alors gracieusement en liste vide, cf.
                # frappe_client.py), ou si le texte du client n'a matché
                # aucune catégorie connue après 2 tentatives déjà posées,
                # on ne repose plus la question : le texte libre est
                # conservé dans la description plutôt que perdu, et le
                # questionnaire avance normalement.
                prior_attempts = sum(
                    1
                    for m in history
                    if m.get("role") == "assistant" and "catégorie" in (m.get("content") or "").lower()
                )
                if not categories or prior_attempts >= 2:
                    brief["_category_skipped"] = True
                    existing_description = (brief.get("description") or "").strip()
                    hint = f"Catégorie indiquée par le client (non reconnue automatiquement) : {user_message}"
                    brief["description"] = f"{existing_description}\n{hint}" if existing_description else hint

        # Catégorisation opportuniste dès qu'une description est connue,
        # pour éviter de poser une question de catégorie inutile si le
        # texte libre du client suffisait déjà à la déduire. `category_hint`
        # (LLM) est ajouté au texte comparé quand disponible, ex: un message
        # riche envoyé en une fois ("plateforme B2B de mise en relation
        # design/marketing, budget 5000€...") peut ainsi remplir catégorie +
        # description + budget en un seul tour au lieu de 3.
        if brief.get("description") and not brief.get("category"):
            categories = await frappe_client.get_categories()
            opportunistic_query = (
                f"{category_hint} {brief['description']}" if category_hint else brief["description"]
            )
            result = nlp_service.categorize_text(opportunistic_query, categories)
            if result.get("category") and result.get("confidence", 0) >= _CATEGORIZE_AUTO_THRESHOLD:
                brief["category"] = result["category"]
                brief["sub_category"] = result.get("sub_category")

    next_slot = nlp_service.next_missing_slot(brief)
    if next_slot is None:
        brief = nlp_service.finalize_brief(brief)
        return BriefingTurnResponse(ready=True, question=None, brief=brief, missing_fields=[], provider=provider)

    question = None
    if openai_client.is_configured:
        question = openai_client.generate_next_question(next_slot, brief, history)
        if question:
            provider = "openai"
    if not question:
        question = nlp_service.default_question_for_slot(next_slot, brief)

    return BriefingTurnResponse(
        ready=False,
        question=question,
        brief=brief,
        missing_fields=nlp_service.missing_fields(brief),
        provider=provider,
    )


@router.post("/briefing/categorize", response_model=CategorizeResponse)
async def briefing_categorize(payload: CategorizeRequest):
    categories = await frappe_client.get_categories()
    provider = "stub"
    result = None

    if openai_client.is_configured:
        llm_result = openai_client.categorize(payload.text, categories)
        if _validate_category_result(llm_result, categories):
            result = llm_result
            provider = "openai"

    if not result:
        result = nlp_service.categorize_text(payload.text, categories)

    known = {k: result.get(k) for k in ("category", "category_name", "sub_category", "sub_category_name", "confidence")}
    return CategorizeResponse(provider=provider, **known)


@router.post("/briefing/enrich", response_model=EnrichResponse)
async def briefing_enrich(payload: EnrichRequest):
    provider = "stub"
    category_name = None
    if payload.category:
        categories = await frappe_client.get_categories()
        match = next((c for c in categories if c.get("name") == payload.category), None)
        category_name = match.get("category_name") if match else payload.category

    reformulated = None
    if openai_client.is_configured:
        reformulated = openai_client.enrich_description(payload.description, category_name)
        if reformulated:
            provider = "openai"
    if not reformulated:
        reformulated = nlp_service.reformulate_description_stub(payload.description, category_name)

    budget_min, budget_max = nlp_service.suggest_budget(payload.description, category_name)

    return EnrichResponse(
        description=reformulated,
        budget_min=budget_min,
        budget_max=budget_max,
        budget_suggested=True,
        provider=provider,
    )


@router.post("/briefing/confirm", response_model=ConfirmResponse)
async def briefing_confirm(payload: ConfirmRequest, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    # Le Gateway a déjà authentifié l'utilisateur final ; on privilégie
    # l'en-tête forwardé (source de confiance réseau interne) sur le champ
    # `client` du body si les deux sont fournis mais divergent.
    client_email = x_user_email or payload.client
    if not client_email:
        raise HTTPException(status_code=400, detail="client (email) requis")

    brief = nlp_service.finalize_brief(payload.brief)

    try:
        result = await frappe_client.create_project_from_briefing(client_email, brief)
    except FrappeClientError as exc:
        logger.error("create_project_from_briefing failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ConfirmResponse(project=result.get("project"), cdc_file=result.get("cdc_file"))


# --------------------------------------------------------------------------
# 2. Assistant conversationnel / Chatbot (cahier §3.4)
# --------------------------------------------------------------------------


async def _chatbot_handler(payload: ChatbotRequest) -> ChatbotResponse:
    faq_match = nlp_service.match_faq(payload.message)
    if faq_match:
        return ChatbotResponse(reply=faq_match["answer"], escalate=False, matched_topic=faq_match["topic"], provider="stub")

    if openai_client.is_configured:
        result = openai_client.chatbot_reply(payload.message, payload.context)
        if result and result.get("reply"):
            return ChatbotResponse(
                reply=result["reply"],
                escalate=bool(result.get("escalate", False)),
                matched_topic=None,
                provider="openai",
            )

    # Hors périmètre du bot -> escalade humaine (cahier §3.4 "Escalade humaine").
    return ChatbotResponse(
        reply=(
            "Je n'ai pas de réponse fiable à vous apporter sur ce point. "
            "Je transmets votre question à un conseiller qui reviendra vers vous."
        ),
        escalate=True,
        matched_topic=None,
        provider="stub",
    )


@router.post("/chatbot", response_model=ChatbotResponse)
async def chatbot(payload: ChatbotRequest):
    return await _chatbot_handler(payload)


@router.post("/chatbot/public", response_model=ChatbotResponse)
async def chatbot_public(payload: ChatbotRequest):
    """Alias sans authentification : le Gateway route `/api/ia/chatbot/public`
    sans exiger de JWT (cf. docs/INTEGRATION.md §5), pour un usage vitrine
    (FAQ publique) avant connexion."""
    return await _chatbot_handler(payload)