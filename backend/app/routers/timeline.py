from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(
    prefix="/timeline",
    tags=["timeline"]
)

@router.get("/", response_model=List[schemas.TimelineEvent])
def get_timeline_events(db: Session = Depends(get_db)):
    """
    Retrieves all career timeline events, sorted chronologically.
    """
    events = db.query(models.TimelineEvent).order_by(
        models.TimelineEvent.event_year.asc(),
        models.TimelineEvent.event_date.asc()
    ).all()
    return events
