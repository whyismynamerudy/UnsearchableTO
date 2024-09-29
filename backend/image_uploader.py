import asyncio
import aiohttp
import google.generativeai as genai
from config import settings
import sys
import os
import json
from PIL import Image
import io

genai.configure(api_key=settings.GEMINI_API_KEY)

CONCURRENT_LIMIT = 32
SAVE_INTERVAL = 100

async def upload_image(session, image_url, semaphore):
    async with semaphore:
        try:
            async with session.get(image_url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to fetch image: HTTP {response.status}")
                image_data = await response.read()

            image = Image.open(io.BytesIO(image_data))
            os.makedirs("images", exist_ok=True)
            image_path = f"images/{image_url.split('/')[-1]}"
            image.save(image_path)

            file = genai.upload_file(image_path)
            return image_url, file.name

        except Exception as e:
            print(f"Failed to upload image {image_url}: {e}")
            return image_url, None

def load_mappings(mappings_file):
    with open(mappings_file, "r") as f:
        return json.load(f)

def save_mappings(mappings, mappings_file):
    with open(mappings_file, "w") as f:
        json.dump(mappings, f, indent=2)

async def main(mappings_file):
    mappings = load_mappings(mappings_file)
    urls_to_upload = [url for url, filename in mappings.items() if not filename]

    print(f"Total URLs to upload: {len(urls_to_upload)}")
    if urls_to_upload:
        semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)
        async with aiohttp.ClientSession() as session:
            upload_tasks = [upload_image(session, url, semaphore) for url in urls_to_upload]
            
            for i, upload_result in enumerate(asyncio.as_completed(upload_tasks), 1):
                url, file_name = await upload_result
                if file_name is not None:
                    mappings[url] = file_name
                
                if i % SAVE_INTERVAL == 0:
                    save_mappings(mappings, mappings_file)
                    print(f"Processed {i} images. Mappings saved to {mappings_file}")

    save_mappings(mappings, mappings_file)

    print(f"Image mappings updated in {mappings_file}")
    print(f"Total mappings: {len(mappings)}")
    print(f"New uploads: {len(urls_to_upload)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python image_uploader.py <mappings_file>")
        sys.exit(1)

    mappings_file = sys.argv[1]
    asyncio.run(main(mappings_file))