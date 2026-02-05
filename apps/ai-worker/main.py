import asyncio
import os
from dotenv import load_dotenv
from bullmq import Worker
from pathlib import Path

# Load environment variables (from your root .env)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")


from src.processor_factory import ProcessorFactory


async def process_document(job, job_token):
    print(f"📦 Processing Job ID: {job.id}")
    print(f"📄 Data received: {job.data}")

    file_url = job.data.get("fileUrl")
    file_format = job.data.get("format")

    if not file_url or not file_format:
        return {"status": "failed", "message": "Missing fileUrl or format in job data"}

    try:
        # TODO: Handle file downloading if fileUrl is a remote URL.
        # For now, assuming it's a local path or accessible via the file system.
        # If file_url is completely remote, we would need to download it to a temp path.

        processor = ProcessorFactory.get_processor(file_format)
        extracted_data = processor.process(file_url)

        print(f"✅ Extracted {len(extracted_data)} items.")
        return {
            "status": "completed",
            "message": "Document processed successfully",
            "data": extracted_data,
        }

    except Exception as e:
        print(f"❌ Error processing document: {e}")
        return {"status": "failed", "message": str(e)}

    await asyncio.sleep(2)  # Simulating work


async def start_worker():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Connect to the EXACT same queue name as NestJS
    worker = Worker("document-processor", process_document, {"connection": redis_url})
    print(f"🚀 Python Worker started! Listening on queue: document-processing")

    # Keep the worker alive
    try:
        await asyncio.Future()
    except asyncio.CancelledError:
        await worker.close()


if __name__ == "__main__":
    try:
        asyncio.run(start_worker())
    except KeyboardInterrupt:
        print("\nShutting down worker...")
