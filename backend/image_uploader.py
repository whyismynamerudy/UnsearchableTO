import asyncio
import aiohttp
import google.generativeai as genai
from config import settings
import sys
import os
import json
from PIL import Image
import io
from tenacity import retry, stop_after_attempt, wait_fixed, RetryError

# Configure Google Generative AI with the API key
genai.configure(api_key=settings.GEMINI_API_KEY)


async def download_image(session, image_url):
    """
    Asynchronously downloads an image from the given URL using aiohttp.
    """
    try:
        async with session.get(image_url) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch image: HTTP {response.status}")
            return await response.read()
    except Exception as e:
        print(f"Error downloading {image_url}: {e}", file=sys.stderr)
        return None


@retry(stop=stop_after_attempt(10), wait=wait_fixed(0.1))
def process_and_upload(image_data, image_url):
    """
    Processes the image data, saves it locally, and uploads it using Google Generative AI.
    """
    image = Image.open(io.BytesIO(image_data))
    os.makedirs("images", exist_ok=True)
    image_filename = os.path.basename(image_url)
    image_path = os.path.join("images", image_filename)
    image.save(image_path)
    file = genai.upload_file(image_path, resumable=False)

    print(f"Successfully uploaded {image_url} as {file.name}", file=sys.stderr)
    return image_url, file.name


async def upload_image(session, image_url):
    """
    Orchestrates the download and upload of a single image.
    Implements retry logic and ensures that the program continues despite individual failures.
    """
    image_data = await download_image(session, image_url)
    if image_data is None:
        return image_url, ""

    try:
        # Offload the blocking processing and uploading to a separate thread
        return await asyncio.to_thread(process_and_upload, image_data, image_url)
    except RetryError:
        print(f"Exceeded retry attempts for {image_url}. Skipping.", file=sys.stderr)
        return image_url, ""
    except Exception as e:
        print(f"Unexpected error processing {image_url}: {e}", file=sys.stderr)
        return image_url, ""


async def main(urls_to_upload):
    """
    Main function to handle the uploading of images using asyncio.
    """
    print(f"Total URLs to upload: {len(urls_to_upload)}", file=sys.stderr)

    if not urls_to_upload:
        print("No images to upload.", file=sys.stderr)
        return

    mappings = {}

    async with aiohttp.ClientSession() as session:
        upload_tasks = [upload_image(session, url) for url in urls_to_upload]
        results = await asyncio.gather(*upload_tasks)

        for url, file_name in results:
            if file_name:
                mappings[url] = file_name

    print(json.dumps(mappings))  # Print mappings as JSON to stdout


if __name__ == "__main__":
    urls_to_upload = sys.argv[1:]
    asyncio.run(main(urls_to_upload))
