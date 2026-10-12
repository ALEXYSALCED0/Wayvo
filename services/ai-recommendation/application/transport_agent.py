import json
import os

from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState


VALID_MODES = {
    "flight",
    "train",
    "bus",
    "car_rental",
    "ferry",
    "walking",
}


def transport_agent(state: TravelState) -> dict:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        return {
            "errors": ["Falta configurar GOOGLE_API_KEY para transport_agent."]
        }

    origin = state.get("origin", "")
    destination = state.get("destination", "")
    travelers = state.get("travelers", 1)
    currency = state.get("currency", "COP")

    prompt = f"""
Genera opciones de transporte para un viaje.

Datos:
- Origen: {origin}
- Destino: {destination}
- Fecha de ida: {state.get("startDate") or state.get("start_date", "No especificada")}
- Fecha de regreso: {state.get("endDate") or state.get("end_date", "No especificada")}
- Viajeros: {travelers}
- Moneda: {currency}

Devuelve exclusivamente JSON válido con esta estructura:
{{
  "routeSummary": "Resumen breve de la ruta",
  "outbound": [
    {{
      "origin": "{origin}",
      "destination": "{destination}",
      "mode": "bus",
      "departureTime": "08:00",
      "arrivalTime": "10:30",
      "estimatedDuration": "2 horas y 30 minutos",
      "estimatedCost": 50000,
      "providerHint": "Operador sugerido"
    }}
  ],
  "inbound": [
    {{
      "origin": "{destination}",
      "destination": "{origin}",
      "mode": "bus",
      "departureTime": "16:00",
      "arrivalTime": "18:30",
      "estimatedDuration": "2 horas y 30 minutos",
      "estimatedCost": 50000,
      "providerHint": "Operador sugerido"
    }}
  ],
  "localTransitTips": ["Consejo de transporte local"],
  "totalTransportCost": 200000
}}

Reglas:
- Devuelve hasta tres alternativas de ida y, si corresponde,
  alternativas de regreso.
- Los modos permitidos son: flight, train, bus, car_rental,
  ferry y walking.
- estimatedCost debe ser numérico y representar el costo TOTAL
  de esa alternativa para todos los viajeros.
- totalTransportCost debe representar una sola combinación
  de ida y regreso para todos los viajeros, no la suma de
  todas las alternativas.
- No inventes operadores reales ni afirmes disponibilidad confirmada.
- Usa costos aproximados en {currency}.
- No incluyas markdown ni explicaciones fuera del JSON.
"""

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash",
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

        outbound = result.get("outbound", [])
        inbound = result.get("inbound", [])

        if not outbound:
            raise ValueError("No se generaron alternativas de ida.")

        for route in outbound + inbound:
            if route.get("mode") not in VALID_MODES:
                raise ValueError(
                    f"Modo de transporte no válido: {route.get('mode')}"
                )

            cost = route.get("estimatedCost")

            if (
                not isinstance(cost, (int, float))
                or isinstance(cost, bool)
                or cost < 0
            ):
                raise ValueError(
                    "Cada alternativa debe tener un costo numérico no negativo."
                )

            for field in (
                "origin",
                "destination",
                "estimatedDuration",
            ):
                if not route.get(field):
                    raise ValueError(
                        f"Falta el campo obligatorio '{field}' en una ruta."
                    )

        total_cost = result.get("totalTransportCost")

        if (
            not isinstance(total_cost, (int, float))
            or isinstance(total_cost, bool)
            or total_cost < 0
        ):
            raise ValueError("totalTransportCost debe ser numérico y no negativo.")

        transport_result = {
            "routeSummary": str(result.get("routeSummary", "")),
            "outbound": outbound,
            "totalTransportCost": total_cost,
        }

        if inbound:
            transport_result["inbound"] = inbound

        if result.get("localTransitTips"):
            transport_result["localTransitTips"] = result["localTransitTips"]

        # Se conserva la clave usada por los agentes actuales.
        transport_options = outbound + inbound

        return {
            "transport_result": transport_result,
            "transport_options": transport_options,
            "messages": ["Agente de transporte ejecutado correctamente."],
        }

    except Exception as exc:
        return {
            "errors": [f"Error en transport_agent: {exc}"]
        }
