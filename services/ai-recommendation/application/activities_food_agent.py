import json
import os

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
Eres un concierge local experto en {destination}. Genera recomendaciones gastronómicas y actividades auténticas y específicas.

Datos del viaje:
- Destino: {destination}
- Origen: {state.get("origin", "No especificado")}
- Fechas: {state.get("startDate") or state.get("start_date", "No especificada")} hasta {state.get("endDate") or state.get("end_date", "No especificada")}
- Viajeros: {travelers}
- Estilo: {state.get("preferredStyle") or "No especificado"}
- Intereses: {assessment.get("interests", [])}
- Restricciones alimentarias: {state.get("dietaryRestrictions", [])}
- Moneda: {currency}

REGLAS CRÍTICAS:
1. En gastronomía, DEBES nombrar un RESTAURANTE O ESTABLECIMIENTO REAL y reconocido de {destination} (ej: "Restaurante Celele", "La Cocina de Pepina", "La Cevicheria", "Pastelería Mila"). NO uses nombres genéricos como "Restaurante típico".
2. Si el restaurante tiene sitio web oficial o cuenta de Instagram conocida, incluye la URL o el @handle real (sin inventar dominios falsos; si no lo sabes con certeza usa null).
3. En actividades, DEBES nombrar la atracción o tour concreto y su OPERADOR O MUSEO REAL (ej: "Castillo San Felipe de Barajas" operado por "Fortificaciones de Cartagena", o "Tour a Islas del Rosario" operado por "Bonavida Catamarán").
4. Si la actividad tiene sitio web oficial de entradas o Instagram del operador, inclúyelo; si no, coloca null.

Devuelve EXCLUSIVAMENTE JSON válido con esta estructura:
{{
  "gastronomy": [
    {{
      "venueName": "Nombre real del restaurante (ej: La Cocina de Pepina)",
      "dish": "Nombre del plato especial a probar (ej: Posta Cartagenera)",
      "typicalPlace": "Restaurante de cocina tradicional cartagenera",
      "description": "Descripción del restaurante y ambiente",
      "mealType": "lunch",
      "estimatedCost": 60000,
      "websiteUrl": "https://lacocinadepepina.com",
      "instagramHandle": "lacocinadepepina",
      "directBookingUrl": null,
      "dietaryMatch": true
    }}
  ],
  "activities": [
    {{
      "title": "Visita Histórica al Castillo San Felipe de Barajas",
      "operatorName": "Fortificaciones de Cartagena",
      "category": "Cultural",
      "description": "Recorrido por los túneles y murallas de la mayor fortaleza militar española en América.",
      "duration": "2.5 horas",
      "estimatedCost": 70000,
      "bestTimeOfDay": "morning",
      "bookingRequired": true,
      "websiteUrl": "https://fortificacionescartagena.com.co/es/",
      "instagramHandle": "castillodesanfelipe",
      "directBookingUrl": null
    }}
  ],
  "culturalHighlights": ["Dato cultural relevante y curioso de {destination}"]
}}

Reglas de formato:
- Genera entre 3 y 5 recomendaciones gastronómicas y entre 3 y 5 actividades.
- mealType debe ser uno de: breakfast, lunch, dinner, snack.
- bestTimeOfDay debe ser uno de: morning, afternoon, evening.
- estimatedCost debe ser numérico y representar el costo total aproximado para todos los viajeros.
- websiteUrl, instagramHandle y directBookingUrl pueden ser strings o null.
- Respeta las restricciones alimentarias.
- No incluyas markdown ni texto fuera del JSON.
"""

    try:
        from application.llm_client import invoke_gemini

        text = invoke_gemini(prompt, temperature=0.1)
        clean_text = text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("\n", 1)[1]
            if clean_text.endswith("```"):
                clean_text = clean_text.rsplit("```", 1)[0]

        result = json.loads(clean_text)

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
                item["estimatedCost"] = 50000

            if not item.get("typicalPlace"):
                item["typicalPlace"] = item.get("venueName") or "Restaurante"

            if not item.get("venueName"):
                item["venueName"] = item.get("typicalPlace") or "Restaurante Recomendado"

            if not item.get("dish"):
                item["dish"] = "Especialidad de la casa"

            if not item.get("description"):
                item["description"] = f"Experiencia culinaria en {item.get('venueName')}."

        for item in activities:
            if item.get("bestTimeOfDay") not in VALID_TIMES:
                item["bestTimeOfDay"] = "morning"

            cost = item.get("estimatedCost")
            if (
                not isinstance(cost, (int, float))
                or isinstance(cost, bool)
                or cost < 0
            ):
                item["estimatedCost"] = 60000

            for field in ("title", "category", "description", "duration"):
                if not item.get(field):
                    item[field] = "Experiencia local destacada"

            if not isinstance(item.get("bookingRequired"), bool):
                item["bookingRequired"] = False

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
