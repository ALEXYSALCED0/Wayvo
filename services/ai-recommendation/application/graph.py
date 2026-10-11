from langgraph.graph import END, START, StateGraph

from domain.state import TravelState
from application.personality_agent import personality_agent
from application.transport_agent import transport_agent
from application.activities_food_agent import activities_food_agent
from application.budget_agent import budget_agent
from application.itinerary_builder import itinerary_builder


def has_errors(state: TravelState) -> bool:
    return bool(state.get("errors", []))


def build_graph():
    graph = StateGraph(TravelState)

    graph.add_node("personality_agent", personality_agent)
    graph.add_node("transport_agent", transport_agent)
    graph.add_node("activities_food_agent", activities_food_agent)
    graph.add_node("budget_agent", budget_agent)
    graph.add_node("itinerary_builder", itinerary_builder)

    graph.add_edge(START, "personality_agent")

    graph.add_conditional_edges(
        "personality_agent",
        has_errors,
        {
            True: END,
            False: "transport_agent",
        },
    )

    graph.add_conditional_edges(
        "transport_agent",
        has_errors,
        {
            True: END,
            False: "activities_food_agent",
        },
    )

    graph.add_conditional_edges(
        "activities_food_agent",
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
