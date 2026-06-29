import logging
import hashlib
import numpy as np
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.config import settings

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self):
        self.collection_name = "career_documents"
        self.vector_size = 1536  # Default OpenAI embedding size
        
        # Initialize Qdrant Client
        if settings.is_qdrant_configured:
            logger.info(f"Connecting to Qdrant at {settings.QDRANT_URL}...")
            self.client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
        else:
            logger.info("Qdrant not configured. Using in-memory Qdrant client...")
            self.client = QdrantClient(location=":memory:")
            
        # Ensure collection exists
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            if self.collection_name not in collection_names:
                logger.info(f"Creating Qdrant collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")

    def _get_embedding(self, text: str) -> List[float]:
        """
        Generates embedding using OpenAI if configured,
        otherwise falls back to a deterministic hash-based mock embedding.
        """
        if settings.is_openai_configured:
            try:
                from openai import OpenAI
                openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = openai_client.embeddings.create(
                    input=[text],
                    model="text-embedding-3-small"
                )
                return response.data[0].embedding
            except Exception as e:
                logger.error(f"OpenAI embedding generation failed, falling back to mock: {e}")
                
        # Mock embedding: Generate a deterministic vector based on text hash
        return self._generate_mock_embedding(text)

    def _generate_mock_embedding(self, text: str) -> List[float]:
        """
        Generates a deterministic vector of size self.vector_size based on the MD5 hash of the text.
        This allows similarity search to somewhat work (matching exact or similar strings) without an API key.
        """
        # Create a hash of the text
        hasher = hashlib.md5(text.encode('utf-8'))
        hash_digest = hasher.digest()
        
        # Use the hash as a seed to generate a deterministic random vector
        seed = int.from_bytes(hash_digest[:4], byteorder='big')
        np.random.seed(seed)
        
        # Generate a random unit vector
        vec = np.random.randn(self.vector_size)
        vec /= np.linalg.norm(vec)
        return vec.tolist()

    def add_document_chunks(self, document_id: int, chunks: List[str], metadata: Dict[str, Any]):
        """
        Chunks the document and inserts into Qdrant.
        """
        points = []
        for idx, chunk in enumerate(chunks):
            vector = self._get_embedding(chunk)
            point_id = int(hashlib.md5(f"{document_id}_{idx}".encode('utf-8')).hexdigest()[:8], 16)
            
            # Prepare payload
            payload = {
                "document_id": document_id,
                "chunk_index": idx,
                "text": chunk,
                **metadata
            }
            
            points.append(PointStruct(
                id=point_id,
                vector=vector,
                payload=payload
            ))
            
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Successfully indexed {len(chunks)} chunks for document {document_id}")
        except Exception as e:
            logger.error(f"Failed to upsert points to Qdrant: {e}")

    def search_similar_chunks(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Searches for similar chunks in Qdrant.
        """
        query_vector = self._get_embedding(query)
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit
            )
            return [hit.payload for hit in results]
        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            return []

vector_store_service = VectorStoreService()
