"""Client HTTP vers les endpoints internes Frappe consommés par ia-service.

Cf. docs/INTEGRATION.md §6 "ia-service":
  - GET  /api/method/platform_core.platform_core.api.ia.get_categories
  - POST /api/method/platform_core.platform_core.api.ia.create_project_from_briefing

Protégés par le header `X-Internal-Token: <INTERNAL_SERVICE_TOKEN>` (§4).

Résolution de l'URL Frappe (bascule conteneur/local, cf.
docs/FRAPPE_FALLBACK.md) : voir `resolve_frappe_url()` ci-dessous. Aucune des
deux fonctions publiques de ce module ne code en dur "Frappe est en local"
ou "en conteneur" — l'URL de base est déterminée dynamiquement à chaque
appel (avec un cache court pour éviter de sonder Frappe à chaque requête).
"""

from __future__ import annotations

import asyncio
import os
import time
from typing import Any

import httpx

# Override explicite optionnel (debug) : si définie, désactive la bascule
# automatique et fige l'URL Frappe utilisée pour tous les appels.
_FRAPPE_URL_EXPLICIT = os.environ.get("FRAPPE_URL", "").strip().rstrip("/") or None

# URLs candidates pour la bascule automatique (utilisées seulement si
# _FRAPPE_URL_EXPLICIT est absente).
FRAPPE_URL_CONTAINER = os.environ.get("FRAPPE_URL_CONTAINER", "http://frappe:8000").rstrip("/")
FRAPPE_URL_LOCAL = os.environ.get("FRAPPE_URL_LOCAL", "http://host.docker.internal:8000").rstrip("/")

INTERNAL_SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "dev-insecure-internal-token")

_PROBE_PATH = "/api/method/platform_core.platform_core.api.utils.ping"
_PROBE_TIMEOUT_SECONDS = 1.5
_URL_CACHE_TTL_SECONDS = 45

_CATEGORIES_CACHE: dict[str, Any] = {"data": None, "fetched_at": 0.0}
_CATEGORIES_TTL_SECONDS = 300

# Cache court du dernier choix d'URL Frappe qui a fonctionné (expire et se
# re-teste, cf. docstring de resolve_frappe_url).
_url_cache: dict[str, Any] = {"url": None, "resolved_at": 0.0}
_url_lock = asyncio.Lock()


def _headers() -> dict[str, str]:
    return {
        "X-Internal-Token": INTERNAL_SERVICE_TOKEN,
        "Content-Type": "application/json",
        # Le serveur de dev Frappe (Werkzeug, `bench start`) répond 417
        # Expectation Failed sur des connexions keep-alive avec certains
        # clients HTTP/1.1 (httpx). Forcer la fermeture évite ce bug ; sans
        # incidence en prod, où Frappe tourne derrière gunicorn/nginx.
        "Connection": "close",
    }


async def _probe(base_url: str) -> bool:
    """Sonde courte (timeout ~1.5s) pour savoir si `base_url` répond.

    Une réponse HTTP (même 4xx) prouve que quelque chose écoute à cette
    adresse ; seule une erreur réseau (connexion refusée, timeout, DNS
    introuvable) est traitée comme "indisponible".
    """
    try:
        async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT_SECONDS) as client:
            resp = await client.get(f"{base_url}{_PROBE_PATH}")
        return resp.status_code < 500
    except httpx.HTTPError:
        return False


