import json
import os

from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState


SYSTEM_PROMPT = """
Eres un asistente especializado en actividades turísticas y gastronomía.

Recomienda actividades y comida considerando el destino, las fechas,
la personalidad del viajero y su presupuesto.

Las personalidades posibles son:
- Aventura
- Relax
- Cultural
- Inversión

No inventes horarios, precios exactos ni disponibilidad real.
Si falta información, indícalo en la descripción.

Responde únicamente con un JSON válido con esta estructura:
{
  "activities": [
    {
      "name": "Nombre de la actividad",
      "description": "Descripción breve"
    }
  ],
  "food_recommendations": [
    {
      "name": "Nombre de la comida o lugar",
      "description": "Descripción breve"
    }
  ]
}
"""


def activities_food_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": state.get("errors", [])
            + ["Falta configurar GOOGLE_API_KEY para el activities_food_agent."]
        }

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        temperature=0,
        api_key=api_key,
    )

    user_context = {
        "destination": state.get("destination"),
        "start_date": state.get("start_date"),
        "end_date": state.get("end_date"),
        "travelers": state.get("travelers"),
        "personality": state.get("personality"),
        "budget_category": state.get("budget_category"),
        "budget_amount": state.get("budget_amount"),
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
        activities = result["activities"]
        food_recommendations = result["food_recommendations"]

        if not isinstance(activities, list):
            raise ValueError("activities debe ser una lista.")

        if not isinstance(food_recommendations, list):
            raise ValueError("food_recommendations debe ser una lista.")

        return {
            "activities": activities,
            "food_recommendations": food_recommendations,
        }

    except (ValueError, TypeError, KeyError) as exc:
        return {
            "errors": state.get("errors", [])
            + [
                "No se pudo interpretar la respuesta del "
                f"activities_food_agent: {exc}"
            ]
        }
