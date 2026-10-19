from unittest.mock import MagicMock

import pytest

from application import chat_agent as chat_module


def _configure_fake_llm(monkeypatch, text, prompts=None):
    class FakeLLM:
        def __init__(self, **kwargs):
            pass

        def invoke(self, prompt):
            if prompts is not None:
                prompts.append(prompt)
            return MagicMock(content=text)

    monkeypatch.setattr(chat_module, "ChatGoogleGenerativeAI", FakeLLM)
    monkeypatch.setattr(
        chat_module.os,
        "getenv",
        lambda name: "test-api-key" if name == "GOOGLE_API_KEY" else None,
    )


def test_chat_responde_con_un_mensaje_del_asistente(monkeypatch):
    _configure_fake_llm(monkeypatch, "Prueba la arepa de huevo en Cartagena.")

    result = chat_module.chat_agent(
        message="¿Qué como en Cartagena?",
        context={"currentDestination": "Cartagena"},
    )

    message = result["message"]
    assert message["sender"] == "ai"
    assert message["text"] == "Prueba la arepa de huevo en Cartagena."
    assert message["id"]
    assert message["timestamp"]
    assert "Cartagena" in result["quickChips"][0]["label"]


def test_el_prompt_incluye_el_contexto_y_solo_los_ultimos_mensajes(monkeypatch):
    prompts = []
    _configure_fake_llm(monkeypatch, "Respuesta", prompts)

    history = [
        {"sender": "user", "text": f"mensaje {number}"}
        for number in range(1, 9)
    ]

    chat_module.chat_agent(
        message="¿Y para la noche?",
        history=history,
        context={"currentDestination": "Medellín", "travelStyle": "Aventura"},
    )

    prompt = prompts[0]
    assert "Medellín" in prompt
    assert "Aventura" in prompt
    assert "¿Y para la noche?" in prompt
    # El cliente muestra el texto tal cual: se pide texto plano.
    assert "no uses markdown" in prompt
    # Solo se envían los últimos 6 mensajes (del 3 al 8).
    assert "mensaje 8" in prompt
    assert "mensaje 3" in prompt
    assert "mensaje 2" not in prompt


def test_sin_api_key_lanza_error(monkeypatch):
    monkeypatch.setattr(chat_module.os, "getenv", lambda name: None)

    with pytest.raises(chat_module.ChatAgentError):
        chat_module.chat_agent(message="Hola")


def test_respuesta_vacia_lanza_error(monkeypatch):
    _configure_fake_llm(monkeypatch, "   ")

    with pytest.raises(chat_module.ChatAgentError):
        chat_module.chat_agent(message="Hola")
