import sys
import subprocess
import json
from pathlib import Path
import requests
from supabase import Client, create_client
from config import settings
import time

supabase_url = settings.SUPABASE_URL
supabase_key = settings.SUPABASE_KEY
supabase: Client = create_client(supabase_url, supabase_key)


def fetch_image_data():
    url = "https://new-builds-2024-818004117691.us-central1.run.app/street_view_images_without_description"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch image data: {response.status_code}")
    data = response.json()
    return data


def create_image_mappings(image_data):
    mappings_file = Path("image_mappings.json")
    if mappings_file.exists():
        with open(mappings_file, "r") as f:
            image_mappings = json.load(f)
    else:
        image_mappings = {}

    new_urls = 0
    for img in image_data:
        if img["image_url"] not in image_mappings:
            image_mappings[img["image_url"]] = ""
            new_urls += 1

    with open(mappings_file, "w") as f:
        json.dump(image_mappings, f, indent=2)

    print(f"Updated {mappings_file} with {new_urls} new URLs")
    return mappings_file


def upload_images(mappings_file):
    script_dir = Path(__file__).resolve().parent
    uploader_script = script_dir / "image_uploader.py"
    python_executable = sys.executable

    command = [python_executable, str(uploader_script), str(mappings_file)]

    print(f"Uploading images: {' '.join(command)}")

    result = subprocess.run(command, check=True, capture_output=True, text=True)
    print(result.stderr)


def process_images(image_data, batch_size=100):
    total_images = len(image_data)
    all_responses = []

    for i in range(0, total_images, batch_size):
        batch_start_time = time.time()
        batch_end = min(i + batch_size, total_images)
        batch_number = i // batch_size + 1

        print(f"Processing batch {batch_number}...")

        current_batch = image_data[i:batch_end]

        script_dir = Path(__file__).resolve().parent
        vision_script = script_dir / "async_vision.py"
        python_executable = sys.executable

        image_urls = [img["image_url"] for img in current_batch]

        command = [python_executable, str(vision_script)] + image_urls

        print(f"Running: {' '.join(command)}")

        result = subprocess.run(command, check=True, capture_output=True, text=True)

        try:
            batch_responses = json.loads(result.stdout)
            all_responses.extend(batch_responses)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON output from async_vision.py: {e}")
            print("async_vision.py stdout:", result.stdout)
            print("async_vision.py stderr:", result.stderr)
            sys.exit(1)

        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        print(f"Batch {batch_number} completed in {batch_duration:.2f} seconds.")
        print()

    return all_responses


def update_description_in_db(image_url, description):
    try:
        data = {"description": description}
        result = (
            supabase.table("street_view_images")
            .update(data)
            .eq("image_url", image_url)
            .execute()
        )
    except Exception as e:
        print(f"Error updating database for image {image_url}: {e}")


def main():
    print(f"Running vision.py")

    image_data = fetch_image_data()

    if not image_data:
        print("No image data fetched from the API.")
        sys.exit(1)

    print("Creating image mappings...")
    mappings_file = create_image_mappings(image_data)
    print("Image mappings created.")

    print("Uploading images...")
    upload_images(mappings_file)
    print("Images uploaded.")

    print("Processing images...")
    responses = process_images(image_data)
    print("All batches processed.")
    print(f"Total responses: {len(responses)}")
    print(
        f"Number of responses with non empty description: {len([response for response in responses if response['description']])}"
    )

    print("Updating database...")
    for response in responses:
        image_url = response["image_url"]
        description = response["description"]
        update_description_in_db(image_url, description)
    print("Database updated.")

    with open("responses_again.json", "w") as f:
        json.dump(responses, f)

    print("Responses saved!")


if __name__ == "__main__":
    main()
