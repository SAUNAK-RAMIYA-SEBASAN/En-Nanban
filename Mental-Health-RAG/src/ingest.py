from pathlib import Path

import chromadb
import fitz
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

from config import (
    CHROMA_DIR,
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    COLLECTION_NAME,
    EMBEDDING_MODEL,
    PDF_DIR,
)


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF with page numbers."""
    doc = fitz.open(pdf_path)
    pages_data = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():  # Only add non-empty pages
            pages_data.append(
                {"text": text, "page": page_num + 1, "source": pdf_path.name}
            )

    doc.close()
    return pages_data


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks by tokens (approx 4 chars = 1 token)."""
    words = text.split()
    chunks = []

    # Approximate tokens: 1 token ≈ 0.75 words
    words_per_chunk = int(chunk_size * 0.75)
    words_overlap = int(overlap * 0.75)

    for i in range(0, len(words), words_per_chunk - words_overlap):
        chunk = " ".join(words[i : i + words_per_chunk])
        if chunk.strip():
            chunks.append(chunk)

        # Break if we've reached the end
        if i + words_per_chunk >= len(words):
            break

    return chunks


def process_all_pdfs():
    """Process all PDFs in the PDF directory."""
    pdf_files = list(PDF_DIR.glob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in {PDF_DIR}")
        return []

    all_chunks = []

    for pdf_path in pdf_files:
        print(f"\nProcessing: {pdf_path.name}")
        pages_data = extract_text_from_pdf(pdf_path)

        for page_data in tqdm(pages_data, desc=f"Chunking {pdf_path.name}"):
            chunks = chunk_text(page_data["text"])

            for i, chunk in enumerate(chunks):
                all_chunks.append(
                    {
                        "text": chunk,
                        "source": page_data["source"],
                        "page": page_data["page"],
                        "chunk_id": f"{page_data['source']}_p{page_data['page']}_c{i}",
                    }
                )

    return all_chunks


def create_vector_db(chunks):
    """Create ChromaDB collection and store embeddings."""
    print("\nInitializing embedding model...")
    embedding_model = SentenceTransformer(EMBEDDING_MODEL)

    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(
        path=str(CHROMA_DIR), settings=Settings(anonymized_telemetry=False)
    )

    # Delete existing collection if exists
    try:
        client.delete_collection(COLLECTION_NAME)
    except:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "Mental health support documents"},
    )

    print(f"\nGenerating embeddings for {len(chunks)} chunks...")
    texts = [chunk["text"] for chunk in chunks]
    embeddings = embedding_model.encode(texts, show_progress_bar=True, batch_size=32)

    print("Storing in ChromaDB...")
    collection.add(
        embeddings=embeddings.tolist(),
        documents=texts,
        ids=[chunk["chunk_id"] for chunk in chunks],
        metadatas=[
            {"source": chunk["source"], "page": chunk["page"]} for chunk in chunks
        ],
    )

    print(f"\n✅ Successfully stored {len(chunks)} chunks in ChromaDB!")
    return collection


def main():
    """Main ingestion pipeline."""
    print("=" * 60)
    print("Mental Health RAG - Document Ingestion")
    print("=" * 60)

    # Process PDFs
    chunks = process_all_pdfs()
    print(f"\nTotal chunks created: {len(chunks)}")

    # Create vector database
    if chunks:
        create_vector_db(chunks)
    else:
        print("No chunks to process!")


if __name__ == "__main__":
    main()
