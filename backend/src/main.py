from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import (
    CORSMiddleware,
)
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.src.core.config import settings
from backend.src.core.database import create_database_and_tables, dispose
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

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://edusparkai-theta.vercel.app",
    "https://edusparkai-nhuy165s-projects.vercel.app",
]

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
