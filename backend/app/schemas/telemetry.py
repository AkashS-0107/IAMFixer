from typing import List
from pydantic import BaseModel
from app.models.telemetry import TelemetryEvent


class TelemetryListResponse(BaseModel):
    incident_id: str
    count: int
    telemetry: List[TelemetryEvent]
