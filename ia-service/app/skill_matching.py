
from __future__ import annotations

import math
from typing import Any, Optional

from app import nlp_service, openai_client

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def _service_text(service: dict[str, Any]) -> str:
    parts = [service.get("service_name"), service.get("skills"), service.get("tech_stack")]
    return " ".join(p for p in parts if p)

def _stub_score(need_text: str, services: list[dict[str, Any]]) -> tuple[float, Optional[str]]:
    """Repli sans IA : recouvrement de racines de mots (meme technique que
    nlp_service.categorize_text), plus tolerant aux variations (pluriels,
    conjugaisons) qu'une comparaison de mots exacts, mais sans comprehension
    des synonymes. Utilise quand aucun fournisseur d'embeddings n'est configure."""
    need_stems = nlp_service._full_tokens(need_text)
    if not need_stems or not services:
        return 0.0, None

    best_score = 0.0
    best_service = None
    for service in services:
        service_stems = nlp_service._full_tokens(_service_text(service))
        if not service_stems:
            continue
        overlap = nlp_service._prefix_overlap(need_stems, service_stems)
        score = overlap / max(len(need_stems), 1)
        if score > best_score:
            best_score = score
            best_service = service.get("service_name")
    return min(1.0, best_score) * 100, best_service

def _semantic_score(need_text: str, services: list[dict[str, Any]]) -> Optional[tuple[float, Optional[str]]]:
    need_embedding = openai_client.get_embedding(need_text)
    if not need_embedding:
        return None

    best_score = 0.0
    best_service = None
    found_any_embedding = False
    for service in services:
        service_text = _service_text(service)
        if not service_text:
            continue
        service_embedding = openai_client.get_embedding(service_text)
        if not service_embedding:
            continue
        found_any_embedding = True
        similarity = max(0.0, _cosine_similarity(need_embedding, service_embedding))
        score = similarity * 100
        if score > best_score:
            best_score = score
            best_service = service.get("service_name")

    if not found_any_embedding:
        return None
    return best_score, best_service

def score_skill_matches(need_text: str, candidates: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """candidates: [{"agency": "AG-1", "services": [{"service_name": ..., "skills": ...,
    "tech_stack": ...}, ...]}, ...]. Retourne, pour chaque agence, le meilleur score de
    correspondance (0-100) entre need_text et l'un de ses services, avec la methode
    utilisee ("openai" si un embedding a pu etre calcule, "stub" sinon) et le nom du
    service qui a obtenu ce score."""
    results: dict[str, dict[str, Any]] = {}
    need_text = (need_text or "").strip()

    for candidate in candidates:
        agency = candidate.get("agency")
        if not agency:
            continue
        services = candidate.get("services") or []

        if not need_text or not services:
            results[agency] = {"score": 0.0, "provider": "stub", "matched_service": None}
            continue

        semantic = _semantic_score(need_text, services) if openai_client.is_configured else None
        if semantic is not None:
            score, matched_service = semantic
            results[agency] = {"score": round(score, 1), "provider": "openai", "matched_service": matched_service}
        else:
            score, matched_service = _stub_score(need_text, services)
            results[agency] = {"score": round(score, 1), "provider": "stub", "matched_service": matched_service}

    return results
