import asyncio
import time
import google.generativeai as genai
from config import settings
import sys
import json

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


async def generate_caption(image_url, file_name):
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash-002", generation_config=generation_config
        )
        file = genai.get_file(file_name)
        response = await model.generate_content_async([file, "\n\n", prompt])
        caption = process_caption(response.text)
        return {"image_url": image_url, "description": caption}
    except Exception as e:
        print(f"Failed to generate response for {image_url}: {e}", file=sys.stderr)
        return {"image_url": image_url, "description": None, "error": str(e)}


async def main(image_urls):
    start_time = time.time()

    with open("image_mappings.json", "r") as f:
        image_to_file = json.load(f)

    print("Generating captions...", file=sys.stderr)
    caption_tasks = [
        generate_caption(url, image_to_file[url]) for url in image_urls if url in image_to_file
    ]
    responses = await asyncio.gather(*caption_tasks)
    print("Captions generated.", file=sys.stderr)

    end_time = time.time()
    print(
        f"\nTotal execution time: {end_time - start_time:.2f} seconds", file=sys.stderr
    )

    return responses


if __name__ == "__main__":
    image_urls = sys.argv[1:]
    responses = asyncio.run(main(image_urls))
    print(json.dumps(responses))
    print("Processing completed.", file=sys.stderr)
