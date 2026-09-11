
from __future__ import annotations

import asyncio
import os
import time
from typing import Any

import httpx

_FRAPPE_URL_EXPLICIT = os.environ.get("FRAPPE_URL", "").strip().rstrip("/") or None

FRAPPE_URL_CONTAINER = os.environ.get("FRAPPE_URL_CONTAINER", "http://frappe:8000").rstrip("/")
FRAPPE_URL_LOCAL = os.environ.get("FRAPPE_URL_LOCAL", "http://host.docker.internal:8000").rstrip("/")

INTERNAL_SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "dev-insecure-internal-token")

_PROBE_PATH = "/api/method/platform_core.platform_core.api.utils.ping"
_PROBE_TIMEOUT_SECONDS = 1.5
_URL_CACHE_TTL_SECONDS = 45

_CATEGORIES_CACHE: dict[str, Any] = {"data": None, "fetched_at": 0.0}
_CATEGORIES_TTL_SECONDS = 300

_url_cache: dict[str, Any] = {"url": None, "resolved_at": 0.0}
_url_lock = asyncio.Lock()

def _headers() -> dict[str, str]:
    return {
        "X-Internal-Token": INTERNAL_SERVICE_TOKEN,
        "Content-Type": "application/json",
        "Connection": "close",
    }

async def _probe(base_url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT_SECONDS) as client:
            resp = await client.get(f"{base_url}{_PROBE_PATH}")
        return resp.status_code < 500
    except httpx.HTTPError:
        return False

async def resolve_frappe_url() -> str:
    if _FRAPPE_URL_EXPLICIT:
        return _FRAPPE_URL_EXPLICIT

    now = time.time()
    cached_url = _url_cache["url"]
    if cached_url is not None and (now - _url_cache["resolved_at"]) < _URL_CACHE_TTL_SECONDS:
        return cached_url

    async with _url_lock:
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

        return cached_url or FRAPPE_URL_CONTAINER

def _unwrap(payload: Any) -> Any:
    if isinstance(payload, dict) and "message" in payload and set(payload.keys()) <= {"message"}:
        return payload["message"]
    return payload

class FrappeClientError(RuntimeError):
    pass

async def get_categories(force_refresh: bool = False) -> list[dict[str, Any]]:
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
        if _CATEGORIES_CACHE["data"] is not None:
            return _CATEGORIES_CACHE["data"]
        raise FrappeClientError(f"Impossible de récupérer les catégories Frappe: {exc}") from exc

async def create_project_from_briefing(client: str, brief: dict[str, Any]) -> dict[str, Any]:
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
