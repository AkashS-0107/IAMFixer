from uuid import uuid4
from pydantic import BaseModel, Field
from app.models.enums import EvidenceRelevance


class Evidence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    incident_id: str
    telemetry_event_id: str
    evidence_type: str
    relevance: EvidenceRelevance
    explanation: str
