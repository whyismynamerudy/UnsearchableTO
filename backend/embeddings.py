import os
import cohere
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("COHERE_API_KEY")


def load_captions():
    return [
        {"id": "1", "text": "Caption A", "embeddings": None},
        {"id": "2", "text": "Caption B", "embeddings": None},
    ]


def save_embeddings(batch, embeddings):
    for caption, embed in zip(batch, embeddings):
        # update databser for caption['id'] with embed


def main():
    co = cohere.ClientV2(api_key)
    captions = load_captions()

    batch_size = 48

    for i in range(0, len(captions), batch_size):
        batch = [
            caption
            for caption in captions[i : i + batch_size]
            if not caption["embeddings"]
        ]
        batch_texts = [caption["text"] for caption in batch]

        response = co.embed(
            texts=batch_texts,
            model="embed-english-v3.0",
            input_type="search_document",
            embedding_types=["float"],
        )

        save_embeddings(batch, response.embeddings.float)


if __name__ == "__main__":
    main()
