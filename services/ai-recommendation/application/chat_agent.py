from __future__ import annotations

import os
from datetime import datetime, timezone

from uuid import uuid4

from langchain_google_genai import ChatGoogleGenerativeAI


# Cuántos mensajes anteriores se envían al modelo como contexto.
MAX_HISTORY = 6


class ChatAgentError(Exception):
    """El chat no pudo responder (falta la API key o falló Gemini)."""


def _format_history(history: list[dict]) -> str:
    lines = []

    for message in history[-MAX_HISTORY:]:
        speaker = "Usuario" if message.get("sender") == "user" else "Asistente"
        lines.append(f"{speaker}: {message.get('text', '')}")

    return "\n".join(lines) if lines else "(sin mensajes anteriores)"


def _quick_chips(destination: str | None) -> list[dict]:
    """Sugerencias rápidas fijas para que el usuario siga la conversación."""
    place = destination or "mi destino"
    questions = [
        f"¿Qué comida típica pruebo en {place}?",
        f"¿Qué planes económicos hay en {place}?",
        f"¿Qué lugares no me puedo perder en {place}?",
    ]

    return [
        {
            "id": f"chip-{index}",
            "label": question,
            "actionPayload": question,
            "isPrimary": index == 1,
        }
        for index, question in enumerate(questions, start=1)
    ]


def chat_agent(
    message: str,
    history: list[dict] | None = None,
    context: dict | None = None,
) -> dict:
    """Modo libre: responde una pregunta de viaje usando Gemini."""
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ChatAgentError("Falta configurar GOOGLE_API_KEY para el chat.")

    context = context or {}
    destination = context.get("currentDestination") or context.get("destination")

    prompt = f"""
Eres el asistente de viajes de Wayvo. Das sugerencias e inspiración
para viajes de forma breve, amable y en español.

Contexto del viajero:
- Destino actual: {destination or "No especificado"}
- Categoría de presupuesto: {context.get("budgetCategory") or "No especificada"}
- Estilo de viaje: {context.get("travelStyle") or "No especificado"}

Conversación anterior:
{_format_history(history or [])}

Nueva pregunta del usuario:
{message}

Reglas:
- Responde en máximo 120 palabras.
- Escribe en texto plano: no uses markdown (ni asteriscos, ni negritas,
  ni títulos). Para listas usa saltos de línea y guiones simples.
- No inventes precios exactos ni confirmes disponibilidad o reservas.
- Si la pregunta no es sobre viajes, redirígela amablemente al tema del viaje.
"""

    try:
        from application.llm_client import invoke_gemini

        text = invoke_gemini(prompt, temperature=0.7)

    except Exception as exc:
        raise ChatAgentError(f"Error en chat_agent: {exc}") from exc

    chips = _quick_chips(destination)

    return {
        "message": {
            "id": str(uuid4()),
            "sender": "ai",
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "quickChips": chips,
        },
        "quickChips": chips,
    }
