import json
from unittest.mock import MagicMock

from application import personality_agent as personality_module


def test_personality_agent_devuelve_estilo_y_ritmo_validos(monkeypatch):
    respuesta = {
        "analyzedStyle": "Cultural",
        "traitSummary": "Interés por la cultura y la historia",
        "dominantPace": "Moderado",
        "psychologicalNotes": "Prefiere experiencias culturales",
        "recommendedVibe": "Viaje cultural tranquilo",
    }

    class FakeLLM:
        def __init__(self, **kwargs):
            assert kwargs["model"] == "gemini-3.1-flash-lite"

        def invoke(self, prompt):
            assert "Cartagena" in prompt
            return MagicMock(content=json.dumps(respuesta, ensure_ascii=False))

    monkeypatch.setattr(
        personality_module,
        "ChatGoogleGenerativeAI",
        FakeLLM,
    )
    monkeypatch.setattr(
        personality_module.os,
        "getenv",
        lambda name: "test-api-key" if name == "GOOGLE_API_KEY" else None,
    )

    result = personality_module.personality_agent({
        "destination": "Cartagena",
        "preferredStyle": "Cultural",
        "psychologicalAssessment": {
            "interests": ["historia", "cultura"],
        },
    })

    assert result["personality_result"]["analyzedStyle"] == "Cultural"
    assert result["personality_result"]["dominantPace"] == "Moderado"
    assert result["personality"] == "Cultural"
    assert not result.get("errors")


def test_personality_agent_no_impone_un_estilo_si_el_usuario_no_eligio(monkeypatch):
    prompts = []
    respuesta = {
        "analyzedStyle": "Aventura",
        "traitSummary": "Le gusta la actividad física",
        "dominantPace": "Intenso",
        "recommendedVibe": "Viaje activo",
    }

    class FakeLLM:
        def __init__(self, **kwargs):
            pass

        def invoke(self, prompt):
            prompts.append(prompt)
            return MagicMock(content=json.dumps(respuesta, ensure_ascii=False))

    monkeypatch.setattr(personality_module, "ChatGoogleGenerativeAI", FakeLLM)
    monkeypatch.setattr(
        personality_module.os,
        "getenv",
        lambda name: "test-api-key" if name == "GOOGLE_API_KEY" else None,
    )

    # "personality" con un valor previo no debe tomarse como preferencia.
    result = personality_module.personality_agent({
        "destination": "Medellín",
        "personality": "Cultural",
        "psychologicalAssessment": {"interests": ["senderismo"]},
    })

    assert "Estilo preferido: No especificado" in prompts[0]
    assert result["personality_result"]["analyzedStyle"] == "Aventura"


def test_personality_agent_rechaza_estilo_no_valido(monkeypatch):
    respuesta = {
        "analyzedStyle": "Playa",
        "traitSummary": "Resumen",
        "dominantPace": "Moderado",
        "recommendedVibe": "Descanso",
    }

    class FakeLLM:
        def __init__(self, **kwargs):
            pass

        def invoke(self, prompt):
            return MagicMock(content=json.dumps(respuesta))

    monkeypatch.setattr(
        personality_module,
        "ChatGoogleGenerativeAI",
        FakeLLM,
    )
    monkeypatch.setattr(
        personality_module.os,
        "getenv",
        lambda name: "test-api-key" if name == "GOOGLE_API_KEY" else None,
    )

    result = personality_module.personality_agent({})

    assert any(
        "Estilo no válido" in error
        for error in result.get("errors", [])
    )


def test_personality_agent_maneja_clave_api_ausente(monkeypatch):
    monkeypatch.setattr(
        personality_module.os,
        "getenv",
        lambda name: None,
    )

    result = personality_module.personality_agent({})

    assert any(
        "GOOGLE_API_KEY" in error
        for error in result.get("errors", [])
    )
    assert "personality_result" not in result
