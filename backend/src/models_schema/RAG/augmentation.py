from pydantic import BaseModel


class AugmentationParams(BaseModel):
    prompt: str


class AnswerGenerationParams(AugmentationParams):
    context_conversations: str
    context_chunks: str
    personal_information: str


class StudyActivityParams(AugmentationParams):
    context_conversations: str
    context_chunks: str
    subject_type: str
    json_schema: str
    activity_format: str
    personal_information: str


class PromptRewriteParams(AugmentationParams):
    context_conversations: str


class GradingParams(AugmentationParams):
    creation_prompt: str
    context_chunks: str


class DocumentAnalysisParams(AugmentationParams):
    name: str
    subject_type: str | None
    document_type: str
    personal_information: str


class StudyAssessmentParams(BaseModel):
    personal_information: str
    context_events: str
