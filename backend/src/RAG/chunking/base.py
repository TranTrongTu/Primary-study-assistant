from abc import ABC, abstractmethod
from types import CoroutineType
from typing import Any

from fastapi import UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.config import settings
from backend.src.exceptions.core import ExceptionLLMError_502
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_analysis import (
    DocumentAnalysis,
    DocumentAnalysisSchema,
    MaterialRecommendation,
    QuestionRecommendation,
)
from backend.src.models_schema.user.user import User

smart_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.DEFAULT_CHUNK_SIZE,
    chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP,
    separators=["\n\n", "\n", ".", " ", ""],
)


class DocumentExtractor(ABC):
    @classmethod
    @abstractmethod
    def verify(cls, file: UploadFile) -> bool:
        """
        Verifies whether a file is of a certain format.
        """
        pass

    @classmethod
    @abstractmethod
    async def extract(
        cls,
        user: User,
        session: AsyncSession,
        file: UploadFile,
        document: Document,
        subject_type_overwrite: bool,
    ) -> DocumentAnalysis | None:
        """
        Extracts and saves chunks.
        """
        pass


def save_document_analysis(
    session: AsyncSession,
    analysis: str,
    document: Document,
    subject_type_overwrite: bool,
) -> DocumentAnalysis:
    """
    Validates and saves the document analysis.
    """
    validated_analysis = DocumentAnalysisSchema.model_validate_json(analysis)

    # Automatic subject type filling, validates based on 3 criteria: user's desire to overwrite, model's decision to overwrite, and whether the input type was null
    if (
        subject_type_overwrite
        and validated_analysis.subject_type_overwrite
        and document.subject_type is None
    ):
        document.subject_type = validated_analysis.subject_type

    material_recommendations = []
    for material_recommendation_schema in validated_analysis.material_recommendations:
        material_recommendation = MaterialRecommendation(
            **material_recommendation_schema.model_dump()
        )
        material_recommendations.append(material_recommendation)

    question_recommendations = []
    for question_recommendation_schema in validated_analysis.question_recommendations:
        question_recommendation = QuestionRecommendation(
            **question_recommendation_schema.model_dump()
        )
        question_recommendations.append(question_recommendation)

    document_analysis = DocumentAnalysis(
        summary=validated_analysis.summary,
        material_recommendations=material_recommendations,
        question_recommendations=question_recommendations,
    )

    session.add_all(material_recommendations)
    session.add_all(question_recommendations)
    session.add(document_analysis)

    return document_analysis


def analysis_task_generator(
    session: AsyncSession,
    final_prompt: str,
    document: Document,
    subject_type_overwrite: bool,
) -> CoroutineType[Any, Any, DocumentAnalysis]:
    """
    Generates an "analysis_task" (a Couroutine), ready to be awaited.
    """

    async def perform_analysis() -> DocumentAnalysis:
        i_retry = 0
        while True:
            analysis = await GlobalAPI.generate_document_analysis(
                final_prompt, DocumentAnalysisSchema
            )

            try:
                document_analysis = save_document_analysis(
                    session, analysis, document, subject_type_overwrite
                )
                return document_analysis
            except ValidationError as e:
                i_retry += 1
                if i_retry >= settings.DEFAULT_N_GENERATION_RETRIES:
                    raise ExceptionLLMError_502(
                        f"Incorrect content format. Details: {e}"
                    )

    analysis_task = perform_analysis()

    return analysis_task
