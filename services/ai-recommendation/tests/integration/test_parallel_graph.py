import time

from application import graph
from application.graph import build_graph


BASE_STATE = {
    "userId": "user-test-001",
    "origin": "Pasto",
    "destination": "Villa de Leyva",
    "startDate": "2026-11-15",
    "endDate": "2026-11-17",
    "travelers": 2,
    "budgetCategory": "Estándar",
    "currency": "COP",
}


def slow(result: dict, seconds: float = 1.0):
    """Agente simulado que tarda como una llamada a Gemini."""
    def agent(state):
        time.sleep(seconds)
        return result
    return agent


PERSONALITY = {
    "personality_result": {
        "analyzedStyle": "Relax",
        "traitSummary": "Perfil de prueba",
        "dominantPace": "Relajado",
        "recommendedVibe": "Descanso",
    },
    "messages": ["personalidad lista"],
}

TRANSPORT = {
    "transport_result": {
        "routeSummary": "Ruta de prueba",
        "outbound": [{
            "origin": "Pasto", "destination": "Villa de Leyva", "mode": "bus",
            "estimatedDuration": "2 horas", "estimatedCost": 100_000,
        }],
        "totalTransportCost": 100_000,
    },
    "messages": ["transporte listo"],
}

EXPERIENCES = {
    "experiences_result": {"activities": [], "gastronomy": [], "culturalHighlights": []},
    "messages": ["actividades listas"],
}


def test_los_tres_agentes_de_gemini_corren_en_paralelo(monkeypatch):
    monkeypatch.setattr(graph, "personality_agent", slow(PERSONALITY))
    monkeypatch.setattr(graph, "transport_agent", slow(TRANSPORT))
    monkeypatch.setattr(graph, "activities_food_agent", slow(EXPERIENCES))

    start = time.perf_counter()
    result = build_graph().invoke(dict(BASE_STATE))
    elapsed = time.perf_counter() - start

    # En secuencia serían ~3 s; en paralelo, ~1 s.
    assert elapsed < 2, f"Tardó {elapsed:.1f} s: los agentes no corrieron en paralelo"
    assert not result.get("errors"), result.get("errors")
    assert result.get("planId")

    # El reducer juntó los mensajes de los tres agentes sin perder ninguno.
    for message in ("personalidad lista", "transporte listo", "actividades listas"):
        assert message in result["messages"]


def test_si_un_agente_falla_el_grafo_termina_con_su_error(monkeypatch):
    failing_transport = {"errors": ["Error en transport_agent: Gemini no disponible"]}

    monkeypatch.setattr(graph, "personality_agent", slow(PERSONALITY, 0))
    monkeypatch.setattr(graph, "transport_agent", slow(failing_transport, 0))
    monkeypatch.setattr(graph, "activities_food_agent", slow(EXPERIENCES, 0))

    result = build_graph().invoke(dict(BASE_STATE))

    assert result["errors"] == ["Error en transport_agent: Gemini no disponible"]
    # No se llegó a calcular el presupuesto ni el itinerario.
    assert "budget_result" not in result
    assert "itinerary" not in result
