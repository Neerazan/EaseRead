from abc import ABC, abstractmethod
from typing import Any, List


class DocumentProcessor(ABC):
    """Abstract base class for document processors.

    Subclasses must implement :meth:`process` which receives a file path
    and returns a list of raw *unstructured* elements.
    """

    @abstractmethod
    def process(self, file_path: str) -> List[Any]:
        """Parse *file_path* and return raw ``unstructured`` elements.

        Args:
            file_path: Absolute path to the document file.

        Returns:
            A list of ``unstructured`` element objects ready for cleaning
            and chunking.
        """
        ...
