"""
Utilidades robustas para extraer y parsear JSON generado por LLMs.
Soporta bloques de código markdown, comas finales sobrantes, texto adyacente
y caracteres no escapados comunes en respuestas de IA.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional


def extract_and_parse_json(text: str) -> Any:
    """
    Extrae y decodifica un objeto o arreglo JSON desde una cadena de texto generada por un LLM.
    Maneja bloques de código markdown, texto circundante y errores comunes de sintaxis JSON.
    """
    if not text or not text.strip():
        raise ValueError("Texto vacío recibido para extracción de JSON.")

    clean = text.strip()

    # 1. Si está envuelto en bloques markdown ```json ... ``` o ``` ... ```
    if "```" in clean:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean)
        if match:
            clean = match.group(1).strip()

    # 2. Intento directo con json.loads estándar
    try:
        return json.loads(clean)
    except Exception:
        pass

    # 3. Extraer el bloque JSON más externo delimitado por { } o [ ]
    start_brace = clean.find("{")
    start_bracket = clean.find("[")

    if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
        end_brace = clean.rfind("}")
        if end_brace != -1 and end_brace > start_brace:
            clean = clean[start_brace : end_brace + 1]
    elif start_bracket != -1:
        end_bracket = clean.rfind("]")
        if end_bracket != -1 and end_bracket > start_bracket:
            clean = clean[start_bracket : end_bracket + 1]

    # Intento después de recortar texto exterior
    try:
        return json.loads(clean)
    except Exception:
        pass

    # 4. Limpieza de errores comunes de sintaxis generados por LLMs
    # a. Eliminar comentarios estilo // o /* */
    repaired = re.sub(r"//.*?\n", "\n", clean)
    repaired = re.sub(r"/\*.*?\*/", "", repaired, flags=re.DOTALL)

    # b. Eliminar comas finales antes de llaves de cierre o corchetes: , } -> } o , ] -> ]
    repaired = re.sub(r",\s*([}\]])", r"\1", repaired)

    try:
        return json.loads(repaired)
    except Exception:
        pass

    # 5. Reemplazar saltos de línea sin escapar dentro de strings
    def escape_newlines_in_strings(s: str) -> str:
        out = []
        in_string = False
        escaped = False
        for ch in s:
            if ch == '"' and not escaped:
                in_string = not in_string
            elif ch == "\\" and in_string:
                escaped = not escaped
                out.append(ch)
                continue
            elif ch == "\n" and in_string:
                out.append("\\n")
                escaped = False
                continue
            escaped = False
            out.append(ch)
        return "".join(out)

    try:
        escaped_newlines = escape_newlines_in_strings(repaired)
        return json.loads(escaped_newlines)
    except Exception as exc:
        raise ValueError(f"No se pudo parsear el JSON generado por el LLM: {exc}") from exc
