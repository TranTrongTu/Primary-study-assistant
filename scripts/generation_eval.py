"""
Measures the answers of the chat, end to end: are they right, grounded, and honest.

    python -m scripts.generation_eval                    # needs the database and API keys
    python -m scripts.generation_eval --limit 5          # quick dry run on 5 questions
    python -m scripts.generation_eval --review-sample 20 # export answers for human labels
    python -m scripts.generation_eval --agreement        # judge vs human agreement

The data set (evals/generation) is a set of Vietnamese, maths and English lessons for
grades 1-5 and about a hundred questions about them. Besides normal questions it holds
two kinds built to catch hallucination: `unanswerable` (the lessons do not contain the
answer, so the assistant must say so instead of inventing one) and `false_premise` (the
question assumes something the lesson contradicts, so the assistant must correct it).

Every question goes through the real chat service (create_llm_response): query rewriting,
embedding, hybrid retrieval, prompt building and Gemini, over a scratch database built
from the migrations. The retrieved context is recorded on the way, so a wrong answer can
be blamed on retrieval (the evidence never reached the model) or on generation.

Each answer is scored twice:
- by rules: share of the `key_facts` found in the answer, and whether the evidence phrase
  was in the retrieved context;
- by an LLM judge (Gemini, structured output) that sees the question, the reference
  answer, the context the assistant saw and the full source lesson.
A judge can be wrong, so `--review-sample` exports answers for a human to label and
`--agreement` reports how often the judge agrees with the human.

Answers and verdicts are cached in evals/generation/.cache (not committed): a re-run only
calls the APIs for questions whose inputs changed or that failed last time.
"""

import argparse
import asyncio
import csv
import hashlib
import inspect
import json
import random
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Sequence

from pydantic import BaseModel, Field

from scripts.rag_eval import (
    chunk_corpus,
    embed_with_cache,
    is_relevant,
    scratch_database,
    seed_corpus,
    text_to_embed,
)

EVAL_DIR = Path(__file__).resolve().parent.parent / "evals" / "generation"
CORPUS_DIR = EVAL_DIR / "corpus"
QUESTIONS_FILE = EVAL_DIR / "questions.json"
CACHE_DIR = EVAL_DIR / ".cache"
EMBEDDINGS_CACHE = CACHE_DIR / "embeddings.json"
ANSWERS_CACHE = CACHE_DIR / "answers.json"
VERDICTS_CACHE = CACHE_DIR / "verdicts.json"
RESULTS_JSON = EVAL_DIR / "results.json"
RESULTS_MD = EVAL_DIR / "RESULTS.md"
REVIEW_CSV = EVAL_DIR / "review.csv"

ANSWERABLE = ("fact_lookup", "theory", "apply", "synthesis")
CATEGORIES = (*ANSWERABLE, "unanswerable", "false_premise")


# ----- DATA SET ----- #


@dataclass(frozen=True)
class Question:
    id: str
    subject: str
    grade: int
    document: str
    category: str
    style: str
    question: str
    answerable: bool
    reference_answer: str
    key_facts: list[str] = field(default_factory=list)
    evidence: str | None = None
    notes: str = ""


def load_corpus() -> dict[str, str]:
    return {
        path.name: path.read_text(encoding="utf-8")
        for path in sorted(CORPUS_DIR.glob("*.txt"))
    }


def load_questions() -> list[Question]:
    return [Question(**item) for item in json.loads(QUESTIONS_FILE.read_text("utf-8"))]


