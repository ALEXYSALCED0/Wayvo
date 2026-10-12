import json
import os

from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState


VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}
VALID_TIMES = {"morning", "afternoon", "evening"}


def activities_food_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": ["Falta configurar GOOGLE_API_KEY para activities_food_agent."]
        }

    assessment = state.get("psychologicalAssessment", {})
    destination = state.get("destination", "")
    travelers = state.get("travelers", 1)
    currency = state.get("currency", "COP")

    prompt = f"""
Genera recomendaciones gastronómicas y actividades para un viaje.

Datos:
- Destino: {destination}
- Origen: {state.get("origin", "No especificado")}
- Fechas: {state.get("startDate") or state.get("start_date", "No especificada")}
  hasta {state.get("endDate") or state.get("end_date", "No especificada")}
- Viajeros: {travelers}
- Estilo: {state.get("preferredStyle") or "No especificado (dedúcelo de los intereses)"}
- Intereses: {assessment.get("interests", [])}
- Restricciones alimentarias: {state.get("dietaryRestrictions", [])}
- Moneda: {currency}

Devuelve exclusivamente JSON válido con esta estructura:
{{
  "gastronomy": [
    {{
      "dish": "Nombre del plato",
      "typicalPlace": "Tipo de establecimiento",
      "description": "Descripción breve",
      "mealType": "lunch",
      "estimatedCost": 30000,
      "dietaryMatch": true
    }}
  ],
  "activities": [
    {{
      "title": "Nombre de la actividad",
      "category": "Cultural",
      "description": "Descripción breve",
      "duration": "2 horas",
      "estimatedCost": 50000,
      "bestTimeOfDay": "morning",
      "bookingRequired": false
    }}
  ],
  "culturalHighlights": ["Dato cultural relevante del destino"]
}}

Reglas:
- Genera entre 3 y 5 recomendaciones gastronómicas y entre 3 y 5 actividades.
- mealType debe ser breakfast, lunch, dinner o snack.
- bestTimeOfDay debe ser morning, afternoon o evening.
- estimatedCost debe ser numérico y representar el costo total
  para todos los viajeros.
- Respeta las restricciones alimentarias indicadas.
- Si no puedes confirmar que un plato cumple una restricción,
  no afirmes que es apto.
- No inventes precios verificados ni disponibilidad de reservas.
- Los costos son estimaciones orientativas en {currency}.
- No incluyas markdown ni explicaciones fuera del JSON.
"""

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.8-flash",
            temperature=0,
            google_api_key=api_key,
        )

        response = llm.invoke(prompt)
        content = response.content

        if isinstance(content, list):
            content = "".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict)
            )

        result = json.loads(content)

        gastronomy = result.get("gastronomy", [])
        activities = result.get("activities", [])

        if not gastronomy:
            raise ValueError("No se generaron recomendaciones gastronómicas.")

        if not activities:
            raise ValueError("No se generaron actividades.")

        for item in gastronomy:
            if item.get("mealType") not in VALID_MEAL_TYPES:
                raise ValueError(
                    f"Tipo de comida no válido: {item.get('mealType')}"
                )

            self_check_cost = item.get("estimatedCost")
            if (
                not isinstance(self_check_cost, (int, float))
                or isinstance(self_check_cost, bool)
                or self_check_cost < 0
            ):
                raise ValueError(
                    "El costo gastronómico debe ser numérico y no negativo."
                )

            for field in ("dish", "typicalPlace", "description"):
                if not item.get(field):
                    raise ValueError(
                        f"Falta '{field}' en una recomendación gastronómica."
                    )

        for item in activities:
            if item.get("bestTimeOfDay") not in VALID_TIMES:
                raise ValueError(
                    f"Horario no válido: {item.get('bestTimeOfDay')}"
                )

            cost = item.get("estimatedCost")
            if (
                not isinstance(cost, (int, float))
                or isinstance(cost, bool)
                or cost < 0
            ):
                raise ValueError(
                    "El costo de una actividad debe ser numérico y no negativo."
                )

            for field in ("title", "category", "description", "duration"):
                if not item.get(field):
                    raise ValueError(
                        f"Falta '{field}' en una actividad."
                    )

            if not isinstance(item.get("bookingRequired"), bool):
                raise ValueError("bookingRequired debe ser booleano.")

        experiences_result = {
            "gastronomy": gastronomy,
            "activities": activities,
            "culturalHighlights": result.get("culturalHighlights", []),
        }

        return {
            "experiences_result": experiences_result,
            "food_recommendations": gastronomy,
            "activities": activities,
            "messages": ["Agente de actividades y gastronomía ejecutado correctamente."],
        }

    except Exception as exc:
        return {
            "errors": [f"Error en activities_food_agent: {exc}"]
        }
