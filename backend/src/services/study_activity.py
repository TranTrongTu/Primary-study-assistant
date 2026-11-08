import json
from datetime import datetime, timezone
from typing import Callable

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col, delete, select, update

from backend.src.core.ai_api import ExceptionRequest_400, GlobalAPI
from backend.src.core.config import settings
from backend.src.exceptions.core import (
    ExceptionLLMError_502,
    ExceptionNotFound_404,
    ExceptionSubmittedExercise_409,
)
from backend.src.models_schema.activity.exercise_item import (
    ExerciseItem,
    ExerciseItemUpdate,
)
from backend.src.models_schema.activity.exercise_item_content import ExerciseItemContent
from backend.src.models_schema.activity.llm_request_json_schema import (
    ForGradingSchema,
    MCQForGradingSchema,
    OpenEndedForGradingSchema,
)
from backend.src.models_schema.activity.llm_return_json_schema import (
    FlashcardsSchema,
    GapFillSchema,
    GradedItemSchema,
    GradedSchema,
    MCQGradedCrossValidation,
    MCQGradedSchema,
    MCQSchema,
    OpenEndedCreationSchema,
    OpenEndedGradedCrossValidation,
    OpenEndedGradedSchema,
    StudyActivityValidationBase,
)
from backend.src.models_schema.activity.review_item import (
    FlashcardInput,
    FlashcardUpdate,
    ReviewItem,
)
from backend.src.models_schema.activity.review_item_content import ReviewItemContent
from backend.src.models_schema.activity.study_activity import (
    FlashcardsActivityInput,
    StudyActivity,
    StudyActivityInput,
    StudyActivityUpdate,
)
from backend.src.models_schema.interaction.interaction import Interaction
from backend.src.models_schema.miscellaneous.enums import (
    ExerciseItemContentType,
    ReviewItemContentType,
    StudyActivityFormat,
    StudyActivityType,
)
from backend.src.models_schema.RAG.augmentation import (
    AugmentationParams,
    GradingParams,
    StudyActivityParams,
)
from backend.src.models_schema.user.user import User
from backend.src.RAG.augmentation.core.specific_augmentations import (
    mcq_grading_augmentation,
    open_ended_grading_augmentation,
    study_activity_augmentation,
)
from backend.src.RAG.augmentation.formatters.chunks.core import chunks_formatter
from backend.src.RAG.augmentation.formatters.conversations.core import (
    conversations_formatter,
)
from backend.src.RAG.augmentation.prompts_formatting.study_activity_format_prompts import (
    MCQ_format_prompt,
    flashcards_format_prompt,
    gap_fill_format_prompt,
    open_ended_format_prompt,
)
from backend.src.RAG.retrieval.core import retrieval
from backend.src.RAG.retrieval.prompt_rewrite import rewrite_prompt
from backend.src.services.llm_response import read_llm_responses

# ----- CREATE ----- #

format_schema_map: dict[
    StudyActivityFormat,
    tuple[str, type[StudyActivityValidationBase]],
] = {
    StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS: (
        MCQ_format_prompt,
        MCQSchema,
    ),
    StudyActivityFormat.FLASHCARDS: (flashcards_format_prompt, FlashcardsSchema),
    StudyActivityFormat.GAP_FILL: (gap_fill_format_prompt, GapFillSchema),
    StudyActivityFormat.OPEN_ENDED: (open_ended_format_prompt, OpenEndedCreationSchema),
}


def save_multiple_choice_questions(
    activity_data: StudyActivityValidationBase,
    study_activity: StudyActivity,
) -> None:
    assert isinstance(activity_data, MCQSchema)

    question_score = settings.DEFAULT_EXERCISE_TOTAL_SCORE / len(
        activity_data.activity_items
    )

    # Begins saving
    exercise_items = []
    for item in activity_data.activity_items:
        # Saves item contents
        exercise_item_contents = [
            ExerciseItemContent(
                content=answer,
                type=ExerciseItemContentType.MULTIPLE_CHOICE_QUESTIONS_CHOICE,
                is_correct=(i_answer == item.correct),
            )
            for i_answer, answer in enumerate(item.answers)
        ]

        # Saves item
        exercise_item = ExerciseItem(
            max_score=question_score,
            question=item.question,
            contents=exercise_item_contents,
        )

        exercise_items.append(exercise_item)

    study_activity.exercise_items = exercise_items


