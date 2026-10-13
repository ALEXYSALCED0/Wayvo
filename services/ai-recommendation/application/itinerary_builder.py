from __future__ import annotations

from datetime import date, datetime, time, timedelta
from uuid import uuid4
import re

from domain.state import TravelState


DAY_START = time(8, 0)
DAY_END = time(22, 0)

MEAL_TIMES = {
    "breakfast": time(8, 0),
    "lunch": time(12, 30),
    "snack": time(16, 0),
    "dinner": time(19, 0),
}

ACTIVITY_TIMES = {
    "morning": time(9, 0),
    "afternoon": time(14, 0),
    "evening": time(18, 0),
}

EVENT_TYPES = {
    "transport": "TRANSPORT",
    "flight": "FLIGHT",
    "bus": "TRANSPORT",
    "train": "TRANSPORT",
    "car_rental": "TRANSPORT",
    "ferry": "TRANSPORT",
    "walking": "TRANSPORT",
}


def _duration_hours(duration: str, fallback: float = 1) -> float:
    """Convierte duraciones como '2 horas', '90 minutos' o '1.5 hours'."""
    if not isinstance(duration, str):
        return fallback

    text = duration.lower().replace(",", ".")
    total = 0.0

    hours = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:horas?|hours?|hrs?|h)\b",
        text,
    )
    minutes = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:minutos?|minutes?|mins?)\b",
        text,
    )

    if hours:
        total += float(hours.group(1))

    if minutes:
        total += float(minutes.group(1)) / 60

    return total if total > 0 else fallback


def _make_event(
    trip_id: str,
    title: str,
    description: str,
    event_type: str,
    event_date: date,
    start_time: time,
    duration_hours: float,
    location: str,
    cost: float,
    order: int,
    extra_details: dict | None = None,
) -> dict:
    start = datetime.combine(event_date, start_time)
    end = start + timedelta(hours=duration_hours)

    details = {"price": cost}
    if extra_details:
        for k, v in extra_details.items():
            if v is not None:
                details[k] = v

    return {
        "id": str(uuid4()),
        "tripId": trip_id,
        "type": event_type,
        "title": title,
        "description": description,
        "location": location,
        "startDateTime": start.isoformat(),
        "endDateTime": end.isoformat(),
        "time": f"{start:%H:%M} - {end:%H:%M}",
        "status": "PENDING",
        "reservationStatus": "NOT_RESERVED",
        "order": order,
        "details": details,
    }


def _fits_schedule(
    day: dict,
    start: datetime,
    end: datetime,
) -> bool:
    """Comprueba que un evento no se solape con otro del mismo día."""
    for event in day["events"]:
        existing_start = datetime.fromisoformat(event["startDateTime"])
        existing_end = datetime.fromisoformat(event["endDateTime"])

        if start < existing_end and end > existing_start:
            return False

    return True


def _schedule_event(
    day: dict,
    trip_id: str,
    title: str,
    description: str,
    event_type: str,
    location: str,
    cost: float,
    preferred_time: time,
    duration_hours: float,
    latest_end: time = DAY_END,
    earliest_start: time = DAY_START,
    extra_details: dict | None = None,
) -> bool:
    """Busca un horario libre a partir del horario preferido, respetando earliest_start."""
    event_date = date.fromisoformat(day["date"])
    earliest_dt = datetime.combine(event_date, earliest_start)
    preferred_start = max(datetime.combine(event_date, preferred_time), earliest_dt)
    day_end = datetime.combine(event_date, latest_end)

    duration = timedelta(hours=duration_hours)
    step = timedelta(minutes=30)

    candidate = preferred_start

    while candidate + duration <= day_end:
        end = candidate + duration

        if _fits_schedule(day, candidate, end):
            day["events"].append(
                _make_event(
                    trip_id=trip_id,
                    title=title,
                    description=description,
                    event_type=event_type,
                    event_date=event_date,
                    start_time=candidate.time(),
                    duration_hours=duration_hours,
                    location=location,
                    cost=cost,
                    order=len(day["events"]) + 1,
                    extra_details=extra_details,
                )
            )
            return True

        candidate += step

    # Si no hay espacio desde el horario preferido, busca antes (pero nunca antes de earliest_start).
    candidate = earliest_dt

    while candidate < preferred_start:
        end = candidate + duration

        if end <= day_end and _fits_schedule(day, candidate, end):
            day["events"].append(
                _make_event(
                    trip_id=trip_id,
                    title=title,
                    description=description,
                    event_type=event_type,
                    event_date=event_date,
                    start_time=candidate.time(),
                    duration_hours=duration_hours,
                    location=location,
                    cost=cost,
                    order=len(day["events"]) + 1,
                    extra_details=extra_details,
                )
            )
            return True

        candidate += step

    return False


