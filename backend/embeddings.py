import cohere
import vecs
import requests
from config import settings
import numpy as np


def load_captions():
    response = requests.get(
        "https://new-builds-2024-818004117691.us-central1.run.app/street_view_images"
    )
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to load captions: {response.status_code}")


def save_embeddings(image_ids, embeddings):
    with vecs.create_client(settings.DB_CONNECTION_STRING) as vx:
        docs = vx.get_or_create_collection(name="image_embeddings", dimension=1024)
        # docs contains :
        # vector[0]: uuid -> same as image uuid
        # vector[1]: embedding -> the float embeddings

        records = []
        for image_id, embedding in zip(image_ids, embeddings):
            print(image_id)
            records.append((image_id, np.array(embedding), {}))

        docs.upsert(records)


def main():
    co = cohere.ClientV2(settings.COHERE_API_KEY)
    captions = load_captions()

    batch_size = 96

    for i in range(0, len(captions), batch_size):
        batch = captions[i : i + batch_size]
        image_ids = [caption["image_id"] for caption in batch]
        batch_texts = [caption["description"] for caption in batch]
        print(batch_texts)

        response = co.embed(
            texts=batch_texts,
            model="embed-english-v3.0",
            input_type="search_document",
            embedding_types=["float"],
        )

        save_embeddings(image_ids, response.embeddings.float)

    with vecs.create_client(settings.DB_CONNECTION_STRING) as vx:
        docs = vx.get_or_create_collection(name="image_embeddings", dimension=1024)
        docs.create_index(
            method=vecs.IndexMethod.hnsw,
            measure=vecs.IndexMeasure.cosine_distance,
        )


if __name__ == "__main__":
    main()