def save_open_ended(
    activity_data: StudyActivityValidationBase,
    study_activity: StudyActivity,
) -> None:
    assert isinstance(activity_data, OpenEndedCreationSchema)

    question_score = settings.DEFAULT_EXERCISE_TOTAL_SCORE / len(
        activity_data.activity_items
    )

    # Begins saving
    exercise_items = []
    for item in activity_data.activity_items:
        # Saves item contents
        exercise_item_content = [
            ExerciseItemContent(
                content=item.correct,
                type=ExerciseItemContentType.OPEN_ENDED_CORRECT,
                is_correct=True,
            )
        ]

        # Saves item
        exercise_item = ExerciseItem(
            max_score=question_score,
            question=item.question,
            contents=exercise_item_content,
        )

        exercise_items.append(exercise_item)

    study_activity.exercise_items = exercise_items


def save_gap_fill(
    activity_data: StudyActivityValidationBase,
    study_activity: StudyActivity,
) -> None:
    assert isinstance(activity_data, GapFillSchema)

    # Begins saving
    review_items = []
    for item in activity_data.activity_items:
        # Saves item contents
        review_item_text = ReviewItemContent(
            content=item.text,
            type=ReviewItemContentType.GAP_FILL_TEXT,
        )
        review_item_corrects = [
            ReviewItemContent(
                content=correct,
                type=ReviewItemContentType.GAP_FILL_CORRECT,
            )
            for correct in item.corrects
        ]
        review_item_distractors = [
            ReviewItemContent(
                content=distractor,
                type=ReviewItemContentType.GAP_FILL_DISTRACTOR,
            )
            for distractor in item.distractors
        ]
        review_item_contents = (
            [review_item_text] + review_item_corrects + review_item_distractors
        )

        # Saves item
        review_item = ReviewItem(contents=review_item_contents)

        review_items.append(review_item)

    study_activity.review_items = review_items


def save_flashcards(
    activity_data: StudyActivityValidationBase,
    study_activity: StudyActivity,
) -> None:
    assert isinstance(activity_data, FlashcardsSchema)

    # Begins saving
    review_items = []
    for item in activity_data.activity_items:
        # Saves item contents
        review_item_front = ReviewItemContent(
            content=item.front,
            type=ReviewItemContentType.FLASHCARDS_FRONT,
        )
        review_item_back = ReviewItemContent(
            content=item.back,
            type=ReviewItemContentType.FLASHCARDS_BACK,
        )
        review_item_contents = [review_item_front, review_item_back]

        # Saves item
        review_item = ReviewItem(contents=review_item_contents)

        review_items.append(review_item)

    study_activity.review_items = review_items


save_mapper = {
    StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS: save_multiple_choice_questions,
    StudyActivityFormat.OPEN_ENDED: save_open_ended,
    StudyActivityFormat.FLASHCARDS: save_flashcards,
    StudyActivityFormat.GAP_FILL: save_gap_fill,
}


