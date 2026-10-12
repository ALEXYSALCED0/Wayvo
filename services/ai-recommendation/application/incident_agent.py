"""
Agente autónomo de resolución de eventualidades e incidencias de viaje para Wayvo.
Genera soluciones contextuales 100% dinámicas usando LLMs con fallback inteligente.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from application.llm_client import invoke_llm
from application.json_utils import extract_and_parse_json

logger = logging.getLogger("ai_recommendation.incident_agent")


def build_incident_prompt(
    destination: str,
    event_title: str,
    event_type: str,
    event_time: str,
    incident_type: str,
    user_reason: str,
    surrounding_itinerary: List[Dict[str, Any]],
) -> str:
    itinerary_summary = "\n".join(
        f"- {item.get('time', 'Hora N/D')}: {item.get('title', 'Evento')} ({item.get('type', 'N/D')})"
        for item in (surrounding_itinerary or [])[:6]
    ) or "Sin otros eventos cercanos reportados."

    return f"""Eres el motor de resolución reactiva de viajes de Wayvo (Travel Re-planning & Concierge AI).
Un viajero se encuentra en el destino: "{destination}".
Ha reportado una disrupción/eventualidad urgente en el siguiente evento de su itinerario:
- Evento Afectado: "{event_title}"
- Tipo de Evento: {event_type}
- Horario Programado: {event_time}
- Categoría de Eventualidad: {incident_type}
- Lo que ocurrió según el viajero: "{user_reason}"

Itinerario circundante / siguientes eventos:
{itinerary_summary}

TU TAREA:
Diseña 2 o 3 alternativas REALISTAS, ESTRUCTURADAS, CREATIVAS Y LÓGICAS para resolver esta eventualidad de inmediato.
REGLAS CRÍTICAS DE SENTIDO COMÚN:
1. Si perdió un transporte crítico (tren, avión, ferry, bus interurbano):
   - Considera la hora actual. Si ya es tarde en la noche, una alternativa DEBE sugerir pernoctar (reservar noche de hotel adicional) y reprogramar el transporte a primera hora de la mañana, o buscar transporte terrestre nocturno sustituto.
   - Si aún es de día, sugiere tomar el siguiente tren/bus disponible o transfer privado, indicando el retraso estimado.
2. Si un atractivo, tour o museo está cerrado o cancelado por clima:
   - Ofrece actividades o alternativas sustitutas cercanas viables bajo techo o de similar perfil cultural/gastronómico.
3. Si el viajero cambió de planes voluntariamente o se siente agotado:
   - Ofrece reorganización con tiempo libre, spa o paseo relajante sin perder el resto del viaje.
