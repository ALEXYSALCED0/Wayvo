from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


# Código del error según el estado HTTP.
ERROR_CODES = {
    400: "INVALID_DATA",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    422: "PLAN_NOT_POSSIBLE",
    500: "INTERNAL_ERROR",
    502: "AGENT_FAILED",
}


def error_response(
    status_code: int,
    message: str,
    details=None,
) -> JSONResponse:
    """Formato común del proyecto: { success: false, error: { code, message, details } }."""
    error = {
        "code": ERROR_CODES.get(status_code, "ERROR"),
        "message": message,
    }

    if details:
        error["details"] = details

    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error},
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    # El detail puede ser un texto o un dict con "message" y datos extra.
    if isinstance(exc.detail, dict):
        details = dict(exc.detail)
        message = str(details.pop("message", "Error en la solicitud."))
        return error_response(exc.status_code, message, details)

    return error_response(exc.status_code, str(exc.detail))


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Errores de los modelos de entrada (campos faltantes, fechas inválidas, etc.).
    details = [
        {
            "field": ".".join(str(part) for part in error["loc"] if part != "body"),
            "message": error["msg"],
        }
        for error in exc.errors()
    ]
    return error_response(400, "Los datos enviados no son válidos.", details)


async def unexpected_exception_handler(request: Request, exc: Exception):
    return error_response(500, "Ocurrió un error inesperado en el servicio.")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unexpected_exception_handler)
