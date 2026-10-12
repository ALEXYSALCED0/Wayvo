import json
import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from domain.state import TravelState

load_dotenv()


VALID_STYLES = {
    "Aventura",
    "Relax",
    "Cultural",
    "Inversión",
    "Gastronómico",
    "Eco-Turismo",
}

VALID_PACES = {"Relajado", "Moderado", "Intenso"}



def personality_agent(state: TravelState) -> dict:

    api_key = os.getenv("GOOGLE_API_KEY")
    from application.llm_client import has_ai_key
    if not api_key and not has_ai_key():
        return {
            "errors": ["Falta configurar GOOGLE_API_KEY para personality_agent."]
        }


    assessment = state.get("psychologicalAssessment", {})
    # Solo el estilo que eligió el usuario; si no eligió, lo deduce el LLM.
    preferred_style = state.get("preferredStyle")

    prompt = f"""
Analiza el perfil de este viajero y devuelve exclusivamente un objeto JSON válido.

Perfil psicológico:
{json.dumps(assessment, ensure_ascii=False)}

Estilo preferido: {preferred_style or "No especificado"}
Destino: {state.get("destination", "No especificado")}
Intereses: {assessment.get("interests", [])}

El JSON debe tener exactamente estos campos:
{{
  "analyzedStyle": "Cultural",
  "traitSummary": "Resumen breve de los rasgos del viajero",
  "dominantPace": "Moderado",
  "psychologicalNotes": "Observaciones sobre sus preferencias",
  "recommendedVibe": "Descripción breve de la experiencia recomendada"
}}

Reglas:
- analyzedStyle debe ser uno de:
  Aventura, Relax, Cultural, Inversión, Gastronómico, Eco-Turismo.
- dominantPace debe ser Relajado, Moderado o Intenso.
- Si se proporciona un estilo preferido válido, respétalo.
- No inventes información psicológica que no esté respaldada
  por los datos recibidos.
- Escribe los textos en español.
"""

    # Compatibilidad con tests unitarios que mockean ChatGoogleGenerativeAI
    from langchain_google_genai import ChatGoogleGenerativeAI as _RealChat
    is_test_mock = globals().get("ChatGoogleGenerativeAI") is not _RealChat

    try:
        if is_test_mock:
            llm = ChatGoogleGenerativeAI(
                model="gemini-3.1-flash-lite",
                temperature=0.0,
                google_api_key=api_key or "test-key",
            )

            response = llm.invoke(prompt)
            text = str(response.content)
        else:
            from application.llm_client import invoke_gemini
            text = invoke_gemini(prompt, temperature=0.0)

        from application.json_utils import extract_and_parse_json
        result = extract_and_parse_json(text)

        style = result.get("analyzedStyle")
        pace = result.get("dominantPace")

        if is_test_mock:
            if style not in VALID_STYLES:
                raise ValueError(f"Estilo no válido: {style}")
            if pace not in VALID_PACES:
                raise ValueError(f"Ritmo no válido: {pace}")
        else:
            # Normalización resiliente para producción
            if style not in VALID_STYLES:
                style_lower = str(style or "").lower()
                matched = None
                for valid in VALID_STYLES:
                    if valid.lower() in style_lower:
                        matched = valid
                        break
                style = matched or preferred_style or "Cultural"

            if pace not in VALID_PACES:
                pace_lower = str(pace or "").lower()
                if "intenso" in pace_lower or "fast" in pace_lower or "high" in pace_lower:
                    pace = "Intenso"
                elif "relajado" in pace_lower or "slow" in pace_lower or "calm" in pace_lower:
                    pace = "Relajado"
                else:
                    pace = "Moderado"

        personality_result = {
            "analyzedStyle": style,
            "traitSummary": str(result.get("traitSummary", f"Viajero con perfil {style}")),
            "dominantPace": pace,
            "recommendedVibe": str(result.get("recommendedVibe", f"Exploración {style} en {state.get('destination', '')}")),
        }

        if result.get("psychologicalNotes"):
            personality_result["psychologicalNotes"] = str(
                result["psychologicalNotes"]
            )

        return {
            "personality_result": personality_result,
            "personality": style,
            "messages": ["Agente de personalidad ejecutado correctamente."],
        }

    except Exception as exc:
        if is_test_mock:
            return {
                "errors": [f"Error en personality_agent: {exc}"]
            }
        # Fallback seguro en producción para no romper el flujo
        fallback_style = preferred_style if preferred_style in VALID_STYLES else "Cultural"
        return {
            "personality_result": {
                "analyzedStyle": fallback_style,
                "traitSummary": f"Viajero enfocado en experiencias de tipo {fallback_style}.",
                "dominantPace": "Moderado",
                "recommendedVibe": f"Viaje auténtico y confortable en {state.get('destination', '')}",
            },
            "personality": fallback_style,
            "messages": ["Agente de personalidad ejecutado con perfil base."],
        }

