from .processors.base import DocumentProcessor
from .processors.pdf_processor import PdfProcessor
from .processors.epub_processor import EpubProcessor


class ProcessorFactory:
    """
    Factory class to get the appropriate document processor.
    """

    @staticmethod
    def get_processor(file_format: str) -> DocumentProcessor:
        """
        Returns a document processor instance based on the file format.

        Args:
            file_format (str): The format of the file (e.g., 'pdf', 'epub').

        Returns:
            DocumentProcessor: An instance of a document processor.

        Raises:
            ValueError: If the file format is not supported.
        """
        file_format = file_format.lower()

        if file_format == 'pdf':
            return PdfProcessor()
        elif file_format == 'epub':
            return EpubProcessor()
        else:
            raise ValueError(f"Unsupported file format: {file_format}")
