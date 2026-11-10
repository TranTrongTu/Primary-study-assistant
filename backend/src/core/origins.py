from backend.src.core.config import settings

# Single source of truth for allowed frontend origins (set CORS_ORIGINS in backend/.env)
origins = settings.cors_origins_list
