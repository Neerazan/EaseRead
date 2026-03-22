"""
Embedding generation service using Google Generative AI.

Wraps :class:`langchain_google_genai.GoogleGenerativeAIEmbeddings` to provide
a simple API for generating vector embeddings from text.
"""

import logging
import time
from typing import List

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from .config import settings

__all__ = ["EmbeddingService"]

logger = logging.getLogger(__name__)

# Rate-limit defaults (Gemini free tier: 1 500 RPM for embedding).
_BATCH_SIZE = 50
_INTER_BATCH_DELAY_S = 1.0


class EmbeddingService:
    """Thin wrapper around Google Generative AI embeddings.

    Usage::

        svc = EmbeddingService()
        vector = svc.generate_embedding("Hello, world!")
        vectors = svc.generate_embeddings(["Hello", "World"])
    """

    def __init__(
        self,
        *,
        model: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self._model_name = model or settings.embedding_model
        self._api_key = api_key or settings.gemini_api_key

        if not self._api_key:
            raise ValueError(
                "GEMINI_API_KEY is required.  Set it in .env or pass it explicitly."
            )

        self._client = GoogleGenerativeAIEmbeddings(
            model=f"models/{self._model_name}",
            google_api_key=self._api_key,
        )
        logger.info(
            "EmbeddingService initialised (model=%s).", self._model_name
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_embedding(self, text: str) -> List[float]:
        """Return the embedding vector for a single piece of text."""
        return self._client.embed_query(text)

    def generate_embeddings(
        self,
        texts: List[str],
        *,
        batch_size: int = _BATCH_SIZE,
        delay: float = _INTER_BATCH_DELAY_S,
    ) -> List[List[float]]:
        """Generate embeddings for a list of texts with batching.

        To respect API rate-limits the texts are split into batches of
        *batch_size* with *delay* seconds between each batch.
        """
        all_embeddings: List[List[float]] = []
        total = len(texts)

        for start in range(0, total, batch_size):
            end = min(start + batch_size, total)
            batch = texts[start:end]

            logger.info(
                "  Embedding batch %d-%d / %d",
                start + 1,
                end,
                total,
            )

            embeddings = self._client.embed_documents(batch)
            all_embeddings.extend(embeddings)

            # Respect rate-limits between batches.
            if end < total:
                time.sleep(delay)

        logger.info("Generated %d embeddings.", len(all_embeddings))
        return all_embeddings
