from __future__ import annotations

import os

from fastapi import Header, HTTPException

INTERNAL_SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "dev-insecure-internal-token")


async def require_internal_token(x_internal_token: str | None = Header(None, alias="X-Internal-Token")) -> None:
    """Verifie que l'appel entrant porte le meme jeton partage que celui utilise
    par ia-service pour appeler Frappe en sortant, injecte par l'api-gateway sur
    les routes /api/ia/**. Sans cette verification, ia-service etait joignable
    directement (port 8083 expose) sans aucun controle."""
    if x_internal_token is None or x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Jeton interne manquant ou invalide")
