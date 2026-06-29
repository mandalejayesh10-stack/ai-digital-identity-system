from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Skill Schemas
class SkillBase(BaseModel):
    name: str
    category: str
    level: str = "Intermediate"

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int

    class Config:
        from_attributes = True

# Skill Relationship Schemas
class SkillRelationshipBase(BaseModel):
    source_skill_id: int
    target_skill_id: int
    relationship_type: str

class SkillRelationship(SkillRelationshipBase):
    id: int

    class Config:
        from_attributes = True

# Timeline Event Schemas
class TimelineEventBase(BaseModel):
    title: str
    description: str
    event_date: Optional[str] = None
    event_year: int
    category: str

class TimelineEventCreate(TimelineEventBase):
    document_id: Optional[int] = None

class TimelineEvent(TimelineEventBase):
    id: int
    document_id: Optional[int] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    name: str
    file_type: str

class DocumentCreate(DocumentBase):
    file_path: str

class Document(DocumentBase):
    id: int
    upload_date: datetime
    status: str
    summary: Optional[str] = None
    overall_score: float
    skills: List[Skill] = []

    class Config:
        from_attributes = True

# RAG Schemas
class RAGQuery(BaseModel):
    question: str

class RAGResponse(BaseModel):
    answer: str
    relevant_documents: List[DocumentBase]

# Dashboard Stats
class DashboardStats(BaseModel):
    career_score: float
    total_documents: int
    total_skills: int
    total_events: int
    recent_activity: List[TimelineEvent]
    top_skills: List[Skill]
    insights: List[str]
    missing_skills: List[str]
    career_roadmap: List[str]
