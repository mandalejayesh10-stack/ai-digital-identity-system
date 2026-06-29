from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app import models, schemas
from app.services.graph_store import graph_store_service

router = APIRouter(
    prefix="/skills",
    tags=["skills"]
)

@router.get("/", response_model=List[schemas.Skill])
def get_skills(db: Session = Depends(get_db)):
    """
    Retrieves all extracted skills.
    """
    return db.query(models.Skill).all()

@router.get("/graph")
def get_skill_graph():
    """
    Retrieves the full entity-relationship graph data from Neo4j / In-memory store.
    Suitable for rendering with React Flow or d3.
    """
    return graph_store_service.get_graph_data()
