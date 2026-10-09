import json
import os

from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState


SYSTEM_PROMPT = """
Eres un asistente especializado en presupuestos de viaje.

Clasifica el presupuesto en exactamente una de estas categorías:
- Económico
- Estándar
- Lujo
- Personalizado

Usa el monto y la información proporcionada por el usuario.
No inventes un presupuesto si no se ha proporcionado.
Si no hay información suficiente, utiliza Personalizado.

Responde únicamente con un JSON válido con esta estructura:
{
  "budget_category": "Económico",
  "reason": "Explicación breve de la clasificación"
}
"""


def budget_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": state.get("errors", [])
            + ["Falta configurar GOOGLE_API_KEY para el budget_agent."]
        }

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        temperature=0,
        api_key=api_key,
    )

    user_context = {
        "budget_category": state.get("budget_category"),
        "budget_amount": state.get("budget_amount"),
        "destination": state.get("destination"),
        "travelers": state.get("travelers"),
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

        valid_categories = {
            "Económico",
            "Estándar",
            "Lujo",
            "Personalizado",
        }

        category = result["budget_category"]

        if category not in valid_categories:
            raise ValueError("Categoría de presupuesto no válida.")

        return {
            "budget_category": category,
            "messages": state.get("messages", [])
            + [result.get("reason", "Presupuesto clasificado.")],
        }

    except (ValueError, TypeError, KeyError) as exc:
        return {
            "errors": state.get("errors", [])
            + [f"No se pudo interpretar la respuesta del budget_agent: {exc}"]
        }
