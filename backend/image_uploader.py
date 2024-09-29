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

async def upload_image(session, image_url):
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
        print(f"Failed to upload image {image_url}: {e}", file=sys.stderr)
        return image_url, None

def load_mappings(mappings_file):
    with open(mappings_file, 'r') as f:
        return json.load(f)

def save_mappings(mappings, mappings_file):
    with open(mappings_file, 'w') as f:
        json.dump(mappings, f, indent=2)

async def main(mappings_file):
    mappings = load_mappings(mappings_file)
    urls_to_upload = [url for url, filename in mappings.items() if not filename]

    if urls_to_upload:
        async with aiohttp.ClientSession() as session:
            upload_tasks = [upload_image(session, url) for url in urls_to_upload]
            upload_results = await asyncio.gather(*upload_tasks)

        for url, file_name in upload_results:
            if file_name is not None:
                mappings[url] = file_name

    save_mappings(mappings, mappings_file)

    print(f"Image mappings updated in {mappings_file}", file=sys.stderr)
    print(f"Total mappings: {len(mappings)}", file=sys.stderr)
    print(f"New mappings added: {len(urls_to_upload)}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python image_uploader.py <mappings_file>", file=sys.stderr)
        sys.exit(1)

    mappings_file = sys.argv[1]
    asyncio.run(main(mappings_file))