from __future__ import annotations

from datetime import date
from math import ceil

from typing import Any

from domain.budget_rates import (
    DAILY_BUDGET_PER_PERSON,
    DEFAULT_CATEGORY,
    NIGHTLY_RATE_PER_ROOM,
    PERSONS_PER_ROOM,
)


def _category(state: dict[str, Any]) -> str:
    return (
        state.get("budgetCategory")
        or state.get("budget_category")
        or DEFAULT_CATEGORY
    )


def _nights(state: dict[str, Any]) -> int:
    start = state.get("start_date") or state.get("startDate")
    end = state.get("end_date") or state.get("endDate")

    if not start or not end:
        return 0

    return max(
        (
            date.fromisoformat(str(end)[:10])
            - date.fromisoformat(str(start)[:10])
        ).days,
        0,
    )


def _estimate_accommodation(
    state: dict[str, Any],
    nights: int,
) -> dict[str, Any] | None:
    """Estima el alojamiento con un hotel real de la categoría elegida."""
    rates = NIGHTLY_RATE_PER_ROOM.get(state.get("currency", "COP"))

    if not rates:
        return None

    destination = state.get("destination", "")
    category = _category(state)
    travelers = state.get("travelers", 1)
    currency = state.get("currency", "COP")

    try:
        from application.hotel_agent import find_real_hotel
        real_hotel = find_real_hotel(
            destination=destination,
            category=category,
            travelers=travelers,
            nights=nights,
            currency=currency,
        )
        if real_hotel:
            return real_hotel
    except Exception:
        pass

    nightly_rate = rates.get(category, rates[DEFAULT_CATEGORY])
    rooms = ceil(travelers / PERSONS_PER_ROOM)

    return {
        "id": f"hotel-{destination.lower()[:3]}-{category[:3].lower()}",
        "name": f"Alojamiento {category.lower()} en {destination}",
        "nights": nights,
        "rooms": rooms,
        "nightlyRate": nightly_rate,
        "estimatedCost": nightly_rate * rooms * nights,
        "isEstimate": True,
    }


def _default_budget(
    state: dict[str, Any],
    nights: int,
) -> float | None:
    """Presupuesto sugerido cuando el usuario no indica un monto."""
    rates = DAILY_BUDGET_PER_PERSON.get(state.get("currency", "COP"))

    if not rates:
        return None

    daily = rates.get(_category(state), rates[DEFAULT_CATEGORY])
    days = nights + 1

    return float(daily * state.get("travelers", 1) * days)


def _valid_cost(
    item: dict[str, Any],
    field: str = "estimatedCost",
) -> float | None:
    value = item.get(field)

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None

    if value < 0:
        return None

    return float(value)


def _cheapest(
    items: list[dict[str, Any]],
) -> dict[str, Any] | None:
    valid = [
        item for item in items
        if _valid_cost(item) is not None
    ]

    return (
        min(valid, key=lambda item: _valid_cost(item) or 0)
        if valid
        else None
    )