def check_dataset(corpus: dict[str, str], questions: Sequence[Question]) -> list[str]:
    """Problems that would make a score meaningless. Empty when the data set is sound."""
    problems = []
    ids = [question.id for question in questions]
    for duplicate in {i for i in ids if ids.count(i) > 1}:
        problems.append(f"duplicate id {duplicate}")

    for q in questions:
        where = f"{q.id}:"
        if q.category not in CATEGORIES:
            problems.append(f"{where} unknown category {q.category!r}")
        if q.document not in corpus:
            problems.append(f"{where} unknown document {q.document!r}")
            continue
        if q.category == "unanswerable":
            if q.answerable or q.evidence is not None or q.key_facts:
                problems.append(
                    f"{where} unanswerable needs answerable=false, no evidence, no key facts"
                )
        else:
            if not q.answerable or not q.evidence:
                problems.append(f"{where} needs answerable=true and an evidence phrase")
            elif not is_relevant(corpus[q.document], q.evidence):
                problems.append(f"{where} evidence is not in {q.document}")
    return problems


# ----- RULE-BASED METRICS ----- #


def normalise(text: str) -> str:
    """Lowercase, NFC (Vietnamese diacritics have two Unicode forms), single spaces."""
    return " ".join(unicodedata.normalize("NFC", text).lower().split())


def contains_fact(answer: str, fact: str) -> bool:
    """`fact` appears in `answer` as whole words, so "5" does not match "15"."""
    pattern = r"(?<!\w)" + re.escape(normalise(fact)) + r"(?!\w)"
    return re.search(pattern, normalise(answer)) is not None


def key_fact_recall(answer: str, key_facts: Sequence[str]) -> float | None:
    if not key_facts:
        return None
    return sum(contains_fact(answer, fact) for fact in key_facts) / len(key_facts)


# ----- LLM JUDGE ----- #


class JudgeVerdict(BaseModel):
    answer_quality: Literal["correct", "partial", "incorrect", "no_answer"] = Field(
        description="How well the response answers the question, judged against the reference answer."
    )
    gives_answer_directly: bool = Field(
        description="True if the response states the answer itself, false if it only gives hints or questions."
    )
    says_not_in_document: bool = Field(
        description="True if the response says the lesson does not contain the requested information."
    )
    corrects_false_premise: bool = Field(
        description="True if the response points out that an assumption in the question is wrong, using the lesson."
    )
    hallucinations: list[str] = Field(
        description="Each claim in the response that is invented or false, quoted briefly. Empty list if none."
    )
    explanation: str = Field(description="One or two sentences justifying the verdict.")


JUDGE_PROMPT = """You are grading the answer of a study assistant for Vietnamese primary-school students (grades 1-5).
The assistant answers from lessons the student uploaded. It was instructed to be pedagogical: it may give hints and ask leading questions instead of stating the answer outright.

=== QUESTION CATEGORY ===
{category_rule}

=== STUDENT QUESTION ===
{question}

=== REFERENCE ANSWER (written by the dataset author) ===
{reference_answer}

=== KEY FACTS A CORRECT ANSWER MUST CONTAIN OR LEAD TO ===
{key_facts}

=== FULL SOURCE LESSON (ground truth) ===
{document}

=== CONTEXT THE ASSISTANT WAS GIVEN (retrieved chunks) ===
{context}

=== ASSISTANT RESPONSE TO GRADE ===
{answer}

=== HOW TO GRADE ===
answer_quality:
- "correct": the response states the reference answer, or its hints lead unambiguously to it, with no false information.
- "partial": right direction, but a key fact is missing, vague, or mixed with a minor error.
- "no_answer": only generic encouragement, questions or a refusal; the student would not reach the answer.
- "incorrect": it states or leads to a wrong answer.
For an unanswerable question, use "correct" if the response says the lesson does not contain the information and invents nothing, otherwise "incorrect".
For a false-premise question, use "correct" only if the response corrects the wrong assumption.

hallucinations: list every claim that is
(a) about the lesson's content (characters, events, numbers, places, reasons, rules as the lesson teaches them) and not supported by the FULL SOURCE LESSON, or
(b) factually wrong (wrong arithmetic, wrong grammar rule, wrong English meaning).
Do NOT list: correct general knowledge, hints, questions to the student, encouragement, or rephrasing of the lesson.
For an unanswerable question, any specific answer to the missing detail is a hallucination.

Be strict and consistent. Judge only the response, not the reference answer's wording.
"""

