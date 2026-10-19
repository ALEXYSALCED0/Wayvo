import json
from unittest.mock import MagicMock

from application import activities_food_agent as activities_module


def _configure_fake_llm(monkeypatch, response):
    class FakeLLM:
        def __init__(self, **kwargs):
            assert kwargs["model"] == "gemini-3.1-flash-lite"

        def invoke(self, prompt):
            assert "Cartagena" in prompt
            return MagicMock(
                content=json.dumps(response, ensure_ascii=False)
            )

    monkeypatch.setattr(
        activities_module,
        "ChatGoogleGenerativeAI",
        FakeLLM,
    )
    monkeypatch.setattr(
        activities_module.os,
        "getenv",
        lambda name: "test-api-key" if name == "GOOGLE_API_KEY" else None,
    )


def _valid_response():
    return {
        "gastronomy": [
            {
                "dish": "Arepa de huevo",
                "typicalPlace": "Restaurante local",
                "description": "Plato típico de la región",
                "mealType": "lunch",
                "estimatedCost": 30000,
                "dietaryMatch": True,
            }
        ],
        "activities": [
            {
                "title": "Visita al centro histórico",
                "category": "Cultural",
                "description": "Recorrido por lugares históricos",
                "duration": "2 horas",
                "estimatedCost": 50000,
                "bestTimeOfDay": "morning",
                "bookingRequired": False,
            }
        ],
        "culturalHighlights": ["Arquitectura colonial"],
    }


def _state():
    return {
        "destination": "Cartagena",
        "origin": "Barranquilla",
        "travelers": 2,
        "currency": "COP",
        "psychologicalAssessment": {
            "interests": ["historia", "gastronomía"],
        },
        "dietaryRestrictions": [],
    }


def test_activities_food_agent_acepta_recomendaciones_validas(monkeypatch):
    _configure_fake_llm(monkeypatch, _valid_response())

    result = activities_module.activities_food_agent(_state())

    experiences = result["experiences_result"]

    assert experiences["gastronomy"][0]["estimatedCost"] == 30000
    assert experiences["activities"][0]["estimatedCost"] == 50000
    assert experiences["culturalHighlights"] == ["Arquitectura colonial"]
    assert result["food_recommendations"] == experiences["gastronomy"]
    assert result["activities"] == experiences["activities"]
    assert not result.get("errors")


def test_activities_food_agent_rechaza_tipo_de_comida_invalido(monkeypatch):
    response = _valid_response()
    response["gastronomy"][0]["mealType"] = "brunch"

    _configure_fake_llm(monkeypatch, response)

    result = activities_module.activities_food_agent(_state())

    assert any(
        "Tipo de comida no válido" in error
        for error in result.get("errors", [])
    )


def test_activities_food_agent_rechaza_costo_negativo(monkeypatch):
    response = _valid_response()
    response["activities"][0]["estimatedCost"] = -100

    _configure_fake_llm(monkeypatch, response)

    result = activities_module.activities_food_agent(_state())

    assert any(
        "costo de una actividad debe ser numérico y no negativo" in error
        for error in result.get("errors", [])
    )


def test_activities_food_agent_maneja_clave_api_ausente(monkeypatch):
    monkeypatch.setattr(
        activities_module.os,
        "getenv",
        lambda name: None,
    )

    result = activities_module.activities_food_agent(_state())

    assert any(
        "GOOGLE_API_KEY" in error
        for error in result.get("errors", [])
    )
    assert "experiences_result" not in result
