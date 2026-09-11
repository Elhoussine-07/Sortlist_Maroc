
from __future__ import annotations

import re
import unicodedata
from typing import Any, Optional

SLOT_ORDER: list[str] = ["description", "need_type", "category", "budget", "location", "delivery_delay_days"]

SLOT_FIELDS: dict[str, list[str]] = {
    "description": ["description"],
    "need_type": ["need_type"],
    "category": ["category"],
    "budget": ["budget_min", "budget_max"],
    "location": ["location"],
    "delivery_delay_days": ["delivery_delay_days"],
}

SLOT_QUESTIONS: dict[str, str] = {
    "description": "Bonjour ! Décrivez-moi en quelques mots le besoin que vous souhaitez confier à un prestataire.",
    "need_type": "S'agit-il d'un projet ponctuel, d'un stage ou d'une offre d'emploi (job) ?",
    "category": (
        "Pouvez-vous préciser la catégorie de prestation qui correspond le mieux à votre besoin "
        "(ex : développement web, design graphique, marketing, juridique...) ?"
    ),
    "budget": "Quel est votre budget approximatif pour ce projet (en euros) ?",
    "location": "Où ce projet doit-il se dérouler (ville, pays, ou « à distance ») ?",
    "delivery_delay_days": "Sous combien de jours souhaitez-vous démarrer / avoir terminé ce projet ?",
}

def next_missing_slot(brief: dict[str, Any]) -> Optional[str]:
    for slot in SLOT_ORDER:
        if slot == "category" and brief.get("_category_skipped"):
            continue
        fields = SLOT_FIELDS[slot]
        if any(not brief.get(f) for f in fields):
            return slot
    return None

def missing_fields(brief: dict[str, Any]) -> list[str]:
    result: list[str] = []
    for slot in SLOT_ORDER:
        if slot == "category" and brief.get("_category_skipped"):
            continue
        for field in SLOT_FIELDS[slot]:
            if not brief.get(field) and field not in result:
                result.append(field)
    return result

def default_question_for_slot(slot: str, brief: dict[str, Any]) -> str:
    return SLOT_QUESTIONS.get(slot, "Pouvez-vous m'en dire plus sur votre besoin ?")

def finalize_brief(brief: dict[str, Any]) -> dict[str, Any]:
    brief = dict(brief)
    if not brief.get("title") and brief.get("description"):
        title = brief["description"].strip()
        brief["title"] = (title[:57] + "...") if len(title) > 60 else title
    if not brief.get("need_type"):
        brief["need_type"] = "Projet"
    return brief

_STOPWORDS_FR = {
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "je", "pour", "avec", "sur", "dans",
    "mon", "ma", "mes", "notre", "nos", "au", "aux", "en", "a", "que", "qui", "ce", "cette", "ces",
    "nous", "vous", "il", "elle", "est", "suis", "avons", "cherche", "cherchons", "besoin",
    "recherche", "voudrais", "aimerais", "faire", "avoir", "être", "etre", "svp", "merci", "bonjour",
    "afin", "par", "ou", "où", "donc", "car", "ni", "mais", "not", "the", "for", "with",
}

def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text

def _tokens(text: str) -> set[str]:
    text = _normalize(text)
    raw = re.findall(r"[a-z0-9]+", text)
    stems = set()
    for tok in raw:
        if len(tok) < 3 or tok in _STOPWORDS_FR:
            continue
        stems.add(tok[:5] if len(tok) > 5 else tok)
    return stems

def _full_tokens(text: str) -> set[str]:
    text = _normalize(text)
    raw = re.findall(r"[a-z0-9]+", text)
    return {tok for tok in raw if len(tok) >= 3 and tok not in _STOPWORDS_FR}

def _prefix_overlap(a: set[str], b: set[str], min_len: int = 3) -> int:
    count = 0
    for token_a in a:
        for token_b in b:
            shorter, longer = (token_a, token_b) if len(token_a) <= len(token_b) else (token_b, token_a)
            if len(shorter) >= min_len and longer.startswith(shorter):
                count += 1
                break
    return count

