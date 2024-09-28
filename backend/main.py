from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from config import settings
from supabase import supabase_client

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
        response = supabase_client.table("street_view_images").select("*").limit(10).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
async def search(query: SearchQuery):
    with vecs.create_client(settings.DB_CONNECTION_STRING) as vx:
    
        res = co.embed(
            texts=[query.q],
            model="embed-english-v3.0",
            input_type="search_query",
            embedding_types=["float"],
        )
        embedding = res.embeddings.float

        docs = vx.get_or_create_collection(name="image_embeddings", dimension=2)
        docs.search(
            data=embedding,
            limit=10,
            measure="cosine_distance",
        )

    return {"results": "Search results will be implemented here"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
