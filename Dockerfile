# syntax=docker/dockerfile:1

# Pinned patch release so a rebuild of the same commit gives the same interpreter.
# Bump deliberately (and regenerate the lock files if the minor version changes).
ARG PYTHON_VERSION=3.14.10

# ---- base: everything the dev and runtime images share ----
FROM python:${PYTHON_VERSION}-slim AS base

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Unprivileged user that owns the working directory
RUN useradd --system --create-home --uid 10001 app \
    && mkdir /code \
    && chown app:app /code

WORKDIR /code

# ---- builder: install the pinned runtime dependencies into a virtualenv ----
FROM python:${PYTHON_VERSION}-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.lock /tmp/requirements.lock
RUN pip install -r /tmp/requirements.lock

# ---- dev-venv: runtime deps + pinned dev tools (debugpy, pytest, locust) ----
FROM builder AS dev-venv
COPY requirements-dev.lock /tmp/requirements-dev.lock
RUN pip install -r /tmp/requirements-dev.lock

# ---- runtime-venv: the runtime image does not need pip ----
FROM builder AS runtime-venv
RUN python -m pip uninstall -y pip

# ---- dev target (docker compose only); the code is bind-mounted by compose ----
# The LAST stage in this file is the default build target, so `runtime` below is
# what Render and CI build. Compose selects this one with `target: dev`.
FROM base AS dev
COPY --from=dev-venv /opt/venv /opt/venv
USER app
EXPOSE 8000 5678

# ---- runtime (default target): virtualenv + application code only ----
FROM base AS runtime
COPY --from=runtime-venv /opt/venv /opt/venv
COPY --chown=app:app ./backend /code/backend

USER app
EXPOSE 8000

# /health runs a query, so "healthy" means the app can reach its database
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

CMD ["fastapi", "run", "backend/src/main.py", "--port", "8000", "--host", "0.0.0.0"]