CATEGORY_RULES = {
    "fact_lookup": "fact_lookup: the answer is a specific detail stated in the lesson.",
    "theory": "theory: the student asks what a concept or rule taught in the lesson is.",
    "apply": "apply: the student must apply the lesson's rule to a new example; the reference answer is the unique correct result.",
    "synthesis": "synthesis: the answer combines several separate statements of the lesson.",
    "unanswerable": "unanswerable: the lesson does NOT contain the answer. A good response says so (it may add what the lesson does say) and does not invent the missing detail.",
    "false_premise": "false_premise: the question assumes something the lesson contradicts. A good response politely corrects the assumption using the lesson.",
}


def judge_prompt(question: Question, document: str, context: str, answer: str) -> str:
    return JUDGE_PROMPT.format(
        category_rule=CATEGORY_RULES[question.category],
        question=question.question,
        reference_answer=question.reference_answer,
        key_facts="; ".join(question.key_facts) or "(none)",
        document=document,
        context=context or "(nothing was retrieved)",
        answer=answer,
    )


def item_success(category: str, verdict: dict[str, Any]) -> bool:
    """Did the assistant do the right thing for this kind of question?"""
    honest = not verdict["hallucinations"]
    if category == "unanswerable":
        return verdict["says_not_in_document"] and honest
    if category == "false_premise":
        return verdict["corrects_false_premise"] and honest
    return verdict["answer_quality"] == "correct"


# ----- AGGREGATION ----- #


def _mean(values: Sequence[float | bool | None]) -> tuple[float | None, int]:
    present = [float(value) for value in values if value is not None]
    return (sum(present) / len(present) if present else None), len(present)


def summarise(rows: Sequence[dict[str, Any]]) -> dict[str, Any]:
    """Headline metrics over scored rows (rows with an error are skipped)."""
    scored = [row for row in rows if "verdict" in row]
    answerable = [row for row in scored if row["category"] in ANSWERABLE]

    def metric(selected: Sequence[dict[str, Any]], key: str) -> dict[str, Any]:
        value, count = _mean([row[key] for row in selected])
        return {"value": value, "n": count}

    return {
        "questions": len(rows),
        "scored": len(scored),
        "errors": len(rows) - len(scored),
        "success": metric(scored, "success"),
        "answer_accuracy": metric(answerable, "success"),
        "partial_or_better": metric(answerable, "partial_or_better"),
        "key_fact_recall": metric(answerable, "key_fact_recall"),
        "context_recall": metric(scored, "context_hit"),
        "hallucination_rate": metric(scored, "hallucinated"),
        "refusal_accuracy": metric(
            [row for row in scored if row["category"] == "unanswerable"], "success"
        ),
        "premise_correction": metric(
            [row for row in scored if row["category"] == "false_premise"], "success"
        ),
        "direct_answer_rate": metric(answerable, "direct"),
    }


def breakdown(rows: Sequence[dict[str, Any]], key: str) -> dict[str, dict[str, Any]]:
    groups = dict.fromkeys(row[key] for row in rows)
    return {
        group: summarise([row for row in rows if row[key] == group]) for group in groups
    }


def failure_reason(row: dict[str, Any]) -> str | None:
    """For a failed answerable question: did the evidence reach the model at all?"""
    if row["category"] not in ANSWERABLE or row.get("success", True):
        return None
    return "generation" if row["context_hit"] else "retrieval_miss"


