import asyncio

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.ai_api import GlobalAPI
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_analysis import DocumentAnalysis
from backend.src.models_schema.document.document_chunk import DocumentChunk
from backend.src.models_schema.miscellaneous.enums import DocumentType
from backend.src.models_schema.RAG.augmentation import DocumentAnalysisParams
from backend.src.models_schema.user.user import User
from backend.src.RAG.augmentation.core.specific_augmentations import (
    document_analysis_augmentation,
)
from backend.src.RAG.chunking.base import (
    DocumentExtractor,
    analysis_task_generator,
)


class ImageExtractor(DocumentExtractor):
    @classmethod
    def verify(cls, file: UploadFile) -> bool:
        # === Content type === #
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed_types:
            return False

        # === Header === #
        header = file.file.read(12)
        file.file.seek(0)

        is_jpeg = header.startswith(b"\xff\xd8\xff")
        is_png = header.startswith(b"\x89PNG\r\n\x1a\n")
        is_webp = header.startswith(b"RIFF") and header[8:12] == b"WEBP"

        if not (is_jpeg or is_png or is_webp):
            return False

        return True

    @classmethod
    async def extract(
        cls,
        user: User,
        session: AsyncSession,
        file: UploadFile,
        document: Document,
        subject_type_overwrite: bool,
    ) -> DocumentAnalysis:
        # Reads the image using the model
        image_description = await GlobalAPI.caption_image(file)

        document.text = image_description

        embedding_content = (
            f"Source: {DocumentType.IMAGE.value} file {document.name}:\n"
            + image_description
        )

        # Runs tasks in parallel

        # Defines tasks
        embed_task = GlobalAPI.embed(embedding_content)

        params = DocumentAnalysisParams(
            prompt=image_description,
            name=document.name,
            subject_type=document.subject_type,
            document_type=document.type,
            personal_information=user.description,
        )
        final_prompt = document_analysis_augmentation(params)

        analysis_task = analysis_task_generator(
            session, final_prompt, document, subject_type_overwrite
        )

        # Calls LLM
        vector, document_analysis = await asyncio.gather(embed_task, analysis_task)

        # Saves the vector
        prepared_chunk = DocumentChunk(
            content_original=f"[IMAGE DESCRIPTION]: {image_description}",
            content_embedded=vector,
            document=document,
        )
        session.add(prepared_chunk)

        # Saves the analysis
        document.document_analysis = document_analysis

        return document_analysis