def _add_transport_event(
    day: dict,
    trip_id: str,
    title: str,
    description: str,
    event_type: str,
    location: str,
    cost: float,
    start_time: time,
    duration_hours: float,
    extra_details: dict | None = None,
) -> None:
    """El transporte tiene hora fija: se agrega a su hora de salida aunque
    termine de noche o al día siguiente (no se limita a las 22:00 como las actividades)."""
    day["events"].append(
        _make_event(
            trip_id=trip_id,
            title=title,
            description=description,
            event_type=event_type,
            event_date=date.fromisoformat(day["date"]),
            start_time=start_time,
            duration_hours=duration_hours,
            location=location,
            cost=cost,
            order=len(day["events"]) + 1,
            extra_details=extra_details,
        )
    )


def _departure_time(route: dict, default: time) -> time:
    """Usa la hora de salida de la ruta ("06:30") si viene y es válida."""
    try:
        return time.fromisoformat(str(route.get("departureTime")))
    except ValueError:
        return default


def _booking_item(item_type: str, item: dict, description: str) -> dict:
    return {
        "type": item_type,
        "providerId": item["providerId"],
        "offerId": item["offerId"],
        "description": description,
        "quantity": item["quantity"],
        "unitPrice": item["unitPrice"],
    }


def _suggested_booking_items(state: TravelState) -> list[dict]:
    """Lo que quedó en el plan y viene del catálogo (tiene offerId) se puede reservar.

    Sigue el contrato CreateBookingItemInput que usa la Saga en el checkout.
    """
    transport = state.get("transport_result", {})
    experiences = state.get("experiences_result", {})
    accommodation = state.get("selected_accommodation") or {}
    items = []

    for route in transport.get("outbound", [])[:1] + transport.get("inbound", [])[:1]:
        if route.get("offerId"):
            items.append(_booking_item("TRANSPORT", route, route.get("providerHint", "Transporte")))

    if accommodation.get("offerId"):
        items.append(_booking_item("ACCOMMODATION", accommodation, accommodation.get("name", "Alojamiento")))

    for activity in experiences.get("activities", []):
        if activity.get("offerId"):
            items.append(_booking_item("ACTIVITY", activity, activity.get("title", "Actividad")))

    return items


