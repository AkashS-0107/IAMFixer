from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import __version__
from app.core.config import settings
from app.db.database import get_db

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health Check",
    description="Check backend operational status, database connectivity, and service version.",
)
async def health_check(db: Session = Depends(get_db)):
    bedrock_status = "configured" if bool(settings.bedrock_model_id) else "not_configured"
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "unavailable"

    return {
        "status": "ok",
        "service": "IAMFixer",
        "version": __version__,
        "ai_provider": settings.iamfixer_ai_provider,
        "bedrock_status": bedrock_status,
        "database_status": database_status,
    }
