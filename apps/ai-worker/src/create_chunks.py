"""
Document chunking and AI-enhanced summarisation.

Provides utilities for splitting cleaned *unstructured* elements into
semantically meaningful chunks, optionally enriching chunks that contain
tables or images with an LLM-generated searchable description.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from unstructured.chunking.title import chunk_by_title

__all__ = [
    "create_chunks_by_title",
    "separate_content_types",
    "create_ai_enhanced_summary",
    "summarise_chunks",
]

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default chunking parameters
# ---------------------------------------------------------------------------

DEFAULT_MAX_CHARACTERS = 3000
DEFAULT_NEW_AFTER_N_CHARS = 2400
DEFAULT_COMBINE_TEXT_UNDER_N_CHARS = 500


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------


def create_chunks_by_title(
    elements: List[Any],
    *,
    max_characters: int = DEFAULT_MAX_CHARACTERS,
    new_after_n_chars: int = DEFAULT_NEW_AFTER_N_CHARS,
    combine_text_under_n_chars: int = DEFAULT_COMBINE_TEXT_UNDER_N_CHARS,
) -> list:
    """Split *elements* into chunks using a title-based strategy.

    Parameters
    ----------
    elements:
        Cleaned ``unstructured`` elements from a document parser.
    max_characters:
        Hard upper limit on characters per chunk.
    new_after_n_chars:
        Soft target — try to start a new chunk after this many characters.
    combine_text_under_n_chars:
        Merge tiny chunks shorter than this with their neighbours.
    """
    logger.info("Creating chunks (title-based strategy)…")

    chunks = chunk_by_title(
        elements,
        max_characters=max_characters,
        new_after_n_chars=new_after_n_chars,
        combine_text_under_n_chars=combine_text_under_n_chars,
    )

    logger.info("Created %d chunks.", len(chunks))
    return chunks


# ---------------------------------------------------------------------------
# Content-type analysis
# ---------------------------------------------------------------------------


def separate_content_types(chunk: Any) -> Dict[str, Any]:
    """Inspect a chunk and separate its content into text, tables, and images.

    Returns a dict with keys ``text``, ``tables``, ``images``, and ``types``.
    """
    content_data: Dict[str, Any] = {
        "text": chunk.text,
        "tables": [],
        "images": [],
        "types": ["text"],
    }

    orig_elements = getattr(
        getattr(chunk, "metadata", None), "orig_elements", None
    )
    if orig_elements is None:
        return content_data

    for element in orig_elements:
        element_type = type(element).__name__

        if element_type == "Table":
            content_data["types"].append("table")
            table_html = getattr(
                getattr(element, "metadata", None), "text_as_html", element.text
            )
            content_data["tables"].append(table_html)

        elif element_type == "Image":
            image_b64 = getattr(
                getattr(element, "metadata", None), "image_base64", None
            )
            if image_b64:
                content_data["types"].append("image")
                content_data["images"].append(image_b64)

    content_data["types"] = list(set(content_data["types"]))
    return content_data


# ---------------------------------------------------------------------------
# AI-enhanced summarisation
# ---------------------------------------------------------------------------


def create_ai_enhanced_summary(
    text: str,
    tables: List[str],
    images: List[str],
    *,
    model_name: str = "gemini-2.5-flash",
) -> str:
    """Generate a searchable LLM description for mixed content.

    Falls back to a simple text summary if the LLM call fails.
    """
    try:
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)

        prompt_text = (
            "You are creating a searchable description for document content "
            "retrieval.\n\n"
            "CONTENT TO ANALYZE:\n"
            f"TEXT CONTENT:\n{text}\n\n"
        )

        if tables:
            prompt_text += "TABLES:\n"
            for i, table in enumerate(tables, start=1):
                prompt_text += f"Table {i}:\n{table}\n\n"

        prompt_text += (
            "YOUR TASK:\n"
            "Generate a comprehensive, searchable description that covers:\n"
            "1. Key facts, numbers, and data points from text and tables\n"
            "2. Main topics and concepts discussed\n"
            "3. Questions this content could answer\n"
            "4. Visual content analysis (charts, diagrams, patterns in images)\n"
            "5. Alternative search terms users might use\n\n"
            "Make it detailed and searchable — prioritize findability over "
            "brevity.\n\n"
            "SEARCHABLE DESCRIPTION:"
        )

        message_content: list[dict[str, Any]] = [
            {"type": "text", "text": prompt_text}
        ]

        for image_base64 in images:
            message_content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    },
                }
            )

        response = llm.invoke([HumanMessage(content=message_content)])
        return response.content

    except Exception:
        logger.exception("AI summary generation failed; using fallback.")
        summary = f"{text[:300]}…"
        if tables:
            summary += f" [Contains {len(tables)} table(s)]"
        if images:
            summary += f" [Contains {len(images)} image(s)]"
        return summary


# ---------------------------------------------------------------------------
# Chunk processing pipeline
# ---------------------------------------------------------------------------


def summarise_chunks(
    chunks: list,
    *,
    ai_model: str = "gemini-2.5-flash",
) -> List[Document]:
    """Process all chunks: analyse content types and create LangChain Documents.

    Chunks that contain tables or images are enriched with an AI-generated
    summary.  Plain-text chunks use their raw text as ``page_content``.

    Returns a list of :class:`langchain_core.documents.Document` instances.
    """
    logger.info("Processing %d chunks with AI summaries…", len(chunks))

    langchain_documents: List[Document] = []
    total = len(chunks)

    for idx, chunk in enumerate(chunks, start=1):
        logger.info("  Chunk %d/%d", idx, total)

        content_data = separate_content_types(chunk)

        has_rich_content = bool(content_data["tables"] or content_data["images"])

        if has_rich_content:
            logger.info("    → Creating AI summary for mixed content…")
            enhanced_content = create_ai_enhanced_summary(
                content_data["text"],
                content_data["tables"],
                content_data["images"],
                model_name=ai_model,
            )
        else:
            enhanced_content = content_data["text"]

        chunk_metadata = getattr(chunk, "metadata", None)
        page_number = getattr(chunk_metadata, "page_number", None) if chunk_metadata else None

        doc = Document(
            page_content=enhanced_content,
            metadata={
                "chunk_index": idx - 1,
                "content_types": content_data["types"],
                "raw_text": content_data["text"],
                "semantic_summary": enhanced_content if has_rich_content else None,
                "page_number": page_number,
                "is_important": False,
            },
        )
        langchain_documents.append(doc)

    logger.info("Processed %d chunks into LangChain Documents.", len(langchain_documents))
    return langchain_documents
