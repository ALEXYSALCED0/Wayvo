import json
import os

from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState


SYSTEM_PROMPT = """
Eres un asistente especializado en preferencias de viaje.

Debes clasificar el estilo de viaje del usuario en exactamente una
de estas categorías:
- Aventura
- Relax
- Cultural
- Inversión

Usa las preferencias explícitas del usuario y el contexto disponible.
No inventes preferencias que no se hayan proporcionado.

Responde únicamente con un JSON válido con esta estructura:
{
  "personality": "Cultural",
  "reason": "Explicación breve de la clasificación"
}
"""


def personality_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": state.get("errors", [])
            + ["Falta configurar GOOGLE_API_KEY para el personality_agent."]
        }

    llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    temperature=0,
    google_api_key=api_key,
    )

    user_context = {
        "origin": state.get("origin"),
        "destination": state.get("destination"),
        "start_date": state.get("start_date"),
        "end_date": state.get("end_date"),
        "personality": state.get("personality"),
        "messages": state.get("messages", []),
    }

    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            ("human", json.dumps(user_context, ensure_ascii=False)),
        ]
    )

    try:
        result = json.loads(response.content)

        valid_personalities = {
            "Aventura",
            "Relax",
            "Cultural",
            "Inversión",
        }

        personality = result["personality"]

        if personality not in valid_personalities:
            raise ValueError("Categoría de personalidad no válida.")

        return {
            "personality": personality,
            "messages": state.get("messages", [])
            + [result.get("reason", "Perfil de viaje clasificado.")],
        }

    except (ValueError, TypeError, KeyError) as exc:
        return {
            "errors": state.get("errors", [])
            + [f"No se pudo interpretar la respuesta del agente: {exc}"]
        }
