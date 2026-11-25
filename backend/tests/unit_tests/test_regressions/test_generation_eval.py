"""
The answer-quality evaluation harness (scripts/generation_eval.py).

The evaluation itself calls Gemini, so it is run by hand. These tests pin the scoring
rules, so a refactor cannot quietly change what "correct" or "hallucinated" means, and
check the committed data set is well formed.
"""

import pytest

from backend.src.exceptions.core import (
    ExceptionAIQuota_503,
    ExceptionExternalService_503,
)
from scripts import generation_eval as ge


def verdict(**overrides):
    base = {
        "answer_quality": "correct",
        "gives_answer_directly": True,
        "says_not_in_document": False,
        "corrects_false_premise": False,
        "hallucinations": [],
        "explanation": "",
    }
    return {**base, **overrides}


def question(**overrides):
    base = {
        "id": "Q1",
        "subject": "tieng_viet",
        "grade": 1,
        "document": "lesson.txt",
        "category": "fact_lookup",
        "style": "normal",
        "question": "Ai có quả na?",
        "answerable": True,
        "reference_answer": "Lan.",
        "key_facts": ["lan"],
        "evidence": "Lan có một quả na.",
    }
    return ge.Question(**{**base, **overrides})


# ----- RULE-BASED METRICS ----- #


def test_key_facts_match_whole_words_only():
    assert ge.contains_fact("Bạn ấy có 5 quyển vở.", "5")
    assert not ge.contains_fact("Bạn ấy có 15 quyển vở.", "5")


def test_key_facts_ignore_case_and_unicode_form():
    decomposed = "Cây Xoài".replace("à", "à")  # same letters, other Unicode form

    assert ge.contains_fact(decomposed, "cây xoài")


def test_key_fact_recall_is_a_share_and_none_without_facts():
    assert ge.key_fact_recall(
        "Lan có quả na", ["lan", "quả na", "quả cam"]
    ) == pytest.approx(2 / 3)
    assert ge.key_fact_recall("anything", []) is None


# ----- SUCCESS RULES ----- #


def test_an_answerable_question_needs_a_correct_answer():
    assert ge.item_success("fact_lookup", verdict())
    assert not ge.item_success("fact_lookup", verdict(answer_quality="partial"))


def test_an_unanswerable_question_needs_an_honest_refusal():
    assert ge.item_success("unanswerable", verdict(says_not_in_document=True))
    # Saying "not in the lesson" and then inventing the detail anyway is a failure
    assert not ge.item_success(
        "unanswerable",
        verdict(says_not_in_document=True, hallucinations=["Lan 7 tuổi"]),
    )
    assert not ge.item_success("unanswerable", verdict())


def test_a_false_premise_must_be_corrected():
    assert ge.item_success("false_premise", verdict(corrects_false_premise=True))
    assert not ge.item_success("false_premise", verdict())


def test_a_failed_answer_is_blamed_on_retrieval_only_when_the_evidence_was_missing():
    q = question()
    wrong = {
        "answer": "Hoa.",
        "context": "",
        "verdict": verdict(answer_quality="incorrect"),
    }
    retrieved = {**wrong, "context": "... Lan có một quả na. Quả na chín thơm."}

    assert ge.score_row(q, wrong)["failure_reason"] == "retrieval_miss"
    assert ge.score_row(q, retrieved)["failure_reason"] == "generation"
    assert (
        ge.score_row(q, {**retrieved, "verdict": verdict()})["failure_reason"] is None
    )


def test_a_question_that_failed_to_run_is_reported_not_scored():
    rows = [
        ge.score_row(
            question(),
            {"answer": "Lan.", "context": "Lan có một quả na.", "verdict": verdict()},
        ),
        ge.score_row(
            question(id="Q2"), {"error": "ExceptionExternalService_503: busy"}
        ),
    ]
    summary = ge.summarise(rows)

    assert summary["errors"] == 1
    assert summary["answer_accuracy"] == {"value": 1.0, "n": 1}
    assert summary["context_recall"] == {"value": 1.0, "n": 1}


def test_hallucination_rate_counts_every_category():
    rows = [
        ge.score_row(
            question(), {"answer": "Lan.", "context": "", "verdict": verdict()}
        ),
        ge.score_row(
            question(
                id="Q2",
                category="unanswerable",
                answerable=False,
                key_facts=[],
                evidence=None,
            ),
            {
                "answer": "Lan 7 tuổi.",
                "context": "",
                "verdict": verdict(hallucinations=["7 tuổi"]),
            },
        ),
    ]
    summary = ge.summarise(rows)

    assert summary["hallucination_rate"] == {"value": 0.5, "n": 2}
    assert summary["refusal_accuracy"] == {"value": 0.0, "n": 1}


