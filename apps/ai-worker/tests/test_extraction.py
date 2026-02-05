import os
import sys
from reportlab.pdfgen import canvas

# Add the parent directory to sys.path to resolve imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.processor_factory import ProcessorFactory


def create_test_pdf(file_path):
    c = canvas.Canvas(file_path)
    c.drawString(100, 750, "Hello, this is a test PDF.")
    c.createTwoPage()  # First page creation implicit, this ends it? No, save() ends.
    # reportlab structure:
    # draw, showPage() (ends page), save()

    # Page 1
    # already drawn "Hello..."
    c.showPage()

    # Page 2
    c.drawString(100, 750, "This is the second page.")
    c.showPage()

    c.save()
    print(f"Created test PDF at {file_path}")


def test_extraction():
    pdf_path = "test_doc.pdf"
    create_test_pdf(pdf_path)

    try:
        print("Testing PDF Processor...")
        processor = ProcessorFactory.get_processor("pdf")
        documents = processor.process(pdf_path)

        print(f"Extracted {len(documents)} pages.")
        for i, doc in enumerate(documents):
            print(f"--- Page {i+1} ---")
            print(doc.page_content.strip())

        assert len(documents) == 2
        assert "Hello, this is a test PDF." in documents[0].page_content
        assert "This is the second page." in documents[1].page_content
        print("✅ PDF Extraction Verified Successfully!")

    except Exception as e:
        print(f"❌ Test Failed: {e}")
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    test_extraction()