async def create_study_activity(
    user: User,
    session: AsyncSession,
    current_datetime: datetime,
    interaction: Interaction,
    study_activity_input: StudyActivityInput,
) -> StudyActivity:

    # === Generates content from model using RAG === #

    # Gets past conversations
    past_conversations = await read_llm_responses(
        session, interaction, settings.DEFAULT_N_PAST_CONVERSATIONS
    )
    formatted_past_conversations = conversations_formatter(past_conversations)

    # Rewrites prompt
    rewritten_prompt = await rewrite_prompt(
        study_activity_input.prompt, formatted_past_conversations
    )

    # Retrieval (using the rewritten prompt)
    embedded_prompt = await GlobalAPI.embed(rewritten_prompt)
    document_chunks = await retrieval(
        session=session,
        interaction=interaction,
        raw_prompt=rewritten_prompt,
        embedded_prompt=embedded_prompt,
        document_id=study_activity_input.document_id,
    )
    formatted_chunks = chunks_formatter(document_chunks)

    # Temporary close
    await session.commit()

    # Augmentation
    json_schema, response_validator = format_schema_map[
        study_activity_input.activity_format
    ]

    params = StudyActivityParams(
        prompt=study_activity_input.prompt,
        context_conversations=formatted_past_conversations,
        context_chunks=formatted_chunks,
        json_schema=json_schema,
        subject_type=study_activity_input.subject_type,
        activity_format=study_activity_input.activity_format,
        personal_information=user.description,
    )

    final_prompt = study_activity_augmentation(params)

    i_retry = 0
    while True:
        try:
            # Generation
            generated_activity = await GlobalAPI.generate_material(
                final_prompt, response_validator
            )

            # Validates content from model
            validated_activity = response_validator.model_validate_json(
                generated_activity
            )

            # Catches errors
            cancellation_keywords = {
                "$!SUBJECT!$": "User's prompt contents doesn't match specified subject type.",
                "$!FORMAT!$": "User's prompt contents doesn't match specified activity format.",
                "$!SCOPE!$": "User's prompt contains irrelevant information.",
                "$!KNOWLEDGE!$": "User's prompt contains information that is too advanced.",
            }

            if (
                validated_activity.name in cancellation_keywords.keys()
                and validated_activity.description in cancellation_keywords.keys()
            ):
                if validated_activity.name != validated_activity.description:
                    raise ExceptionLLMError_502(
                        "Incorrect error format returned by the LLM."
                    )
                else:
                    raise ExceptionRequest_400(
                        cancellation_keywords[validated_activity.name]
                    )

            break

        except (ExceptionLLMError_502, ValidationError) as e:
            i_retry += 1
            if i_retry >= settings.DEFAULT_N_GENERATION_RETRIES:
                if isinstance(e, ExceptionLLMError_502):
                    raise
                else:
                    raise ExceptionLLMError_502(
                        f"Incorrect content format. Details: {e}"
                    )
            continue

    # === Saves response === #

    study_activity = StudyActivity(
        prompt=study_activity_input.prompt,
        activity_type=study_activity_input.activity_type,  # type: ignore
        activity_format=study_activity_input.activity_format,
        subject_type=study_activity_input.subject_type,
        name=validated_activity.name,
        description=validated_activity.description,
        interaction=interaction,
        created_at=current_datetime,
    )

    session.add(study_activity)

    saver = save_mapper[study_activity_input.activity_format]
    saver(
        activity_data=validated_activity,
        study_activity=study_activity,
    )

    await session.commit()  # Commits EVERYTHING

    return study_activity


async def create_flashcards_activity(
    session: AsyncSession,
    interaction: Interaction,
    current_datetime: datetime,
    flashcards_activity_input: FlashcardsActivityInput,
) -> StudyActivity:

    flashcards_activity = StudyActivity(
        prompt=None,
        activity_type=StudyActivityType.REVIEW,
        activity_format=StudyActivityFormat.FLASHCARDS,
        subject_type=flashcards_activity_input.subject_type,
        name=flashcards_activity_input.name,
        description=flashcards_activity_input.description,
        created_at=current_datetime,
        interaction=interaction,
    )

    session.add(flashcards_activity)
    await session.commit()
    # await session.refresh(flashcards_activity)

    return flashcards_activity


async def add_flashcards(
    user: User,
    session: AsyncSession,
    flashcard_inputs: list[FlashcardInput],
    flashcards_activity_id: int,
) -> StudyActivity:
    query = (
        select(StudyActivity)
        .join(Interaction)
        .where(
            StudyActivity.id == flashcards_activity_id,
            StudyActivity.activity_format == StudyActivityFormat.FLASHCARDS,
            StudyActivity.is_deleted == False,
            Interaction.user_id == user.id,
        )
        .options(
            selectinload(StudyActivity.review_items).selectinload(ReviewItem.contents)  # type: ignore
        )
    )
    flashcards_activity = (await session.execute(query)).scalars().first()

    if flashcards_activity is None:
        raise ExceptionNotFound_404(
            "StudyActivity",
            {
                "id": flashcards_activity_id,
                "user_id": user.id,
                "activity_format": StudyActivityFormat.FLASHCARDS.value,
                "is_deleted": False,
            },
        )

    flashcards = []
    for flashcard_input in flashcard_inputs:
        # Saves item contents
        flashcard_front = ReviewItemContent(
            content=flashcard_input.front,
            type=ReviewItemContentType.FLASHCARDS_FRONT,
        )
        flashcard_back = ReviewItemContent(
            content=flashcard_input.back,
            type=ReviewItemContentType.FLASHCARDS_BACK,
        )
        flashcard_contents = [flashcard_front, flashcard_back]

        # Saves item
        flashcard = ReviewItem(
            contents=flashcard_contents,
            study_activity=flashcards_activity,
        )

        flashcards.append(flashcard)

    session.add_all(flashcards)
    await session.commit()

    return flashcards_activity


