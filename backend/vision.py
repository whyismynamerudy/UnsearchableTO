import asyncio
import time
from tenacity import retry, wait_random_exponential, stop_after_attempt
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

prompt = "Describe the image in a detailed unformatted paragraph."

generation_config = genai.GenerationConfig(
    temperature=0.2,
    top_p=0.95,
    top_k=40,
    max_output_tokens=512,
    response_mime_type="text/plain",
)


async def create_model():
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash-002", generation_config=generation_config
    )


async def upload_file_async(file_name):
    return await asyncio.to_thread(genai.upload_file, file_name)


async def generate_response(model, file, file_name):
    try:
        response = await model.generate_content_async([file, "\n\n", prompt])
        print(f"Response for {file_name}: {response.text.replace('\n', '')[:100]}")
    except Exception as e:
        print(f"Failed to generate response for {file_name}: {e}")
        raise


async def process_file(model, file_name):
    try:
        file = await upload_file_async(file_name)
        await generate_response(model, file, file_name)
    except Exception as e:
        print(f"Error processing {file_name}: {e}")


async def process_batch(model, batch):
    tasks = [process_file(model, file_name) for file_name in batch]
    await asyncio.gather(*tasks)


async def main():
    start_time = time.time()
    file_names = ["e1.jpg", "e2.jpg"] * 1000
    batch_size = 100

    model = await create_model()

    for i in range(0, len(file_names), batch_size):
        batch = file_names[i : i + batch_size]
        print(f"Processing batch {i//batch_size + 1} ...")
        await process_batch(model, batch)
        print(f"Completed batch {i//batch_size + 1}")

    end_time = time.time()
    print(f"\nTotal execution time: {end_time - start_time:.2f} seconds")


if __name__ == "__main__":
    asyncio.run(main())
