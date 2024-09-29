from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Tuple
from pydantic import BaseModel, Field
from config import settings
from supabase_settings import supabase_client
import cohere
import vecs

app = FastAPI()
co = cohere.Client(api_key=settings.COHERE_API_KEY)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class SearchQuery(BaseModel):
    q: str = Field(..., min_length=1, max_length=100, description="The search phrase")


@app.get("/")
async def root():
    return {"message": "Welcome to the search API"}


@app.get("/test")
async def test():
    try:
        response = (
            supabase_client.table("street_view_images").select("*").limit(10).execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/street_view_images")
async def get_street_view_images():
    # Updated longitude and latitude values
    longitude_min = -79.403619  # topleft longitude
    longitude_max = -79.374303  # bottomright longitude
    latitude_min = 43.637794  # bottomleft latitude
    latitude_max = 43.670535  # topright latitude

    try:
        response = (
            supabase_client.table("street_view_images")
            .select("*")
            .filter("longitude", "gte", longitude_min)
            .filter("longitude", "lte", longitude_max)
            .filter("latitude", "gte", latitude_min)
            .filter("latitude", "lte", latitude_max)
            .execute()
        )

        return response.data  # Return the filtered rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/street_view_images_without_description")
async def get_street_view_images_without_description():
    # Updated longitude and latitude values
    longitude_min = -79.403619  # topleft longitude
    longitude_max = -79.374303  # bottomright longitude
    latitude_min = 43.637794  # bottomleft latitude
    latitude_max = 43.670535  # topright latitude

    try:
        response = (
            supabase_client.table("street_view_images")
            .select("*")
            .filter("longitude", "gte", longitude_min)
            .filter("longitude", "lte", longitude_max)
            .filter("latitude", "gte", latitude_min)
            .filter("latitude", "lte", latitude_max)
            .filter("description", "is", "null")
            .execute()
        )

        return response.data  # Return the filtered rows without description
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/street_view_images_with_description")
async def get_street_view_images_with_description():
    # Updated longitude and latitude values
    longitude_min = -79.403619  # topleft longitude
    longitude_max = -79.374303  # bottomright longitude
    latitude_min = 43.637794  # bottomleft latitude
    latitude_max = 43.670535  # topright latitude

    try:
        response = (
            supabase_client.table("street_view_images")
            .select("*")
            .filter("longitude", "gte", longitude_min)
            .filter("longitude", "lte", longitude_max)
            .filter("latitude", "gte", latitude_min)
            .filter("latitude", "lte", latitude_max)
            .filter("description", "neq", "null")
            .execute()
        )

        if response.data is None:
            raise Exception("No data returned from Supabase")

        return (
            response.data
        )  # Return all rows within the specified range and with non-null description
    except Exception as e:
        print(f"Error in get_street_view_images_with_description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/street_view_images_hundred")
async def get_street_view_images_hundred():
    # Updated longitude and latitude values
    longitude_min = -79.403619  # topleft longitude
    longitude_max = -79.374303  # bottomright longitude
    latitude_min = 43.637794  # bottomleft latitude
    latitude_max = 43.670535  # topright latitude

    try:
        response = (
            supabase_client.table("street_view_images")
            .select("*")
            .filter("longitude", "gte", longitude_min)
            .filter("longitude", "lte", longitude_max)
            .filter("latitude", "gte", latitude_min)
            .filter("latitude", "lte", latitude_max)
            .limit(100)
            .execute()
        )

        return response.data  # Return the filtered rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
async def search(q: str = Query(..., min_length=1, max_length=100)):
    with vecs.create_client(settings.DB_CONNECTION_STRING) as vx:

        res = co.embed(
            texts=[q],
            model="embed-english-v3.0",
            input_type="search_query",
            embedding_types=["float"],
        )
        embedding = res.embeddings.float[0]

        docs = vx.get_or_create_collection(name="image_embeddings", dimension=1024)
        results_from_query = docs.query(
            data=embedding,
            limit=100,
            measure="cosine_distance",
            include_value=True, 
        )
        # results_from_query is a list of tuples, where each tuple[0] contains the result ID and each tuple[1] contains the cosine similarity
        print(results_from_query)
        result_ids = [result[0] for result in results_from_query]
        similarity_scores = [1 - result[1] for result in results_from_query]  # Convert distance to similarity

    results = (
        supabase_client.table("street_view_images")
        .select("*")
        .in_("image_id", result_ids)
        .execute()
    )
    # Prepare heatmap data
    heatmap_data: List[Tuple[float, float, float]] = []
    for result, score in zip(results.data, similarity_scores):
        heatmap_data.append((
            result['latitude'],
            result['longitude'],
            score  # Use similarity score as weight
        ))

    return {"results": results.data,
            "heatmap_data": heatmap_data}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
