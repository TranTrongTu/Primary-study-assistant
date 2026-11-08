from pathlib import Path

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    # ----- CORE ----- #

    # === Developer mode === #
    DEV_MODE: bool

    # === Database === #
    POSTGRES_URL: PostgresDsn
    POSTGRES_URL_TEST: PostgresDsn

    # === Auth === #
    PRIVATE_KEY: str

    # === API === #

    # Gemini
    API_KEYS_GEMINI: str

    # Cloudflare
    CLOUDFLARE_ACCOUNT_ID: str
    CLOUDFLARE_API_TOKEN: str

    # ----- TECHNICAL CONFIGURATIONS ----- #

    # === Auth === #
    JWT_ALGORITHM: str
    TOKEN_EXPIRY_HOURS: int

    # === Models === #
    MODEL_IN_USE_EMBED: str
    MODEL_IN_USE_CAPTION_IMAGE: str
    MODEL_IN_USE_GENERATE_CHAT: str
    MODEL_IN_USE_REWRITE_PROMPT: str
    MODEL_IN_USE_GENERATE_MATERIAL: str
    MODEL_IN_USE_GRADE_ANSWERS: str
    MODEL_IN_USE_GENERATE_DOCUMENT_ANALYSIS: str
    MODEL_IN_USE_GENERATE_STUDY_ASSESSMENT: str

    # ** Google ** #
    EMBED_MODEL_GOOGLE: str
    VISION_MODEL_GOOGLE: str
    ANSWER_MODEL_GOOGLE: str

    # ** Ollama ** #
    OLLAMA_HOST: str
    EMBED_MODEL_OLLAMA: str
    VISION_MODEL_OLLAMA: str
    ANSWER_MODEL_OLLAMA: str

    # ** Cloudflare ** #
    EMBED_MODEL_CLOUDFLARE: str
    VISION_MODEL_CLOUDFLARE: str

    # === RAG === #
    DEFAULT_CHUNK_SIZE: int
    DEFAULT_CHUNK_OVERLAP: int
    DEFAULT_EMBED_DIMENSIONALITY_GOOGLE_OLLAMA: int
    DEFAULT_EMBED_DIMENSIONALITY_CLOUDFLARE: int
    DEFAULT_N_CHUNKS_RETRIEVED: int
    DEFAULT_N_PAST_CONVERSATIONS: int
    DEFAULT_N_CHUNKS_WINDOW: int
    DEFAULT_N_API_CALL_RETRIES: int

    # === Application Related === #

    # ** Study Activity ** #
    DEFAULT_EXERCISE_TOTAL_SCORE: float
    DEFAULT_N_GENERATION_RETRIES: int

    # ** Study Assessment ** #
    DEFAULT_N_DOCUMENTS_FETCHED: int
    DEFAULT_N_LLM_RESPONSES_FETCHED: int
    DEFAULT_N_STUDY_ACTIVITIES_FETCHED: int

    # ----- CONFIG ----- #

    @property
    def gemini_keys_list(self) -> list[str]:
        return [key.strip() for key in self.API_KEYS_GEMINI.split(",") if key.strip()]

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
    )


settings = Settings()  # type: ignore