# ----- STOPPING EARLY ----- #


def test_the_call_budget_refuses_the_request_over_the_limit():
    budget = ge.CallBudget(2)
    budget.spend()
    budget.spend()

    with pytest.raises(ge.CallBudgetExceeded):
        budget.spend()
    assert budget.used == 2


def test_the_run_stops_on_a_spent_quota_a_used_budget_or_repeated_failures():
    quota = ExceptionAIQuota_503("limit")
    busy = ExceptionExternalService_503("busy")

    assert "quota" in ge.stop_reason(quota, 1)
    assert "--max-calls" in ge.stop_reason(
        ge.CallBudgetExceeded("--max-calls 2 reached"), 1
    )
    assert ge.stop_reason(busy, 1) is None
    assert "in a row" in ge.stop_reason(busy, ge.MAX_CONSECUTIVE_FAILURES)


# ----- JUDGE CALIBRATION ----- #


def test_agreement_uses_only_labelled_rows():
    rows = [
        {
            "judge_success": "1",
            "human_success": "1",
            "judge_hallucinated": "0",
            "human_hallucinated": "0",
        },
        {
            "judge_success": "1",
            "human_success": "0",
            "judge_hallucinated": "0",
            "human_hallucinated": "1",
        },
        {
            "judge_success": "1",
            "human_success": "",
            "judge_hallucinated": "0",
            "human_hallucinated": "",
        },
    ]

    assert ge.agreement(rows) == {"n": 2, "success": 0.5, "hallucination": 0.5}
    assert ge.agreement(rows[2:]) is None


# ----- DATA SET ----- #


def test_check_dataset_catches_broken_labels():
    corpus = {"lesson.txt": "Lan có một quả na. Quả na chín thơm."}
    problems = ge.check_dataset(
        corpus,
        [
            question(),
            question(id="Q1"),  # duplicate id
            question(
                id="Q3", evidence="Lan có một quả cam."
            ),  # evidence not in the lesson
            question(
                id="Q4",
                category="unanswerable",
                answerable=False,
                key_facts=[],
                evidence="x",
            ),
        ],
    )

    assert any("duplicate id Q1" in p for p in problems)
    assert any(p.startswith("Q3:") for p in problems)
    assert any(p.startswith("Q4:") for p in problems)


@pytest.mark.skipif(not ge.QUESTIONS_FILE.exists(), reason="data set not generated yet")
def test_the_committed_data_set_is_well_formed():
    corpus = ge.load_corpus()
    questions = ge.load_questions()

    assert ge.check_dataset(corpus, questions) == []
    categories = {q.category for q in questions}
    assert {"unanswerable", "false_premise"} <= categories


# ----- JUDGE ENDPOINT ----- #


@pytest.fixture
def no_judge_environment(monkeypatch):
    for name in ge.JudgeSettings.model_fields:
        monkeypatch.delenv(name, raising=False)


def test_without_configuration_the_judge_is_gemini(no_judge_environment):
    assert ge.judge_endpoint(ge.JudgeSettings(_env_file=None)) is None


def test_the_judge_can_be_any_endpoint_and_is_named_with_its_host(no_judge_environment):
    judge = ge.JudgeSettings(
        _env_file=None,
        JUDGE_BASE_URL="https://provider.test/v1",
        JUDGE_API_KEY="secret-key",
        JUDGE_MODEL="big",
        JUDGE_STRUCTURED_OUTPUT="json_object",
    )

    endpoint = ge.judge_endpoint(judge)
    assert endpoint.label == "big@provider.test"
    assert endpoint.structured_output == "json_object"
    assert ge.judge_endpoint(judge, "bigger").model == "bigger"


def test_the_judge_temperature_can_be_left_out(no_judge_environment):
    assert ge.JudgeSettings(_env_file=None).JUDGE_TEMPERATURE == 0
    omit = ge.JudgeSettings(_env_file=None, JUDGE_TEMPERATURE="omit")
    assert omit.JUDGE_TEMPERATURE == "omit"
    assert (
        ge.JudgeSettings(_env_file=None, JUDGE_TEMPERATURE="0.5").JUDGE_TEMPERATURE
        == 0.5
    )


def test_the_judge_settings_example_file_is_valid(no_judge_environment):
    example = ge.EVAL_DIR.parent / ".env.example"

    assert ge.judge_endpoint(ge.JudgeSettings(_env_file=example)) is None


def test_a_judge_without_a_model_is_refused(no_judge_environment):
    with pytest.raises(ValueError, match="JUDGE_MODEL"):
        ge.JudgeSettings(_env_file=None, JUDGE_BASE_URL="https://provider.test/v1")
