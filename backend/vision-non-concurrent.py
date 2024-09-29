import asyncio
import time

import aiohttp  # For making asynchronous HTTP requests.
import google.generativeai as genai
from config import settings
from supabase import Client, create_client  # Import Supabase client

genai.configure(api_key=settings.GEMINI_API_KEY)

prompt = "Describe the image in a detailed unformatted paragraph."

generation_config = genai.GenerationConfig(
    temperature=0.2,
    top_p=0.95,
    top_k=40,
    max_output_tokens=512,
    response_mime_type="text/plain",
)

# Initialize Supabase client
supabase_url = settings.SUPABASE_URL
supabase_key = settings.SUPABASE_KEY
supabase: Client = create_client(supabase_url, supabase_key)


async def create_model():
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash-002",
        generation_config=generation_config,
    )


async def fetch_image_data():
    url = "https://new-builds-2024-818004117691.us-central1.run.app/street_view_images_without_description"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch image data: {response.status}")
            data = await response.json()
            return data


async def upload_file_async(image_url):
    # Download the image and upload it using genai.upload_file
    async with aiohttp.ClientSession() as session:
        async with session.get(image_url) as response:
            if response.status != 200:
                raise Exception(f"Failed to download image: {response.status}")
            image_content = await response.read()
            # Save image content to a temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".jpg") as temp_file:
                temp_file.write(image_content)
                temp_file.flush()
                return await asyncio.to_thread(genai.upload_file, temp_file.name)


async def generate_response(model, file, image_id):
    try:
        response = await model.generate_content_async([file, "\n\n", prompt])
        description = response.text.strip()
        print(f"Response for image {image_id}: {description[:100]}")

        return description  # Return the description

    except Exception as e:
        print(f"Failed to generate response for image {image_id}: {e}")
        raise


async def update_description_in_db(image_id, description):
    try:
        data = {
            'description': description
        }
        result = supabase.table('street_view_images').update(data).eq('image_id', image_id).execute()
        if result.error:
            print(f"Failed to update database for image {image_id}: {result.error}")
        else:
            print(f"Successfully updated database for image {image_id}")
    except Exception as e:
        print(f"Error updating database for image {image_id}: {e}")


async def process_image(model, image_data):
    try:
        image_id = image_data.get("image_id")
        image_url = image_data.get("image_url")
        file = await upload_file_async(image_url)
        description = await generate_response(model, file, image_id)
        await update_description_in_db(image_id, description)
    except Exception as e:
        print(f"Error processing image {image_id}: {e}")


async def main():
    start_time = time.time()

    # Fetch the image data from the endpoint
    image_data_list = await fetch_image_data()
    if not image_data_list:
        print("No images to process.")
        return

    model = await create_model()

    for i, image_data in enumerate(image_data_list, 1):
        print(f"Processing image {i}/{len(image_data_list)}: {image_data.get('image_id')}")
        await process_image(model, image_data)

    end_time = time.time()
    print(f"\nTotal execution time: {end_time - start_time:.2f} seconds")


if __name__ == "__main__":
    asyncio.run(main())