from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.src.core.origins import origins
from backend.src.exceptions.core import (
    ExceptionCustom,
    ExceptionResponse,
    ExceptionType,
)


def get_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin in origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


async def custom_exceptions_handler(request: Request, exc: ExceptionCustom):
    exception_response = ExceptionResponse(
        exception_type=exc.exception_type,
        message=exc.message,
    )

    headers = exc.headers if exc.headers else {}
    headers.update(get_cors_headers(request))

    return JSONResponse(
        status_code=exc.status_code,
        content=exception_response.model_dump(),
        headers=headers,
    )


async def starlette_exceptions_handlers(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        exception_type = ExceptionType.NOT_FOUND
    elif exc.status_code == 405:
        exception_type = ExceptionType.METHOD

    # Just to be safe. Realistically never gonna happen.
    else:
        exception_type = ExceptionType.BAD_REQUEST

    exception_response = ExceptionResponse(
        exception_type=exception_type, message=str(exc.detail)
    )

    headers = dict(exc.headers) if exc.headers else {}
    headers.update(get_cors_headers(request))

    return JSONResponse(
        status_code=exc.status_code,
        content=exception_response.model_dump(),
        headers=headers,
    )


async def validation_exceptions_handler(request: Request, exc: RequestValidationError):
    exception_response = ExceptionResponse(
        exception_type=ExceptionType.REQUEST_VALIDATION,
        message=f"Request validation error. Details: {exc.errors()}",
    )

    return JSONResponse(
        status_code=400,
        content=exception_response.model_dump(),
        headers=get_cors_headers(request),
    )


async def generic_exceptions_handler(request: Request, exc: Exception):
    exception_response = ExceptionResponse(
        exception_type=ExceptionType.INTERNAL_ERROR,
        message=f"Internal server error. Details: {str(exc)}",
    )

    return JSONResponse(
        status_code=500,
        content=exception_response.model_dump(),
        headers=get_cors_headers(request),
    )
