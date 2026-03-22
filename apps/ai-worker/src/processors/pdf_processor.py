import logging
from typing import Any, List

from unstructured.partition.pdf import partition_pdf

from .base import DocumentProcessor

logger = logging.getLogger(__name__)


class PdfProcessor(DocumentProcessor):
    """Extract structured elements from a PDF using ``unstructured``."""

    def process(self, file_path: str) -> List[Any]:
        """Partition a PDF into raw *unstructured* elements.

        Uses the ``hi_res`` strategy with table-structure inference and
        image extraction enabled.
        """
        logger.info("Partitioning PDF: %s", file_path)

        elements = partition_pdf(
            filename=file_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_images_in_pdf=True,
            extract_image_block_types=["Image"],
            extract_image_block_to_payload=True,
        )

        logger.info("Extracted %d elements from PDF.", len(elements))
        return elements
