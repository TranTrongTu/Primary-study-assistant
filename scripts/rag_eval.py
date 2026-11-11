"""
Measures how well retrieval finds the right chunk, for each search method.

    python -m scripts.rag_eval            # needs the database and the embedding API key

The data set (evals/retrieval) is ten short Vietnamese primary-school lessons and a list
of questions. Each question names an `evidence` phrase copied from one lesson: a chunk is
relevant when it contains that phrase, so the labels do not depend on chunk ids and stay
valid if the chunk size changes.

The lessons are chunked and embedded the way an uploaded text file is, stored in a
scratch database built from the migrations, and searched with the functions the app
itself calls (vector_search, keyword_search, RRF). Nothing is re-implemented here, so the
numbers describe the deployed retrieval and not a copy of it.

Embeddings are cached in evals/retrieval/.cache (not committed), so only the first run
calls the embedding API.
"""

import argparse
import asyncio
import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Awaitable, Callable, Sequence

EVAL_DIR = Path(__file__).resolve().parent.parent / "evals" / "retrieval"
CORPUS_DIR = EVAL_DIR / "corpus"
QUESTIONS_FILE = EVAL_DIR / "questions.json"
CACHE_FILE = EVAL_DIR / ".cache" / "embeddings.json"
RESULTS_JSON = EVAL_DIR / "results.json"
RESULTS_MD = EVAL_DIR / "RESULTS.md"

# The app passes five chunks to the LLM (DEFAULT_N_CHUNKS_RETRIEVED), so a relevant chunk
# ranked sixth or lower is as good as not found.
CUTOFF = 5
HIT_AT = (1, 3, 5)

EmbedFunction = Callable[[list[str]], Awaitable[list[list[float]]]]


# ----- DATA SET ----- #


@dataclass(frozen=True)
class Question:
    category: str
    document: str
    question: str
    evidence: str


def load_corpus() -> dict[str, str]:
    """File name -> text, in a stable order."""
    return {
        path.name: path.read_text(encoding="utf-8")
        for path in sorted(CORPUS_DIR.glob("*.txt"))
    }


def load_questions() -> list[Question]:
    return [Question(**item) for item in json.loads(QUESTIONS_FILE.read_text("utf-8"))]


# ----- METRICS ----- #


def _squash(text: str) -> str:
    return " ".join(text.split())


def is_relevant(chunk_text: str, evidence: str) -> bool:
    """A chunk is relevant when it contains the evidence phrase (whitespace-insensitive)."""
    return _squash(evidence) in _squash(chunk_text)


def first_relevant_rank(ranked_chunks: Sequence[str], evidence: str) -> int | None:
    """1-based rank of the first relevant chunk within the cutoff, or None."""
    for rank, chunk_text in enumerate(ranked_chunks[:CUTOFF], start=1):
        if is_relevant(chunk_text, evidence):
            return rank
    return None


def summarise(ranks: Sequence[int | None]) -> dict[str, float]:
    """hit@k = share of questions answered within the top k; MRR = mean of 1/rank."""
    total = len(ranks)
    if total == 0:
        return {**{f"hit@{k}": 0.0 for k in HIT_AT}, "mrr": 0.0, "questions": 0}

    summary: dict[str, float] = {
        f"hit@{k}": sum(1 for rank in ranks if rank is not None and rank <= k) / total
        for k in HIT_AT
    }
    summary["mrr"] = sum(1 / rank for rank in ranks if rank is not None) / total
    summary["questions"] = total
    return summary


def summarise_by_category(
    questions: Sequence[Question], ranks: Sequence[int | None]
) -> dict[str, dict[str, float]]:
    report = {"all": summarise(ranks)}
    for category in dict.fromkeys(question.category for question in questions):
        report[category] = summarise(
            [
                rank
                for question, rank in zip(questions, ranks)
                if question.category == category
            ]
        )
    return report


# ----- EMBEDDINGS ----- #