# ----- READ ----- #


async def read_all_study_activity(
    session: AsyncSession,
    interaction: Interaction,
) -> list[StudyActivity]:
    query = select(StudyActivity).where(
        StudyActivity.interaction_id == interaction.id,
        StudyActivity.is_deleted == False,
    )
    study_activities = (await session.execute(query)).scalars().all()

    return list(study_activities)


async def read_study_activity_complete(
    user: User,
    session: AsyncSession,
    study_activity_id: int,
) -> StudyActivity:

    query = (
        select(StudyActivity)
        .join(Interaction)
        .where(
            StudyActivity.id == study_activity_id,
            Interaction.user_id == user.id,
            StudyActivity.is_deleted == False,
        )
        .options(
            selectinload(
                StudyActivity.review_items.and_(ReviewItem.is_deleted == False)  # type: ignore
            ).selectinload(ReviewItem.contents),  # type: ignore
            selectinload(
                StudyActivity.exercise_items.and_(ExerciseItem.is_deleted == False)  # type: ignore
            ).selectinload(
                ExerciseItem.contents  # type: ignore
            ),
        )
    )
    study_activity = (await session.execute(query)).scalars().first()

    if study_activity is None:
        raise ExceptionNotFound_404(
            "StudyActivity",
            {
                "id": study_activity_id,
                "interaction.user_id": user.id,
                "is_deleted": False,
            },
        )

    return study_activity


# ----- UPDATE ----- #


async def update_study_activity(
    user: User,
    session: AsyncSession,
    study_activity_id: int,
    study_activity_update: StudyActivityUpdate,
) -> StudyActivity:  # type: ignore
    query = (
        select(StudyActivity)
        .join(Interaction)
        .where(
            StudyActivity.id == study_activity_id,
            Interaction.user_id == user.id,
            StudyActivity.is_deleted == False,
        )
    )

    study_activity = (await session.execute(query)).scalars().first()

    if study_activity is None:
        raise ExceptionNotFound_404(
            "StudyActivity",
            {
                "id": study_activity_id,
                "interaction.user_id": user.id,
                "is_deleted": False,
            },
        )

    update_data = study_activity_update.model_dump(exclude_unset=True)

    study_activity.sqlmodel_update(update_data)

    session.add(study_activity)
    await session.commit()
    # await session.refresh(study_activity)

    return study_activity


async def update_flashcard(
    user: User,
    session: AsyncSession,
    flashcard_id: int,
    flashcard_update: FlashcardUpdate,
) -> ReviewItem:
    query = (
        select(ReviewItem)
        .join(StudyActivity)
        .join(Interaction)
        .where(
            ReviewItem.id == flashcard_id,
            ReviewItem.is_deleted == False,
            StudyActivity.activity_format == StudyActivityFormat.FLASHCARDS,
            Interaction.user_id == user.id,
        )
        .options(selectinload(ReviewItem.contents))  # type: ignore
    )

    flashcard = (await session.execute(query)).scalars().first()

    if flashcard is None:
        raise ExceptionNotFound_404(
            "ReviewItem",
            {
                "id": flashcard_id,
                "user_id": user.id,
                "activity_format": StudyActivityFormat.FLASHCARDS.value,
                "is_deleted": False,
            },
        )

    for face in flashcard.contents:
        if face.type == ReviewItemContentType.FLASHCARDS_BACK:
            face.content = flashcard_update.back
        elif face.type == ReviewItemContentType.FLASHCARDS_FRONT:
            face.content = flashcard_update.front

    await session.commit()
    # await session.refresh(flashcard, attribute_names=["contents"])

    return flashcard