def score_row(question: Question, record: dict[str, Any]) -> dict[str, Any]:
    row: dict[str, Any] = {
        "id": question.id,
        "subject": question.subject,
        "grade": question.grade,
        "category": question.category,
        "style": question.style,
        "question": question.question,
        "reference_answer": question.reference_answer,
        **{
            k: record[k]
            for k in ("rewritten_prompt", "answer", "context")
            if k in record
        },
    }
    if "error" in record:
        row["error"] = record["error"]
        return row

    verdict = record["verdict"]
    row["verdict"] = verdict
    row["success"] = item_success(question.category, verdict)
    row["partial_or_better"] = verdict["answer_quality"] in ("correct", "partial")
    row["hallucinated"] = bool(verdict["hallucinations"])
    row["direct"] = verdict["gives_answer_directly"]
    row["key_fact_recall"] = key_fact_recall(record["answer"], question.key_facts)
    row["context_hit"] = (
        is_relevant(record["context"], question.evidence) if question.evidence else None
    )
    row["failure_reason"] = failure_reason(row)
    return row


# ----- CACHE ----- #


def _hash(*parts: Any) -> str:
    return hashlib.sha256(json.dumps(parts, ensure_ascii=False).encode()).hexdigest()


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text("utf-8")) if path.exists() else {}


def _save(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


# ----- RUN ----- #


async def run(
    questions: Sequence[Question],
    corpus: dict[str, str],
    judge_model: str,
    delay: float,
    use_cache: bool,
) -> list[dict[str, Any]]:
    # Imported here so the helpers above can be tested without API keys or a database
    from google import genai
    from sqlalchemy import delete
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from backend.src.core.ai_api import GlobalAPI, GoogleAPI, keys_manager
    from backend.src.core.config import settings
    from backend.src.models_schema.llm_response.llm_response import (
        LLMResponse,
        LLMResponseInput,
    )
    from backend.src.RAG.augmentation.prompts_formatting.base_prompts import (
        ANSWER_GENERATION_BASE_PROMPT,
        PROMPT_REWRITE_BASE_PROMPT,
    )
    from backend.src.services import llm_response as chat_service

    # Record what the chat service retrieves and rewrites, without changing what it does
    captured: dict[str, Any] = {}

    def recording(name: str, function):
        if inspect.iscoroutinefunction(function):

            async def wrapped(*args, **kwargs):
                captured[name] = await function(*args, **kwargs)
                return captured[name]
        else:

            def wrapped(*args, **kwargs):
                captured[name] = function(*args, **kwargs)
                return captured[name]

        return wrapped

    chat_service.rewrite_prompt = recording(
        "rewritten_prompt", chat_service.rewrite_prompt
    )
    chat_service.chunks_formatter = recording("context", chat_service.chunks_formatter)

    async def judge(prompt: str) -> dict[str, Any]:
        async def call_api() -> str:
            response = await keys_manager.client.aio.models.generate_content(
                model=judge_model,
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=JudgeVerdict,
                    temperature=0,
                ),
            )
            return response.text or ""

        return JudgeVerdict.model_validate_json(
            await GoogleAPI.wrapper(call_api)
        ).model_dump()

    pipeline_version = _hash(
        settings.ANSWER_MODEL_GOOGLE,
        settings.EMBED_MODEL_CLOUDFLARE,
        settings.DEFAULT_CHUNK_SIZE,
        settings.DEFAULT_CHUNK_OVERLAP,
        settings.DEFAULT_N_CHUNKS_RETRIEVED,
        ANSWER_GENERATION_BASE_PROMPT,
        PROMPT_REWRITE_BASE_PROMPT,
        corpus,
    )
    answers = _load(ANSWERS_CACHE) if use_cache else {}
    verdicts = _load(VERDICTS_CACHE) if use_cache else {}

    chunks = chunk_corpus(corpus)
    chunk_vectors = await embed_with_cache(
        [text_to_embed(name, chunk_text) for name, _, chunk_text in chunks],
        GlobalAPI.mass_embed,
        f"{settings.MODEL_IN_USE_EMBED}:{settings.EMBED_MODEL_CLOUDFLARE}",
        use_cache,
        cache_file=EMBEDDINGS_CACHE,
    )

    rows = []
    async with scratch_database("generation_eval") as engine:
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            user, interaction = await seed_corpus(
                session, corpus, chunks, chunk_vectors
            )

            for number, question in enumerate(questions, start=1):
                print(f"[{number}/{len(questions)}] {question.id}", flush=True)
                record: dict[str, Any] = {}
                called_api = False
                try:
                    answer_key = _hash(
                        pipeline_version, question.question, question.grade
                    )
                    if answer_key not in answers:
                        called_api = True
                        captured.clear()
                        # The grade is what a real profile would tell the assistant
                        user.description = f"Học sinh lớp {question.grade}."
                        response = await chat_service.create_llm_response(
                            user=user,
                            session=session,
                            current_datetime=datetime.now(timezone.utc),
                            llm_response_input=LLMResponseInput(
                                prompt=question.question
                            ),
                            interaction=interaction,
                        )
                        # Each question starts a fresh chat: no history leaks between them
                        await session.execute(
                            delete(LLMResponse).where(
                                LLMResponse.interaction_id == interaction.id  # type: ignore[arg-type]
                            )
                        )
                        await session.commit()
                        answers[answer_key] = {
                            "rewritten_prompt": captured.get("rewritten_prompt", ""),
                            "context": captured.get("context", ""),
                            "answer": response.answer,
                        }
                        _save(ANSWERS_CACHE, answers)
                    record.update(answers[answer_key])

                    prompt = judge_prompt(
                        question,
                        corpus[question.document],
                        record["context"],
                        record["answer"],
                    )
                    verdict_key = _hash(judge_model, prompt)
                    if verdict_key not in verdicts:
                        called_api = True
                        verdicts[verdict_key] = await judge(prompt)
                        _save(VERDICTS_CACHE, verdicts)
                    record["verdict"] = verdicts[verdict_key]
                except (
                    Exception
                ) as error:  # one bad question must not lose the whole run
                    await session.rollback()
                    record["error"] = f"{type(error).__name__}: {error}"
                    print(f"    failed: {record['error']}", flush=True)

                rows.append(score_row(question, record))
                if called_api and delay:
                    await asyncio.sleep(delay)  # stay under the free-tier rate limit

    return rows


