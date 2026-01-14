import chromadb
from chromadb.config import Settings
from openai import OpenAI
from sentence_transformers import SentenceTransformer

from config import (
    CHROMA_DIR,
    COLLECTION_NAME,
    EMBEDDING_MODEL,
    LLM_MODEL,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    TOP_K_RESULTS,
)


class RAGEngine:
    """RAG Engine for mental health support chatbot."""

    def __init__(self):
        """Initialize embedding model, ChromaDB, and OpenRouter client."""
        print("Initializing RAG Engine...")

        # Load embedding model
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)

        # Connect to ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR), settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.chroma_client.get_collection(COLLECTION_NAME)

        # Initialize OpenRouter client
        self.llm_client = OpenAI(
            base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY
        )

        print("✅ RAG Engine initialized!")

    def retrieve_context(self, query, top_k=TOP_K_RESULTS):
        """Retrieve relevant context from ChromaDB."""
        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()

        # Query ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding], n_results=top_k
        )

        # Format context with sources
        contexts = []
        for i, (doc, metadata) in enumerate(
            zip(results["documents"][0], results["metadatas"][0])
        ):
            contexts.append(
                {"text": doc, "source": metadata["source"], "page": metadata["page"]}
            )

        return contexts

    def generate_response(self, query, contexts):
        """Generate response using LLM with retrieved context."""

        # Build context string
        context_str = "\n\n".join(
            [
                f"[Source: {ctx['source']}, Page: {ctx['page']}]\n{ctx['text']}"
                for ctx in contexts
            ]
        )

        # System prompt
        system_prompt = """You are a compassionate AI mental health first aid assistant for students and young people. Your role is to provide immediate, evidence-based guidance using WHO mental health guidelines and culturally relevant practices.

Guidelines:
- Provide empathetic, clear, and actionable advice
- Base responses on the provided context from WHO guidelines, stress management, and mindfulness practices
- If someone is in crisis or mentions self-harm/suicide, urge them to contact emergency services immediately
- You cannot diagnose conditions - recommend professional help when needed
- Be supportive and non-judgmental
- Keep responses concise (3-4 paragraphs max)

Context from mental health resources:
{context}"""

        # User prompt
        user_prompt = f"Question: {query}"

        # Call LLM
        response = self.llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt.format(context=context_str),
                },
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        return response.choices[0].message.content

    def chat(self, user_query):
        """Main RAG pipeline: retrieve context + generate response."""
        try:
            # Retrieve relevant context
            contexts = self.retrieve_context(user_query)

            # Generate response
            response = self.generate_response(user_query, contexts)

            return {
                "response": response,
                "sources": [
                    {"source": ctx["source"], "page": ctx["page"]} for ctx in contexts
                ],
            }

        except Exception as e:
            return {
                "response": "I apologize, but I encountered an error. Please try again or contact support if the issue persists.",
                "error": str(e),
            }


# Create singleton instance
rag_engine = None


def get_rag_engine():
    """Get or create RAG engine instance."""
    global rag_engine
    if rag_engine is None:
        rag_engine = RAGEngine()
    return rag_engine
