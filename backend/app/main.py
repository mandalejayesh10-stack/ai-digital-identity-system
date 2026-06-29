import os
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, get_db
from app import models, schemas
from app.routers import documents, timeline, skills, search
from app.services.graph_store import graph_store_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for the AI Digital Identity System",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon ease; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(timeline.router, prefix=settings.API_V1_STR)
app.include_router(skills.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)

def seed_demo_data(db: Session):
    """
    Pre-populates the database with a premium, realistic profile for hackathon demonstration.
    """
    # Check if data already exists
    if db.query(models.Document).first() is not None:
        logger.info("Demo data already seeded.")
        return

    logger.info("Seeding database with stunning hackathon demo profile...")
    
    # 1. Create Documents
    doc1 = models.Document(name="Resume_Alex_Dev.pdf", file_path="./uploads/Resume_Alex_Dev.pdf", file_type="resume", status="completed", summary="Experienced Full-Stack Engineer specializing in AI integration, GraphRAG, and high-performance backend systems.", overall_score=92.0)
    doc2 = models.Document(name="React_Advanced_Cert.pdf", file_path="./uploads/React_Advanced_Cert.pdf", file_type="certificate", status="completed", summary="Professional certification in Advanced React patterns, state management, and Next.js SSR optimization.", overall_score=88.0)
    doc3 = models.Document(name="AI_Resume_Analyzer_Project.pdf", file_path="./uploads/AI_Resume_Analyzer_Project.pdf", file_type="project", status="completed", summary="Open-source portfolio project implementing multi-agent document analysis using LangGraph and Qdrant.", overall_score=95.0)
    
    db.add_all([doc1, doc2, doc3])
    db.commit()
    db.refresh(doc1)
    db.refresh(doc2)
    db.refresh(doc3)

    # 2. Create Skills
    skills_list = [
        models.Skill(name="Python", category="language", level="Expert"),
        models.Skill(name="JavaScript", category="language", level="Expert"),
        models.Skill(name="TypeScript", category="language", level="Intermediate"),
        models.Skill(name="React", category="framework", level="Expert"),
        models.Skill(name="Next.js", category="framework", level="Expert"),
        models.Skill(name="FastAPI", category="framework", level="Expert"),
        models.Skill(name="PostgreSQL", category="database", level="Intermediate"),
        models.Skill(name="Qdrant", category="database", level="Intermediate"),
        models.Skill(name="Neo4j", category="database", level="Intermediate"),
        models.Skill(name="Docker", category="tool", level="Intermediate"),
        models.Skill(name="Git", category="tool", level="Expert"),
        models.Skill(name="GraphRAG", category="concept", level="Expert")
    ]
    db.add_all(skills_list)
    db.commit()

    # Refresh skills to get IDs
    skills_map = {s.name: s for s in db.query(models.Skill).all()}

    # Connect Documents to Skills
    doc1.skills.extend([skills_map["Python"], skills_map["JavaScript"], skills_map["React"], skills_map["FastAPI"], skills_map["PostgreSQL"]])
    doc2.skills.extend([skills_map["JavaScript"], skills_map["React"], skills_map["Next.js"]])
    doc3.skills.extend([skills_map["Python"], skills_map["FastAPI"], skills_map["Qdrant"], skills_map["Neo4j"], skills_map["GraphRAG"]])
    db.commit()

    # 3. Create Timeline Events
    events = [
        models.TimelineEvent(document_id=doc1.id, title="B.S. in Computer Science", description="Graduated with honors. Specialized in Software Engineering and Distributed Systems.", event_date="2023-05-15", event_year=2023, category="education"),
        models.TimelineEvent(document_id=doc2.id, title="React Advanced Certification", description="Completed intensive specialization in React design patterns, performance tuning, and Next.js.", event_date="2023-11-10", event_year=2023, category="certification"),
        models.TimelineEvent(document_id=doc1.id, title="Software Engineer Intern at TechCorp", description="Developed REST APIs using FastAPI and built interactive dashboard features in React.", event_date="2024-06-01", event_year=2024, category="work"),
        models.TimelineEvent(document_id=doc3.id, title="Won Global AI Hackathon 2025", description="Built a real-time collaborative document editor with AI copilot integration.", event_date="2025-02-20", event_year=2025, category="award"),
        models.TimelineEvent(document_id=doc3.id, title="Built AI Digital Identity System", description="Designed a GraphRAG career portfolio using Neo4j, Qdrant, and LangGraph.", event_date="2025-08-01", event_year=2025, category="project"),
        models.TimelineEvent(document_id=doc3.id, title="Published GraphRAG Research Paper", description="Authored a paper on optimizing entity-relationship extraction in recruitment workflows.", event_date="2026-04-15", event_year=2026, category="project")
    ]
    db.add_all(events)
    db.commit()

    # 4. Seed the Graph Store Service (Neo4j / In-memory)
    for doc in [doc1, doc2, doc3]:
        graph_store_service.add_node("Document", doc.name, {
            "document_id": doc.id,
            "file_type": doc.file_type,
            "score": doc.overall_score
        })

    for s_name, skill in skills_map.items():
        graph_store_service.add_node("Skill", s_name, {
            "category": skill.category,
            "level": skill.level
        })

    # Connect Document -> HAS_SKILL -> Skill
    for doc in [doc1, doc2, doc3]:
        for skill in doc.skills:
            graph_store_service.add_relationship(
                "Document", doc.name,
                "Skill", skill.name,
                "HAS_SKILL"
            )

    # Connect Skill Relationships
    graph_store_service.add_relationship("Skill", "FastAPI", "Skill", "Python", "PREREQUISITE_OF")
    graph_store_service.add_relationship("Skill", "Next.js", "Skill", "React", "PREREQUISITE_OF")
    graph_store_service.add_relationship("Skill", "React", "Skill", "JavaScript", "PREREQUISITE_OF")
    graph_store_service.add_relationship("Skill", "GraphRAG", "Skill", "Neo4j", "USED_WITH")
    graph_store_service.add_relationship("Skill", "GraphRAG", "Skill", "Qdrant", "USED_WITH")
    graph_store_service.add_relationship("Skill", "GraphRAG", "Skill", "Python", "USED_WITH")

    logger.info("Database successfully seeded.")

