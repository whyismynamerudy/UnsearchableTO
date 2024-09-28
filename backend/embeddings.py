import os
import cohere
import vecs
from config import settings

# vx = vecs.create_client(settings.DB_CONNECTION_STRING)


def load_captions():
    return [
        {"id": "1", "caption": "Caption A", "embeddings": None},
        {"id": "2", "caption": "Caption B", "embeddings": None},
    ]


def save_embeddings(batch, embeddings):
    with vecs.create_client(settings.DB_CONNECTION_STRING) as vx:
        docs = vx.get_or_create_collection(name="image_embeddings", dimension=2)
        # docs contains :
        # vector[0]: uuid -> same as image uuid
        # vector[1]: embedding -> the float embeddings

        # NOTE: pls update the uuid field to match what batch contains

        docs.upsert(
            records=[
                (uuid, embedding) for uuid, embedding in zip(batch, embeddings)
            ]
        )

    pass
    
    # for caption, embed in zip(batch, embeddings):
    #     # update databser for caption['id'] with embed
    #     docs.upsert(
    #         records = [

    #         ]
    #     )
    #     pass


def main():
    co = cohere.ClientV2(settings.COHERE_API_KEY)
    captions = load_captions()

    batch_size = 48

    for i in range(0, len(captions), batch_size):
        batch = [
            caption
            for caption in captions[i : i + batch_size]
            if not caption["embeddings"]
        ]
        batch_texts = [caption["caption"] for caption in batch]

        response = co.embed(
            texts=batch_texts,
            model="embed-english-v3.0",
            input_type="search_document",
            embedding_types=["float"],
        )

        save_embeddings(batch, response.embeddings.float)

    with vecs.create_client(settings.DB_CONNECTION_STRING) as vx:
        docs = vx.get_or_create_collection(name="image_embeddings", dimension=2)
        docs.create_index(
            method=IndexMethod.hnsw,
            measure=IndexMeasure.cosine_distance,
        )

    


if __name__ == "__main__":
    main()
