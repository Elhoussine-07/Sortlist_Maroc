"""Schémas Pydantic pour ia-service.

Voir docs/INTEGRATION.md §6 "ia-service" pour le contrat exact avec Frappe,
et le cahier des charges module 1.2 (Smart Briefing IA) / 3.4 (Chatbot).
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

# --------------------------------------------------------------------------
# Briefing conversationnel (module 1.2)
# --------------------------------------------------------------------------


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' ou 'assistant'")
    content: str


class BriefingTurnRequest(BaseModel):
    conversation_history: list[ChatMessage] = Field(default_factory=list)
    user_message: str = ""
    current_brief: dict[str, Any] = Field(default_factory=dict)


class BriefingTurnResponse(BaseModel):
    ready: bool
    question: Optional[str] = None
    brief: dict[str, Any]
    missing_fields: list[str] = Field(default_factory=list)
    provider: str


class CategorizeRequest(BaseModel):
    text: str


class CategorizeResponse(BaseModel):
    category: Optional[str] = None
    category_name: Optional[str] = None
    sub_category: Optional[str] = None
    sub_category_name: Optional[str] = None
    confidence: float = 0.0
    provider: str


class EnrichRequest(BaseModel):
    description: str
    category: Optional[str] = None


class EnrichResponse(BaseModel):
    description: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_suggested: bool = False
    provider: str


class ConfirmRequest(BaseModel):
    client: str
    brief: dict[str, Any]


class ConfirmResponse(BaseModel):
    project: str
    cdc_file: Optional[str] = None


# --------------------------------------------------------------------------
# Chatbot (module 3.4)
# --------------------------------------------------------------------------


class ChatbotRequest(BaseModel):
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


class ChatbotResponse(BaseModel):
    reply: str
    escalate: bool = False
    matched_topic: Optional[str] = None
    provider: str


# --------------------------------------------------------------------------
# Catégories Frappe (cf. platform_core.api.ia.get_categories)
# --------------------------------------------------------------------------


class SubCategory(BaseModel):
    name: str
    sub_category_name: str
    category: str


class Category(BaseModel):
    name: str
    category_name: str
    icon: Optional[str] = None
    sub_categories: list[SubCategory] = Field(default_factory=list)



