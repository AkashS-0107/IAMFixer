from datetime import datetime
from pydantic import BaseModel
from app.models.enums import Severity, SimulationScenario


class SimulationResult(BaseModel):
    incident_id: str
    scenario: SimulationScenario
    incident_title: str
    affected_service: str
    severity: Severity
    telemetry_count: int
    created_at: datetime
