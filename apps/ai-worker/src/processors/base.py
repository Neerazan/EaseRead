from abc import ABC, abstractmethod
from typing import List
from langchain_core.documents import Document


class DocumentProcessor(ABC):
    """
    Abstract base class for document processors.
    """

    @abstractmethod
    def process(self, file_path: str) -> List[Document]:
        """
        Process the document at the given file path and return a list of Documents.

        Args:
            file_path (str): The path to the file to be processed.

        Returns:
            List[Document]: A list of extracted documents.
        """
        pass
