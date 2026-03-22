from typing import List, Dict, Any
from .base import DocumentProcessor


class EpubProcessor(DocumentProcessor):
    """
    Processor for EPUB files.
    """

    def process(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from an EPUB file.

        Args:
            file_path (str): The path to the EPUB file.

        Returns:
            List[Dict[str, Any]]: A list of extracted data dictionaries.

        Raises:
            NotImplementedError: EPUB processing is not yet implemented.
        """
        raise NotImplementedError("EPUB processing is not yet implemented.")
