from pathlib import Path

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


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
    MODEL_IN_USE_EMBED: str = "CLOUDFLARE"
    MODEL_IN_USE_CAPTION_IMAGE: str = "CLOUDFLARE"
    MODEL_IN_USE_GENERATE_CHAT: str = "GOOGLE"
    MODEL_IN_USE_REWRITE_PROMPT: str = "GOOGLE"
    MODEL_IN_USE_GENERATE_MATERIAL: str = "GOOGLE"
    MODEL_IN_USE_GRADE_ANSWERS: str = "GOOGLE"
    MODEL_IN_USE_GENERATE_DOCUMENT_ANALYSIS: str = "GOOGLE"
    MODEL_IN_USE_GENERATE_STUDY_ASSESSMENT: str = "GOOGLE"

    # ** Google ** #
    EMBED_MODEL_GOOGLE: str = "gemini-embedding-2"
    VISION_MODEL_GOOGLE: str = "gemini-3.1-flash-lite"
    ANSWER_MODEL_GOOGLE: str = "gemini-3.1-flash-lite"

    # ** Ollama ** #
    OLLAMA_HOST: str = "http://localhost:11434"
    EMBED_MODEL_OLLAMA: str = "nomic-embed-text"
    VISION_MODEL_OLLAMA: str = "llama3.2-vision"
    ANSWER_MODEL_OLLAMA: str = "llama3.1"

    # ** Cloudflare ** #
    EMBED_MODEL_CLOUDFLARE: str = "@cf/baai/bge-m3"
    VISION_MODEL_CLOUDFLARE: str = "@cf/meta/llama-3.2-11b-vision-instruct"

    # === RAG === #
    DEFAULT_CHUNK_SIZE: int = 500
    DEFAULT_CHUNK_OVERLAP: int = 50
    DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA: int = 768
    DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE: int = 1024
    DEFAULT_N_CHUNKS_RETRIEVED: int = 5
    DEFAULT_N_PAST_CONVERSATIONS: int = 3
    DEFAULT_N_CHUNKS_WINDOW: int = 1
    DEFAULT_N_API_CALL_RETRIES: int = 3

    # === Application Related === #

    # ** Study Activity ** #
    DEFAULT_EXERCISE_TOTAL_SCORE: float = 100
    DEFAULT_N_GENERATION_RETRIES: int = 3

    # ** Study Assessment ** #
    DEFAULT_N_DOCUMENTS_FETCHED: int = 50
    DEFAULT_N_LLM_RESPONSES_FETCHED: int = 50
    DEFAULT_N_STUDY_ACTIVITIES_FETCHED: int = 30

    # ----- CONFIG ----- #

    @property
    def gemini_keys_list(self) -> list[str]:
        return [key.strip() for key in self.API_KEYS_GEMINI.split(",") if key.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
    )


settings = Settings()  # type: ignore
