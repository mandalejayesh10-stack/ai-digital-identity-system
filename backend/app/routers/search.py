from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services.agent_workflow import AgentWorkflowService

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.post("/chat", response_model=schemas.RAGResponse)
def rag_search(payload: schemas.RAGQuery, db: Session = Depends(get_db)):
    """
    RAG Chat Agent. Answers natural language queries over uploaded documents.
    """
    question = payload.question
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    db_docs = db.query(models.Document).all()
    
    answer, cited_docs = AgentWorkflowService.answer_query_with_rag(question, db_docs)
    
    # Map cited docs to Schema format
    relevant_docs = []
    for doc in cited_docs:
        relevant_docs.append(schemas.DocumentBase(
            name=doc["name"],
            file_type=doc["file_type"]
        ))
        
    return schemas.RAGResponse(
        answer=answer,
        relevant_documents=relevant_docs
    )
