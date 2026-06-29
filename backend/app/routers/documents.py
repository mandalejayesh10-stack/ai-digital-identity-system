import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.config import settings
from app import models, schemas
from app.services.parser import parser_service
from app.services.agent_workflow import AgentWorkflowService

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

def process_document_background(doc_id: int, file_path: str, file_name: str, file_type: str):
    """
    Background task to parse and run the agent workflow on the uploaded file.
    """
    db = next(get_db())
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not db_doc:
        return
        
    try:
        db_doc.status = "processing"
        db.commit()
        
        # 1. Parse file
        text = parser_service.parse_file(file_path)
        
        # 2. Run agent workflow
        result = AgentWorkflowService.process_document(doc_id, file_name, file_type, text)
        
        # 3. Update database record
        db_doc.summary = result.get("summary", "")
        db_doc.overall_score = result.get("overall_score", 70.0)
        db_doc.status = "completed"
        
        # Add extracted skills to document
        for skill_data in result.get("skills", []):
            db_skill = db.query(models.Skill).filter(models.Skill.name == skill_data["name"]).first()
            if not db_skill:
                db_skill = models.Skill(
                    name=skill_data["name"],
                    category=skill_data["category"],
                    level=skill_data["level"]
                )
                db.add(db_skill)
                db.commit()
                db.refresh(db_skill)
            
            # Connect skill to document if not already connected
            if db_skill not in db_doc.skills:
                db_doc.skills.append(db_skill)
                
        # Add timeline events
        for event_data in result.get("timeline_events", []):
            db_event = models.TimelineEvent(
                document_id=doc_id,
                title=event_data["title"],
                description=event_data["description"],
                event_date=event_data.get("event_date"),
                event_year=event_data["event_year"],
                category=event_data["category"]
            )
            db.add(db_event)
            
        db.commit()
        
    except Exception as e:
        db_doc.status = "failed"
        db_doc.summary = f"Processing failed: {str(e)}"
        db.commit()

@router.post("/upload", response_model=schemas.Document)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    file_type: str = Form(...),  # resume, certificate, internship, project, portfolio, github
    db: Session = Depends(get_db)
):
    # Validate file type
    valid_types = ["resume", "certificate", "internship", "project", "portfolio", "github"]
    if file_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Must be one of: {', '.join(valid_types)}")
        
    # Save file locally
    file_name = file.filename
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # Create database entry
    db_doc = models.Document(
        name=file_name,
        file_path=file_path,
        file_type=file_type,
        status="pending"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Trigger background parsing & agent workflow
    background_tasks.add_task(
        process_document_background,
        doc_id=db_doc.id,
        file_path=file_path,
        file_name=file_name,
        file_type=file_type
    )
    
    return db_doc

@router.get("/", response_model=List[schemas.Document])
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()

@router.get("/{doc_id}", response_model=schemas.Document)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete local file
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            pass
            
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
