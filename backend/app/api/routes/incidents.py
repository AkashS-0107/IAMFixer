from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_incident_service
from app.models.enums import IncidentStatus, Severity
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.services.incidents.incident_service import IncidentService

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Incident",
    description="Create a new software incident record with title, description, severity, status, and affected service.",
)
async def create_incident(
    payload: IncidentCreate,
    service: IncidentService = Depends(get_incident_service),
):
    return service.create_incident(payload)


@router.get(
    "",
    response_model=List[IncidentResponse],
    summary="List Incidents",
    description="List stored incidents with optional filtering by severity, status, and affected service.",
)
async def list_incidents(
    severity: Optional[Severity] = Query(None, description="Filter by severity level (LOW, MEDIUM, HIGH, CRITICAL)"),
    status: Optional[IncidentStatus] = Query(None, description="Filter by incident status (OPEN, INVESTIGATING, RESOLVED)"),
    affected_service: Optional[str] = Query(None, description="Filter by affected service name"),
    service: IncidentService = Depends(get_incident_service),
):
    return service.list_incidents(
        severity=severity,
        status=status,
        affected_service=affected_service,
    )


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
    summary="Get Incident Details",
    description="Retrieve details for a specific incident by ID. Returns 404 if not found.",
)
async def get_incident(
    incident_id: str,
    service: IncidentService = Depends(get_incident_service),
):
    return service.get_incident(incident_id)
