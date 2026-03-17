"""
Database service for persisting document chunks and embeddings.

Uses ``psycopg2`` with the ``pgvector`` extension to store vector
embeddings alongside chunk text and metadata in PostgreSQL.
"""

import json
import logging
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import psycopg2
import psycopg2.extras
from pgvector.psycopg2 import register_vector

from .config import settings

__all__ = ["DatabaseService"]

logger = logging.getLogger(__name__)


class DatabaseService:
    """Manages a connection pool to PostgreSQL and provides helpers for
    inserting document chunks with vector embeddings.
    """

    def __init__(
        self,
        *,
        dsn: str | None = None,
    ) -> None:
        self._dsn = dsn or settings.database_url
        self._conn: Optional[psycopg2.extensions.connection] = None

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    def _get_connection(self) -> psycopg2.extensions.connection:
        """Return (and cache) a database connection."""
        if self._conn is None or self._conn.closed:
            self._conn = psycopg2.connect(self._dsn)
            register_vector(self._conn)
            self._ensure_pgvector()
            logger.info("Database connection established.")
        return self._conn

    def _ensure_pgvector(self) -> None:
        """Make sure the ``vector`` extension is enabled."""
        conn = self._conn
        assert conn is not None
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()

    @contextmanager
    def _cursor(self):
        """Yield a cursor that auto-commits on success and rolls back on error."""
        conn = self._get_connection()
        cur = conn.cursor()
        try:
            yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    def close(self) -> None:
        """Close the underlying database connection."""
        if self._conn and not self._conn.closed:
            self._conn.close()
            logger.info("Database connection closed.")

    # ------------------------------------------------------------------
    # Chunk storage
    # ------------------------------------------------------------------

    def store_chunks_batch(
        self,
        file_content_hash: str,
        chunks: List[Dict[str, Any]],
    ) -> int:
        """Insert a batch of chunks with embeddings into ``document_chunk``.

        Each item in *chunks* should be a dict with keys:
        - ``content``      (str)  — the chunk text
        - ``embedding``    (list) — the vector embedding
        - ``chunk_index``  (int)  — ordering index
        - ``content_types`` (list, optional) — e.g. ["text", "table"]
        - ``token_count``  (int, optional)
        - ``chapter_title`` (str, optional)
        - ``heading_path`` (list, optional)
        - ``semantic_summary`` (str, optional)
        - ``page_number``  (int, optional)
        - ``metadata`` (dict, optional)
        - ``is_important`` (bool, optional)

        Returns the number of rows inserted.
        """
        if not chunks:
            return 0

        sql = """
            INSERT INTO document_chunk
                (id, "fileContentHash", content, embedding, index,
                 "tokenCount", "chapterTitle", "headingPath", "semanticSummary",
                 "pageNumber", "metadata", "isImportant",
                 "contentTypes",
                 "createdAt", "updatedAt")
            VALUES
                (%s, %s, %s, %s::vector, %s,
                 %s, %s, %s, %s,
                 %s, %s, %s,
                 %s,
                 %s, %s)
        """

        now = datetime.now(timezone.utc)
        rows = []
        for chunk in chunks:
            embedding_literal = (
                "[" + ",".join(str(v) for v in chunk["embedding"]) + "]"
            )
            rows.append((
                str(uuid4()),
                file_content_hash,
                chunk["content"],
                embedding_literal,
                chunk["chunk_index"],
                chunk.get("token_count"),
                chunk.get("chapter_title"),
                json.dumps(chunk.get("heading_path")) if chunk.get("heading_path") else None,
                chunk.get("semantic_summary"),
                chunk.get("page_number"),
                json.dumps(chunk.get("metadata")) if chunk.get("metadata") else None,
                chunk.get("is_important", False),
                json.dumps(chunk.get("content_types", ["text"])),
                now,
                now,
            ))

        with self._cursor() as cur:
            psycopg2.extras.execute_batch(cur, sql, rows, page_size=100)

        logger.info(
            "Stored %d chunks for document file content %s.", len(rows), file_content_hash
        )
        return len(rows)

    # ------------------------------------------------------------------
    # Status updates
    # ------------------------------------------------------------------

    def mark_file_content_processed(self, file_content_hash: str) -> None:
        """Set ``isProcessed = true`` on the ``file_content`` row linked to
        the given *file_content_hash*.
        """
        sql = """
            UPDATE file_content
               SET "isProcessed" = true,
                   "processedAt" = %s,
                   "updatedAt"   = %s
             WHERE hash = %s
        """
        now = datetime.now(timezone.utc)
        with self._cursor() as cur:
            cur.execute(sql, (now, now, file_content_hash))

        logger.info(
            "Marked file_content as processed for file %s.", file_content_hash
        )
