import asyncio
import time
import os
import dotenv
from tenacity import retry, wait_random_exponential
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

prompt = "Describe the image in a detailed unformatted paragraph."

generation_config = genai.GenerationConfig(
    temperature=0.2,
    top_p=0.95,
    top_k=64,
    max_output_tokens=512,
    response_mime_type="text/plain",
)

async def create_model():
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash-exp-0827",
        generation_config=generation_config
    )

async def process_file(file_name):
    file = await asyncio.to_thread(genai.upload_file, file_name)
    model = await create_model()
    response = await model.generate_content_async([file, "\n\n", prompt])
    print(f"Response for {file_name}: {response.text[:100]}")

async def process_batch(batch):
    tasks = [process_file(file_name) for file_name in batch]
    await asyncio.gather(*tasks)

async def main():
    start_time = time.time()
    file_names = ["e1.jpg", "e2.jpg"] * 24
    batch_size = 8
    
    for i in range(0, len(file_names), batch_size):
        batch = file_names[i:i+batch_size]
        await process_batch(batch)
        await asyncio.sleep(1)
        print(f"Completed batch {i//batch_size + 1}")
    
    end_time = time.time()
    print(f"\nTotal execution time: {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(main())