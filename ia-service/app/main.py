"""Point d'entrée FastAPI de ia-service (port 8083).

Cf. docs/INTEGRATION.md §2 (table des ports) et §6 (contrat ia-service).
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware  # ← DÉSACTIVÉ

from app.openai_client import is_configured as openai_configured
from app.routes import router as ia_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ia-service")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(
    title="ia-service",
    description="Smart Briefing IA + Assistant conversationnel - plateforme B2B (cf. docs/INTEGRATION.md §6)",
    version="1.0.0",
)

# ✅ DÉSACTIVÉ : Le CORS est géré par le Gateway
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[FRONTEND_URL],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(ia_router)


@app.get("/health")
async def health():
    """Healthcheck racine, sans auth - utilisé par docker-compose (cf.
    docs/INTEGRATION.md §10)."""
    return {"status": "ok", "service": "ia-service"}


@app.on_event("startup")
async def on_startup():
    mode = "openai" if openai_configured else "stub"
    logger.info("ia-service démarré - mode IA: %s", mode)
    if not openai_configured:
        logger.warning(
            "OPENAI_API_KEY absent : ia-service fonctionne en mode stub déterministe "
            "(réponses marquées provider=\"stub\"), cf. docs/INTEGRATION.md §9."
        )