def itinerary_builder(state: TravelState) -> dict:
    # Solo los errores nuevos de este nodo: LangGraph los suma al estado.
    errors = []
    # Lo que no cabe en el horario no daña el plan: queda como aviso.
    warnings = []

    try:
        user_id = state.get("userId")
        origin = state.get("origin", "")
        destination = state.get("destination", "")

        start_date = date.fromisoformat(
            str(state.get("startDate") or state.get("start_date") or "")
        )
        end_date = date.fromisoformat(
            str(state.get("endDate") or state.get("end_date") or "")
        )

        if not user_id:
            raise ValueError("Falta userId.")

        if not destination:
            raise ValueError("Falta destination.")

        if end_date < start_date:
            raise ValueError("endDate no puede ser anterior a startDate.")

        travelers = state.get("travelers", 1)
        if (
            isinstance(travelers, bool)
            or not isinstance(travelers, int)
            or travelers < 1
        ):
            raise ValueError("travelers debe ser un entero mayor que cero.")

        # Se crea primero el planId y se reutiliza como tripId provisional
        # de los eventos para mantener una referencia consistente.
        plan_id = str(uuid4())
        trip_id = plan_id

        days = []
        current = start_date
        day_number = 1

        while current <= end_date:
            days.append({
                "dayNumber": day_number,
                "date": current.isoformat(),
                "title": f"Día {day_number} en {destination}",
                "events": [],
            })
            current += timedelta(days=1)
            day_number += 1

        transport = state.get("transport_result", {})
        experiences = state.get("experiences_result", {})

        outbound = transport.get("outbound", [])
        inbound = transport.get("inbound", [])

        # Transporte de ida: ocupa el primer día y bloquea el horario
        # que necesitan las demás actividades.
        if outbound:
            route = outbound[0]
            duration = _duration_hours(
                route.get("estimatedDuration", ""),
                fallback=2,
            )
            mode = route.get("mode", "transport")
            event_type = EVENT_TYPES.get(mode, "TRANSPORT")
            cost = route.get("estimatedCost", 0)

            if not isinstance(cost, (int, float)) or isinstance(cost, bool) or cost < 0:
                raise ValueError("El costo del transporte de ida no es válido.")

            airline = route.get("airline") or route.get("providerHint", "Avianca")
            flight_num = route.get("flightNumber", "Vuelo Directo")
            airline_url = route.get("airlineBookingUrl") or "https://www.avianca.com/co/es/"

            _add_transport_event(
                day=days[0],
                trip_id=trip_id,
                title=f"Vuelo {airline} ({flight_num}): {origin} ➔ {destination}" if mode == "flight" else f"Viaje de {origin} a {destination}",
                description=(
                    f"Transporte operado por {airline}. "
                    f"Duración estimada: {route.get('estimatedDuration', 'No especificada')}."
                ),
                event_type=event_type,
                location=f"{origin} - {destination}",
                cost=float(cost),
                start_time=_departure_time(route, time(8, 0)),
                duration_hours=duration,
                extra_details={
                    "airline": airline,
                    "flightNumber": flight_num,
                    "airlineBookingUrl": airline_url,
                },
            )

        # Transporte de regreso: se programa en el último día.
        if inbound:
            route = inbound[0]
            duration = _duration_hours(
                route.get("estimatedDuration", ""),
                fallback=2,
            )
            mode = route.get("mode", "transport")
            event_type = EVENT_TYPES.get(mode, "TRANSPORT")
            cost = route.get("estimatedCost", 0)

            if not isinstance(cost, (int, float)) or isinstance(cost, bool) or cost < 0:
                raise ValueError("El costo del transporte de regreso no es válido.")

            airline = route.get("airline") or route.get("providerHint", "Avianca")
            flight_num = route.get("flightNumber", "Vuelo Retorno")
            airline_url = route.get("airlineBookingUrl") or "https://www.avianca.com/co/es/"

            _add_transport_event(
                day=days[-1],
                trip_id=trip_id,
                title=f"Vuelo {airline} ({flight_num}): {destination} ➔ {origin}" if mode == "flight" else f"Regreso de {destination} a {origin}",
                description=(
                    f"Transporte operado por {airline}. "
                    f"Duración estimada: {route.get('estimatedDuration', 'No especificada')}."
                ),
                event_type=event_type,
                location=f"{destination} - {origin}",
                cost=float(cost),
                start_time=_departure_time(route, time(16, 0)),
                duration_hours=duration,
                extra_details={
                    "airline": airline,
                    "flightNumber": flight_num,
                    "airlineBookingUrl": airline_url,
                },
            )

        # Determinar hora de llegada del vuelo/transporte de ida en el Día 1
        day1_earliest_start = DAY_START
        if outbound and days:
            route = outbound[0]
            dep_t = _departure_time(route, time(8, 0))
            dur_h = _duration_hours(route.get("estimatedDuration", ""), fallback=2)
            arr_dt = datetime.combine(date.fromisoformat(days[0]["date"]), dep_t) + timedelta(hours=dur_h)
            avail_dt = arr_dt + timedelta(minutes=60)
            day1_earliest_start = avail_dt.time()

            # Evento de Check-in en el hotel
            accommodation = state.get("selected_accommodation") or {}
            hotel_name = accommodation.get("name")
            if hotel_name:
                checkin_time = (arr_dt + timedelta(minutes=40)).time()
                _add_transport_event(
                    day=days[0],
                    trip_id=trip_id,
                    title=f"Check-in en {hotel_name}",
                    description=f"Llegada al hospedaje e instalación. {accommodation.get('description', '')}",
                    event_type="ACCOMMODATION",
                    location=accommodation.get("location", destination),
                    cost=0.0,
                    start_time=checkin_time,
                    duration_hours=0.5,
                    extra_details={
                        "hotelName": hotel_name,
                        "hotelType": accommodation.get("hotelType"),
                        "bookingUrl": accommodation.get("bookingUrl"),
                    },
                )

        # Se utilizan las recomendaciones que dejó el budget_agent.
        activities = experiences.get("activities", [])
        gastronomy = experiences.get("gastronomy", [])

        # Las actividades se distribuyen procurando respetar su franja horaria preferida
        # y NUNCA antes de la llegada del vuelo al destino.
        for index, activity in enumerate(activities):
            if not days:
                break

            time_of_day = activity.get("bestTimeOfDay", "morning")
            preferred_time = ACTIVITY_TIMES.get(time_of_day, time(9, 0))

            if len(days) > 1 and day1_earliest_start >= time(14, 0) and time_of_day in ("morning", "afternoon"):
                day_idx = 1 + (index % (len(days) - 1))
            else:
                day_idx = index % len(days)

            day = days[day_idx]
            day_earliest = day1_earliest_start if day_idx == 0 else DAY_START

            duration = _duration_hours(
                activity.get("duration", ""),
                fallback=2,
            )

            cost = activity.get("estimatedCost", 0)
            if (
                isinstance(cost, bool)
                or not isinstance(cost, (int, float))
                or cost < 0
            ):
                continue

            op_name = activity.get("operatorName")
            act_title = activity.get("title", "Actividad")
            website_url = activity.get("websiteUrl")
            ig_handle = activity.get("instagramHandle")
            ig_url = f"https://www.instagram.com/{ig_handle.strip('@')}/" if ig_handle else None
            booking_url = activity.get("directBookingUrl")

            title = f"{act_title} ({op_name})" if op_name and op_name.lower() not in act_title.lower() else act_title

            scheduled = _schedule_event(
                day=day,
                trip_id=trip_id,
                title=title,
                description=activity.get("description", ""),
                event_type="ACTIVITY",
                location=destination,
                cost=float(cost),
                preferred_time=preferred_time,
                duration_hours=duration,
                earliest_start=day_earliest,
                extra_details={
                    "operatorName": op_name,
                    "websiteUrl": website_url,
                    "instagramHandle": ig_handle,
                    "instagramUrl": ig_url,
                    "directBookingUrl": booking_url,
                },
            )

            if not scheduled:
                warnings.append(
                    f"No se pudo programar la actividad "
                    f"'{activity.get('title', 'Actividad')}' por falta de horario."
                )

        # Las comidas se programan después de las actividades.
        for index, meal in enumerate(gastronomy):
            if not days:
                break

            meal_type = meal.get("mealType", "lunch")
            preferred_time = MEAL_TIMES.get(meal_type, time(12, 0))

            if len(days) > 1 and day1_earliest_start >= time(14, 0) and meal_type in ("breakfast", "lunch"):
                day_idx = 1 + (index % (len(days) - 1))
            else:
                day_idx = index % len(days)

            day = days[day_idx]
            day_earliest = day1_earliest_start if day_idx == 0 else DAY_START

            cost = meal.get("estimatedCost", 0)
            if (
                isinstance(cost, bool)
                or not isinstance(cost, (int, float))
                or cost < 0
            ):
                continue

            venue_name = meal.get("venueName") or meal.get("typicalPlace") or "Restaurante"
            dish_name = meal.get("dish") or "Especialidad gastronómica"
            website_url = meal.get("websiteUrl")
            ig_handle = meal.get("instagramHandle")
            ig_url = f"https://www.instagram.com/{ig_handle.strip('@')}/" if ig_handle else None
            booking_url = meal.get("directBookingUrl")

            title = f"{venue_name}: {dish_name}" if venue_name.lower() not in dish_name.lower() else dish_name

            scheduled = _schedule_event(
                day=day,
                trip_id=trip_id,
                title=title,
                description=f"{meal.get('description', '')}. Especialidad: {dish_name}.",
                event_type="MEAL",
                location=f"{venue_name}, {destination}",
                cost=float(cost),
                preferred_time=preferred_time,
                duration_hours=1,
                earliest_start=day_earliest,
                extra_details={
                    "venueName": venue_name,
                    "dish": dish_name,
                    "websiteUrl": website_url,
                    "instagramHandle": ig_handle,
                    "instagramUrl": ig_url,
                    "directBookingUrl": booking_url,
                },
            )

            if not scheduled:
                warnings.append(
                    f"No se pudo programar la comida "
                    f"'{meal.get('dish', 'Comida')}' por falta de horario."
                )

        for day in days:
            day["events"].sort(key=lambda event: event["startDateTime"])

            for order, event in enumerate(day["events"], start=1):
                event["order"] = order

        trip_draft = {
            "userId": user_id,
            "origin": origin,
            "destination": destination,
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "travelers": travelers,
            "title": f"Viaje a {destination}",
        }

        messages = []
        messages.append("Itinerario construido correctamente.")
        messages.extend(warnings)

        return {
            "planId": plan_id,
            "tripDraft": trip_draft,
            "itinerary": {
                "destination": destination,
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "days": days,
            },
            "suggestedBookingItems": _suggested_booking_items(state),
            "messages": messages,
            "errors": errors,
        }

    except Exception as exc:
        return {
            "errors": errors + [f"Error en itinerary_builder: {exc}"]
        }
