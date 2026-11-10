"""Settings must work with only the secrets/infrastructure variables set."""

import pytest
from pydantic import ValidationError

from backend.src.core.config import Settings

REQUIRED = {
    "POSTGRES_URL": "postgresql+asyncpg://user:pass@localhost:5432/app",
    "PRIVATE_KEY": "not-a-real-key",
    "API_KEYS_GEMINI": "key-one, key-two",
    "CLOUDFLARE_ACCOUNT_ID": "account",
    "CLOUDFLARE_API_TOKEN": "token",
}

# Variables that have defaults; make sure the machine running the tests cannot override them.
HAS_DEFAULTS = ["DEV_MODE", "POSTGRES_URL_TEST", "DEFAULT_CHUNK_SIZE", "MODEL_IN_USE_EMBED"]


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch):
    for name in [*REQUIRED, *HAS_DEFAULTS]:
        monkeypatch.delenv(name, raising=False)


def test_loads_with_only_required_variables():
    settings = Settings(_env_file=None, **REQUIRED)  # type: ignore[arg-type]

    assert settings.DEFAULT_CHUNK_SIZE == 500
    assert settings.MODEL_IN_USE_EMBED == "CLOUDFLARE"
    assert settings.POSTGRES_URL_TEST is None
    assert settings.gemini_keys_list == ["key-one", "key-two"]


def test_dev_mode_is_off_by_default():
    # Forgetting DEV_MODE on a server must never expose the dev-only routes.
    settings = Settings(_env_file=None, **REQUIRED)  # type: ignore[arg-type]

    assert settings.DEV_MODE is False


@pytest.mark.parametrize("missing", sorted(REQUIRED))
def test_each_secret_is_still_required(missing):
    values = {k: v for k, v in REQUIRED.items() if k != missing}

    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values)  # type: ignore[arg-type]
