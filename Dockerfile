# syntax=docker/dockerfile:1

# ---- build stage: resolve and install the pinned runtime dependencies ----
FROM python:3.14-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.lock /tmp/requirements.lock
RUN pip install -r /tmp/requirements.lock

# ---- dev target (docker compose only): runtime deps + debugpy, pytest, locust ----
# The last stage in this file is the default build target, so `runtime` below is
# what Render and CI build. Compose selects this one with `target: dev`.
FROM builder AS dev-venv
COPY requirements-dev.txt /tmp/requirements-dev.txt
RUN pip install -r /tmp/requirements-dev.txt

FROM python:3.14-slim AS dev
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
RUN useradd --system --create-home --uid 10001 app
COPY --from=dev-venv /opt/venv /opt/venv
WORKDIR /code
USER app
EXPOSE 8000 5678

# ---- runtime stage: only the virtualenv and the application code ----
FROM python:3.14-slim AS runtime

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Run as an unprivileged user
RUN useradd --system --create-home --uid 10001 app

COPY --from=builder /opt/venv /opt/venv

WORKDIR /code
COPY --chown=app:app ./backend /code/backend

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/openapi.json', timeout=4).status == 200 else 1)"

CMD ["fastapi", "run", "backend/src/main.py", "--port", "8000", "--host", "0.0.0.0"]
