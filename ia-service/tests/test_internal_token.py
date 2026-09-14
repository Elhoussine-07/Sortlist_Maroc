import os

os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "dev-insecure-internal-token")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_HEADERS = {"X-Internal-Token": "dev-insecure-internal-token"}


def test_health_is_open_without_token():
    response = client.get("/health")
    assert response.status_code == 200


def test_router_health_is_open_without_token():
    response = client.get("/api/ia/health")
    assert response.status_code == 200


def test_chatbot_public_is_open_without_token():
    response = client.post("/api/ia/chatbot/public", json={"message": "bonjour"})
    assert response.status_code == 200


def test_chatbot_requires_internal_token():
    response = client.post("/api/ia/chatbot", json={"message": "bonjour"})
    assert response.status_code == 401


def test_chatbot_rejects_wrong_internal_token():
    response = client.post(
        "/api/ia/chatbot", json={"message": "bonjour"}, headers={"X-Internal-Token": "wrong"}
    )
    assert response.status_code == 401


def test_chatbot_accepts_valid_internal_token():
    response = client.post("/api/ia/chatbot", json={"message": "bonjour"}, headers=VALID_HEADERS)
    assert response.status_code == 200


def test_briefing_turn_requires_internal_token():
    response = client.post("/api/ia/briefing/turn", json={"user_message": "Bonjour"})
    assert response.status_code == 401


def test_briefing_turn_accepts_valid_internal_token():
    response = client.post("/api/ia/briefing/turn", json={"user_message": ""}, headers=VALID_HEADERS)
    assert response.status_code == 200


def test_briefing_categorize_requires_internal_token():
    response = client.post("/api/ia/briefing/categorize", json={"text": "site web"})
    assert response.status_code == 401


def test_briefing_enrich_requires_internal_token():
    response = client.post("/api/ia/briefing/enrich", json={"description": "site vitrine"})
    assert response.status_code == 401


def test_briefing_confirm_requires_internal_token():
    response = client.post("/api/ia/briefing/confirm", json={"brief": {}, "client": "a@b.com"})
    assert response.status_code == 401


def test_matching_skill_scores_requires_internal_token():
    response = client.post(
        "/api/ia/matching/skill-scores",
        json={"need_text": "site web", "candidates": []},
    )
    assert response.status_code == 401


def test_matching_skill_scores_accepts_valid_internal_token():
    response = client.post(
        "/api/ia/matching/skill-scores",
        json={"need_text": "site web", "candidates": []},
        headers=VALID_HEADERS,
    )
    assert response.status_code == 200
