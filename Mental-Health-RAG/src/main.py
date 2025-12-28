import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_engine import get_rag_engine

# Initialize FastAPI app
app = FastAPI(
    title="Mental Health AI First Aid API",
    description="RAG-based chatbot for mental health support",
    version="1.0.0",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class ChatRequest(BaseModel):
    message: str

    class Config:
        json_schema_extra = {
            "example": {"message": "How can I manage stress during exams?"}
        }


class Source(BaseModel):
    source: str
    page: int


class ChatResponse(BaseModel):
    response: str
    sources: List[Source]
    error: Optional[str] = None


# Initialize RAG engine on startup
@app.on_event("startup")
async def startup_event():
    """Initialize RAG engine when server starts."""
    print("Starting Mental Health AI First Aid API...")
    get_rag_engine()
    print("✅ API ready!")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if API is running."""
    return {"status": "healthy", "service": "Mental Health AI First Aid API"}


# Main chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process user query and return AI response with sources.

    - **message**: User's mental health question or concern
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Get RAG engine
        rag_engine = get_rag_engine()

        # Process query
        result = rag_engine.chat(request.message)

        return ChatResponse(
            response=result["response"],
            sources=[Source(**src) for src in result.get("sources", [])],
            error=result.get("error"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# Root endpoint
@app.get("/")
async def root():
    """API information."""
    return {
        "message": "Mental Health AI First Aid API",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
