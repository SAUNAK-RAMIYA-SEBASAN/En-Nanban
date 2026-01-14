## Steps to Run on Another System

**Prerequisites:**
- Docker Desktop installed
- Git (to clone the project)

**Steps:**

1. **Clone the project:**
   ```bash
   git clone <your-repo-url>
   cd mental-health-rag
   ```

2. **Add your OpenRouter API key:**
   Create a `.env` file in the project root:
   ```
   OPENROUTER_API_KEY=your_key_here
   ```

3. **Run ingestion (one-time only):**
   ```bash
   # Create virtual environment
   python3.11 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Place PDFs in data/pdfs/ folder
   # Then run ingestion
   cd src
   python ingest.py
   ```

4. **Build Docker image:**
   ```bash
   docker build -t mental-health-rag .
   ```

5. **Run the container:**
   ```bash
   # Windows
   docker run -p 8000:8000 -v "C:\path\to\mental-health-rag\data:/app/data" mental-health-rag

   # Linux/Mac
   docker run -p 8000:8000 -v "/path/to/mental-health-rag/data:/app/data" mental-health-rag
   ```

6. **Access API:**
   Open your browser and navigate to [http://localhost:8000/docs](http://localhost:8000/docs).

**Note:** Step 3 only needs to be run once to create the ChromaDB. After that, just follow steps 4-6.
