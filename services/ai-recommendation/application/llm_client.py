"""
Cliente universal de LLMs para Wayvo.
Soporta múltiples proveedores de IA gratuitos y de alto rendimiento:
1. Groq (Llama 3.3 70B Versatile, DeepSeek R1, Llama 3.1 8B) - 100% gratuito vía console.groq.com.
2. OpenRouter (Modelos :free como Llama 3.3 70B, Gemini 2.0 Flash Exp) - vía openrouter.ai.
3. Google Gemini (gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-flash-lite-latest) vía GOOGLE_API_KEY.

Si un proveedor falla por cuota (429) o conectividad, conmuta automáticamente al siguiente disponible.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger("ai_recommendation.llm_client")

GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]

GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "llama-3.1-8b-instant",
]

OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-r1:free",
]


def _call_groq(prompt: str, temperature: float = 0.3) -> Optional[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

        for model in GROQ_MODELS:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                )
                text = response.choices[0].message.content or ""
                if text.strip():
                    logger.info(f"Respuesta obtenida exitosamente desde Groq ({model})")
                    return text.strip()
            except Exception as e:
                logger.warning(f"Groq modelo {model} falló: {e}")
                continue
    except Exception as exc:
        logger.warning(f"Error inicializando cliente Groq: {exc}")

    return None


def _call_openrouter(prompt: str, temperature: float = 0.3) -> Optional[str]:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

        for model in OPENROUTER_MODELS:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                )
                text = response.choices[0].message.content or ""
                if text.strip():
                    logger.info(f"Respuesta obtenida exitosamente desde OpenRouter ({model})")
                    return text.strip()
            except Exception as e:
                logger.warning(f"OpenRouter modelo {model} falló: {e}")
                continue
    except Exception as exc:
        logger.warning(f"Error inicializando cliente OpenRouter: {exc}")

    return None


def _call_gemini(prompt: str, temperature: float = 0.7, max_retries: int = 1) -> Optional[str]:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        for model_name in GEMINI_MODELS:
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
                    logger.info(f"Respuesta obtenida exitosamente desde Gemini ({model_name})")
                    return text
            except Exception as exc:
                logger.warning(f"Gemini modelo {model_name} falló: {exc}")
                continue
    except Exception as exc:
        logger.warning(f"Error inicializando Gemini: {exc}")

    return None


def invoke_llm(
    prompt: str,
    temperature: float = 0.3,
    max_retries: int = 1,
) -> str:
    """
    Invoca el mejor LLM disponible con conmutación por error (fallback):
    1. Si LLM_PROVIDER='groq' o hay GROQ_API_KEY, intenta Groq primero.
    2. Si LLM_PROVIDER='openrouter' o hay OPENROUTER_API_KEY, intenta OpenRouter.
    3. Intenta Google Gemini con su cascada de modelos lite.
    4. Si falla Gemini y existe otra clave, intenta los otros proveedores.
    """
    preferred = (os.getenv("LLM_PROVIDER") or "").lower()

    if preferred == "groq" or os.getenv("GROQ_API_KEY"):
        res = _call_groq(prompt, temperature)
        if res:
            return res

    if preferred == "openrouter" or os.getenv("OPENROUTER_API_KEY"):
        res = _call_openrouter(prompt, temperature)
        if res:
            return res

    # Intento principal con Gemini
    res = _call_gemini(prompt, temperature, max_retries)
    if res:
        return res

    # Si Gemini falló por cuota o error, intentar Groq como respaldo si está configurado
    if os.getenv("GROQ_API_KEY"):
        res = _call_groq(prompt, temperature)
        if res:
            return res

    # Si aún no hay respuesta, intentar OpenRouter si está configurado
    if os.getenv("OPENROUTER_API_KEY"):
        res = _call_openrouter(prompt, temperature)
        if res:
            return res

    raise RuntimeError(
        "No se pudo obtener respuesta de ningún proveedor de IA configurado. "
        "Verifica tus claves en .env (GOOGLE_API_KEY, GROQ_API_KEY o OPENROUTER_API_KEY)."
    )


# Alias retrocompatible
invoke_gemini = invoke_llm


def has_ai_key() -> bool:
    """Verifica si al menos una clave de IA (Gemini, Groq u OpenRouter) está configurada."""
    return bool(
        os.getenv("GOOGLE_API_KEY")
        or os.getenv("GROQ_API_KEY")
        or os.getenv("OPENROUTER_API_KEY")
    )