async def answer_exercise_item(
    user: User,
    session: AsyncSession,
    exercise_item_id: int,
    exercise_item_update: ExerciseItemUpdate,
) -> ExerciseItem:  # type: ignore
    # Gets the item
    query = (
        select(ExerciseItem, StudyActivity)
        .join(StudyActivity)
        .join(Interaction)
        .where(
            ExerciseItem.id == exercise_item_id,
            Interaction.user_id == user.id,
            ExerciseItem.is_deleted == False,
        )
        .options(selectinload(ExerciseItem.contents))  # type: ignore
    )

    row = (await session.execute(query)).first()

    if row is None:
        raise ExceptionNotFound_404(
            "ExerciseItem",
            {
                "id": exercise_item_id,
                "user_id": user.id,
                "is_deleted": False,
            },
        )

    exercise_item, study_activity = row

    assert isinstance(exercise_item, ExerciseItem)
    assert isinstance(study_activity, StudyActivity)

    # Checks for submission status
    if study_activity.is_submitted:
        raise ExceptionSubmittedExercise_409()

    # If MCQ, grades the answer immediately
    if study_activity.activity_format == StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS:
        # Validates integer type
        if not isinstance(exercise_item_update.attempt, int):
            raise ExceptionRequest_400(
                custom_message="Answers to multiple choice questions need to be an integer pointing to the id of the correct answer."
            )

        # Grades and updates score, this score isn't shown until the exercise is submitted
        for content in exercise_item.contents:
            if exercise_item_update.attempt == content.id:
                if content.is_correct:
                    exercise_item.user_score = exercise_item.max_score
                else:
                    exercise_item.user_score = 0
                break

        # Validates valid answer id
        else:
            raise ExceptionRequest_400(
                custom_message="Answer did not match the id of any of the answers of the current question."
            )
    else:
        if not isinstance(exercise_item_update.attempt, str):
            raise ExceptionRequest_400(
                custom_message="Answer needs to be of type string."
            )

    # Updates answer
    exercise_item.attempt = str(exercise_item_update.attempt)

    await session.commit()

    return exercise_item


async def submit_exercise_activity(
    user: User,
    session: AsyncSession,
    current_datetime: datetime,
    study_activity_id: int,
) -> StudyActivity:

    # === Fetches and sets up the study activity === #
    query = (
        select(StudyActivity, Interaction)
        .join(Interaction)
        .where(
            Interaction.user_id == user.id,
            StudyActivity.id == study_activity_id,
            StudyActivity.activity_type == StudyActivityType.EXERCISE,
            StudyActivity.is_deleted == False,
        )
        .options(
            selectinload(
                StudyActivity.exercise_items.and_(ExerciseItem.is_deleted == False)  # type: ignore
            ).selectinload(
                ExerciseItem.contents  # type: ignore
            ),
        )
    )

    row = (await session.execute(query)).first()

    if row is None:
        raise ExceptionNotFound_404(
            "StudyActivity",
            {
                "id": study_activity_id,
                "user_id": user.id,
                "activity_type": StudyActivityType.EXERCISE.value,
                "is_deleted": False,
            },
        )

    study_activity, interaction = row

    assert isinstance(study_activity, StudyActivity)
    assert isinstance(interaction, Interaction)

    # Checks for submission status
    if study_activity.is_submitted:
        raise ExceptionSubmittedExercise_409()

    # === Grading / explaining the questions and answers === #

    # Different configurations for different exercise format type (instead of built-in categorization in the configurations).
    GRADING_CONFIGURATIONS: dict[
        StudyActivityFormat,
        tuple[
            type[ForGradingSchema],
            Callable[[AugmentationParams], str],
            type[GradedSchema],
            type[GradedSchema],
        ],
    ] = {
        StudyActivityFormat.OPEN_ENDED: (
            OpenEndedForGradingSchema,
            open_ended_grading_augmentation,
            OpenEndedGradedSchema,
            OpenEndedGradedCrossValidation,
        ),
        StudyActivityFormat.MULTIPLE_CHOICE_QUESTIONS: (
            MCQForGradingSchema,
            mcq_grading_augmentation,
            MCQGradedSchema,
            MCQGradedCrossValidation,
        ),
    }
    (
        exercise_work_schema,
        grading_augmentation,
        graded_schema,
        cross_validation_schema,
    ) = GRADING_CONFIGURATIONS[study_activity.activity_format]

    # ++ Preparing the json input ++ #

    # Fetches questions and answers from the activity
    exercise_works = exercise_work_schema.model_validate(study_activity)

    # ++ Preparing the context document ++ #

    # Fetches just the questions for retrieval
    prompt_for_retrieval = "\n".join(
        item.question for item in study_activity.exercise_items
    )

    # Embeds and retrieves relevant information (document chunks)
    embedded_prompt = await GlobalAPI.embed(prompt_for_retrieval)
    document_chunks = await retrieval(
        session=session,
        interaction=interaction,
        raw_prompt=prompt_for_retrieval,
        embedded_prompt=embedded_prompt,
        document_id=None,
    )

    await session.commit()  # Temporary close

    formatted_chunks = chunks_formatter(document_chunks)

    params = GradingParams(
        prompt=exercise_works.model_dump_json(),
        creation_prompt=study_activity.prompt,  # type: ignore
        context_chunks=formatted_chunks,
    )

    final_prompt = grading_augmentation(params)

    # ++ Grading ++ #

    i_retry = 0

    while True:
        # API call
        try:
            grading_results = await GlobalAPI.grade_answers(final_prompt, graded_schema)
            grading_results_python: dict = json.loads(grading_results)
            grading_results_python.update(
                {"grading_input": exercise_works.model_dump()}
            )

            validated_grading_results = cross_validation_schema.model_validate(
                grading_results_python
            )
            break

        # Catches errors, if retry limit exceeded, throws a 502
        except (ExceptionLLMError_502, ValidationError) as e:
            i_retry += 1
            if i_retry >= settings.DEFAULT_N_GENERATION_RETRIES:
                if isinstance(e, ExceptionLLMError_502):
                    raise
                else:
                    raise ExceptionLLMError_502(
                        f"Incorrect content format. Details: {e}"
                    )
            continue

    # ++ Saving grading results ++ #

    results_map: dict[int, GradedItemSchema] = {
        res.id: res for res in validated_grading_results.grading_results
    }

    for exercise_item in study_activity.exercise_items:
        # No need more validation here because the validator already made sure every item is graded
        assert exercise_item.id is not None
        graded_result = results_map[exercise_item.id]

        # Updates score and / or explanation
        exercise_item.sqlmodel_update(graded_result.model_dump(exclude={"id"}))
        session.add(exercise_item)

    # === Updates status and returns === #
    study_activity.is_submitted = True
    study_activity.submitted_at = current_datetime

    await session.commit()

    return study_activity


