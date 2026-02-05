from typing import List
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document
from .base import DocumentProcessor


class PdfProcessor(DocumentProcessor):
    """
    Processor for PDF files using PyMuPDFLoader.
    """

    def process(self, file_path: str) -> List[Document]:
        """
        Extracts text from a PDF file.

        Args:
            file_path (str): The path to the PDF file.

        Returns:
            List[Document]: A list of documents, typically one per page.
        """
        loader = PyMuPDFLoader(file_path)
        return loader.load()
