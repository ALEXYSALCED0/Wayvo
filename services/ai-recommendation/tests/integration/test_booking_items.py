from fastapi.testclient import TestClient

import main
from application import graph
from application.graph import build_graph


def test_plan_bogota_cartagena_sugiere_items_reservables_del_catalogo(monkeypatch):
    """Los items sugeridos coinciden con el presupuesto del plan y con los ids de provider-service."""

    def fake_personality(state):
        return {
            "personality_result": {
                "analyzedStyle": "Cultural",
                "traitSummary": "Perfil de prueba",
                "dominantPace": "Moderado",
                "recommendedVibe": "Cultura",
            },
        }

    def fake_transport(state):
        # Gemini propone un bus; como hay vuelos en el catálogo, se reemplaza.
        return {
            "transport_result": {
                "routeSummary": "Ruta de prueba",
                "outbound": [{
                    "origin": "Bogotá", "destination": "Cartagena", "mode": "bus",
                    "estimatedDuration": "20 horas", "estimatedCost": 150_000,
                }],
                "totalTransportCost": 150_000,
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

    response = TestClient(main.app).post("/api/v1/ai/plan", json={
        "userId": "user-1",
        "origin": "Bogotá",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-18",
        "travelers": 2,
        "budgetCategory": "Estándar",
        "psychologicalAssessment": {
            "spontaneityScore": 3,
            "comfortPriority": 3,
            "culturalCuriosity": 4,
            "socialPreference": "couple",
            "physicalActivityLevel": "moderate",
            "interests": ["historia"],
        },
    })

    assert response.status_code == 200, response.json()
    plan = response.json()["data"]
    items = {item["type"]: item for item in plan["suggestedBookingItems"]}

    # Vuelo más barato del catálogo (el de la noche), para 2 personas.
    assert items["TRANSPORT"]["providerId"] == "prov-aerocaribe"
    assert items["TRANSPORT"]["offerId"] == "offer-aerocaribe-bog-ctg-pm"
    assert items["TRANSPORT"]["quantity"] == 2
    assert items["TRANSPORT"]["unitPrice"] == 290_000

    # Hotel estándar: 1 habitación x 3 noches.
    assert items["ACCOMMODATION"]["offerId"] == "offer-colonial-standard"
    assert items["ACCOMMODATION"]["quantity"] == 3

    assert items["ACTIVITY"]["offerId"] == "offer-guia-ciudad-amurallada"

    # Lo que se reserva es lo mismo que se presupuestó.
    breakdown = plan["budget"]["breakdown"]
    assert breakdown["transport"] == 290_000 * 2
    assert breakdown["accommodation"] == 420_000 * 3

    # El vuelo aparece en el itinerario a su hora real de salida.
    first_day = plan["itinerary"]["days"][0]["events"]
    flight = next(event for event in first_day if event["type"] == "FLIGHT")
    assert flight["startDateTime"] == "2026-11-15T19:45:00"