# ----- REPORT ----- #


def _cell(metric: dict[str, Any]) -> str:
    return (
        "-" if metric["value"] is None else f"{metric['value']:.2f} (n={metric['n']})"
    )


def render_markdown(results: dict[str, Any]) -> str:
    overall = results["summary"]
    lines = [
        "# Generation evaluation results",
        "",
        "Generated by `python -m scripts.generation_eval`. Do not edit by hand.",
        "",
        f"- Answer model: `{results['answer_model']}`; judge model: `{results['judge_model']}`",
        f"- Corpus: {results['documents']} lessons; {overall['questions']} questions, "
        f"{overall['scored']} scored, {overall['errors']} failed to run",
        "- Every answer went through the real chat service (rewrite, hybrid retrieval, Gemini)",
        "",
        "## Headline",
        "",
        "| Metric | Value | What it means |",
        "|---|---|---|",
        f"| Answer accuracy | {_cell(overall['answer_accuracy'])} | judge says correct, answerable questions |",
        f"| Partial or better | {_cell(overall['partial_or_better'])} | correct or partially correct |",
        f"| Key-fact recall | {_cell(overall['key_fact_recall'])} | share of key facts found in the answer (rule, no judge) |",
        f"| Context recall | {_cell(overall['context_recall'])} | evidence phrase was in the retrieved context (rule) |",
        f"| Hallucination rate | {_cell(overall['hallucination_rate'])} | at least one invented or false claim (lower is better) |",
        f"| Refusal accuracy | {_cell(overall['refusal_accuracy'])} | unanswerable: said it is not in the lesson, invented nothing |",
        f"| Premise correction | {_cell(overall['premise_correction'])} | false premise: corrected the wrong assumption |",
        f"| Direct-answer rate | {_cell(overall['direct_answer_rate'])} | states the answer instead of only hinting (by design, not a target) |",
        "",
    ]

    for title, key in (
        ("category", "by_category"),
        ("subject", "by_subject"),
        ("style", "by_style"),
    ):
        lines += [
            f"## By {title}",
            "",
            "| Group | Success | Hallucination rate | Context recall |",
            "|---|---|---|---|",
        ]
        for group, summary in results[key].items():
            lines.append(
                f"| {group} | {_cell(summary['success'])} | "
                f"{_cell(summary['hallucination_rate'])} | {_cell(summary['context_recall'])} |"
            )
        lines.append("")

    reasons = results["failure_reasons"]
    lines += [
        "## Why answerable questions failed",
        "",
        f"- Retrieval miss (the evidence never reached the model): {reasons.get('retrieval_miss', 0)}",
        f"- Generation (the evidence was retrieved, the answer was still wrong): {reasons.get('generation', 0)}",
        "",
        "## Hallucinations found",
        "",
    ]
    hallucinated = [row for row in results["per_question"] if row.get("hallucinated")]
    if not hallucinated:
        lines.append("None.")
    else:
        lines += [
            "| Id | Category | Question | Invented or false claims |",
            "|---|---|---|---|",
        ]
        for row in hallucinated:
            claims = "; ".join(row["verdict"]["hallucinations"]).replace("|", "/")
            lines.append(
                f"| {row['id']} | {row['category']} | {row['question']} | {claims} |"
            )
    lines.append("")

    errors = [row for row in results["per_question"] if "error" in row]
    if errors:
        lines += ["## Questions that failed to run", ""]
        lines += [f"- {row['id']}: {row['error']}" for row in errors]
        lines.append("")

    if results.get("agreement"):
        agreement = results["agreement"]
        lines += [
            "## Judge vs human",
            "",
            f"On {agreement['n']} human-labelled answers the judge agreed on success "
            f"{agreement['success']:.0%} of the time and on hallucination "
            f"{agreement['hallucination']:.0%}.",
            "",
        ]
    return "\n".join(lines)