4. Cada alternativa DEBE incluir la lista de nuevos eventos a inyectar en el itinerario (`newEventsToInject`).

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{{
  "aiDiagnosis": "Explicación empática y concisa de la solución propuesta y mitigación del itinerario.",
  "alternatives": [
    {{
      "id": "alt-1",
      "title": "Nombre conciso de la solución",
      "description": "Explicación detallada de cómo soluciona el problema y qué pasos seguir.",
      "type": "transit",
      "typeLabel": "Transporte Sustituto",
      "provider": "Nombre del operador o servicio sugerido",
      "timeImpact": "+2 horas",
      "costDifference": "$45,000 COP",
      "compatibility": "96%",
      "isRecommended": true,
      "newEventsToInject": [
        {{
          "title": "Título del nuevo evento",
          "description": "Detalles del evento de reemplazo",
          "time": "18:30 - 20:00",
          "type": "TRANSPORT",
          "typeLabel": "Transporte",
          "location": "{destination}"
        }}
      ]
    }}
  ]
}}
"""


def get_heuristic_fallback(
    destination: str,
    event_title: str,
    event_type: str,
    user_reason: str,
) -> Dict[str, Any]:
    """Genera alternativas de respaldo coherentes si el LLM no responde."""
    is_transport = "TRANS" in event_type.upper() or "FLIGHT" in event_type.upper() or "TREN" in event_title.upper()

    if is_transport:
        return {
            "aiDiagnosis": f"Disrupción de transporte detectada en '{event_title}'. Se ofrecen dos rutas de mitigación: salida en siguiente horario disponible o transporte terrestre alternativo.",
            "alternatives": [
                {
                    "id": "alt-1",
                    "title": "Reprogramar para siguiente horario disponible",
                    "description": f"Se ajusta la salida de {event_title} para 2 horas más tarde, coordinando con el operador local.",
                    "type": "transit",
                    "typeLabel": "Transporte Reprogramado",
                    "provider": "Operador local / Taquilla oficial",
                    "timeImpact": "+120 min",
                    "costDifference": "$0 COP (Sujeto a política de cambio)",
                    "compatibility": "94%",
                    "isRecommended": True,
                    "newEventsToInject": [
                        {
                            "title": f"{event_title} (Reprogramado)",
                            "description": "Salida en el siguiente horario disponible con itinerario ajustado.",
                            "time": "Próxima salida disponible",
                            "type": "TRANSPORT",
                            "typeLabel": "Transporte",
                            "location": destination,
                        }
                    ],
                },
                {
                    "id": "alt-2",
                    "title": "Noche adicional en hotel + Salida a primera hora",
                    "description": "Si no hay más salidas hoy, se añade estadía express y se toma la primera salida de la mañana.",
                    "type": "combined",
                    "typeLabel": "Alojamiento + Conexión",
                    "provider": "Hotel céntrico / Hostal disponible",
                    "timeImpact": "+1 noche",
                    "costDifference": "Aprox. $160,000 COP",
                    "compatibility": "88%",
                    "isRecommended": False,
                    "newEventsToInject": [
                        {
                            "title": "Check-in alojamiento imprevisto",
                            "description": "Estadía nocturna para descansar y continuar a primera hora.",
                            "time": "20:00 - Noche",
                            "type": "HOTEL",
                            "typeLabel": "Alojamiento",
                            "location": destination,
                        },
                        {
                            "title": f"{event_title} (Salida Matutina)",
                            "description": "Primer transporte de la mañana sin congestión.",
                            "time": "07:00 AM",
                            "type": "TRANSPORT",
                            "typeLabel": "Transporte",
                            "location": destination,
                        },
                    ],
                },
            ],
        }

    return {
        "aiDiagnosis": f"Eventualidad atendida en '{event_title}'. Se propone actividad sustituta cercana o tiempo libre de relajación.",
        "alternatives": [
            {
                "id": "alt-1",
                "title": "Actividad cultural o gastronómica sustituta",
                "description": f"Experiencia alternativa en {destination} de duración equivalente sin alterar la agenda posterior.",
                "type": "activity",
                "typeLabel": "Actividad Alternativa",
                "provider": "Guías locales certificados",
                "timeImpact": "Mismo horario",
                "costDifference": "$0 COP",
                "compatibility": "97%",
                "isRecommended": True,
                "newEventsToInject": [
                    {
                        "title": f"Experiencia local en {destination}",
                        "description": "Visita a centro histórico, mercado gastronómico o museo alternativo.",
                        "time": "Mismo horario",
                        "type": "ACTIVITY",
                        "typeLabel": "Actividad",
                        "location": destination,
                    }
                ],
            },
            {
                "id": "alt-2",
                "title": "Tiempo libre y descanso en zona comercial",
                "description": "Pausa relajante para café de especialidad y compras locales antes del siguiente evento.",
                "type": "activity",
                "typeLabel": "Tiempo Libre",
                "provider": "Wayvo Concierge",
                "timeImpact": "Flexible",
                "costDifference": "$0 COP",
                "compatibility": "90%",
                "isRecommended": False,
                "newEventsToInject": [
                    {
                        "title": "Tiempo libre & Recorrido autónomo",
                        "description": "Descanso y recorrido por la zona a ritmo libre.",
                        "time": "Horario disponible",
                        "type": "MEAL",
                        "typeLabel": "Gastronomía & Relax",
                        "location": destination,
                    }
                ],
            },
        ],
    }


def resolve_incident_agent(
    destination: str,
    event_title: str,
    event_type: str,
    event_time: str,
    incident_type: str,
    user_reason: str,
    surrounding_itinerary: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Ejecuta la generación dinámica de alternativas con IA."""
    prompt = build_incident_prompt(
        destination=destination,
        event_title=event_title,
        event_type=event_type,
        event_time=event_time,
        incident_type=incident_type,
        user_reason=user_reason,
        surrounding_itinerary=surrounding_itinerary or [],
    )

    try:
        raw_response = invoke_llm(prompt, temperature=0.3)
        parsed = extract_and_parse_json(raw_response)

        if isinstance(parsed, dict) and "alternatives" in parsed and isinstance(parsed["alternatives"], list):
            # Normalizar identificadores de alternativas
            for idx, alt in enumerate(parsed["alternatives"]):
                if not alt.get("id"):
                    alt["id"] = f"alt-{idx + 1}"
            return parsed
    except Exception as exc:
        logger.warning(f"Falla al generar alternativas con LLM: {exc}. Usando fallback heurístico.")

    return get_heuristic_fallback(
        destination=destination,
        event_title=event_title,
        event_type=event_type,
        user_reason=user_reason,
    )
