import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from assessment import (
    AssessmentQuestionsResponse,
    AssessmentRequest,
    AssessmentResult,
    DifficultyLevel,
    DifficultyRequest,
    calculate_gad7_score,
    calculate_phq9_score,
    get_gad7_questions,
    get_phq9_questions,
)
from rag_engine import get_rag_engine

# Initialize FastAPI app
app = FastAPI(
    title="Mental Health AI First Aid API",
    description="RAG-based chatbot + Assessment tools for mental health support",
    version="1.1.0",  # Updated version
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== CHATBOT MODELS (UNCHANGED) =====
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


# ===== ASSESSMENT MODELS (NEW) =====
class AssessmentDifficultyRequest(BaseModel):
    difficulty: DifficultyLevel


# Initialize RAG engine on startup
@app.on_event("startup")
async def startup_event():
    """Initialize RAG engine when server starts."""
    print("Starting Mental Health AI First Aid API...")
    get_rag_engine()
    print("✅ API ready with RAG + Assessment tools!")


# ===== CHATBOT ENDPOINTS (UNCHANGED) =====
@app.get("/health")
async def health_check():
    """Check if API is running."""
    return {"status": "healthy", "service": "Mental Health AI First Aid API"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process user query and return AI response with sources.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        rag_engine = get_rag_engine()
        result = rag_engine.chat(request.message)

        return ChatResponse(
            response=result["response"],
            sources=[
                Source(source=src["source"], page=src["page"])
                for src in result.get("sources", [])
            ],
            error=result.get("error"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/")
async def root():
    """API information."""
    return {
        "message": "Mental Health AI First Aid API",
        "features": [
            "AI Chatbot (/chat)",
            "GAD-7 Assessment (/assessment/gad7)",
            "PHQ-9 Assessment (/assessment/phq9)",
        ],
        "docs": "/docs",
        "health": "/health",
    }


# ===== NEW ASSESSMENT ENDPOINTS =====
## GAD-7 Assessment
@app.get("/assessment/gad7/questions", response_model=AssessmentQuestionsResponse)
async def gad7_questions():
    """Get GAD-7 questions and response options."""
    return get_gad7_questions()


@app.post("/assessment/gad7/score")
async def gad7_submit_responses(
    responses: AssessmentRequest, difficulty: AssessmentDifficultyRequest
):
    """Submit GAD-7 responses and get assessment results."""
    return calculate_gad7_score(responses.responses, difficulty.difficulty)


## PHQ-9 Assessment
@app.get("/assessment/phq9/questions", response_model=AssessmentQuestionsResponse)
async def phq9_questions():
    """Get PHQ-9 questions and response options."""
    return get_phq9_questions()


@app.post("/assessment/phq9/score")
async def phq9_submit_responses(
    responses: AssessmentRequest,
    difficulty: AssessmentDifficultyRequest,
    felt_depressed_past_year: bool = False,
    serious_thoughts_past_month: bool = False,
):
    """Submit PHQ-9 responses and get assessment results."""
    return calculate_phq9_score(
        responses.responses,
        difficulty.difficulty,
        felt_depressed_past_year,
        serious_thoughts_past_month,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