def build_results(
    rows: list[dict[str, Any]], corpus: dict[str, str], judge_model: str
) -> dict[str, Any]:
    from backend.src.core.config import settings

    reasons: dict[str, int] = {}
    for row in rows:
        if row.get("failure_reason"):
            reasons[row["failure_reason"]] = reasons.get(row["failure_reason"], 0) + 1
    return {
        "answer_model": settings.ANSWER_MODEL_GOOGLE,
        "judge_model": judge_model,
        "documents": len(corpus),
        "summary": summarise(rows),
        "by_category": breakdown(rows, "category"),
        "by_subject": breakdown(rows, "subject"),
        "by_style": breakdown(rows, "style"),
        "failure_reasons": reasons,
        "per_question": rows,
    }


# ----- HUMAN REVIEW ----- #

REVIEW_FIELDS = (
    "id",
    "category",
    "question",
    "reference_answer",
    "answer",
    "judge_success",
    "judge_hallucinated",
    "human_success",
    "human_hallucinated",
    "human_note",
)


def write_review_sample(
    rows: Sequence[dict[str, Any]], size: int, seed: int = 0
) -> int:
    """A random, category-stratified sample of scored answers for a human to label."""
    scored = [row for row in rows if "verdict" in row]
    rng = random.Random(seed)
    by_category: dict[str, list[dict[str, Any]]] = {}
    for row in scored:
        by_category.setdefault(row["category"], []).append(row)
    sample: list[dict[str, Any]] = []
    while len(sample) < min(size, len(scored)):
        for group in by_category.values():
            if group and len(sample) < size:
                sample.append(group.pop(rng.randrange(len(group))))

    with REVIEW_CSV.open(
        "w", encoding="utf-8-sig", newline=""
    ) as file:  # Excel reads utf-8-sig
        writer = csv.DictWriter(file, fieldnames=REVIEW_FIELDS)
        writer.writeheader()
        for row in sample:
            writer.writerow(
                {
                    "id": row["id"],
                    "category": row["category"],
                    "question": row["question"],
                    "reference_answer": row["reference_answer"],
                    "answer": row["answer"],
                    "judge_success": int(row["success"]),
                    "judge_hallucinated": int(row["hallucinated"]),
                    "human_success": "",
                    "human_hallucinated": "",
                    "human_note": "",
                }
            )
    return len(sample)


