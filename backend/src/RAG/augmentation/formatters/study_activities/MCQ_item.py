from backend.src.models_schema.activity.exercise_item import ExerciseItem


def MCQ_item_formatter(item: ExerciseItem) -> str:
    return f"""Question: {item.question}
Choices:
{"\n".join(item_content.content for item_content in item.contents)}
Student answer: {"Correct" if item.user_score > 0 else ("Wrong" if item.study_activity.is_submitted else "This exercise hasn't been submitted.")}
LLM grader's assessment: {item.explanation if item.study_activity.is_submitted else "This exercise hasn't been submitted."}
"""
