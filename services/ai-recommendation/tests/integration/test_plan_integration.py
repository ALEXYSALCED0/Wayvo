from application.budget_agent import budget_agent


def test_budget_agent_con_alojamiento_ficticio():
    """Comprueba que el agente calcule el presupuesto con alojamiento."""

    state = {
        "userId": "user-test-001",
        "origin": "Barranquilla",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-18",
        "travelers": 2,
        "budgetCategory": "Estándar",
        "currency": "COP",
        "approximateBudgetAmount": 1_000_000,
        "transport_result": {
            "outbound": [
                {
                    "origin": "Barranquilla",
                    "destination": "Cartagena",
                    "mode": "bus",
                    "estimatedCost": 100_000,
                }
            ],
            "inbound": [
                {
                    "origin": "Cartagena",
                    "destination": "Barranquilla",
                    "mode": "bus",
                    "estimatedCost": 100_000,
                }
            ],
            "totalTransportCost": 200_000,
        },
        "experiences_result": {
            "activities": [
                {
                    "title": "Visita cultural de prueba",
                    "estimatedCost": 100_000,
                }
            ],
            "gastronomy": [
                {
                    "dish": "Comida típica de prueba",
                    "estimatedCost": 50_000,
                }
            ],
        },
        "accommodation_options": [
            {
                "id": "test-hotel-001",
                "name": "Alojamiento ficticio",
                "estimatedCost": 250_000,
            }
        ],
    }

    result = budget_agent(state)

    assert result.get("errors") == []

    budget = result["budget_result"]
    breakdown = budget["breakdown"]

    assert breakdown["transport"] == 200_000
    assert breakdown["accommodation"] == 250_000
    assert breakdown["activities"] == 100_000
    assert breakdown["food"] == 50_000

    assert budget["estimatedTotalCost"] == 600_000
    assert budget["estimatedTotalCost"] <= state["approximateBudgetAmount"]

    assert result["selected_accommodation"]["id"] == "test-hotel-001"




from application.graph import build_graph


def test_grafo_completo_genera_un_plan_sin_ofertas_de_alojamiento(monkeypatch):
    from application import graph

    def fake_personality(state):
        return {
            "personality_result": {
                "analyzedStyle": "Cultural",
                "traitSummary": "Perfil cultural de prueba",
                "dominantPace": "Moderado",
                "recommendedVibe": "Cultural",
            },
            "errors": state.get("errors", []),
        }

    def fake_transport(state):
        return {
            "transport_result": {
                "routeSummary": "Ruta ficticia de prueba",
                "outbound": [
                    {
                        "origin": "Barranquilla",
                        "destination": "Cartagena",
                        "mode": "bus",
                        "estimatedDuration": "2 horas",
                        "estimatedCost": 100000,
                    }
                ],
                "inbound": [],
                "totalTransportCost": 100000,
            },
            "errors": state.get("errors", []),
        }

    def fake_experiences(state):
        return {
            "experiences_result": {
                "activities": [
                    {
                        "title": "Visita cultural de prueba",
                        "category": "Cultura",
                        "description": "Actividad ficticia",
                        "duration": "2 horas",
                        "estimatedCost": 100000,
                        "bestTimeOfDay": "morning",
                        "bookingRequired": False,
                    }
                ],
                "gastronomy": [
                    {
                        "dish": "Comida típica de prueba",
                        "typicalPlace": "Restaurante ficticio",
                        "description": "Comida de prueba",
                        "mealType": "lunch",
                        "estimatedCost": 50000,
                    }
                ],
                "culturalHighlights": ["Centro histórico"],
            },
            "errors": state.get("errors", []),
        }

    # Solo se simulan los agentes que llaman al LLM.
    # budget_agent e itinerary_builder se ejecutan de verdad.
    monkeypatch.setattr(graph, "personality_agent", fake_personality)
    monkeypatch.setattr(graph, "transport_agent", fake_transport)
    monkeypatch.setattr(graph, "activities_food_agent", fake_experiences)

    test_graph = build_graph()

    state = {
        "userId": "user-test-001",
        "origin": "Barranquilla",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-18",
        "travelers": 2,
        "budgetCategory": "Estándar",
        "currency": "COP",
        "approximateBudgetAmount": 1000000,
        "psychologicalAssessment": {
            "spontaneityScore": 3,
            "comfortPriority": 3,
            "culturalCuriosity": 5,
            "socialPreference": "friends",
            "physicalActivityLevel": "moderate",
            "interests": ["historia", "gastronomía", "cultura"],
        },
        "preferredStyle": "Cultural",
        # Sin accommodation_options: el budget_agent debe estimarlo solo.
    }

    result = test_graph.invoke(state)

    assert not result.get("errors"), result.get("errors")
    # Estándar en COP: 250.000 x 1 habitación x 3 noches.
    assert result["budget_result"]["breakdown"]["accommodation"] == 750_000
    assert len(result["itinerary"]["days"]) == 4
    assert result.get("personality_result")
    assert result.get("transport_result")
    assert result.get("experiences_result")
    assert result.get("budget_result")
    assert result.get("itinerary")
    assert result.get("tripDraft")
    assert result.get("planId")



def test_endpoint_plan_funciona_sin_monto_y_sin_estilo(monkeypatch):
    """approximateBudgetAmount y preferredStyle son opcionales en el contrato."""
    from fastapi.testclient import TestClient

    import main
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
                "outbound": [
                    {
                        "origin": "Bogotá",
                        "destination": "Cartagena",
                        "mode": "flight",
                        "estimatedDuration": "1 hora y 30 minutos",
                        "estimatedCost": 400000,
                    }
                ],
                "totalTransportCost": 400000,
            },
        }

    def fake_experiences(state):
        return {
            "experiences_result": {
                "activities": [],
                "gastronomy": [],
                "culturalHighlights": [],
            },
        }

    monkeypatch.setattr(graph, "personality_agent", fake_personality)
    monkeypatch.setattr(graph, "transport_agent", fake_transport)
    monkeypatch.setattr(graph, "activities_food_agent", fake_experiences)
    monkeypatch.setattr(main, "travel_graph", build_graph())

    response = TestClient(main.app).post("/api/v1/ai/plan", json={
        "userId": "user-test-001",
        "origin": "Bogotá",
        "destination": "Cartagena",
        "startDate": "2026-11-15",
        "endDate": "2026-11-17",
        "travelers": 2,
        "budgetCategory": "Económico",
        "psychologicalAssessment": {
            "spontaneityScore": 2,
            "comfortPriority": 4,
            "culturalCuriosity": 3,
            "socialPreference": "couple",
            "physicalActivityLevel": "low",
            "interests": ["playa"],
        },
    })

    assert response.status_code == 200, response.json()
    body = response.json()
    assert body["personality"]["analyzedStyle"] == "Relax"
    # Económico en COP: 120.000 x 1 habitación x 2 noches.
    assert body["budget"]["breakdown"]["accommodation"] == 240_000
