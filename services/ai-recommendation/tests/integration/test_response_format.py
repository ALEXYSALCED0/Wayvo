from fastapi.testclient import TestClient

import main
from application.graph import build_graph


client = TestClient(main.app)

VALID_REQUEST = {
    "userId": "user-test-001",
    "origin": "Bogotá",
    "destination": "Cartagena",
    "startDate": "2026-11-15",
    "endDate": "2026-11-17",
    "travelers": 2,
    "budgetCategory": "Estándar",
    "psychologicalAssessment": {
        "spontaneityScore": 3,
        "comfortPriority": 3,
        "culturalCuriosity": 3,
        "socialPreference": "couple",
        "physicalActivityLevel": "moderate",
        "interests": ["playa"],
    },
}


def test_health_usa_el_formato_comun():
    body = client.get("/health").json()

    assert body["success"] is True
    assert body["data"]["service"] == "ai-recommendation"


def test_datos_invalidos_responden_400_con_el_campo_que_falla():
    request = {**VALID_REQUEST, "travelers": 0}

    response = client.post("/api/v1/ai/plan", json=request)
    body = response.json()

    assert response.status_code == 400
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_DATA"
    assert body["error"]["details"][0]["field"] == "travelers"


def test_fechas_invertidas_responden_400():
    request = {**VALID_REQUEST, "startDate": "2026-11-20", "endDate": "2026-11-17"}

    response = client.post("/api/v1/ai/plan", json=request)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_DATA"


def test_un_plan_imposible_responde_422_con_el_motivo(monkeypatch):
    from application import graph

    def fake_personality(state):
        return {
            "personality_result": {
                "analyzedStyle": "Relax",
                "traitSummary": "Perfil de prueba",
                "dominantPace": "Relajado",
                "recommendedVibe": "Descanso",
            },
        }

    def expensive_transport(state):
        # El transporte solo ya supera el presupuesto sugerido.
        return {
            "transport_result": {
                "routeSummary": "Ruta muy costosa",
                "outbound": [{
                    "origin": "Bogotá", "destination": "Cartagena", "mode": "flight",
                    "estimatedDuration": "1 hora", "estimatedCost": 50_000_000,
                }],
                "totalTransportCost": 50_000_000,
            },
        }

    def fake_experiences(state):
        return {
            "experiences_result": {
                "activities": [], "gastronomy": [], "culturalHighlights": [],
            },
        }

    monkeypatch.setattr(graph, "personality_agent", fake_personality)
    monkeypatch.setattr(graph, "transport_agent", expensive_transport)
    monkeypatch.setattr(graph, "activities_food_agent", fake_experiences)
    monkeypatch.setattr(main, "travel_graph", build_graph())

    response = client.post("/api/v1/ai/plan", json=VALID_REQUEST)
    body = response.json()

    assert response.status_code == 422
    assert body["success"] is False
    assert body["error"]["code"] == "PLAN_NOT_POSSIBLE"
    assert body["error"]["details"]["errors"]


def test_ruta_inexistente_responde_404_con_el_formato_comun():
    response = client.get("/api/v1/no-existe")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