async def embed_with_cache(
    texts: list[str], embed: EmbedFunction, model_name: str, use_cache: bool = True
) -> list[list[float]]:
    """Embeds `texts`, calling the API only for the ones not seen before."""

    def key(text: str) -> str:
        return hashlib.sha256(f"{model_name}\n{text}".encode()).hexdigest()

    cache: dict[str, list[float]] = {}
    if use_cache and CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text("utf-8"))

    missing = [text for text in dict.fromkeys(texts) if key(text) not in cache]
    if missing:
        for text, vector in zip(missing, await embed(missing)):
            cache[key(text)] = vector
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        CACHE_FILE.write_text(json.dumps(cache), encoding="utf-8")

    return [cache[key(text)] for text in texts]


# ----- RUN ----- #


async def run(use_cache: bool) -> dict:
    # Imported here so the metric helpers above can be tested without a database
    from alembic import command
    from sqlalchemy import text
    from sqlalchemy.engine import make_url
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from backend.src.core import database
    from backend.src.core.ai_api import GlobalAPI
    from backend.src.core.config import settings
    from backend.src.models_schema.document.document import Document
    from backend.src.models_schema.document.document_chunk import DocumentChunk
    from backend.src.models_schema.interaction.interaction import Interaction
    from backend.src.models_schema.miscellaneous.enums import DocumentType
    from backend.src.models_schema.user.user import User
    from backend.src.RAG.chunking.base import smart_splitter
    from backend.src.RAG.retrieval.keyword_search import keyword_search
    from backend.src.RAG.retrieval.RRF import RRF
    from backend.src.RAG.retrieval.vector_search import vector_search

    corpus = load_corpus()
    questions = load_questions()
    model_name = f"{settings.MODEL_IN_USE_EMBED}:{settings.EMBED_MODEL_CLOUDFLARE}"

    # Chunk exactly like TextExtractor does, including the "Source:" line it embeds
    chunks: list[tuple[str, int, str]] = [
        (name, index, chunk_text)
        for name, contents in corpus.items()
        for index, chunk_text in enumerate(smart_splitter.split_text(contents))
    ]
    for question in questions:
        if not any(is_relevant(chunk[2], question.evidence) for chunk in chunks):
            raise SystemExit(
                f"No chunk contains the evidence for: {question.question!r}. "
                "The phrase is probably cut by a chunk boundary: pick a shorter one."
            )

    chunk_vectors = await embed_with_cache(
        [
            f"Source: {DocumentType.TEXT.value} file {name}:\n{chunk_text}"
            for name, _, chunk_text in chunks
        ],
        GlobalAPI.mass_embed,
        model_name,
        use_cache,
    )
    question_vectors = await embed_with_cache(
        [question.question for question in questions],
        GlobalAPI.mass_embed,
        model_name,
        use_cache,
    )

    # A scratch database built from the migrations: same schema and indexes as production
    base_url = make_url(str(settings.POSTGRES_URL))
    scratch_name = f"rag_eval_{uuid.uuid4().hex[:8]}"
    admin = create_async_engine(base_url, isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        await conn.execute(text(f'CREATE DATABASE "{scratch_name}"'))

    scratch_url = base_url.set(database=scratch_name)
    settings.POSTGRES_URL = scratch_url.render_as_string(hide_password=False)  # type: ignore[assignment]
    engine = create_async_engine(scratch_url)

    ranks: dict[str, list[int | None]] = {"vector": [], "keyword": [], "hybrid": []}
    try:
        await asyncio.to_thread(command.upgrade, database._alembic_config(), "head")

        now = datetime.now(timezone.utc)
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            user = User(
                username="rag-eval",
                email="rag-eval@example.com",
                description="",
                hashed_password="unused",
                created_at=now,
            )
            interaction = Interaction(name="RAG evaluation", user=user, created_at=now)
            documents = {
                name: Document(
                    name=name,
                    interaction=interaction,
                    page_starts_at=0,
                    type=DocumentType.TEXT,
                    subject_type=None,
                    text=contents,
                    created_at=now,
                )
                for name, contents in corpus.items()
            }
            session.add_all(
                [
                    DocumentChunk(
                        content_original=chunk_text,
                        content_embedded=vector,
                        document_chunk_index=index,
                        document=documents[name],
                    )
                    for (name, index, chunk_text), vector in zip(chunks, chunk_vectors)
                ]
            )
            await session.commit()

            # document_id=None: search every document of the conversation, the default in chat
            for question, vector in zip(questions, question_vectors):
                by_vector = await vector_search(session, interaction, vector, None)
                by_keyword = await keyword_search(
                    session, interaction, question.question, None
                )
                rankings = {
                    "vector": by_vector,
                    "keyword": by_keyword,
                    "hybrid": RRF(by_vector, by_keyword),
                }
                for method, ranked in rankings.items():
                    ranks[method].append(
                        first_relevant_rank(
                            [chunk.content_original for chunk in ranked],
                            question.evidence,
                        )
                    )
    finally:
        await engine.dispose()
        async with admin.connect() as conn:
            await conn.execute(
                text(f'DROP DATABASE IF EXISTS "{scratch_name}" WITH (FORCE)')
            )
        await admin.dispose()

    return {
        "embedding_model": settings.EMBED_MODEL_CLOUDFLARE,
        "chunk_size": settings.DEFAULT_CHUNK_SIZE,
        "chunk_overlap": settings.DEFAULT_CHUNK_OVERLAP,
        "documents": len(corpus),
        "chunks": len(chunks),
        "cutoff": CUTOFF,
        "methods": {
            method: summarise_by_category(questions, method_ranks)
            for method, method_ranks in ranks.items()
        },
        "per_question": [
            {
                "category": question.category,
                "question": question.question,
                **{method: ranks[method][index] for method in ranks},
            }
            for index, question in enumerate(questions)
        ],
    }


# ----- REPORT ----- #


def render_markdown(results: dict) -> str:
    methods = results["methods"]
    categories = list(next(iter(methods.values())))
    lines = [
        "# Retrieval evaluation results",
        "",
        "Generated by `python -m scripts.rag_eval`. Do not edit by hand.",
        "",
        f"- Corpus: {results['documents']} documents, {results['chunks']} chunks "
        f"(chunk size {results['chunk_size']}, overlap {results['chunk_overlap']})",
        f"- Embedding model: `{results['embedding_model']}`",
        f"- A question counts as answered only if a relevant chunk is in the top "
        f"{results['cutoff']}, the number of chunks the app passes to the LLM",
        "",
    ]
    for category in categories:
        count = int(methods["hybrid"][category]["questions"])
        lines += [
            f"## {category} ({count} questions)",
            "",
            "| Method | hit@1 | hit@3 | hit@5 | MRR |",
            "|---|---|---|---|---|",
        ]
        for method, report in methods.items():
            row = report[category]
            lines.append(
                f"| {method} | {row['hit@1']:.2f} | {row['hit@3']:.2f} | "
                f"{row['hit@5']:.2f} | {row['mrr']:.2f} |"
            )
        lines.append("")

    lines += [
        "## Rank of the first relevant chunk, per question",
        "",
        "`-` means no relevant chunk in the top " + str(results["cutoff"]) + ".",
        "",
        "| Category | Question | vector | keyword | hybrid |",
        "|---|---|---|---|---|",
    ]
    for row in results["per_question"]:
        cells = [str(row[method] or "-") for method in ("vector", "keyword", "hybrid")]
        lines.append(
            f"| {row['category']} | {row['question']} | " + " | ".join(cells) + " |"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0].strip())
    parser.add_argument(
        "--no-cache", action="store_true", help="embed everything again"
    )
    parser.add_argument(
        "--no-write", action="store_true", help="print only, keep the result files"
    )
    args = parser.parse_args()

    results = asyncio.run(run(use_cache=not args.no_cache))
    report = render_markdown(results)
    print(report)

    if not args.no_write:
        RESULTS_JSON.write_text(
            json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        RESULTS_MD.write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
