from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Table, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Association table for Document <-> Skill
document_skill = Table(
    'document_skills',
    Base.metadata,
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True),
    Column('skill_id', Integer, ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True)
)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    file_path = Column(String)
    file_type = Column(String, index=True)  # resume, certificate, internship, project, portfolio, github
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="pending")  # pending, processing, completed, failed
    summary = Column(Text, nullable=True)
    overall_score = Column(Float, default=0.0)

    # Relationships
    timeline_events = relationship("TimelineEvent", back_populates="document", cascade="all, delete-orphan")
    skills = relationship("Skill", secondary=document_skill, back_populates="documents")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, index=True)
    description = Column(Text)
    event_date = Column(String, nullable=True)  # YYYY-MM-DD or YYYY-MM
    event_year = Column(Integer, index=True)
    category = Column(String, index=True)  # work, education, project, certification, award

    # Relationships
    document = relationship("Document", back_populates="timeline_events")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String, index=True)  # language, framework, database, tool, concept
    level = Column(String, default="Intermediate")  # Beginner, Intermediate, Expert

    # Relationships
    documents = relationship("Document", secondary=document_skill, back_populates="skills")

class SkillRelationship(Base):
    __tablename__ = "skill_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"))
    target_skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"))
    relationship_type = Column(String)  # used_with, related_to, prerequisite_of

    # Relationships
    source_skill = relationship("Skill", foreign_keys=[source_skill_id])
    target_skill = relationship("Skill", foreign_keys=[target_skill_id])
