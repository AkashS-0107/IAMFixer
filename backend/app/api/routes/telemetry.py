from fastapi import APIRouter, Depends
from app.api.dependencies import get_telemetry_service
from app.schemas.telemetry import TelemetryListResponse
from app.services.telemetry.telemetry_service import TelemetryService

router = APIRouter(prefix="/api/incidents", tags=["Telemetry"])


@router.get(
    "/{incident_id}/telemetry",
    response_model=TelemetryListResponse,
    summary="Get Incident Telemetry",
    description="Retrieve all telemetry events associated with an incident ordered chronologically ascending.",
)
async def get_incident_telemetry(
    incident_id: str,
    service: TelemetryService = Depends(get_telemetry_service),
):
    telemetry = service.get_incident_telemetry(incident_id)
    return TelemetryListResponse(
        incident_id=incident_id,
        count=len(telemetry),
        telemetry=telemetry,
    )
