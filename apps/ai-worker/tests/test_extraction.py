import os
import sys

# Add the parent directory to sys.path to resolve imports correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.processor_factory import ProcessorFactory
from reportlab.pdfgen import canvas


def create_test_pdf(file_path):
    c = canvas.Canvas(file_path)
    c.setFont("Helvetica", 22)
    c.drawString(100, 750, "CHAPTER 3")
    c.setFont("Helvetica", 12)
    c.drawString(100, 700, "Hello, this is a test PDF.")
    c.showPage()

    # Page 2
    c.setFont("Helvetica", 18)
    c.drawString(100, 750, "The Journey")
    c.setFont("Helvetica", 12)
    c.drawString(100, 700, "This is the second page.")
    c.showPage()

    c.save()
    print(f"Created test PDF at {file_path}")


def test_extraction():
    pdf_path = "test_doc.pdf"
    create_test_pdf(pdf_path)

    try:
        print("Testing PDF Processor...")
        processor = ProcessorFactory.get_processor("pdf")
        results = processor.process(pdf_path)

        print(f"Extracted {len(results)} items.")
        for item in results[:5]:
            print(
                f"Page {item['page']} | Size {item['font_size']} | Text: {item['text']}"
            )

        # Check for specific items
        chapter_item = next(i for i in results if "CHAPTER 3" in i["text"])
        assert chapter_item["font_size"] == 22
        assert chapter_item["page"] == 1

        journey_item = next(i for i in results if "The Journey" in i["text"])
        assert journey_item["font_size"] == 18
        assert journey_item["page"] == 2

        print("✅ Structured PDF Extraction Verified Successfully!")

    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback

        traceback.print_exc()
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    test_extraction()
