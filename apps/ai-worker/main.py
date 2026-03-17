"""
AI Worker — Document processing pipeline.

Listens on the ``document-processor`` BullMQ queue and runs the full
extract → clean → chunk → embed → store pipeline for each incoming job.
"""

import asyncio
import logging
import sys

from bullmq import Worker

from src.config import settings
from src.clean_text import clean_elements
from src.create_chunks import create_chunks_by_title, summarise_chunks
from src.db import DatabaseService
from src.embeddings import EmbeddingService
from src.processor_factory import ProcessorFactory

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("ai-worker")

# ---------------------------------------------------------------------------
# Services (created once, reused across jobs)
# ---------------------------------------------------------------------------

embedding_service = EmbeddingService()
db_service = DatabaseService()

# ---------------------------------------------------------------------------
# Job handler
# ---------------------------------------------------------------------------


async def process_document(job, job_token):
    """Process a single document-processing job.

    Expected job data::

        {
            "documentId": "<uuid>",
            "fileUrl":    "/absolute/path/to/file",
            "userId":     "<uuid>",
            "format":     "pdf" | "epub" | …
        }
    """
    logger.info("📦 Job %s received — data: %s", job.id, job.data)

    file_content_hash = job.data.get("fileContentHash")
    file_url = job.data.get("fileUrl")
    file_format = job.data.get("format")

    if not file_url or not file_format:
        return {
            "status": "failed",
            "message": "Missing fileUrl or format in job data",
        }

    if not file_content_hash:
        return {
            "status": "failed",
            "message": "Missing fileContentHash in job data",
        }

    try:
        # 1. Extract raw elements ──────────────────────────────────────
        logger.info("Step 1/6 — Extracting elements…")
        processor = ProcessorFactory.get_processor(file_format)
        elements = processor.process(file_url)
        logger.info("  → Extracted %d elements.", len(elements))

        # 2. Clean elements ────────────────────────────────────────────
        logger.info("Step 2/6 — Cleaning elements…")
        cleaned = clean_elements(elements)
        logger.info("  → %d elements after cleaning.", len(cleaned))

        # 3. Create chunks (title-based) ───────────────────────────────
        logger.info("Step 3/6 — Creating chunks…")
        chunks = create_chunks_by_title(cleaned)
        logger.info("  → %d chunks created.", len(chunks))

        # 4. Summarise / enrich chunks ─────────────────────────────────
        logger.info("Step 4/6 — Summarising chunks (AI-enhanced for mixed content)…")
        langchain_docs = summarise_chunks(chunks)
        logger.info("  → %d LangChain documents ready.", len(langchain_docs))

        # 5. Generate embeddings ───────────────────────────────────────
        logger.info("Step 5/6 — Generating embeddings…")
        texts = [doc.page_content for doc in langchain_docs]
        embeddings = embedding_service.generate_embeddings(texts)
        logger.info("  → %d embeddings generated.", len(embeddings))

        # 6. Store in database ─────────────────────────────────────────
        logger.info("Step 6/6 — Storing chunks + embeddings in database…")
        chunk_rows = []
        for doc, embedding in zip(langchain_docs, embeddings):
            chunk_metadata = doc.metadata
            chunk_rows.append({
                "content": chunk_metadata.get("raw_text", doc.page_content),
                "embedding": embedding,
                "chunk_index": chunk_metadata.get("chunk_index", 0),
                "content_types": chunk_metadata.get("content_types", ["text"]),
                "semantic_summary": chunk_metadata.get("semantic_summary"),
                "page_number": chunk_metadata.get("page_number"),
                "is_important": chunk_metadata.get("is_important", False),
                "chapter_title": chunk_metadata.get("chapter_title"),
                "heading_path": chunk_metadata.get("heading_path"),
                "token_count": chunk_metadata.get("token_count"),
            })

        stored = db_service.store_chunks_batch(file_content_hash, chunk_rows)
        db_service.mark_file_content_processed(file_content_hash)

        logger.info("✅ Document file content %s processed — %d chunks stored.", file_content_hash, stored)

        return {
            "status": "completed",
            "message": f"Document processed: {stored} chunks embedded and stored.",
            "chunksStored": stored,
        }

    except Exception as e:
        logger.exception("❌ Error processing document file content %s", file_content_hash)
        return {"status": "failed", "message": str(e)}


# ---------------------------------------------------------------------------
# Worker lifecycle
# ---------------------------------------------------------------------------


async def start_worker():
    """Start the BullMQ worker and keep it running."""
    worker = Worker(
        settings.document_queue_name,
        process_document,
        {"connection": settings.redis_url},
    )
    logger.info(
        "🚀 Worker started — listening on queue '%s'",
        settings.document_queue_name,
    )

    try:
        await asyncio.Future()  # run forever
    except asyncio.CancelledError:
        pass
    finally:
        await worker.close()
        db_service.close()
        logger.info("Worker stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(start_worker())
    except KeyboardInterrupt:
        logger.info("Shutting down…")
