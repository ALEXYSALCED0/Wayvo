from __future__ import annotations

import os

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Literal

from adapters.error_handlers import register_error_handlers
from application.chat_agent import ChatAgentError, chat_agent
from application.graph import travel_graph

load_dotenv()

app = FastAPI(
    title="Wayvo AI Recommendation Service",
    description="LangGraph Multiagent Engine for Travel Recommendations",
    version="1.0.0",
)

# Todas las respuestas de error usan { success: false, error: { code, message, details } }.
register_error_handlers(app)

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


class PsychologicalAssessmentInput(BaseModel):
    spontaneityScore: int = Field(ge=1, le=5)
    comfortPriority: int = Field(ge=1, le=5)
    culturalCuriosity: int = Field(ge=1, le=5)
    socialPreference: Literal[
        "solo", "couple", "family", "friends", "group"
    ]
    physicalActivityLevel: Literal["low", "moderate", "high"]
    interests: list[str]


class AIPlanRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    userId: str = Field(min_length=1)
    origin: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    startDate: str
    endDate: str
    travelers: int = Field(ge=1)
    budgetCategory: BudgetCategory
    currency: str = Field(default="COP", min_length=3, max_length=3)
    approximateBudgetAmount: float | None = Field(default=None, gt=0)
    psychologicalAssessment: PsychologicalAssessmentInput
    dietaryRestrictions: list[str] = Field(default_factory=list)
    preferredStyle: TravelStyle | None = None

    @field_validator("startDate", "endDate")
    @classmethod
    def validate_date_format(cls, value):
        from datetime import date

        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("La fecha debe usar el formato YYYY-MM-DD.") from exc

        return value

    @field_validator("endDate")
    @classmethod
    def validate_dates(cls, end_date, info):
        start_date = info.data.get("startDate")

        if start_date and end_date < start_date:
            raise ValueError("endDate no puede ser anterior a startDate.")

        return end_date


# Modelos del chat libre (AIChatRequest en shared/contracts).
class ChatHistoryMessage(BaseModel):
    sender: Literal["ai", "user"]
    text: str


class ChatContext(BaseModel):
    currentDestination: str | None = None
    budgetCategory: str | None = None
    travelStyle: str | None = None


class AIChatRequest(BaseModel):
    userId: str = Field(min_length=1)
    message: str = Field(min_length=1, max_length=1000)
    tripId: str | None = None
    conversationHistory: list[ChatHistoryMessage] = Field(default_factory=list)
    context: ChatContext | None = None


@app.get("/health")
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "ai-recommendation",
        },
    }


def validate_budget(
    budget: dict,
    budget_limit: float,
) -> None:
    """Comprueba que el desglose coincida con el total y respete el límite."""
    breakdown = budget.get("breakdown")

    if not isinstance(breakdown, dict):
        raise HTTPException(
            status_code=500,
            detail="El agente de presupuesto no devolvió un breakdown válido.",
        )

    fields = [
        "transport",
        "accommodation",
        "activities",
        "food",
    ]

    total = 0.0

    for field in fields:
        value = breakdown.get(field)

        if (
            not isinstance(value, (int, float))
            or isinstance(value, bool)
            or value < 0
        ):
            raise HTTPException(
                status_code=500,
                detail=f"El costo '{field}' debe ser numérico y no negativo.",
            )

        total += value

    reported_total = budget.get("estimatedTotalCost")

    if (
        not isinstance(reported_total, (int, float))
        or isinstance(reported_total, bool)
        or abs(reported_total - total) > 0.01
    ):
        raise HTTPException(
            status_code=500,
            detail="El total estimado no coincide con el desglose del presupuesto.",
        )

    if total > budget_limit + 0.01:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "El plan supera el presupuesto indicado.",
                "budgetLimit": budget_limit,
                "estimatedTotalCost": total,
            },
        )


def validate_complete_result(result: dict) -> None:
    required_fields = {
        "personality": result.get("personality_result"),
        "budget": result.get("budget_result"),
        "transport": result.get("transport_result"),
        "experiences": result.get("experiences_result"),
        "itinerary": result.get("itinerary"),
        "tripDraft": result.get("tripDraft"),
        "planId": result.get("planId"),
    }

    missing = [
        name
        for name, value in required_fields.items()
        if value is None
    ]

    if missing:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "El grafo no generó todos los campos requeridos.",
                "missingFields": missing,
            },
        )


@app.post("/api/v1/ai/plan")
def generate_plan(request: AIPlanRequest):
    initial_state = request.model_dump(
        exclude_none=True,
        mode="json",
    )

    # Compatibilidad con los nombres que utilizan los agentes.
    # Si no llega approximateBudgetAmount, el budget_agent sugiere uno.
    # El estilo no se rellena aquí: lo decide el personality_agent.
    initial_state["start_date"] = request.startDate
    initial_state["end_date"] = request.endDate
    initial_state["budget_category"] = request.budgetCategory

    try:
        result = travel_graph.invoke(initial_state)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="No se pudo completar el procesamiento del plan de viaje.",
        ) from exc

    errors = result.get("errors", [])

    if errors:
        error_text = " ".join(str(error).lower() for error in errors)

        # El catálogo de alojamiento sigue pendiente.
        if any(
            term in error_text
            for term in ("alojamiento", "presupuesto", "costo válido")
        ):
            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "No se pudo generar un plan completo con los datos "
                        "y costos disponibles."
                    ),
                    "errors": errors,
                },
            )

        raise HTTPException(
            status_code=502,
            detail={
                "message": "Un agente no pudo completar su tarea.",
                "errors": errors,
            },
        )

    validate_complete_result(result)

    budget = result["budget_result"]
    validate_budget(budget, result["budget_amount"])

    plan = {
        "planId": result["planId"],
        "tripDraft": result["tripDraft"],
        "personality": result["personality_result"],
        "budget": budget,
        "transport": result["transport_result"],
        "experiences": result["experiences_result"],
        "itinerary": result["itinerary"],
        "suggestedBookingItems": result.get("suggestedBookingItems", []),
    }

    return {"success": True, "data": plan}


@app.post("/api/v1/recommendations")
def generate_recommendations_legacy(request: AIPlanRequest):
    """Mantiene la ruta anterior para compatibilidad."""
    return generate_plan(request)


@app.post("/api/v1/ai/chat")
def chat(request: AIChatRequest):
    """Modo libre: chat directo con el asistente. No pasa por el grafo de agentes."""
    try:
        response = chat_agent(
            message=request.message,
            history=[m.model_dump() for m in request.conversationHistory],
            context=request.context.model_dump() if request.context else None,
        )
    except ChatAgentError as exc:
        raise HTTPException(
            status_code=502,
            detail="El asistente no pudo responder en este momento.",
        ) from exc

    return {"success": True, "data": response}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
