from fastapi.testclient import TestClient

import main
from application.chat_agent import ChatAgentError


client = TestClient(main.app)


def test_chat_responde_con_el_formato_comun(monkeypatch):
    received = {}

    def fake_chat_agent(message, history, context):
        received.update(message=message, history=history, context=context)
        return {
            "message": {
                "id": "msg-1",
                "sender": "ai",
                "text": "Visita el centro histórico.",
                "timestamp": "2026-10-11T12:00:00+00:00",
            },
            "quickChips": [],
        }

    monkeypatch.setattr(main, "chat_agent", fake_chat_agent)

    response = client.post("/api/v1/ai/chat", json={
        "userId": "user-1",
        "message": "¿Qué hago en Cartagena?",
        "conversationHistory": [
            {
                "id": "m0",
                "sender": "user",
                "text": "Hola",
                "timestamp": "2026-10-11T11:59:00+00:00",
            },
        ],
        "context": {"currentDestination": "Cartagena"},
    })
    body = response.json()

    assert response.status_code == 200
    assert body["success"] is True
    assert body["data"]["message"]["text"] == "Visita el centro histórico."
    assert received["history"] == [{"sender": "user", "text": "Hola"}]
    assert received["context"]["currentDestination"] == "Cartagena"


def test_mensaje_vacio_responde_400(monkeypatch):
    response = client.post("/api/v1/ai/chat", json={"userId": "user-1", "message": ""})

    assert response.status_code == 400
    assert response.json()["error"]["details"][0]["field"] == "message"


def test_si_gemini_falla_responde_502(monkeypatch):
    def failing_chat_agent(message, history, context):
        raise ChatAgentError("Gemini no disponible")

    monkeypatch.setattr(main, "chat_agent", failing_chat_agent)

    response = client.post("/api/v1/ai/chat", json={"userId": "user-1", "message": "Hola"})
    body = response.json()

    assert response.status_code == 502
    assert body["success"] is False
    assert body["error"]["code"] == "AGENT_FAILED"
