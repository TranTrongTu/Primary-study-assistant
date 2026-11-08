import asyncio

from fastapi import UploadFile
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.ai_api import GlobalAPI
from backend.src.core.config import settings
from backend.src.exceptions.core import (
    ExceptionLLMError_502,
    ExceptionRequestValidation_400,
)
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
    smart_splitter,
)


class TextExtractor(DocumentExtractor):
    @classmethod
    def verify(cls, file: UploadFile) -> bool:
        # === Content type === #
        if file.content_type is None:
            return False

        print(file.content_type)

        is_text = (
            file.content_type.startswith("text/")
            or file.content_type == "application/json"
        )
        is_generic = file.content_type == "application/octet-stream"

        if not (is_text or is_generic):
            return False

        # === Header === #
        header = file.file.read(512)
        file.file.seek(0)

        print(header)

        if not header:
            return False

        if b"\x00" in header:
            return False

        try:
            header.decode("utf-8")
            return True

        except UnicodeDecodeError as e:
            if e.start >= len(header) - 4:
                return True

            return False

    @classmethod
    async def extract(
        cls,
        user: User,
        session: AsyncSession,
        file: UploadFile,
        document: Document,
        subject_type_overwrite: bool,
    ) -> DocumentAnalysis | None:
        # Reads the file
        text_bytes = await file.read()
        try:
            contents = text_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise ExceptionRequestValidation_400(
                "Invalid file format.\nAllowed formats are:\n- PDF\n- JPEG, PNGM, WEBP\n- Text files\nPlease recheck file extension and file contents."
            )

        if len(contents.strip()) == 0:
            return

        document.text = contents

        def process():
            # Staging data
            prepared_chunks: list[str] = []
            chunk_metadata = []

            split_chunks = smart_splitter.split_text(contents)

            for chunk_index, chunk_text in enumerate(split_chunks):
                embedding_content = (
                    f"Source: {DocumentType.TEXT.value} file {document.name}:\n"
                    + chunk_text
                )

                prepared_chunks.append(embedding_content)
                chunk_metadata.append(
                    {
                        "content": chunk_text,
                        "index": chunk_index,
                    }
                )
            return prepared_chunks, chunk_metadata

        prepared_chunks, chunk_metadata = await asyncio.to_thread(process)

        # Runs tasks in parallel
        if prepared_chunks:
            # Defines tasks
            embed_task = GlobalAPI.mass_embed(prepared_chunks)

            params = DocumentAnalysisParams(
                prompt=contents,
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
            vectors, document_analysis = await asyncio.gather(embed_task, analysis_task)

            # Saves the vectors
            embedded_chunks = [
                DocumentChunk(
                    content_original=metadata["content"],
                    content_embedded=vector,
                    document_chunk_index=metadata["index"],
                    document=document,
                )
                for metadata, vector in zip(chunk_metadata, vectors)
            ]

            session.add_all(embedded_chunks)

            # Saves the analysis
            document.document_analysis = document_analysis

            return document_analysis
