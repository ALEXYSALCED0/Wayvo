import json
from unittest.mock import MagicMock

from application import transport_agent as transport_module


def _configure_fake_llm(monkeypatch, response):
    class FakeLLM:
        def __init__(self, **kwargs):
            assert kwargs["model"] == "gemini-3.1-flash-lite"

        def invoke(self, prompt):
            assert "Barranquilla" in prompt
            assert "Cartagena" in prompt
            return MagicMock(
                content=json.dumps(response, ensure_ascii=False)
            )

    monkeypatch.setattr(
        transport_module,
        "ChatGoogleGenerativeAI",
        FakeLLM,
    )
    monkeypatch.setattr(
        transport_module.os,
        "getenv",
        lambda name: "test-api-key" if name == "GOOGLE_API_KEY" else None,
    )


def _valid_response():
    return {
        "routeSummary": "Ruta de prueba",
        "outbound": [
            {
                "origin": "Barranquilla",
                "destination": "Cartagena",
                "mode": "bus",
                "estimatedDuration": "2 horas",
                "estimatedCost": 100000,
            }
        ],
        "inbound": [
            {
                "origin": "Cartagena",
                "destination": "Barranquilla",
                "mode": "bus",
                "estimatedDuration": "2 horas",
                "estimatedCost": 100000,
            }
        ],
        "localTransitTips": ["Usar transporte autorizado"],
        "totalTransportCost": 200000,
    }


def _state():
    return {
        "origin": "Barranquilla",
        "destination": "Cartagena",
        "travelers": 2,
        "currency": "COP",
    }


def test_transport_agent_acepta_rutas_validas(monkeypatch):
    _configure_fake_llm(monkeypatch, _valid_response())

    result = transport_module.transport_agent(_state())

    transport = result["transport_result"]

    assert transport["outbound"][0]["estimatedCost"] == 100000
    assert transport["inbound"][0]["estimatedCost"] == 100000
    assert transport["totalTransportCost"] == 200000
    assert len(result["transport_options"]) == 2
    assert not result.get("errors")


def test_transport_agent_rechaza_modo_invalido(monkeypatch):
    response = _valid_response()
    response["outbound"][0]["mode"] = "teleportacion"

    _configure_fake_llm(monkeypatch, response)

    result = transport_module.transport_agent(_state())

    assert any(
        "Modo de transporte no válido" in error
        for error in result.get("errors", [])
    )


def test_transport_agent_rechaza_costo_negativo(monkeypatch):
    response = _valid_response()
    response["outbound"][0]["estimatedCost"] = -500

    _configure_fake_llm(monkeypatch, response)

    result = transport_module.transport_agent(_state())

    assert any(
        "costo numérico no negativo" in error
        for error in result.get("errors", [])
    )


def test_transport_agent_maneja_clave_api_ausente(monkeypatch):
    monkeypatch.setattr(
        transport_module.os,
        "getenv",
        lambda name: None,
    )

    result = transport_module.transport_agent(_state())

    assert any(
        "GOOGLE_API_KEY" in error
        for error in result.get("errors", [])
    )
    assert "transport_result" not in result