def categorize_text(text: str, categories: list[dict[str, Any]], threshold: float = 0.12) -> dict[str, Any]:
    text_stems = _full_tokens(text)
    best: dict[str, Any] = {
        "category": None,
        "category_name": None,
        "sub_category": None,
        "sub_category_name": None,
        "confidence": 0.0,
    }
    if not text_stems or not categories:
        return best

    best_score = 0.0
    for cat in categories:
        cat_name = cat.get("category_name") or ""
        cat_stems = _full_tokens(cat_name)
        sub_categories = cat.get("sub_categories") or []

        if cat_stems:
            overlap = _prefix_overlap(text_stems, cat_stems)
            score = overlap / max(len(cat_stems), 1)
            if score > best_score:
                best_score = score
                best = {
                    "category": cat.get("name"),
                    "category_name": cat_name,
                    "sub_category": None,
                    "sub_category_name": None,
                    "confidence": min(1.0, score),
                }

        for sub in sub_categories:
            sub_name = sub.get("sub_category_name") or ""
            sub_stems = _full_tokens(sub_name)
            combined = cat_stems | sub_stems
            if not combined:
                continue
            overlap = _prefix_overlap(text_stems, combined)
            score = overlap / max(len(combined), 1)
            if sub_stems and (text_stems & sub_stems):
                score += 0.15
            if score > best_score:
                best_score = score
                best = {
                    "category": cat.get("name"),
                    "category_name": cat_name,
                    "sub_category": sub.get("name"),
                    "sub_category_name": sub_name,
                    "confidence": min(1.0, score),
                }

    if best_score < threshold:
        return {
            "category": None,
            "category_name": None,
            "sub_category": None,
            "sub_category_name": None,
            "confidence": round(best_score, 3),
        }
    best["confidence"] = round(best["confidence"], 3)
    return best

def infer_need_type(text: str) -> Optional[str]:
    lower = _normalize(text)
    if any(k in lower for k in ("stage", "stagiaire", "alternance", "alternant")):
        return "Stage"
    if any(k in lower for k in ("emploi", "job", "recrut", "cdi", "cdd", "embauch", "poste a pourvoir")):
        return "Job"
    if any(k in lower for k in ("projet", "mission", "prestation", "prestataire")):
        return "Projet"
    return None

_THOUSAND_SPACING_RE = re.compile(r"(?<=\d)[  ](?=\d{3}(?:\D|$))")
_NUMBER_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(k)?", re.IGNORECASE)

def _extract_numbers(text: str) -> list[float]:
    normalized = text
    prev = None
    while prev != normalized:
        prev = normalized
        normalized = _THOUSAND_SPACING_RE.sub("", normalized)
    values: list[float] = []
    for match in _NUMBER_RE.finditer(normalized):
        raw, k_suffix = match.groups()
        if not raw:
            continue
        try:
            value = float(raw.replace(",", "."))
        except ValueError:
            continue
        if k_suffix:
            value *= 1000
        values.append(value)
    return values

def parse_budget(text: str) -> tuple[Optional[float], Optional[float]]:
    numbers = _extract_numbers(text)
    if not numbers:
        return (None, None)
    if len(numbers) == 1:
        return (numbers[0], numbers[0])
    lo, hi = sorted(numbers[:2])
    return (lo, hi)

def parse_delay_days(text: str) -> Optional[int]:
    lower = _normalize(text)
    match = re.search(r"(\d+)", lower)
    if match:
        n = int(match.group(1))
        if "semaine" in lower:
            return n * 7
        if "mois" in lower:
            return n * 30
        return n
    if any(k in lower for k in ("urgent", "rapide", "au plus vite", "asap")):
        return 7
    if any(k in lower for k in ("pas presse", "flexible", "peu importe")):
        return 30
    return None

_BUDGET_KEYWORD_TABLE: list[tuple[str, tuple[float, float]]] = [
    ("logo", (300, 1500)),
    ("identite visuelle", (500, 3000)),
    ("charte graphique", (500, 3000)),
    ("design", (500, 3000)),
    ("graphi", (500, 3000)),
    ("application mobile", (5000, 20000)),
    ("app mobile", (5000, 20000)),
    ("site web", (2000, 8000)),
    ("site internet", (2000, 8000)),
    ("e-commerce", (3000, 12000)),
    ("ecommerce", (3000, 12000)),
    ("developpement", (3000, 15000)),
    ("informatique", (2000, 10000)),
    ("marketing", (1000, 6000)),
    ("communication", (1000, 6000)),
    ("reseaux sociaux", (500, 3000)),
    ("juridique", (500, 3000)),
    ("comptab", (500, 3000)),
    ("traduction", (200, 1500)),
    ("redaction", (300, 2000)),
    ("photo", (500, 3000)),
    ("video", (800, 5000)),
    ("recrutement", (1000, 5000)),
    ("ressources humaines", (1000, 5000)),
    ("conseil", (1000, 8000)),
    ("formation", (500, 4000)),
]

