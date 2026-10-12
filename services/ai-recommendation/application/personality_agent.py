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

    if not api_key:
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

    try:
        from application.llm_client import invoke_gemini

        text = invoke_gemini(prompt, temperature=0.0)
        clean_text = text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("\n", 1)[1]
            if clean_text.endswith("```"):
                clean_text = clean_text.rsplit("```", 1)[0]

        result = json.loads(clean_text)

        style = result.get("analyzedStyle")
        pace = result.get("dominantPace")

        if style not in VALID_STYLES:
            raise ValueError(f"Estilo no válido: {style}")

        if pace not in VALID_PACES:
            raise ValueError(f"Ritmo no válido: {pace}")

        personality_result = {
            "analyzedStyle": style,
            "traitSummary": str(result["traitSummary"]),
            "dominantPace": pace,
            "recommendedVibe": str(result["recommendedVibe"]),
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
        return {
            "errors": [f"Error en personality_agent: {exc}"]
        }
