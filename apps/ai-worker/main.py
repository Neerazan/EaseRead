import asyncio
import os
from dotenv import load_dotenv
from bullmq import Worker

# Load environment variables (from your root .env)
load_dotenv(dotenv_path="../../.env")


async def process_document(job, job_token):
    print(f"📦 Processing Job ID: {job.id}")
    print(f"📄 Data received: {job.data}")

    # This is where your heavy PDF logic will go!
    await asyncio.sleep(2)  # Simulating work

    return {"status": "completed", "message": "PDF Parsed successfully"}


async def start_worker():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Connect to the EXACT same queue name as NestJS
    worker = Worker("document-processing", process_document, {"connection": redis_url})

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
