from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_investigation_engine
from app.schemas.investigation import InvestigationResponse
from app.services.investigation.investigation_engine import InvestigationEngine

router = APIRouter(prefix="/api/incidents", tags=["Investigation"])


@router.post(
    "/{incident_id}/investigate",
    response_model=InvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Incident Investigation",
    description="Run the Root Cause Analysis engine on incident telemetry, extract evidence, compute root cause and recommendation.",
)
async def investigate_incident(
    incident_id: str,
    rerun: Optional[bool] = Query(False, description="Set true to force re-running investigation if already completed"),
    engine: InvestigationEngine = Depends(get_investigation_engine),
):
    return engine.start_investigation(incident_id=incident_id, rerun=rerun)


@router.get(
    "/{incident_id}/investigation",
    response_model=InvestigationResponse,
    summary="Get Persisted Investigation Result",
    description="Retrieve the stored investigation result for a given incident. Returns 404 if not found.",
)
async def get_investigation_result(
    incident_id: str,
    engine: InvestigationEngine = Depends(get_investigation_engine),
):
    return engine.get_investigation(incident_id=incident_id)
