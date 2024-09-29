import cohere
import vecs
import requests
from config import settings


def load_captions():
    response = requests.get(
        "https://new-builds-2024-818004117691.us-central1.run.app/street_view_images"
    )
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to load captions: {response.status_code}")


def save_embeddings(batch, embeddings):
    with vecs.create_client(settings.SUPABASE_URL) as vx:
        docs = vx.get_or_create_collection(name="image_embeddings", dimension=2)
        # docs contains :
        # vector[0]: uuid -> same as image uuid
        # vector[1]: embedding -> the float embeddings

        docs.upsert(
            records=[
                (caption["image_id"], embedding)
                for caption, embedding in zip(batch, embeddings)
            ]
        )


def main():
    co = cohere.ClientV2(settings.COHERE_API_KEY)
    captions = load_captions()
    captions = captions[0:10]

    batch_size = 5

    for i in range(0, len(captions), batch_size):
        batch = captions[i : i + batch_size]
        batch_texts = [
            caption["description"] for caption in batch if caption["description"]
        ]

        response = co.embed(
            texts=batch_texts,
            model="embed-english-v3.0",
            input_type="search_document",
            embedding_types=["float"],
        )

        print(response.embeddings.float)

        save_embeddings(batch, response.embeddings.float)

    with vecs.create_client(settings.SUPABASE_URL) as vx:
        docs = vx.get_or_create_collection(name="image_embeddings", dimension=2)
        docs.create_index(
            method=vecs.IndexMethod.hnsw,
            measure=vecs.IndexMeasure.cosine_distance,
        )


if __name__ == "__main__":
    main()
