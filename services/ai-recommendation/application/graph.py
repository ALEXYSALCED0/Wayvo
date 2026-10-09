from langgraph.graph import END, START, StateGraph

from domain.state import TravelState
from application.personality_agent import personality_agent
from application.budget_agent import budget_agent
from application.transport_agent import transport_agent
from application.activities_food_agent import activities_food_agent


def build_graph():
    graph = StateGraph(TravelState)

    graph.add_node("personality_agent", personality_agent)
    graph.add_node("budget_agent", budget_agent)
    graph.add_node("transport_agent", transport_agent)
    graph.add_node("activities_food_agent", activities_food_agent)

    graph.add_edge(START, "personality_agent")
    graph.add_edge("personality_agent", "budget_agent")
    graph.add_edge("budget_agent", "transport_agent")
    graph.add_edge("transport_agent", "activities_food_agent")
    graph.add_edge("activities_food_agent", END)

    return graph.compile()


travel_graph = build_graph()
