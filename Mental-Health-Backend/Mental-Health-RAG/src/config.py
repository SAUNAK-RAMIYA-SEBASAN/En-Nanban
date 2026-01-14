import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Project paths
BASE_DIR = Path(__file__).parent.parent
PDF_DIR = BASE_DIR / "data" / "pdfs"

# Use absolute path if in Docker, relative otherwise
if os.path.exists("/app/data/chroma_db"):
    CHROMA_DIR = Path("/app/data/chroma_db")
else:
    CHROMA_DIR = BASE_DIR / "data" / "chroma_db"

# Embedding model
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Chunking parameters
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150

# ChromaDB settings
COLLECTION_NAME = "mental_health_docs"

# OpenRouter API
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

# RAG settings
TOP_K_RESULTS = 4
