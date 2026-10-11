import unicodedata
from datetime import date
from math import ceil

from domain.provider_catalog import (
    ACTIVITY_OFFERS,
    CITY_CODES,
    FLIGHT_OFFERS,
    STAY_OFFERS,
)
from domain.state import TravelState


def _city_code(name: str) -> str | None:
    """'Cartagena de Indias' -> 'CTG'. Ignora mayúsculas y tildes."""
    text = unicodedata.normalize("NFKD", name or "")
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()

    for city, code in CITY_CODES.items():
        if city in text:
            return code

    return None


def _nights(state: TravelState) -> int:
    start = state.get("startDate") or state.get("start_date")
    end = state.get("endDate") or state.get("end_date")

    if not start or not end:
        return 0

    return max((date.fromisoformat(end) - date.fromisoformat(start)).days, 0)


def provider_catalog_agent(state: TravelState) -> dict:
    """Agrega al estado las ofertas reservables de provider-service.

    No decide nada: deja las opciones para que el budget_agent escoja.
    Las ofertas guardan providerId y offerId para armar la reserva al final.
    """
    origin = state.get("origin", "")
    destination = state.get("destination", "")
    origin_code = _city_code(origin)
    destination_code = _city_code(destination)
    travelers = state.get("travelers", 1)
    nights = _nights(state)
    category = state.get("budgetCategory") or state.get("budget_category")

    updates = {}
    found = []

    # Vuelos: si hay oferta del catálogo para la ruta, reemplaza las de Gemini,
    # porque solo las del catálogo se pueden reservar.
    flights = [
        offer for offer in FLIGHT_OFFERS
        if offer["origin"] == origin_code
        and offer["destination"] == destination_code
    ]

    if flights:
        transport = dict(state.get("transport_result", {}))
        transport["outbound"] = [
            {
                "origin": origin,
                "destination": destination,
                "mode": "flight",
                "departureTime": offer["departureTime"],
                "estimatedDuration": offer["estimatedDuration"],
                "estimatedCost": offer["unitPrice"] * travelers,
                "providerHint": offer["title"],
                "providerId": offer["providerId"],
                "offerId": offer["offerId"],
                "unitPrice": offer["unitPrice"],
                "quantity": travelers,
            }
            for offer in flights
        ]
        updates["transport_result"] = transport
        found.append("vuelos")

    # Alojamiento: según la categoría, de lujo o no (si existe de ese tipo).
    stays = [offer for offer in STAY_OFFERS if offer["city"] == destination_code]
    wants_luxury = category == "Lujo"
    preferred = [offer for offer in stays if offer["isLuxury"] == wants_luxury]
    stays = preferred or stays

    if stays and nights > 0:
        options = []

        for offer in stays:
            units = ceil(travelers / offer["guests"])
            options.append({
                "name": offer["title"],
                "providerId": offer["providerId"],
                "offerId": offer["offerId"],
                "unitPrice": offer["unitPrice"],
                "quantity": units * nights,
                "nights": nights,
                "rooms": units,
                "estimatedCost": offer["unitPrice"] * units * nights,
            })

        updates["accommodation_options"] = options
        found.append("alojamiento")

    # Actividades: se suman a las que propuso el activities_food_agent.
    tours = [offer for offer in ACTIVITY_OFFERS if offer["city"] == destination_code]

    if tours:
        experiences = dict(state.get("experiences_result", {}))
        experiences["activities"] = list(experiences.get("activities", [])) + [
            {
                "title": offer["title"],
                "category": "Tour",
                "description": offer["description"],
                "duration": offer["duration"],
                "estimatedCost": offer["unitPrice"] * travelers,
                "bestTimeOfDay": offer["bestTimeOfDay"],
                "bookingRequired": True,
                "providerId": offer["providerId"],
                "offerId": offer["offerId"],
                "unitPrice": offer["unitPrice"],
                "quantity": travelers,
            }
            for offer in tours
        ]
        updates["experiences_result"] = experiences
        found.append("actividades")

    message = (
        f"Catálogo de proveedores: se encontraron {', '.join(found)}."
        if found
        else "Catálogo de proveedores: no hay ofertas para esta ruta."
    )
    updates["messages"] = [message]

    return updates