def budget_agent(state: dict[str, Any]) -> dict[str, Any]:
    # Solo los errores nuevos de este nodo: LangGraph los suma al estado.
    errors = []
    nights = _nights(state)

    budget = state.get("approximateBudgetAmount")
    if budget is None:
        budget = state.get("budget_amount")

    # Sin monto del usuario, se sugiere uno según la categoría.
    if budget is None:
        budget = _default_budget(state, nights)

    currency = state.get("currency", "COP")

    if (
        isinstance(budget, bool)
        or not isinstance(budget, (int, float))
        or budget <= 0
    ):
        return {
            "errors": errors + [
                "Se necesita un presupuesto total positivo "
                "para calcular el viaje."
            ]
        }

    transport = state.get("transport_result", {})
    experiences = state.get("experiences_result", {})
    accommodation_options = state.get("accommodation_options", [])

    outbound = transport.get("outbound", [])
    inbound = transport.get("inbound", [])

    selected_outbound = _cheapest(outbound)
    selected_inbound = _cheapest(inbound) if inbound else None

    if not selected_outbound:
        return {
            "errors": errors + [
                "No hay una alternativa de transporte de ida "
                "con costo válido."
            ]
        }

    if inbound and not selected_inbound:
        return {
            "errors": errors + [
                "Hay opciones de regreso, pero ninguna tiene "
                "un costo válido."
            ]
        }

    transport_cost = _valid_cost(selected_outbound)

    if selected_inbound:
        return_cost = _valid_cost(selected_inbound)

        if return_cost is None:
            return {
                "errors": errors + [
                    "El costo del transporte de regreso no es válido."
                ]
            }

        transport_cost += return_cost

    # La opción debe representar el costo total de la estancia
    # para todos los viajeros, no el precio de una sola noche.
    # Si no llegan ofertas, se estima con la tarifa de la categoría.
    accommodation = (
        _cheapest(accommodation_options)
        if accommodation_options
        else _estimate_accommodation(state, nights)
    )

    if not accommodation:
        return {
            "errors": errors + [
                "No se puede validar el presupuesto completo: "
                "no hay ofertas de alojamiento con costo válido "
                f"ni tarifas para la moneda {currency}."
            ]
        }

    accommodation_cost = _valid_cost(accommodation)

    user_budget = state.get("approximateBudgetAmount")
    # Si el usuario no indicó un monto fijo, el presupuesto sugerido se ajusta
    # dinámicamente para cubrir el costo real de vuelos/hoteles de ese destino,
    # siempre que no sea un costo absurdo o astronómico (ej: > 20M COP para viaje corto).
    max_reasonable_budget = 20_000_000 if currency == "COP" else 5_000
    if user_budget is None and budget is not None:
        needed = transport_cost + accommodation_cost + (float(budget) * 0.3)
        if needed > float(budget) and (transport_cost + accommodation_cost) <= max_reasonable_budget:
            budget = round(transport_cost + accommodation_cost + float(budget), 2)

    available = round(
        float(budget) - transport_cost - accommodation_cost,
        2,
    )

    is_budget_exceeded = False
    if available < 0:
        if user_budget is not None:
            # Presupuesto personalizado insuficiente: no arrojar error.
            # En su lugar, cubrir transporte y alojamiento con las opciones mínimas
            # e informar amablemente en la interfaz.
            is_budget_exceeded = True
            budget = round(transport_cost + accommodation_cost, 2)
            available = 0.0
        else:
            return {
                "errors": errors + [
                    "El transporte y el alojamiento superan el "
                    "presupuesto disponible. Se necesitan opciones "
                    "más económicas."
                ]
            }



    activities = [
        item
        for item in experiences.get("activities", [])
        if _valid_cost(item) is not None
    ]

    food = [
        item
        for item in experiences.get("gastronomy", [])
        if _valid_cost(item) is not None
    ]

    activities.sort(key=lambda item: _valid_cost(item) or 0)
    food.sort(key=lambda item: _valid_cost(item) or 0)

    selected_activities = []
    selected_food = []
    remaining = available

    # Alterna entre actividades y comida para distribuir
    # el dinero entre ambas categorías.
    while activities or food:
        added = False

        for pool, selected in (
            (activities, selected_activities),
            (food, selected_food),
        ):
            if not pool:
                continue

            candidate = pool[0]
            cost = _valid_cost(candidate)

            if cost is not None and cost <= remaining:
                selected.append(pool.pop(0))
                remaining = round(remaining - cost, 2)
                added = True
            else:
                pool.pop(0)

        if not added:
            break

    activities_cost = round(
        sum(_valid_cost(item) or 0 for item in selected_activities),
        2,
    )

    food_cost = round(
        sum(_valid_cost(item) or 0 for item in selected_food),
        2,
    )

    total = round(
        transport_cost
        + accommodation_cost
        + activities_cost
        + food_cost,
        2,
    )

    if total > float(budget) + 0.01:
        return {
            "errors": errors + [
                "No fue posible ajustar las recomendaciones "
                "al presupuesto."
            ]
        }

    breakdown = {
        "transport": round(transport_cost, 2),
        "accommodation": round(accommodation_cost, 2),
        "activities": activities_cost,
        "food": food_cost,
    }

    days = max(nights, 1)

    budget_result = {
        "category": _category(state),
        "currency": currency,
        "estimatedTotalCost": total,
        "dailyBudget": round(total / days, 2),
        "breakdown": breakdown,
        "isBudgetExceeded": is_budget_exceeded,
        "userBudget": float(user_budget) if user_budget is not None else None,
        "budgetNotice": (
            f"Tu presupuesto personalizado ({currency} {float(user_budget):,.0f}) es inferior al costo base del viaje "
            f"({currency} {total:,.0f} entre transporte y hospedaje). Diseñamos el plan con las tarifas más económicas y convenientes disponibles."
            if is_budget_exceeded else None
        ),
        "savingsTips": [
            "Las actividades y comidas no seleccionadas quedaron "
            "fuera del plan para respetar el presupuesto.",
            "Confirma la disponibilidad y el precio final antes "
            "de reservar.",
        ],
    }

    updated_transport = {
        **transport,
        "outbound": [selected_outbound],
        "inbound": [selected_inbound] if selected_inbound else [],
        "totalTransportCost": round(transport_cost, 2),
    }

    updated_experiences = {
        **experiences,
        "activities": selected_activities,
        "gastronomy": selected_food,
    }

    return {
        "budget_result": budget_result,
        "transport_result": updated_transport,
        "experiences_result": updated_experiences,
        "selected_accommodation": accommodation,
        # Límite usado (el del usuario o el sugerido) para que main.py lo valide.
        "budget_amount": float(budget),
        "errors": errors,
    }
