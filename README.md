# Aegis: AI Digital Identity System

> **The Ultimate GraphRAG-Powered Career Twin.**  
> *Turn raw resumes, certificates, and portfolio URLs into an interactive, semantic digital identity. No more searching through folders—just ask your AI.*
>
> **🌐 Live Demo:** [ai-digital-identity-system.vercel.app](https://ai-digital-identity-system.vercel.app/)

---

## 🚀 National Hackathon Submission

Aegis is an enterprise-grade full-stack platform designed to solve the chaos of professional document storage. Instead of static files in cloud folders, Aegis parses, indexes, and maps your entire career history into a stateful **Multi-Agent Graph (LangGraph)**, a **Vector Database (Qdrant)**, and a **Knowledge Graph (Neo4j)**.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js 16, React, Tailwind CSS, Lucide Icons, React Flow (Custom SVG Physics Engine).
*   **Backend:** FastAPI (Python), SQLAlchemy ORM, Uvicorn.
*   **Orchestration & AI:** LangGraph (StateGraph), LlamaIndex, OpenAI GPT-4o-mini.
*   **Document Ingestion:** LlamaParse (High-fidelity markdown layout extraction), PyPDF2 (Local fallback).
*   **Vector Database:** Qdrant (Hybrid semantic search, dense & sparse embeddings).
*   **Graph Database:** Neo4j (Cypher query language, property graphs).
*   **Relational Database:** PostgreSQL (Production) / SQLite (Zero-Config Development).

---

## 📦 System Architecture & Data Flow

```mermaid
graph TB
    subgraph Frontend [Next.js 16 Client]
        UI[Dashboard UI]
        TG[Timeline Graph]
        SG[Interactive Skill Graph]
        Chat[RAG Chatbot]
    end

    subgraph Backend [FastAPI Server]
        API[REST API Gateway]
        DB_Conn[SQLAlchemy ORM]
        
        subgraph AgentPipeline [LangGraph Ingestion Engine]
            Orch[State Graph Orchestrator]
            NP[Parser Node]
            NC[Categorizer Node]
            NS[Skill Extractor Node]
            NT[Timeline Builder Node]
            NG[Graph Builder Node]
            NV[Vector Indexer Node]
        end
    end

    subgraph Storage [Data Tier]
        SQL[(PostgreSQL / SQLite)]
        Qdrant[(Qdrant Vector DB)]
        Neo4j[(Neo4j Graph DB)]
        FS[(Local File Storage)]
    end

    %% Connections
    UI --> API
    TG --> API
    SG --> API
    Chat --> API

    API --> DB_Conn
    API --> AgentPipeline
    
    NP --> FS
    NC --> DB_Conn
    NS --> DB_Conn
    NT --> DB_Conn
    NG --> Neo4j
    NV --> Qdrant
    
    DB_Conn --> SQL
```

---

## 🌟 Core Modules

### 1. Ingestion Worker (`LlamaParse + OCR`)
Converts complex PDFs (tables, multi-column layouts) into structured Markdown. Automatically falls back to local PyPDF2 text extraction if offline.

### 2. Intelligent Categorization
Extracts professional skills, categories (language, framework, database, tool, concept), competence levels (Beginner, Intermediate, Expert), and years of experience.

### 3. Relationship Engine (`Neo4j`)
Maps nodes (Documents, Skills, Events) and edges (`HAS_SKILL`, `CONTAINS_EVENT`, `PREREQUISITE_OF`) in a property graph to visualize how your skills and projects connect.

### 4. Career Journey Timeline
Extracts milestones and dates, merges them, and displays an interactive, chronological vertical timeline. Clicking any node displays its details and links back to the verified source document.

### 5. Smart Retrieval (`GraphRAG`)
A chat interface allowing you to query your digital twin (e.g., *"Which projects did I build with React?"* or *"Show my AI certificates before 2025"*). Aegis performs a vector search, compiles context, and generates a response citing the exact source documents.

---

## ⚙️ Quick Start (Zero-Config Hackathon Mode)

Aegis is built with a **Dual-Engine Architecture**. It runs out-of-the-box locally using SQLite, in-memory Qdrant, and an in-memory Graph Store. No cloud database setup is required to run the demo.

### One-Click Launch (Windows)
Double-click the **`run.bat`** file in the root directory. This will automatically:
1.  Initialize a Python virtual environment and install backend packages.
2.  Install Next.js frontend node packages.
3.  Start the FastAPI backend (`http://localhost:8000`) and Next.js dev server (`http://localhost:3000`).

### Manual Launch
**1. Start the Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*The database will be created and pre-seeded with a premium profile (`Alex Developer`) on startup.*

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🔒 Production Configuration

To connect to cloud databases, create a `.env` file in the `backend/` directory:

```env
# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
LLAMA_CLOUD_API_KEY=your_llamaparse_api_key_here

# Databases
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
QDRANT_URL=https://your-qdrant-cluster.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
NEO4J_URI=neo4j+s://your-neo4j-aura.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
```
