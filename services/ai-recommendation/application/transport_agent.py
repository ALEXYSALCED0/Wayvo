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
Genera opciones de transporte para un viaje de {origin} a {destination}.

Datos:
- Origen: {origin}
- Destino: {destination}
- Fecha de ida: {state.get("startDate") or state.get("start_date", "No especificada")}
- Fecha de regreso: {state.get("endDate") or state.get("end_date", "No especificada")}
- Viajeros: {travelers}
- Moneda: {currency}

Para trayectos de larga distancia o aéreos, usa 'mode': 'flight' con aerolíneas reales oficiales (ej: 'Avianca', 'LATAM Airlines', 'Wingo', 'Copa Airlines') e incluye el portal oficial de reservas de esa aerolínea.

Devuelve exclusivamente JSON válido con esta estructura:
{{
  "routeSummary": "Vuelo directo con aerolínea comercial",
  "outbound": [
    {{
      "origin": "{origin}",
      "destination": "{destination}",
      "mode": "flight",
      "airline": "Avianca",
      "flightNumber": "AV9540",
      "airlineBookingUrl": "https://www.avianca.com/es/",
      "departureTime": "08:15",
      "arrivalTime": "09:45",
      "estimatedDuration": "1 hora y 30 minutos",
      "estimatedCost": 640000,
      "providerHint": "Avianca"
    }}
  ],
  "inbound": [
    {{
      "origin": "{destination}",
      "destination": "{origin}",
      "mode": "flight",
      "airline": "Avianca",
      "flightNumber": "AV9541",
      "airlineBookingUrl": "https://www.avianca.com/es/",
      "departureTime": "17:30",
      "arrivalTime": "19:00",
      "estimatedDuration": "1 hora y 30 minutos",
      "estimatedCost": 640000,
      "providerHint": "Avianca"
    }}
  ],
  "localTransitTips": ["Consejo de transporte en {destination}"],
  "totalTransportCost": 1280000
}}

Reglas:
- Devuelve hasta tres alternativas de ida y, si corresponde, alternativas de regreso.
- Los modos permitidos son: flight, train, bus, car_rental, ferry y walking.
- estimatedCost debe ser numérico y representar el costo TOTAL de esa alternativa para todos los viajeros.
- totalTransportCost debe representar una sola combinación de ida y regreso para todos los viajeros.
- Usa costos realistas de mercado en {currency}.
- No incluyas markdown ni explicaciones fuera del JSON.
"""

    try:
        from application.llm_client import invoke_gemini

        text = invoke_gemini(prompt, temperature=0.0)
        clean_text = text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("\n", 1)[1]
            if clean_text.endswith("```"):
                clean_text = clean_text.rsplit("```", 1)[0]

        result = json.loads(clean_text)

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
