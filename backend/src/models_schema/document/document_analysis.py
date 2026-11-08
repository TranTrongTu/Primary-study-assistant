from typing import TYPE_CHECKING, Annotated

from sqlmodel import Field, Relationship, SQLModel

from backend.src.models_schema.miscellaneous.enums import (
    StudyActivityFormat,
    SubjectType,
)

if TYPE_CHECKING:
    from backend.src.models_schema.document.document import Document

# ----- MATERIAL RECOMMENDATION ----- #

# === BASE === #


class MaterialRecommendationBase(SQLModel):
    prompt: str
    activity_format: StudyActivityFormat
    subject_type: SubjectType


# === OUTPUT === #


class MaterialRecommendationOutput(MaterialRecommendationBase):
    pass


# === SCHEMA === #


class MaterialRecommendationSchema(MaterialRecommendationBase):
    pass


# === TABLE MODEL === #


class MaterialRecommendation(MaterialRecommendationBase, table=True):
    __tablename__ = "material_recommendation"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    document_analysis_id: Annotated[
        int | None,
        Field(
            foreign_key="document_analysis.id",
            nullable=False,
            ondelete="CASCADE",
        ),
    ] = None

    document_analysis: "DocumentAnalysis" = Relationship(
        back_populates="material_recommendations"
    )


# ----- QUESTION RECOMMENDATION ----- #

# === BASE === #


class QuestionRecommendationBase(SQLModel):
    prompt: str


# === OUTPUT === #


class QuestionRecommendationOutput(QuestionRecommendationBase):
    pass


# === SCHEMA === #


class QuestionRecommendationSchema(QuestionRecommendationBase):
    pass


# === TABLE MODEL === #


class QuestionRecommendation(QuestionRecommendationBase, table=True):
    __tablename__ = "question_recommendation"  # type: ignore

    id: Annotated[int | None, Field(primary_key=True, nullable=False)] = None
    document_analysis_id: Annotated[
        int | None,
        Field(
            foreign_key="document_analysis.id",
            nullable=False,
            ondelete="CASCADE",
        ),
    ] = None

    document_analysis: "DocumentAnalysis" = Relationship(
        back_populates="question_recommendations"
    )


# ----- DOCUMENT ANALYSIS ----- #

# === BASE === #


class DocumentAnalysisBase(SQLModel):
    summary: str


# === OUTPUT === #


class DocumentAnalysisOutput(DocumentAnalysisBase):
    material_recommendations: list[MaterialRecommendationOutput]
    question_recommendations: list[QuestionRecommendationOutput]


# === SCHEMA === #


class DocumentAnalysisSchema(DocumentAnalysisBase):
    subject_type: SubjectType
    subject_type_overwrite: bool
    material_recommendations: list[MaterialRecommendationSchema]
    question_recommendations: list[QuestionRecommendationSchema]


# === TABLE MODEL === #


class DocumentAnalysis(DocumentAnalysisBase, table=True):
    __tablename__ = "document_analysis"  # type: ignore

    id: Annotated[
        int | None,
        Field(
            primary_key=True,
            nullable=False,
        ),
    ] = None
    document_id: Annotated[
        int | None,
        Field(
            foreign_key="document.id",
            nullable=False,
            ondelete="CASCADE",
        ),
    ] = None

    material_recommendations: list[MaterialRecommendation] = Relationship(
        back_populates="document_analysis",
    )
    question_recommendations: list[QuestionRecommendation] = Relationship(
        back_populates="document_analysis",
    )
    document: "Document" = Relationship(back_populates="document_analysis")
