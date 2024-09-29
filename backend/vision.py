import sys
import subprocess
import json
from pathlib import Path
import requests
from supabase import Client, create_client
from config import settings

supabase_url = settings.SUPABASE_URL
supabase_key = settings.SUPABASE_KEY
supabase: Client = create_client(supabase_url, supabase_key)


def fetch_image_data():
    url = "https://new-builds-2024-818004117691.us-central1.run.app/street_view_images"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch image data: {response.status_code}")
    data = response.json()
    return data[:500]


def process_images(image_data, batch_size=30):
    total_images = len(image_data)
    all_responses = []

    for i in range(0, total_images, batch_size):
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

        print(f"Batch {batch_number} completed.")
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
        if result:
            print(f"Successfully updated database for image {image_url}")
    except Exception as e:
        print(f"Error updating database for image {image_url}: {e}")


def main():
    print(f"Running vision.py")

    image_data = fetch_image_data()

    if not image_data:
        print("No image data fetched from the API.")
        sys.exit(1)

    responses = process_images(image_data)
    print("All batches processed.")
    print(f"Total responses: {len(responses)}")

    for response in responses:
        image_url = response["image_url"]
        description = response["description"]
        update_description_in_db(image_url, description)

    with open("all_responses.json", "w") as f:
        json.dump(responses, f)

    print("Responses saved to all_responses.json")


if __name__ == "__main__":
    main()
