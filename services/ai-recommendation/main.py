import os

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal

from application.graph import travel_graph

load_dotenv()

app = FastAPI(
    title="Wayvo AI Recommendation Service",
    description="LangGraph Multiagent Engine for Travel Recommendations",
    version="1.0.0",
)


class TravelRequest(BaseModel):
    origin: str
    destination: str
    start_date: str | None = None
    end_date: str | None = None
    travelers: int = Field(default=1, ge=1)
    personality: Literal[
        "Aventura", "Relax", "Cultural", "Inversión"
    ] | None = None
    budget_category: Literal[
        "Económico", "Estándar", "Lujo", "Personalizado"
    ] | None = None
    budget_amount: float | None = Field(default=None, gt=0)
    messages: list[str] = Field(default_factory=list)


@app.get("/health")
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "ai-recommendation",
        },
    }


@app.post("/api/v1/recommendations")
def generate_recommendations(request: TravelRequest):
    result = travel_graph.invoke(
        request.model_dump(exclude_none=True)
    )

    return {
        "success": not bool(result.get("errors")),
        "data": result,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
