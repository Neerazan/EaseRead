from abc import ABC, abstractmethod
from typing import List, Dict, Any


class DocumentProcessor(ABC):
    """
    Abstract base class for document processors.
    """

    @abstractmethod
    def process(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Process the document at the given file path and return structured data.

        Args:
            file_path (str): The path to the file to be processed.

        Returns:
            List[Dict[str, Any]]: A list of dictionaries containing text, font_size, and page.
        """
        pass
