"""
Módulo de búsqueda web en tiempo real sin costo ni API key usando DDGS.
Permite descubrir restaurantes, platos típicos, hoteles y actividades
para CUALQUIER destino del mundo, incluidos destinos ocultos o remotos.
"""

from __future__ import annotations
import logging
from typing import List, Dict

logger = logging.getLogger("ai_recommendation.web_search")


def search_destination_live(destination: str, max_results: int = 4) -> Dict[str, List[Dict[str, str]]]:
    """
    Busca información en tiempo real sobre gastronomía y actividades para cualquier destino.
    Retorna un diccionario con 'food' y 'activities'.
    """
    food_results = []
    activities_results = []

    try:
        from ddgs import DDGS
    except ImportError:
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            logger.warning("DDGS no disponible para búsqueda web en tiempo real.")
            return {"food": [], "activities": []}

    try:
        with DDGS() as ddgs:
            # 1. Búsqueda gastronómica
            food_query = f"mejores restaurantes donde comer platos tipicos en {destination}"
            for r in ddgs.text(food_query, max_results=max_results):
                food_results.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("body", ""),
                    "url": r.get("href", ""),
                })

            # 2. Búsqueda de actividades y lugares
            act_query = f"que hacer lugares turisticos actividades tours en {destination}"
            for r in ddgs.text(act_query, max_results=max_results):
                activities_results.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("body", ""),
                    "url": r.get("href", ""),
                })
    except Exception as exc:
        logger.warning(f"Error realizando búsqueda web en tiempo real para {destination}: {exc}")

    return {
        "food": food_results,
        "activities": activities_results,
    }


def format_web_context(web_data: Dict[str, List[Dict[str, str]]]) -> str:
    """Convierte los resultados de búsqueda web en texto estructurado para el prompt del LLM."""
    food = web_data.get("food", [])
    activities = web_data.get("activities", [])

    if not food and not activities:
        return ""

    lines = ["INFORMACIÓN EN TIEMPO REAL DE LA WEB SOBRE ESTE DESTINO:"]

    if food:
        lines.append("Gastronomía y restaurantes encontrados en la web:")
        for idx, item in enumerate(food, 1):
            lines.append(f"{idx}. {item['title']}: {item['snippet']} (Fuente: {item['url']})")

    if activities:
        lines.append("\nAtracciones y actividades encontradas en la web:")
        for idx, item in enumerate(activities, 1):
            lines.append(f"{idx}. {item['title']}: {item['snippet']} (Fuente: {item['url']})")

    lines.append("\nUsa esta información real y reciente para nombrar lugares y platos específicos.")
    return "\n".join(lines)
