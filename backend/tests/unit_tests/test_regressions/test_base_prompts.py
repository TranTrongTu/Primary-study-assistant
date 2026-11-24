"""
The base prompts share one CURRICULUM constant instead of six pasted copies.

These tests make sure every prompt that needs the curriculum still gets it exactly
once, and that the curriculum can never break str.format (a stray brace in it would
raise KeyError or IndexError for every request using that prompt).
"""

import string

import pytest

from backend.src.RAG.augmentation.prompts_formatting import base_prompts as bp

PROMPTS_WITH_CURRICULUM = [
    "ANSWER_GENERATION_BASE_PROMPT",
    "STUDY_ACTIVITY_BASE_PROMPT",
    "OPEN_ENDED_GRADING_BASE_PROMPT",
    "MCQ_GRADING_BASE_PROMPT",
    "DOCUMENT_ANALYSIS_BASE_PROMPT",
    "STUDY_ASSESSMENT_BASE_PROMPT",
]
ALL_PROMPTS = [name for name in vars(bp) if name.endswith("_BASE_PROMPT")]


def fill(template: str) -> str:
    fields = {name for _, name, _, _ in string.Formatter().parse(template) if name}
    return template.format(**dict.fromkeys(fields, "<value>"))


def test_the_curriculum_has_no_format_braces():
    assert "{" not in bp.CURRICULUM
    assert "}" not in bp.CURRICULUM


@pytest.mark.parametrize("name", PROMPTS_WITH_CURRICULUM)
def test_each_prompt_contains_the_curriculum_once(name):
    rendered = fill(getattr(bp, name))

    assert rendered.count(bp.CURRICULUM) == 1
    assert rendered.count("=== CURRICULUM ===") == 1


@pytest.mark.parametrize("name", ALL_PROMPTS)
def test_every_prompt_still_formats(name):
    rendered = fill(getattr(bp, name))

    assert "<value>" in rendered
