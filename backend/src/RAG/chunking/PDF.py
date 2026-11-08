import asyncio

from fastapi import UploadFile
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.ai_api import GlobalAPI
from backend.src.models_schema.document.document import Document
from backend.src.models_schema.document.document_analysis import (
    DocumentAnalysis,
)
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


class PdfExtractor(DocumentExtractor):
    @classmethod
    def verify(cls, file: UploadFile) -> bool:
        # === Content type === #
        if file.content_type != "application/pdf":
            return False

        # === Header === #
        header = file.file.read(5)
        file.file.seek(0)

        if header != b"%PDF-":
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
    ) -> DocumentAnalysis | None:

        def process():
            """
            Processes the PDF, returning prepared chunks, chunks' metadata and raw text
            """
            reader = PdfReader(file.file)

            # Staging data
            prepared_chunks: list[str] = []
            chunk_metadata = []
            text_list = []

            # Iterating over document pages
            chunk_index = 0

            for page_num, page_contents in enumerate(reader.pages):
                page_text = page_contents.extract_text()

                if not page_text or len(page_text.strip()) == 0:
                    continue

                # Appending text
                text_list.append(page_text)

                # Chopping text in 1 page into chunks
                split_chunks = smart_splitter.split_text(page_text)

                for chunk_text in split_chunks:
                    # Adding metadata to chunk
                    embedding_content = (
                        f"Source: {DocumentType.PDF.value} file {document.name}, page {page_num + document.page_starts_at}:\n"
                        + chunk_text
                    )

                    # Preparing chunks
                    prepared_chunks.append(embedding_content)
                    chunk_metadata.append(
                        {
                            "content": chunk_text,
                            "page": page_num,
                            "index": chunk_index,
                        }
                    )

                    chunk_index += 1

            text = "\n".join(text_list)

            return prepared_chunks, chunk_metadata, text

        prepared_chunks, chunk_metadata, text = await asyncio.to_thread(process)

        # Updates text
        document.text = text

        # Runs tasks in parallel
        if prepared_chunks:
            # Defines tasks
            embed_task = GlobalAPI.mass_embed(prepared_chunks)

            params = DocumentAnalysisParams(
                prompt=text,
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
                    document_page_num=metadata["page"],
                    document_chunk_index=metadata["index"],
                    document=document,
                )
                for metadata, vector in zip(chunk_metadata, vectors)
            ]

            session.add_all(embedded_chunks)

            # Saves the analysis
            document.document_analysis = document_analysis

            return document_analysis
