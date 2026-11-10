# Dolphin

An AI study assistant for Vietnamese primary school students (grades 1–5). Students upload their own study material (PDFs, images), then chat with it, generate flashcards, take graded exercises and get daily progress assessments. Answers are grounded in the uploaded material using Retrieval-Augmented Generation (RAG).

**Live demo:** https://dolphin-edu-ebon.vercel.app

The frontend runs on Vercel, the API on Render (free tier) and the database on Neon (PostgreSQL, Singapore). The free API instance sleeps when idle, so the first request after a pause can take up to about 30 seconds.

> **Origin.** Dolphin started as a group coursework project (*Computational Thinking*, Group N9, Class 24TNT1) under the name EduSpark.AI. I am continuing it as a personal project: hardening security, adding tests and CI, and operating it as a real deployment. See [Credits](#credits) and [What changed since the group project](#what-changed-since-the-group-project).

## Features

- **Chat over your documents.** Upload PDFs or images; text is extracted (images are captioned by a vision model), chunked and embedded. Questions are answered from the retrieved chunks.
- **Hybrid retrieval.** Vector similarity (pgvector) and keyword similarity (pg_trgm) results are fused with Reciprocal Rank Fusion (RRF).
- **Flashcards and exercises.** LLM-generated flashcards and exercises, with LLM grading and cross-validation of the grading.
- **Progress tracking.** Daily check-ins, login streaks and LLM-written study assessments.

## Architecture

```
React + Vite (frontend)  ──HTTP──▶  FastAPI (backend)  ──▶  PostgreSQL + pgvector + pg_trgm
                                        │
                                        ├──▶ Google Gemini        (generation; multiple API keys rotated)
                                        └──▶ Cloudflare Workers AI (embeddings: bge-m3, 1024-d; image captioning)
```

| Layer | Stack |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI, SQLModel / SQLAlchemy (async), asyncpg |
| Database | PostgreSQL 16 with `pgvector` and `pg_trgm` |
| AI | Gemini (LLM), Cloudflare Workers AI (embeddings, vision) |
| Local infra | Docker Compose |

Backend code lives in `backend/src` (`routes/`, `services/`, `RAG/`, `models_schema/`, `core/`). Tests are in `backend/tests`.

## Getting started (local)

**Prerequisites:** Git, Node.js (LTS), Docker Desktop, a [Google AI Studio](https://aistudio.google.com/) API key, and a [Cloudflare](https://dash.cloudflare.com/) account (Account ID and an API token with *Workers AI* read/edit permission).

1. **Clone**
   ```sh
   git clone https://github.com/TranTrongTu/Primary-study-assistant.git
   cd Primary-study-assistant
   ```
2. **Database credentials (repo root).** Copy `.env.example` to `.env` and set your own Postgres user, password and database name. Docker Compose reads these.
3. **Backend config.** Copy `backend/.env.example` to `backend/.env`, use the same database credentials in `POSTGRES_URL`, and fill in:
   ```sh
   API_KEYS_GEMINI=...            # comma-separated for multiple keys
   CLOUDFLARE_ACCOUNT_ID=...
   CLOUDFLARE_API_TOKEN=...
   PRIVATE_KEY=...                # python -c "import secrets; print(secrets.token_hex(32))"
   ```
4. **Frontend config.** In `frontend/`, copy `.env.example` to `.env` (`VITE_API_URL=http://localhost:8000/api`). The value must end with `/api`, and it is baked into the bundle at build time, so redeploy after changing it.
5. **Start the backend and database**
   ```sh
   docker compose up --build
   ```
   API docs: http://localhost:8000/docs
6. **Generate the API client and start the frontend** (backend must be running)
   ```sh
   cd frontend
   npm install
   npm run generate:api
   npm run dev
   ```

All secrets and URLs come from environment variables; nothing is hard-coded. `DEV_MODE=true` is for local use only: it exposes `/api/dev/wipe-db` and verbose errors. Production must run with `DEV_MODE=false`.

## Testing

Tests run against a separate `<database>_test` database created automatically by Docker Compose (the test suite refuses to start if it points at the main database, because it drops all tables).

```sh
cd <repo root>
python -m pytest backend/tests
```

## What changed since the group project

- Moved credentials, database URLs, CORS origins and API URLs into environment configuration.
- Fixed `overwritten_day` being usable in production, which let a user obtain near-permanent login tokens and inflate login streaks.
- Stopped returning raw exception text (SQL, constraint names) in HTTP 500 responses.
- Fixed a missing `user_id` join that let one user's assessment block another's.
- Made grading retry on malformed LLM JSON instead of failing with a 500.
- Separated the test database from the development database.
- Added regression tests for each fix above.

## Credits

Originally built as a coursework project by Group N9, Class 24TNT1:

- Đỗ Lê Phong Phú
- Mai Hoàng Hiệp
- Quách Lê Nhật Huy
- Trần Trọng Tú
- Nguyễn Thanh Tuấn

## License

Distributed under the Apache License 2.0. See [LICENSE](LICENSE).
