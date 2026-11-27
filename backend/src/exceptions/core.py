from enum import Enum

from pydantic import BaseModel

# ----- SCHEMAS ----- #


class ExceptionType(str, Enum):
    # 400
    BAD_REQUEST = "BAD_REQUEST"
    REQUEST_VALIDATION = "REQUEST_VALIDATION"

    # 401
    AUTHENTICATION = "AUTHENTICATION"

    # 404
    NOT_FOUND = "NOT_FOUND"

    # 405
    METHOD = "METHOD"

    # 409
    TAKEN_INFO = "TAKEN_INFO"
    SUBMITTED_EXERCISE = "SUBMITTED_EXERCISE"

    # 429
    RATE_LIMITED = "RATE_LIMITED"

    # 500
    INTERNAL_ERROR = "INTERNAL_ERROR"

    # 502
    LLM_ERROR = "LLM_ERROR"

    # 503
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE"
    AI_QUOTA = "AI_QUOTA"


class ExceptionCustom(Exception):
    def __init__(
        self,
        status_code: int,
        exception_type: ExceptionType,
        message: str,
        headers: dict | None = None,
    ):
        self.status_code = status_code
        self.exception_type = exception_type
        self.message = message
        self.headers = headers

        super().__init__(self.message)


class ExceptionResponse(BaseModel):
    exception_type: ExceptionType
    message: str


# ----- DOCUMENTATION RESPONSES ----- #


class Responses:
    RESPONSE_400_BAD_REQUEST = {
        "model": ExceptionResponse,
        "description": "Request error.",
    }

    RESPONSE_401_UNAUTHORIZED = {
        "model": ExceptionResponse,
        "description": "Authentication error.",
    }
    RESPONSE_403_FORBIDDEN = {
        "model": ExceptionResponse,
        "description": "Action is forbidden to the current account.",
    }
    RESPONSE_404_NOT_FOUND = {
        "model": ExceptionResponse,
        "description": "Resource not found.",
    }

    RESPONSE_405_METHOD = {
        "model": ExceptionResponse,
        "description": "Method not allowed.",
    }

    RESPONSE_409_CONFLICT = {
        "model": ExceptionResponse,
        "description": "Conflict with information in database.",
    }

    RESPONSE_422_UNPROCESSABLE_CONTENT = {
        "model": ExceptionResponse,
        "description": "Request validation error.",
    }

    RESPONSE_500_INTERNAL_SERVER_ERROR = {
        "model": ExceptionResponse,
        "description": "Internal server error.",
    }

    RESPONSE_502_BAD_GATEWAY = {
        "model": ExceptionResponse,
        "description": "External LLM failed to fulfill a task.",
    }

    RESPONSE_429_TOO_MANY_REQUESTS = {
        "model": ExceptionResponse,
        "description": "Too many requests. The Retry-After header says when to try again.",
    }

    RESPONSE_503_SERVICE_UNAVAILABLE = {
        "model": ExceptionResponse,
        "description": "External service unavailable.",
    }


# ----- SPECIFIC ERRORS ----- #

# === 400 === #


class ExceptionRequest_400(ExceptionCustom):
    def __init__(self, custom_message: str | None = None):
        super().__init__(
            status_code=400,
            exception_type=ExceptionType.BAD_REQUEST,
            message=custom_message if custom_message is not None else "Request error.",
        )


class ExceptionRequestValidation_400(ExceptionCustom):
    def __init__(self, custom_message: str | None = None):
        super().__init__(
            status_code=400,
            exception_type=ExceptionType.REQUEST_VALIDATION,
            message=custom_message
            if custom_message is not None
            else "Request validation error.",
        )


# === 401 === #


class ExceptionAuthentication_401(ExceptionCustom):
    def __init__(self):
        super().__init__(
            status_code=401,
            exception_type=ExceptionType.AUTHENTICATION,
            message="Invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# === 404 === #


class ExceptionNotFound_404(ExceptionCustom):
    def __init__(self, obj: str, info: dict):
        super().__init__(
            status_code=404,
            exception_type=ExceptionType.NOT_FOUND,
            message=f"Could not find {obj} with the provided information: {info}",
        )


# === 409 === #


class ExceptionSubmittedExercise_409(ExceptionCustom):
    def __init__(self):
        super().__init__(
            status_code=409,
            exception_type=ExceptionType.SUBMITTED_EXERCISE,
            message="Cannot submit or answer questions in an already submitted exercise.",
        )


class ExceptionTakenInfo_409(ExceptionCustom):
    def __init__(self, obj: str, info: str):
        super().__init__(
            status_code=409,
            exception_type=ExceptionType.TAKEN_INFO,
            message=f"Another {obj} with this {info} already exists.",
        )


# === 500 === #


class ExceptionInternalError_500(ExceptionCustom):
    def __init__(self, custom_message: str):
        super().__init__(
            status_code=500,
            exception_type=ExceptionType.INTERNAL_ERROR,
            message=custom_message,
        )


# === 502 === #


class ExceptionLLMError_502(ExceptionCustom):
    def __init__(self, custom_message: str):
        super().__init__(
            status_code=502,
            exception_type=ExceptionType.LLM_ERROR,
            message=custom_message,
        )


# === 429 === #


class ExceptionTooManyRequests_429(ExceptionCustom):
    def __init__(self, custom_message: str, retry_after: float):
        super().__init__(
            status_code=429,
            exception_type=ExceptionType.RATE_LIMITED,
            message=custom_message,
            headers={"Retry-After": str(int(retry_after + 0.999))},
        )


# === 503 === #


class ExceptionExternalService_503(ExceptionCustom):
    def __init__(self, custom_message: str):
        super().__init__(
            status_code=503,
            exception_type=ExceptionType.EXTERNAL_SERVICE,
            message=custom_message,
        )


class ExceptionAIQuota_503(ExceptionExternalService_503):
    """The AI provider's daily quota is spent: retrying in a moment will not help."""

    def __init__(self, custom_message: str):
        super().__init__(custom_message)
        self.exception_type = ExceptionType.AI_QUOTA
