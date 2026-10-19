from langgraph.graph import END, START, StateGraph

from domain.state import TravelState
from application.personality_agent import personality_agent
from application.transport_agent import transport_agent
from application.activities_food_agent import activities_food_agent
from application.provider_catalog_agent import provider_catalog_agent
from application.budget_agent import budget_agent
from application.itinerary_builder import itinerary_builder


# Los tres agentes que consultan a Gemini. No dependen entre sí,
# así que corren en paralelo (fan-out) para que el plan responda más rápido.
LLM_AGENTS = ["personality_agent", "transport_agent", "activities_food_agent"]


def has_errors(state: TravelState) -> bool:
    return bool(state.get("errors", []))


def build_graph():
    graph = StateGraph(TravelState)

    graph.add_node("personality_agent", personality_agent)
    graph.add_node("transport_agent", transport_agent)
    graph.add_node("activities_food_agent", activities_food_agent)
    graph.add_node("provider_catalog", provider_catalog_agent)
    graph.add_node("budget_agent", budget_agent)
    graph.add_node("itinerary_builder", itinerary_builder)

    # Fan-out: los tres agentes de Gemini arrancan al mismo tiempo.
    for agent in LLM_AGENTS:
        graph.add_edge(START, agent)

    # Fan-in: provider_catalog espera a que terminen los tres.
    graph.add_edge(LLM_AGENTS, "provider_catalog")

    # Si algún agente de Gemini falló, se termina sin calcular el presupuesto.
    graph.add_conditional_edges(
        "provider_catalog",
        has_errors,
        {
            True: END,
            False: "budget_agent",
        },
    )

    graph.add_conditional_edges(
        "budget_agent",
        has_errors,
        {
            True: END,
            False: "itinerary_builder",
        },
    )

    graph.add_edge("itinerary_builder", END)

    return graph.compile()


travel_graph = build_graph()
