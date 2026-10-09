from langgraph.graph import END, START, StateGraph

from domain.state import TravelState
from application.personality_agent import personality_agent


def build_graph():
    graph = StateGraph(TravelState)

    # Nodo que analiza el estilo de viaje del usuario.
    graph.add_node("personality_agent", personality_agent)

    # Flujo inicial: inicio -> agente de personalidad -> fin.
    graph.add_edge(START, "personality_agent")
    graph.add_edge("personality_agent", END)

    return graph.compile()


travel_graph = build_graph()
