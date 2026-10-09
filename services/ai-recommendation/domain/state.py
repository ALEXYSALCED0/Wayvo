from typing import Any, Literal, TypedDict


class TravelState(TypedDict, total=False):
    # Información proporcionada por el usuario
    origin: str
    destination: str
    start_date: str
    end_date: str
    travelers: int

    # Preferencias del viajero
    personality: Literal["Aventura", "Relax", "Cultural", "Inversión"]
    budget_category: Literal[
        "Económico", "Estándar", "Lujo", "Personalizado"
    ]
    budget_amount: float

    # Resultados de los agentes
    transport_options: list[dict[str, Any]]
    activities: list[dict[str, Any]]
    food_recommendations: list[dict[str, Any]]

    # Seguimiento de la ejecución
    messages: list[str]
    errors: list[str]
    itinerary: dict[str, Any]
