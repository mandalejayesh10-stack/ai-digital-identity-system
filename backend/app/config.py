import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI Digital Identity System"
    API_V1_STR: str = "/api/v1"
    
    # OpenAI API Key
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Google Gemini API Key (Free Alternative)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # LlamaCloud API Key for LlamaParse
    LLAMA_CLOUD_API_KEY: str = os.getenv("LLAMA_CLOUD_API_KEY", "")
    
    # Databases
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # Qdrant Vector Database
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    
    # Neo4j Graph Database
    NEO4J_URI: str = os.getenv("NEO4J_URI", "")
    NEO4J_USERNAME: str = os.getenv("NEO4J_USERNAME", "")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "")
    
    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # 'local', 's3', or 'supabase'
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    @property
    def is_qdrant_configured(self) -> bool:
        return bool(self.QDRANT_URL)
        
    @property
    def is_neo4j_configured(self) -> bool:
        return bool(self.NEO4J_URI and self.NEO4J_USERNAME and self.NEO4J_PASSWORD)
        
    @property
    def is_llamaparse_configured(self) -> bool:
        return bool(self.LLAMA_CLOUD_API_KEY)

    @property
    def is_openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY)
        
    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
