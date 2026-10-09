import json
import os

from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState


SYSTEM_PROMPT = """
Eres un asistente especializado en transporte para viajes.

Analiza el origen, el destino, las fechas, el número de viajeros
y el presupuesto disponible.

Propón opciones de transporte razonables según la información recibida.
No inventes precios, horarios ni disponibilidad real.
Si falta información, indícalo en las opciones.

Responde únicamente con un JSON válido con esta estructura:
{
  "transport_options": [
    {
      "mode": "Bus",
      "description": "Descripción de la opción",
      "estimated_cost": null
    }
  ]
}
"""


def transport_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": state.get("errors", [])
            + ["Falta configurar GOOGLE_API_KEY para el transport_agent."]
        }

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        temperature=0,
        api_key=api_key,
    )

    user_context = {
        "origin": state.get("origin"),
        "destination": state.get("destination"),
        "start_date": state.get("start_date"),
        "end_date": state.get("end_date"),
        "travelers": state.get("travelers"),
        "budget_category": state.get("budget_category"),
        "budget_amount": state.get("budget_amount"),
    }

    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            ("human", json.dumps(user_context, ensure_ascii=False)),
        ]
    )

    try:
        result = json.loads(response.content)
        options = result["transport_options"]

        if not isinstance(options, list):
            raise ValueError("transport_options debe ser una lista.")

        return {"transport_options": options}

    except (ValueError, TypeError, KeyError) as exc:
        return {
            "errors": state.get("errors", [])
            + [f"No se pudo interpretar la respuesta del transport_agent: {exc}"]
        }