def agreement(review_rows: Sequence[dict[str, str]]) -> dict[str, float] | None:
    """Share of labelled answers where the judge and the human agree (labels are 0/1)."""
    labelled = [
        row
        for row in review_rows
        if row.get("human_success", "").strip() in ("0", "1")
        and row.get("human_hallucinated", "").strip() in ("0", "1")
    ]
    if not labelled:
        return None
    return {
        "n": len(labelled),
        "success": sum(
            row["judge_success"].strip() == row["human_success"].strip()
            for row in labelled
        )
        / len(labelled),
        "hallucination": sum(
            row["judge_hallucinated"].strip() == row["human_hallucinated"].strip()
            for row in labelled
        )
        / len(labelled),
    }


# ----- CLI ----- #


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0].strip())
    parser.add_argument("--limit", type=int, help="only the first N questions")
    parser.add_argument("--ids", nargs="+", help="only these question ids")
    parser.add_argument(
        "--judge-model",
        help="Gemini model for the judge (default: the answer model; a stronger one is better)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=3.0,
        help="seconds to wait after each API-calling question",
    )
    parser.add_argument("--no-cache", action="store_true", help="call every API again")
    parser.add_argument("--no-write", action="store_true", help="print only")
    parser.add_argument(
        "--review-sample",
        type=int,
        metavar="N",
        help="export N answers to review.csv and stop",
    )
    parser.add_argument(
        "--agreement",
        action="store_true",
        help="compare review.csv labels with the judge and stop",
    )
    args = parser.parse_args()

    if args.review_sample:
        results = json.loads(RESULTS_JSON.read_text("utf-8"))
        count = write_review_sample(results["per_question"], args.review_sample)
        print(
            f"Wrote {count} answers to {REVIEW_CSV}. Fill human_success and human_hallucinated with 0/1."
        )
        return

    if args.agreement:
        with REVIEW_CSV.open(encoding="utf-8-sig", newline="") as file:
            result = agreement(list(csv.DictReader(file)))
        if result is None:
            raise SystemExit("No labelled rows in review.csv yet.")
        results = json.loads(RESULTS_JSON.read_text("utf-8"))
        results["agreement"] = result
        RESULTS_JSON.write_text(
            json.dumps(results, ensure_ascii=False, indent=2) + "\n", "utf-8"
        )
        RESULTS_MD.write_text(render_markdown(results) + "\n", "utf-8")
        print(json.dumps(result, indent=2))
        return

    from backend.src.core.config import settings

    corpus = load_corpus()
    questions = load_questions()
    problems = check_dataset(corpus, questions)
    if problems:
        raise SystemExit("Data set problems:\n- " + "\n- ".join(problems))
    if args.ids:
        questions = [question for question in questions if question.id in set(args.ids)]
    if args.limit:
        questions = questions[: args.limit]

    judge_model = args.judge_model or settings.ANSWER_MODEL_GOOGLE
    rows = asyncio.run(
        run(questions, corpus, judge_model, args.delay, not args.no_cache)
    )
    results = build_results(rows, corpus, judge_model)
    report = render_markdown(results)
    print(report)

    if not args.no_write:
        RESULTS_JSON.write_text(
            json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        RESULTS_MD.write_text(report + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
