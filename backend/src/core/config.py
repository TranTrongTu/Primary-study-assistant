from pathlib import Path
from typing import Literal

from pydantic import PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

# Keys of GlobalAPI.models. A typo here used to surface only on the first AI request.
ModelProvider = Literal["GOOGLE", "OLLAMA", "CLOUDFLARE", "OPENAI_COMPATIBLE"]


class Settings(BaseSettings):
    # ----- CORE ----- #

    # Required: POSTGRES_URL, PRIVATE_KEY, API_KEYS_GEMINI, CLOUDFLARE_ACCOUNT_ID and
    # CLOUDFLARE_API_TOKEN. Everything else has a working default.

    # === Developer mode === #
    # Fail-safe default: dev-only routes (e.g. wipe-db) stay off unless enabled explicitly.
    DEV_MODE: bool = False

    # === Database === #
    POSTGRES_URL: PostgresDsn
    POSTGRES_URL_TEST: PostgresDsn | None = None
    # Connections kept per backend instance = DB_POOL_SIZE, plus DB_MAX_OVERFLOW during bursts.
    # Keep the total well below the database limit (Neon free tier is small).
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 5

    # === Auth === #
    PRIVATE_KEY: str

    # === CORS === #
    # Comma-separated frontend origins allowed to call the API
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174"
    )

    # === API === #

    # Gemini
    API_KEYS_GEMINI: str

    # Cloudflare
    CLOUDFLARE_ACCOUNT_ID: str
    CLOUDFLARE_API_TOKEN: str

    # ----- TECHNICAL CONFIGURATIONS ----- #

    # === Auth === #
    JWT_ALGORITHM: str = "HS256"
    TOKEN_EXPIRY_HOURS: int = 72

    # === Models === #
    MODEL_IN_USE_EMBED: ModelProvider = "CLOUDFLARE"
    MODEL_IN_USE_CAPTION_IMAGE: ModelProvider = "CLOUDFLARE"
    MODEL_IN_USE_GENERATE_CHAT: ModelProvider = "GOOGLE"
    MODEL_IN_USE_REWRITE_PROMPT: ModelProvider = "GOOGLE"
    MODEL_IN_USE_GENERATE_MATERIAL: ModelProvider = "GOOGLE"
    MODEL_IN_USE_GRADE_ANSWERS: ModelProvider = "GOOGLE"
    MODEL_IN_USE_GENERATE_DOCUMENT_ANALYSIS: ModelProvider = "GOOGLE"
    MODEL_IN_USE_GENERATE_STUDY_ASSESSMENT: ModelProvider = "GOOGLE"

    # ** Google ** #
    EMBED_MODEL_GOOGLE: str = "gemini-embedding-2"
    VISION_MODEL_GOOGLE: str = "gemini-3.1-flash-lite"
    ANSWER_MODEL_GOOGLE: str = "gemini-3.1-flash-lite"
    # Used for text generation when ANSWER_MODEL_GOOGLE is overloaded or out of quota.
    # Empty = no fallback.
    ANSWER_MODEL_GOOGLE_FALLBACK: str = ""

    # ** Ollama ** #
    OLLAMA_HOST: str = "http://localhost:11434"
    EMBED_MODEL_OLLAMA: str = "nomic-embed-text"
    VISION_MODEL_OLLAMA: str = "llama3.2-vision"
    ANSWER_MODEL_OLLAMA: str = "llama3.1"

    # ** Cloudflare ** #
    EMBED_MODEL_CLOUDFLARE: str = "@cf/baai/bge-m3"
    VISION_MODEL_CLOUDFLARE: str = "@cf/meta/llama-3.2-11b-vision-instruct"

    # ** Any provider with an OpenAI-compatible API ** #
    # Select it by setting a MODEL_IN_USE_* above to OPENAI_COMPATIBLE.
    OPENAI_COMPATIBLE_BASE_URL: str = ""
    OPENAI_COMPATIBLE_API_KEY: str = ""
    OPENAI_COMPATIBLE_MODEL: str = ""
    OPENAI_COMPATIBLE_EMBED_MODEL: str = ""
    OPENAI_COMPATIBLE_VISION_MODEL: str = ""
    # See StructuredOutput in core/openai_compatible.py. OpenAI and Anthropic need
    # json_schema_strict.
    OPENAI_COMPATIBLE_STRUCTURED_OUTPUT: Literal[
        "json_schema_strict", "json_schema", "json_object"
    ] = "json_schema"
    OPENAI_COMPATIBLE_TIMEOUT_SECONDS: float = 60

    # === RAG === #
    DEFAULT_CHUNK_SIZE: int = 500
    DEFAULT_CHUNK_OVERLAP: int = 50
    DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA: int = 768
    DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE: int = 1024
    DEFAULT_N_CHUNKS_RETRIEVED: int = 5
    DEFAULT_N_PAST_CONVERSATIONS: int = 3
    DEFAULT_N_CHUNKS_WINDOW: int = 1
    # Attempts per model for a failure worth retrying
    DEFAULT_N_API_CALL_RETRIES: int = 3
    # Most seconds one AI call may spend waiting between attempts. A student is waiting
    # for the answer, so a long wait the provider asks for is turned into an error.
    LLM_MAX_RETRY_WAIT_SECONDS: float = 20
    # Upper bound on LLM calls a single request may run at the same time
    # (protects provider rate limits when many days need an assessment at once).
    MAX_CONCURRENT_LLM_CALLS: int = 3

    # === Abuse limits === #
    # Counted in memory by core/rate_limit.py; see there for what each one protects.
    RATE_LIMIT_LOGIN_FAILURES: int = 5  # per email, per 15 minutes
    RATE_LIMIT_REGISTRATIONS_PER_HOUR: int = 20  # all new accounts together
    RATE_LIMIT_AI_REQUESTS_PER_10_MINUTES: int = 20  # per user
    RATE_LIMIT_AI_REQUESTS_PER_DAY: int = 150  # per user
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024
    MAX_PDF_PAGES: int = 30
    MAX_PROMPT_CHARS: int = 2000

    # === Application Related === #

    # ** Study Activity ** #
    DEFAULT_EXERCISE_TOTAL_SCORE: float = 100
    DEFAULT_N_GENERATION_RETRIES: int = 3

    # ** Study Assessment ** #
    DEFAULT_N_DOCUMENTS_FETCHED: int = 50
    DEFAULT_N_LLM_RESPONSES_FETCHED: int = 50
    DEFAULT_N_STUDY_ACTIVITIES_FETCHED: int = 30

    # ----- CONFIG ----- #

    @field_validator(
        "MODEL_IN_USE_EMBED",
        "MODEL_IN_USE_CAPTION_IMAGE",
        "MODEL_IN_USE_GENERATE_CHAT",
        "MODEL_IN_USE_REWRITE_PROMPT",
        "MODEL_IN_USE_GENERATE_MATERIAL",
        "MODEL_IN_USE_GRADE_ANSWERS",
        "MODEL_IN_USE_GENERATE_DOCUMENT_ANALYSIS",
        "MODEL_IN_USE_GENERATE_STUDY_ASSESSMENT",
        mode="before",
    )
    @classmethod
    def normalize_provider(cls, value):
        # Tolerate stray spaces and lower case from hosting dashboards; reject unknown names.
        return value.strip().upper() if isinstance(value, str) else value

    @model_validator(mode="after")
    def check_openai_compatible(self):
        # Fail at startup rather than on a student's first request
        needed: set[str] = set()
        for name in type(self).model_fields:
            if not name.startswith("MODEL_IN_USE_"):
                continue
            if getattr(self, name) != "OPENAI_COMPATIBLE":
                continue
            needed.add("OPENAI_COMPATIBLE_BASE_URL")
            if name == "MODEL_IN_USE_EMBED":
                needed.add("OPENAI_COMPATIBLE_EMBED_MODEL")
            elif name == "MODEL_IN_USE_CAPTION_IMAGE":
                needed.add("OPENAI_COMPATIBLE_VISION_MODEL")
            else:
                needed.add("OPENAI_COMPATIBLE_MODEL")

        missing = sorted(name for name in needed if not getattr(self, name))
        if missing:
            raise ValueError(f"OPENAI_COMPATIBLE is in use but {missing} is not set")
        return self

    def answer_model(self, provider: str) -> str:
        """The model a provider answers with, as named in logs and results."""
        return {
            "GOOGLE": self.ANSWER_MODEL_GOOGLE,
            "OLLAMA": self.ANSWER_MODEL_OLLAMA,
            "CLOUDFLARE": "",
            "OPENAI_COMPATIBLE": (
                f"{self.OPENAI_COMPATIBLE_MODEL}@{self.OPENAI_COMPATIBLE_BASE_URL}"
            ),
        }[provider]

    @property
    def embed_model(self) -> str:
        return {
            "GOOGLE": self.EMBED_MODEL_GOOGLE,
            "OLLAMA": self.EMBED_MODEL_OLLAMA,
            "CLOUDFLARE": self.EMBED_MODEL_CLOUDFLARE,
            "OPENAI_COMPATIBLE": self.OPENAI_COMPATIBLE_EMBED_MODEL,
        }[self.MODEL_IN_USE_EMBED]

    @property
    def gemini_keys_list(self) -> list[str]:
        return [key.strip() for key in self.API_KEYS_GEMINI.split(",") if key.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        str_strip_whitespace=True,
    )


settings = Settings()  # type: ignore
