from __future__ import annotations

import os
from langchain_google_genai import ChatGoogleGenerativeAI

MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]


def invoke_gemini(
    prompt: str,
    temperature: float = 0.7,
    max_retries: int = 1,
) -> str:
    """Invoca Gemini probando modelos compatibles en cascada para evitar cuellos de botella de cuota (429)."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("Falta configurar GOOGLE_API_KEY.")

    last_error = None
    for model_name in MODELS:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=temperature,
                google_api_key=api_key,
                max_retries=max_retries,
            )
            response = llm.invoke(prompt)
            content = response.content

            if isinstance(content, list):
                content = "".join(
                    item.get("text", "")
                    for item in content
                    if isinstance(item, dict)
                )

            text = str(content).strip()
            if text:
                return text
        except Exception as exc:
            last_error = exc
            # Si el modelo tiene 429 u otro error de tasa, probar inmediatamente el siguiente modelo sin demoras
            continue

    raise last_error or RuntimeError("No se pudo obtener respuesta de ningún modelo de Gemini.")
