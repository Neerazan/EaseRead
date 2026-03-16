from typing import Dict, Any
from .base import DocumentProcessor
from unstructured.partition.pdf import partition_pdf


class PdfProcessor(DocumentProcessor):
    def __init__(self):
        pass

    def process(self, file_path: str) -> Dict[str, Any]:
        print(f"Partitioning document: {file_path} ....")

        elements = partition_pdf(
            filename=file_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_images_in_pdf=True,
            extract_image_block_types=["Image"],
            extract_image_block_to_payload=True,
        )

        print(f"extracted {len(elements)} elements.")
        
        # Convert elements to dictionaries for return and saving
        element_dicts = [el.to_dict() for el in elements]

        # Save to file for inspection
        import json
        with open("processed_elements.json", "w") as f:
            json.dump(element_dicts, f, indent=2)
            print(f"Saved elements to processed_elements.json")

        return element_dicts
