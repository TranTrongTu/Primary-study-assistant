import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import (
    CORSMiddleware,
)
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.src.core.config import settings
from backend.src.core.database import create_database_and_tables, dispose
from backend.src.core.dependencies import SessionDep
from backend.src.core.origins import origins
from backend.src.exceptions.core import ExceptionCustom, Responses
from backend.src.exceptions.handlers import (
    custom_exceptions_handler,
    generic_exceptions_handler,
    starlette_exceptions_handlers,
    validation_exceptions_handler,
)
from backend.src.routes import (
    auth,
    dev_tools,
    document,
    interaction,
    llm_response,
    note,
    study_activity,
    study_progress,
    user,
)

logger = logging.getLogger(__name__)

# ----- Setting up app ----- #


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_database_and_tables()

    yield

    await dispose()


app = FastAPI(
    lifespan=lifespan,
    responses={
        400: Responses.RESPONSE_400_BAD_REQUEST,
        500: Responses.RESPONSE_500_INTERNAL_SERVER_ERROR,
    },
)

# ----- CORS ----- #

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)

# ----- Exception handling ----- #

app.add_exception_handler(RequestValidationError, validation_exceptions_handler)  # type: ignore
app.add_exception_handler(StarletteHTTPException, starlette_exceptions_handlers)  # type: ignore
app.add_exception_handler(ExceptionCustom, custom_exceptions_handler)  # type: ignore
app.add_exception_handler(Exception, generic_exceptions_handler)

# ----- Health check ----- #


@app.get("/health", include_in_schema=False)
async def health(session: SessionDep):
    """
    Liveness + database check for the container HEALTHCHECK and the hosting
    platform. Returns 503 (not 500) when the database cannot be reached.
    """
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        logger.warning("Health check failed: database unreachable", exc_info=True)
        return JSONResponse(status_code=503, content={"status": "unavailable"})

    return {"status": "ok"}


# ----- Mounting routers ----- #

app.include_router(
    auth.router,
    prefix="/api",
    tags=["auth"],
)

app.include_router(
    document.router,
    prefix="/api/document",
    tags=["document"],
)

app.include_router(
    interaction.router,
    prefix="/api/interaction",
    tags=["interaction"],
)

app.include_router(
    llm_response.router,
    prefix="/api/llm-response",
    tags=["llm-response"],
)

app.include_router(
    note.router,
    prefix="/api/note",
    tags=["note"],
)

app.include_router(
    user.router,
    prefix="/api/user",
    tags=["user"],
)

app.include_router(
    study_activity.router,
    prefix="/api/study-activity",
    tags=["study-activity"],
)

app.include_router(
    study_progress.router,
    prefix="/api/study-progress",
    tags=["study-progress"],
)

if settings.DEV_MODE:
    app.include_router(
        dev_tools.router,
        prefix="/api/dev",
        tags=["dev"],
    )
