from typing import List
from langchain_core.documents import Document
from .base import DocumentProcessor


class EpubProcessor(DocumentProcessor):
    """
    Processor for EPUB files.
    """

    def process(self, file_path: str) -> List[Document]:
        """
        Extracts text from an EPUB file.

        Args:
            file_path (str): The path to the EPUB file.

        Returns:
            List[Document]: A list of extracted documents.

        Raises:
            NotImplementedError: EPUB processing is not yet implemented.
        """
        raise NotImplementedError("EPUB processing is not yet implemented.")