async def resolve_frappe_url() -> str:
    """Détermine l'URL de base Frappe à utiliser *maintenant*.

    Essaie d'abord l'URL "conteneur" (FRAPPE_URL_CONTAINER), et si la sonde
    échoue, bascule sur l'URL "locale" (FRAPPE_URL_LOCAL). Le résultat est
    mis en cache ~45s pour éviter de sonder Frappe à chaque requête, puis
    expire et est re-testé (pour suivre Frappe si son mode de déploiement
    change en cours de route, sans redémarrage).

    Si FRAPPE_URL est explicitement définie, elle est retournée telle
    quelle et aucune sonde n'est jamais effectuée (bascule désactivée).
    """
    if _FRAPPE_URL_EXPLICIT:
        return _FRAPPE_URL_EXPLICIT

    now = time.time()
    cached_url = _url_cache["url"]
    if cached_url is not None and (now - _url_cache["resolved_at"]) < _URL_CACHE_TTL_SECONDS:
        return cached_url

    async with _url_lock:
        # Un autre coroutine a peut-etre deja rafraichi le cache pendant
        # qu'on attendait le verrou.
        cached_url = _url_cache["url"]
        if cached_url is not None and (time.time() - _url_cache["resolved_at"]) < _URL_CACHE_TTL_SECONDS:
            return cached_url

        if await _probe(FRAPPE_URL_CONTAINER):
            _url_cache["url"] = FRAPPE_URL_CONTAINER
            _url_cache["resolved_at"] = time.time()
            return FRAPPE_URL_CONTAINER

        if await _probe(FRAPPE_URL_LOCAL):
            _url_cache["url"] = FRAPPE_URL_LOCAL
            _url_cache["resolved_at"] = time.time()
            return FRAPPE_URL_LOCAL

        # Les deux sondes ont échoué : on retombe sur le dernier choix connu
        # (même périmé) plutôt que de flapper, sinon sur l'URL conteneur par
        # défaut. On NE rafraîchit PAS le timestamp du cache, pour que le
        # prochain appel retente une sonde immédiatement plutôt que de
        # rester bloqué ~45s sur un échec.
        return cached_url or FRAPPE_URL_CONTAINER


def _unwrap(payload: Any) -> Any:
    """Les méthodes `frappe.whitelist` exposées via /api/method/ renvoient
    généralement `{"message": <valeur>}`. On dévoile cette enveloppe si
    présente, sinon on renvoie le payload tel quel (robustesse aux deux
    formats)."""
    if isinstance(payload, dict) and "message" in payload and set(payload.keys()) <= {"message"}:
        return payload["message"]
    return payload


class FrappeClientError(RuntimeError):
    """Erreur lors d'un appel service-à-service vers Frappe."""


async def get_categories(force_refresh: bool = False) -> list[dict[str, Any]]:
    """Récupère les catégories/sous-catégories actives, avec un petit cache
    en mémoire (5 min) pour éviter de solliciter Frappe à chaque appel de
    catégorisation."""
    now = time.time()
    if not force_refresh and _CATEGORIES_CACHE["data"] is not None:
        if now - _CATEGORIES_CACHE["fetched_at"] < _CATEGORIES_TTL_SECONDS:
            return _CATEGORIES_CACHE["data"]

    base_url = await resolve_frappe_url()
    url = f"{base_url}/api/method/platform_core.platform_core.api.ia.get_categories"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=_headers())
        resp.raise_for_status()
        data = _unwrap(resp.json())
        data = data or []
        _CATEGORIES_CACHE["data"] = data
        _CATEGORIES_CACHE["fetched_at"] = now
        return data
    except (httpx.HTTPError, ValueError) as exc:
        # Frappe indisponible : on retombe sur le cache s'il existe (même
        # périmé), sinon liste vide (la catégorisation heuristique se
        # dégrade gracieusement).
        if _CATEGORIES_CACHE["data"] is not None:
            return _CATEGORIES_CACHE["data"]
        raise FrappeClientError(f"Impossible de récupérer les catégories Frappe: {exc}") from exc


async def create_project_from_briefing(client: str, brief: dict[str, Any]) -> dict[str, Any]:
    """Appelle Frappe pour créer le Project (source de vérité) + générer le
    CDC PDF. C'est le SEUL endroit où ia-service déclenche une écriture
    durable, et elle passe toujours par Frappe."""
    base_url = await resolve_frappe_url()
    url = f"{base_url}/api/method/platform_core.platform_core.api.ia.create_project_from_briefing"
    body = {"client": client, "brief": brief}
    try:
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            resp = await http_client.post(url, headers=_headers(), json=body)
        resp.raise_for_status()
        return _unwrap(resp.json())
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text
        raise FrappeClientError(f"Frappe a refusé create_project_from_briefing ({exc.response.status_code}): {detail}") from exc
    except httpx.HTTPError as exc:
        raise FrappeClientError(f"Frappe injoignable pour create_project_from_briefing: {exc}") from exc
