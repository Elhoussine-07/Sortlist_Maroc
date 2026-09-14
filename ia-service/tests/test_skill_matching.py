import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "dev-insecure-internal-token")

from fastapi.testclient import TestClient

from app import skill_matching
from app.main import app

client = TestClient(app)
VALID_HEADERS = {"X-Internal-Token": "dev-insecure-internal-token"}

WEB_SERVICE = {
    "service_name": "Developpement web",
    "skills": "React, Node.js",
    "tech_stack": "React, Node, PostgreSQL",
}
MARKETING_SERVICE = {
    "service_name": "Marketing digital",
    "skills": "SEO, SEA",
    "tech_stack": "Google Ads, Analytics",
}


def test_cosine_similarity_identical_vectors_is_one():
    assert skill_matching._cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0


def test_cosine_similarity_orthogonal_vectors_is_zero():
    assert skill_matching._cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_cosine_similarity_handles_empty_or_mismatched_vectors():
    assert skill_matching._cosine_similarity([], [1.0]) == 0.0
    assert skill_matching._cosine_similarity([1.0, 2.0], [1.0]) == 0.0


def test_stub_score_favors_matching_service_over_unrelated_one():
    score, matched = skill_matching._stub_score(
        "Je cherche un developpement de site web moderne", [WEB_SERVICE, MARKETING_SERVICE]
    )
    assert score > 0
    assert matched == "Developpement web"


def test_stub_score_is_zero_with_no_overlap():
    score, matched = skill_matching._stub_score("Besoin de traduction juridique", [WEB_SERVICE])
    assert score == 0.0
    assert matched is None


def test_score_skill_matches_uses_stub_when_openai_not_configured(monkeypatch):
    monkeypatch.setattr(skill_matching.openai_client, "is_configured", False)
    candidates = [
        {"agency": "AG-WEB", "services": [WEB_SERVICE]},
        {"agency": "AG-MARKETING", "services": [MARKETING_SERVICE]},
    ]
    results = skill_matching.score_skill_matches(
        "Je cherche un developpement de site web moderne", candidates
    )

    assert results["AG-WEB"]["provider"] == "stub"
    assert results["AG-WEB"]["score"] > results["AG-MARKETING"]["score"]


def test_score_skill_matches_uses_openai_when_embeddings_available(monkeypatch):
    monkeypatch.setattr(skill_matching.openai_client, "is_configured", True)

    def fake_embedding(text):
        # Vecteurs factices : le texte "web" pointe sur l'axe X, "marketing" sur l'axe Y.
        return [1.0, 0.0] if "web" in text.lower() else [0.0, 1.0]

    monkeypatch.setattr(skill_matching.openai_client, "get_embedding", fake_embedding)

    candidates = [
        {"agency": "AG-WEB", "services": [WEB_SERVICE]},
        {"agency": "AG-MARKETING", "services": [MARKETING_SERVICE]},
    ]
    results = skill_matching.score_skill_matches("besoin de developpement web", candidates)

    assert results["AG-WEB"]["provider"] == "openai"
    assert results["AG-WEB"]["score"] == 100.0
    assert results["AG-MARKETING"]["score"] == 0.0


def test_score_skill_matches_falls_back_to_stub_when_embedding_fails(monkeypatch):
    monkeypatch.setattr(skill_matching.openai_client, "is_configured", True)
    monkeypatch.setattr(skill_matching.openai_client, "get_embedding", lambda text: None)

    candidates = [{"agency": "AG-WEB", "services": [WEB_SERVICE]}]
    results = skill_matching.score_skill_matches(
        "Je cherche un developpement de site web moderne", candidates
    )

    assert results["AG-WEB"]["provider"] == "stub"


def test_score_skill_matches_handles_agency_without_services():
    candidates = [{"agency": "AG-EMPTY", "services": []}]
    results = skill_matching.score_skill_matches("Site e-commerce", candidates)

    assert results["AG-EMPTY"] == {"score": 0.0, "provider": "stub", "matched_service": None}


def test_score_skill_matches_handles_blank_need_text():
    candidates = [{"agency": "AG-WEB", "services": [WEB_SERVICE]}]
    results = skill_matching.score_skill_matches("   ", candidates)

    assert results["AG-WEB"] == {"score": 0.0, "provider": "stub", "matched_service": None}


def test_skill_scores_route_returns_scores_for_each_candidate():
    payload = {
        "need_text": "Je cherche un developpement de site web moderne",
        "candidates": [
            {"agency": "AG-WEB", "services": [WEB_SERVICE]},
            {"agency": "AG-MARKETING", "services": [MARKETING_SERVICE]},
        ],
    }
    response = client.post("/api/ia/matching/skill-scores", json=payload, headers=VALID_HEADERS)

    assert response.status_code == 200
    scores = response.json()["scores"]
    assert scores["AG-WEB"]["score"] > scores["AG-MARKETING"]["score"]
    assert scores["AG-WEB"]["matched_service"] == "Developpement web"
