from datetime import datetime

from fastapi import APIRouter

from backend.src.core.dependencies import (
    DatetimeDep,
    InteractionDep,
    SessionDep,
    UserDep,
)
from backend.src.exceptions.core import Responses
from backend.src.models_schema.activity.exercise_item import (
    ExerciseItemOutput,
    ExerciseItemUpdate,
)
from backend.src.models_schema.activity.review_item import (
    FlashcardInput,
    FlashcardUpdate,
    ReviewItemOutput,
)
from backend.src.models_schema.activity.study_activity import (
    FlashcardsActivityInput,
    StudyActivityInput,
    StudyActivityOutput,
    StudyActivityOutputComplete,
    StudyActivityUpdate,
)
from backend.src.services import study_activity

router = APIRouter()

# ----- CREATE ----- #


@router.post(
    "/{interaction_id}/create",
    response_model=StudyActivityOutputComplete,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
        502: Responses.RESPONSE_502_BAD_GATEWAY,
        503: Responses.RESPONSE_503_SERVICE_UNAVAILABLE,
    },
)
async def create_study_activity(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    interaction: InteractionDep,
    study_activity_input: StudyActivityInput,
):
    """
    Tạo một dạng tài liệu tùy vào các yêu cầu trong request.
    """
    return await study_activity.create_study_activity(
        user=user,
        session=session,
        current_datetime=current_datetime,
        interaction=interaction,
        study_activity_input=study_activity_input,
    )


@router.post(
    "/{interaction_id}/flashcards/create",
    response_model=StudyActivityOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
    },
)
async def create_flashcards_activity(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    interaction: InteractionDep,
    flashcards_activity_input: FlashcardsActivityInput,
):
    """
    Tạo một tài liệu Flashcards rỗng.
    """
    return await study_activity.create_flashcards_activity(
        session=session,
        current_datetime=current_datetime,
        interaction=interaction,
        flashcards_activity_input=flashcards_activity_input,
    )


@router.post(
    "/{flashcards_activity_id}/add-cards",
    response_model=StudyActivityOutputComplete,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def add_flashcards(
    user: UserDep,
    session: SessionDep,
    flashcards_activity_id: int,
    flashcard_inputs: list[FlashcardInput],
):
    """
    Thêm flashcards cho một tài liệu Flashcards.
    """
    return await study_activity.add_flashcards(
        user=user,
        session=session,
        flashcard_inputs=flashcard_inputs,
        flashcards_activity_id=flashcards_activity_id,
    )


# ----- READ ----- #


@router.get(
    "/{interaction_id}/",
    response_model=list[StudyActivityOutput],
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def read_all_study_activity(
    user: UserDep,
    session: SessionDep,
    interaction: InteractionDep,
):
    """
    Đọc thông tin khái quát của tất cả dạng tài liệu đã tạo trong Interaction.
    """
    return await study_activity.read_all_study_activity(
        session=session,
        interaction=interaction,
    )


@router.get(
    "/{study_activity_id}",
    response_model=StudyActivityOutputComplete,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def read_study_activity_complete(
    user: UserDep,
    session: SessionDep,
    study_activity_id: int,
):
    """
    Đọc thông tin chi tiết của một tài liệu.
    """
    unvalidated = await study_activity.read_study_activity_complete(
        user=user,
        session=session,
        study_activity_id=study_activity_id,
    )

    if unvalidated.is_submitted:
        study_activity_output_complete = StudyActivityOutputComplete.model_validate(
            unvalidated, context={"show_answers": True}
        )
    else:
        study_activity_output_complete = StudyActivityOutputComplete.model_validate(
            unvalidated
        )

    return study_activity_output_complete


# ----- UPDATE ----- #


@router.patch(
    "/{study_activity_id}/update",
    response_model=StudyActivityOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def update_study_activity(
    user: UserDep,
    session: SessionDep,
    study_activity_id: int,
    study_activity_update: StudyActivityUpdate,
):
    """
    Cập nhật thông tin khái quát của một tài liệu (tên và mô tả).
    """
    return await study_activity.update_study_activity(
        user=user,
        session=session,
        study_activity_id=study_activity_id,
        study_activity_update=study_activity_update,
    )


@router.patch(
    "/flashcards/{flashcard_id}",
    response_model=ReviewItemOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def update_flashcard(
    user: UserDep,
    session: SessionDep,
    flashcard_id: int,
    flashcard_update: FlashcardUpdate,
):
    """
    Chỉnh sửa một flashcard.
    """
    return await study_activity.update_flashcard(
        user=user,
        session=session,
        flashcard_id=flashcard_id,
        flashcard_update=flashcard_update,
    )


@router.patch(
    "/{exercise_item_id}/answer",
    response_model=ExerciseItemOutput,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
        409: Responses.RESPONSE_409_CONFLICT,
    },
)
async def answer_exercise_item(
    user: UserDep,
    session: SessionDep,
    exercise_item_id: int,
    exercise_item_update: ExerciseItemUpdate,
):
    """
    Trả lời MỘT câu hỏi trong một tài liệu dạng Exercise.
    """
    return await study_activity.answer_exercise_item(
        user=user,
        session=session,
        exercise_item_id=exercise_item_id,
        exercise_item_update=exercise_item_update,
    )


@router.patch(
    "/{study_activity_id}/submit",
    response_model=StudyActivityOutputComplete,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
        409: Responses.RESPONSE_409_CONFLICT,
        502: Responses.RESPONSE_502_BAD_GATEWAY,
        503: Responses.RESPONSE_503_SERVICE_UNAVAILABLE,
    },
)
async def submit_exercise_activity(
    user: UserDep,
    session: SessionDep,
    current_datetime: DatetimeDep,
    study_activity_id: int,
):
    """
    Nộp tài liệu dạng Exercise.
    """
    unvalidated = await study_activity.submit_exercise_activity(
        user=user,
        session=session,
        current_datetime=current_datetime,
        study_activity_id=study_activity_id,
    )

    study_activity_output_complete = StudyActivityOutputComplete.model_validate(
        unvalidated, context={"show_answers": True}
    )

    return study_activity_output_complete


# ----- DELETE ----- #


@router.delete(
    "/flashcards/{flashcard_id}",
    status_code=204,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def delete_flashcard(user: UserDep, session: SessionDep, flashcard_id: int):
    """
    Xóa một flashcard.
    """
    return await study_activity.delete_flashcard(
        user,
        session,
        flashcard_id,
    )


@router.delete(
    "/{study_activity_id}",
    status_code=204,
    responses={
        401: Responses.RESPONSE_401_UNAUTHORIZED,
        404: Responses.RESPONSE_404_NOT_FOUND,
    },
)
async def delete_study_activity(
    user: UserDep,
    session: SessionDep,
    study_activity_id: int,
):
    """
    Xóa một tài liệu.
    """
    return await study_activity.delete_study_activity(
        user,
        session,
        study_activity_id,
    )
