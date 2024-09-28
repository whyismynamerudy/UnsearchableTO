import asyncio
import time
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

prompt = "Describe the image in a detailed unformatted paragraph. Don't mention the Google logo."

generation_config = genai.GenerationConfig(
    temperature=0,
    top_p=0.95,
    top_k=40,
    max_output_tokens=512,
    response_mime_type="text/plain",
)


def process_caption(caption):
    return caption.split(":")[-1].replace("\n", " ").strip()


async def upload_file(file_name):
    return await asyncio.to_thread(genai.upload_file, file_name)


async def generate_response(file):
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash-002", generation_config=generation_config
        )
        response = await model.generate_content_async([file, "\n\n", prompt])
        print(f"Response for {file.name}: {process_caption(response.text)[:100]}")
    except Exception as e:
        print(f"Failed to generate response for {file.name}: {e}")
        raise


async def main(file_names):
    start_time = time.time()
    batch_size = 20

    for i in range(0, len(file_names), batch_size):
        batch = file_names[i : i + batch_size]

        # Upload batch of files
        print(f"Uploading batch {i//batch_size + 1}...")
        uploaded_files = await asyncio.gather(
            *[upload_file(file_name) for file_name in batch]
        )
        print(f"Batch {i//batch_size + 1} uploaded.")

        # Generate responses for the uploaded batch
        print(f"Generating responses for batch {i//batch_size + 1}...")
        tasks = [generate_response(file) for file in uploaded_files]
        await asyncio.gather(*tasks)
        print(f"Responses generated for batch {i//batch_size + 1}.")

        await asyncio.sleep(0.1)

    end_time = time.time()
    print(f"\nTotal execution time: {end_time - start_time:.2f} seconds")


if __name__ == "__main__":
    file_names = [f"images/e{i}.jpg" for i in range(1, 101)]
    asyncio.run(main(file_names))
