from fastapi.testclient import TestClient

import main
from application.graph import build_graph


client = TestClient(main.app)

VALID_REQUEST = {
    "userId": "user-test-001",
    "origin": "Bogotá",
    # Destino sin ofertas en el catálogo, para que se usen las rutas de prueba.
    "destination": "Villa de Leyva",
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


def _graph_with_transport(monkeypatch, outbound_cost):
    """Reconstruye el grafo con agentes falsos y un transporte de ida con el costo dado."""
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

    def fake_transport(state):
        return {
            "transport_result": {
                "routeSummary": "Ruta de prueba",
                "outbound": [{
                    "origin": "Bogotá", "destination": "Villa de Leyva", "mode": "flight",
                    "estimatedDuration": "1 hora", "estimatedCost": outbound_cost,
                }],
                "totalTransportCost": outbound_cost,
            },
        }

    def fake_experiences(state):
        return {
            "experiences_result": {
                "activities": [], "gastronomy": [], "culturalHighlights": [],
            },
        }

    monkeypatch.setattr(graph, "personality_agent", fake_personality)
    monkeypatch.setattr(graph, "transport_agent", fake_transport)
    monkeypatch.setattr(graph, "activities_food_agent", fake_experiences)
    monkeypatch.setattr(main, "travel_graph", build_graph())


def test_un_plan_imposible_responde_422_con_el_motivo(monkeypatch):
    # Sin ningún transporte con costo válido no se puede armar el plan.
    _graph_with_transport(monkeypatch, outbound_cost=None)

    response = client.post("/api/v1/ai/plan", json=VALID_REQUEST)
    body = response.json()

    assert response.status_code == 422
    assert body["success"] is False
    assert body["error"]["code"] == "PLAN_NOT_POSSIBLE"
    assert body["error"]["details"]["errors"]


def test_un_transporte_costoso_ajusta_el_presupuesto_sugerido(monkeypatch):
    # Sin monto del usuario, el presupuesto se adapta al costo real del destino
    # en vez de rechazar el plan.
    _graph_with_transport(monkeypatch, outbound_cost=50_000_000)

    response = client.post("/api/v1/ai/plan", json=VALID_REQUEST)
    body = response.json()

    assert response.status_code == 200
    budget = body["data"]["budget"]
    assert budget["breakdown"]["transport"] == 50_000_000
    assert budget["isBudgetExceeded"] is False


def test_ruta_inexistente_responde_404_con_el_formato_comun():
    response = client.get("/api/v1/no-existe")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