_DEFAULT_BUDGET_RANGE: tuple[float, float] = (1000, 5000)

def suggest_budget(description: str, category_name: Optional[str]) -> tuple[float, float]:
    combined = _normalize(f"{category_name or ''} {description or ''}")
    for keyword, budget_range in _BUDGET_KEYWORD_TABLE:
        if keyword in combined:
            return budget_range
    return _DEFAULT_BUDGET_RANGE

def reformulate_description_stub(description: str, category_name: Optional[str]) -> str:
    text = (description or "").strip()
    if not text:
        return text
    cat_phrase = f" dans la catégorie « {category_name} »" if category_name else ""
    cleaned = text.rstrip(". ")
    return (
        f"Besoin exprimé par le client{cat_phrase} : {cleaned}. "
        "Ce brief pourra être précisé (livrables attendus, contraintes techniques, "
        "contexte du projet) afin de faciliter la mise en relation avec les prestataires "
        "les plus adaptés."
    )

FAQ_KNOWLEDGE_BASE: list[dict[str, Any]] = [
    {
        "topic": "fonctionnement",
        "keywords": ["fonctionne", "fonctionnement", "comment ca marche", "mise en relation", "utiliser la plateforme"],
        "answer": (
            "La plateforme met en relation des entreprises clientes avec des prestataires/agences : "
            "vous déposez un projet (via le Smart Briefing IA, Unicast ou Multicast), les agences "
            "compatibles sont identifiées, puis vous échangez des devis jusqu'à sélectionner votre "
            "prestataire."
        ),
    },
    {
        "topic": "facturation",
        "keywords": ["facturation", "commission", "tarif", "prix", "cout", "combien ca coute", "gratuit", "payant"],
        "answer": (
            "Le dépôt d'un projet est entièrement gratuit pour le client, quel que soit le canal "
            "utilisé (Smart Briefing, Unicast ou Multicast). Les modalités de facturation entre le "
            "client et le prestataire retenu sont définies directement dans le devis accepté."
        ),
    },
    {
        "topic": "delais",
        "keywords": ["delai", "delais", "combien de temps", "rapidite", "mise en relation rapide"],
        "answer": (
            "Le délai de mise en relation dépend de votre catégorie de besoin et du nombre "
            "d'agences actives sur ce segment. Une estimation basée sur des projets similaires "
            "déjà traités vous est proposée pendant le Smart Briefing."
        ),
    },
    {
        "topic": "cdc",
        "keywords": ["cahier des charges", "cdc", "pdf", "document", "brief"],
        "answer": (
            "À la fin du questionnaire, un cahier des charges (CDC) structuré est généré "
            "automatiquement au format PDF. Vous pouvez le modifier tant que le projet n'est pas "
            "passé en statut « En cours »."
        ),
    },
    {
        "topic": "categories",
        "keywords": ["categorie", "categories", "sous-categorie", "type de prestation", "domaine"],
        "answer": (
            "Décrivez votre besoin en langage naturel : la catégorisation automatique détecte pour "
            "vous la catégorie et la sous-catégorie de service les plus pertinentes, sans avoir à "
            "naviguer dans une arborescence."
        ),
    },
    {
        "topic": "statuts_projet",
        "keywords": ["statut", "statuts", "avancement", "suivi", "ou en est mon projet"],
        "answer": (
            "Un projet suit le parcours suivant : Brouillon → Postulé → En attente → En cours → "
            "(éventuellement Suspendu) → Terminé, ou Rejeté si aucune suite n'est donnée."
        ),
    },
    {
        "topic": "compte",
        "keywords": ["inscription", "creer un compte", "compte", "connexion", "otp", "mot de passe"],
        "answer": (
            "L'inscription se fait par e-mail avec vérification par OTP. Pour une agence, le numéro "
            "d'enregistrement légal est vérifié automatiquement selon le pays afin de renforcer la "
            "confiance dès l'inscription."
        ),
    },
]

def match_faq(message: str) -> Optional[dict[str, Any]]:
    stems = _tokens(message)
    lower = _normalize(message)
    best_topic = None
    best_score = 0
    for entry in FAQ_KNOWLEDGE_BASE:
        score = 0
        for keyword in entry["keywords"]:
            if keyword in lower:
                score += 2
            elif " " not in keyword:
                keyword_stems = _tokens(keyword)
                score += len(stems & keyword_stems)
        if score > best_score:
            best_score = score
            best_topic = entry
    if best_score < 2:
        return None
    return best_topic