# ----- DELETE ----- #


async def delete_flashcard(
    user: User,
    session: AsyncSession,
    flashcard_id: int,
) -> None:
    query = (
        select(ReviewItem)
        .join(StudyActivity)
        .join(Interaction)
        .where(
            ReviewItem.id == flashcard_id,
            ReviewItem.is_deleted == False,
            StudyActivity.activity_format == StudyActivityFormat.FLASHCARDS,
            Interaction.user_id == user.id,
        )
    )

    flashcard = (await session.execute(query)).scalars().first()

    if flashcard is None:
        raise ExceptionNotFound_404(
            "ReviewItem",
            {
                "id": flashcard_id,
                "user_id": user.id,
                "activity_format": StudyActivityFormat.FLASHCARDS.value,
                "is_deleted": False,
            },
        )

    flashcard.is_deleted = True

    await session.commit()


async def soft_delete_items(session: AsyncSession, study_activity_id: int):
    query_exercise = (
        update(ExerciseItem)
        .where(col(ExerciseItem.study_activity_id) == study_activity_id)
        .values(is_deleted=True)
    )

    query_review = (
        update(ReviewItem)
        .where(col(ReviewItem.study_activity_id) == study_activity_id)
        .values(is_deleted=True)
    )

    await session.execute(query_exercise)
    await session.execute(query_review)


async def delete_study_activity(
    user: User,
    session: AsyncSession,
    study_activity_id: int,
) -> None:
    query = (
        select(StudyActivity)
        .join(Interaction)
        .where(
            StudyActivity.id == study_activity_id,
            Interaction.user_id == user.id,
            StudyActivity.is_deleted == False,
        )
    )

    study_activity = (await session.execute(query)).scalars().first()

    if study_activity is None:
        raise ExceptionNotFound_404(
            "StudyActivity",
            {
                "id": study_activity_id,
                "interaction.user_id": user.id,
                "is_deleted": False,
            },
        )

    # Soft deletes the associated items
    await soft_delete_items(session, study_activity_id)

    # Soft deletes the activity
    study_activity.is_deleted = True

    await session.commit()