@app.get("/api/v1/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns high-level statistics and career recommendations.
    """
    # Seed demo data if database is empty
    seed_demo_data(db)
    
    docs = db.query(models.Document).all()
    skills = db.query(models.Skill).all()
    events = db.query(models.TimelineEvent).all()
    
    avg_score = sum([d.overall_score for d in docs]) / len(docs) if docs else 0.0
    
    recent_activity = db.query(models.TimelineEvent).order_by(
        models.TimelineEvent.event_year.desc(),
        models.TimelineEvent.event_date.desc()
    ).limit(5).all()
    
    top_skills = [s for s in skills if s.level == "Expert"][:6]
    if not top_skills:
        top_skills = skills[:6]
        
    insights = [
        "Your AI Career Score is in the top 95% of software engineers.",
        "Your skills in Python and FastAPI are heavily linked across 3 core projects.",
        "A strong concentration of certifications in late 2023 demonstrates rapid skill acquisition.",
        "No career gaps detected in your timeline from 2023 to 2026."
    ]
    
    missing_skills = [
        "Docker (Highly recommended for FastAPI deployments)",
        "Kubernetes (Frequently requested in expert-level job descriptions)",
        "Tailwind CSS (Required for modern Next.js frontend roles)"
    ]
    
    career_roadmap = [
        "Step 1: Obtain a Cloud Certification (AWS Certified Developer / Associate)",
        "Step 2: Build a production-grade Kubernetes deployment for the AI Digital Identity System",
        "Step 3: Contribute to open-source GraphRAG repositories to elevate industry presence"
    ]
    
    return schemas.DashboardStats(
        career_score=round(avg_score, 1),
        total_documents=len(docs),
        total_skills=len(skills),
        total_events=len(events),
        recent_activity=recent_activity,
        top_skills=top_skills,
        insights=insights,
        missing_skills=missing_skills,
        career_roadmap=career_roadmap
    )

@app.on_event("startup")
def startup_event():
    # Seed data on startup
    db = SessionLocal = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()
