from typing import Any, Literal, TypedDict


TravelStyle = Literal[
    "Aventura",
    "Relax",
    "Cultural",
    "Inversión",
    "Gastronómico",
    "Eco-Turismo",
]

BudgetCategory = Literal[
    "Económico",
    "Estándar",
    "Lujo",
    "Personalizado",
]

PacePreference = Literal["Relajado", "Moderado", "Intenso"]


class PsychologicalAssessment(TypedDict):
    spontaneityScore: int
    comfortPriority: int
    culturalCuriosity: int
    socialPreference: Literal[
        "solo", "couple", "family", "friends", "group"
    ]
    physicalActivityLevel: Literal["low", "moderate", "high"]
    interests: list[str]


class TravelState(TypedDict, total=False):
    # Entrada del contrato
    userId: str
    origin: str
    destination: str
    startDate: str
    endDate: str
    travelers: int
    budgetCategory: BudgetCategory
    currency: str
    approximateBudgetAmount: float
    psychologicalAssessment: PsychologicalAssessment
    dietaryRestrictions: list[str]
    preferredStyle: TravelStyle

    # Compatibilidad con los agentes existentes
    start_date: str
    end_date: str
    personality: TravelStyle
    budget_category: BudgetCategory
    budget_amount: float

    # Resultados estructurados de los agentes
    personality_result: dict[str, Any]
    budget_result: dict[str, Any]
    transport_result: dict[str, Any]
    experiences_result: dict[str, Any]
    accommodation_options: list[dict[str, Any]]
    selected_accommodation: dict[str, Any]

    # Resultados utilizados actualmente por Gemini
    transport_options: list[dict[str, Any]]
    activities: list[dict[str, Any]]
    food_recommendations: list[dict[str, Any]]

    # Salida final
    planId: str
    tripDraft: dict[str, Any]
    itinerary: dict[str, Any]
    suggestedBookingItems: list[dict[str, Any]]

    # Seguimiento de ejecución
    messages: list[str]
    errors: list[str]
