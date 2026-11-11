"""
Keyword search behaviour, and the retrieval evaluation harness (scripts/rag_eval.py).

The evaluation itself needs the real embedding API, so it is run by hand. These tests
keep its data set and its arithmetic honest, and pin the two keyword-search properties
the evaluation led to.
"""

from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_chunk import (
    EMBEDDING_DIMENSIONS,
    DocumentChunk,
)
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.models_schema.user.user import User
from backend.src.RAG.chunking.base import smart_splitter
from backend.src.RAG.retrieval.keyword_search import keyword_search
from scripts import rag_eval

# ----- KEYWORD SEARCH ----- #

FRACTIONS = (
    "Rút gọn phân số là chia cả tử số và mẫu số cho cùng một số tự nhiên lớn hơn 1. "
    "Phân số không thể rút gọn được nữa gọi là phân số tối giản. Muốn so sánh hai phân "
    "số khác mẫu số, ta quy đồng mẫu số của chúng rồi so sánh hai tử số. Trong hai phân "
    "số cùng mẫu số, phân số nào có tử số lớn hơn thì lớn hơn."
)
WATER = (
    "Nước tồn tại ở ba thể là thể lỏng, thể rắn và thể khí. Nước đông đặc thành nước "
    "đá ở 0 độ C và sôi ở 100 độ C. Khi được đun nóng, nước bay hơi nhanh hơn."
)
HISTORY = (
    "Năm 938, vua Nam Hán sai con trai là Lưu Hoằng Tháo dẫn một đạo quân thủy sang "
    "xâm lược nước ta. Ngô Quyền cho quân lính đóng cọc gỗ bịt sắt xuống lòng sông "
    "Bạch Đằng, chờ thủy triều xuống rồi đổ ra đánh."
)


@pytest.fixture
async def interaction_with_chunks(session: AsyncSession) -> Interaction:
    now = datetime.now(timezone.utc)
    user = User(
        username="retrieval",
        email="retrieval@example.com",
        description="",
        hashed_password="unused",
        created_at=now,
    )
    interaction = Interaction(name="Retrieval", user=user, created_at=now)
    document = Document(
        name="lessons.txt",
        interaction=interaction,
        page_starts_at=0,
        type=DocumentType.TEXT,
        subject_type=None,
        text="",
        created_at=now,
    )
    session.add_all(
        [
            DocumentChunk(
                content_original=content,
                content_embedded=[0.1] * EMBEDDING_DIMENSIONS,
                document_chunk_index=index,
                document=document,
            )
            for index, content in enumerate([WATER, FRACTIONS, HISTORY])
        ]
    )
    await session.commit()
    return interaction


async def test_keyword_search_matches_a_question_typed_without_diacritics(
    session: AsyncSession, interaction_with_chunks: Interaction
):
    chunks = await keyword_search(
        session, interaction_with_chunks, "phan so toi gian la gi", None
    )

    assert chunks[0].content_original == FRACTIONS


async def test_keyword_search_ranks_by_the_best_matching_part_of_a_long_chunk(
    session: AsyncSession, interaction_with_chunks: Interaction
):
    # The name is a small part of the chunk: whole-chunk similarity would rank it low
    chunks = await keyword_search(
        session, interaction_with_chunks, "Lưu Hoằng Tháo", None
    )

    assert chunks[0].content_original == HISTORY


# ----- EVALUATION DATA SET ----- #


def test_every_question_has_evidence_in_its_document_and_in_one_chunk():
    corpus = rag_eval.load_corpus()
    questions = rag_eval.load_questions()

    assert len(corpus) >= 10
    assert len(questions) >= 30

    chunks = {
        name: smart_splitter.split_text(contents) for name, contents in corpus.items()
    }
    for question in questions:
        assert question.category in {"paraphrase", "keyword", "no_diacritics"}
        assert question.evidence in corpus[question.document], question.question
        # A phrase cut in two by a chunk boundary could never be retrieved
        assert any(
            rag_eval.is_relevant(chunk, question.evidence)
            for chunk in chunks[question.document]
        ), question.question


# ----- EVALUATION ARITHMETIC ----- #


def test_first_relevant_rank_is_one_based_and_ignores_whitespace_differences():
    ranked = ["about water", "tử số  và\nmẫu số", "tử số và mẫu số again"]

    assert rag_eval.first_relevant_rank(ranked, "tử số và mẫu số") == 2
    assert rag_eval.first_relevant_rank(ranked, "not there") is None


def test_a_relevant_chunk_below_the_cutoff_counts_as_not_found():
    ranked = ["x"] * rag_eval.CUTOFF + ["the answer"]

    assert rag_eval.first_relevant_rank(ranked, "the answer") is None


def test_summarise_computes_hit_rates_and_mean_reciprocal_rank():
    summary = rag_eval.summarise([1, 2, None, 5])

    assert summary["hit@1"] == 0.25
    assert summary["hit@3"] == 0.5
    assert summary["hit@5"] == 0.75
    assert summary["mrr"] == pytest.approx((1 + 1 / 2 + 0 + 1 / 5) / 4)
    assert summary["questions"] == 4


def test_summarise_by_category_reports_each_category_and_the_total():
    questions = [
        rag_eval.Question("keyword", "a.txt", "q1", "e1"),
        rag_eval.Question("paraphrase", "a.txt", "q2", "e2"),
        rag_eval.Question("keyword", "a.txt", "q3", "e3"),
    ]

    report = rag_eval.summarise_by_category(questions, [1, None, 3])

    assert list(report) == ["all", "keyword", "paraphrase"]
    assert report["keyword"]["hit@1"] == 0.5
    assert report["keyword"]["hit@3"] == 1.0
    assert report["paraphrase"]["hit@5"] == 0.0
    assert report["all"]["questions"] == 3


async def test_embedding_cache_only_calls_the_api_for_new_texts(tmp_path, monkeypatch):
    monkeypatch.setattr(rag_eval, "CACHE_FILE", tmp_path / "embeddings.json")
    calls: list[list[str]] = []

    async def fake_embed(texts: list[str]) -> list[list[float]]:
        calls.append(texts)
        return [[float(len(text))] for text in texts]

    first = await rag_eval.embed_with_cache(["a", "bb", "a"], fake_embed, "model")
    second = await rag_eval.embed_with_cache(["bb", "ccc"], fake_embed, "model")

    assert first == [[1.0], [2.0], [1.0]]
    assert second == [[2.0], [3.0]]
    assert calls == [["a", "bb"], ["ccc"]]
