import fitz
from typing import List, Dict, Any
from .base import DocumentProcessor


class PdfProcessor(DocumentProcessor):
    """
    Processor for PDF files using PyMuPDF (fitz) directly for rich metadata.
    """

    def process(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts structured text from a PDF file including font sizes and pages.
        """
        doc = fitz.open(file_path)
        extracted_data = []

        for page_index, page in enumerate(doc):
            # get_text("dict") provides blocks -> lines -> spans
            page_dict = page.get_text("dict")
            for block in page_dict["blocks"]:
                if block["type"] == 0:  # Text block
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"].strip()
                            if text:
                                extracted_data.append(
                                    {
                                        "text": text,
                                        "font_size": round(span["size"], 2),
                                        "page": page_index + 1,
                                        "font": span["font"],
                                    }
                                )
        doc.close()
        return extracted_data
