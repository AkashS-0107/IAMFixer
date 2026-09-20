from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4
from pydantic import BaseModel, Field
from app.models.enums import TelemetryEventType, TelemetrySource


class TelemetryEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    incident_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: TelemetrySource
    event_type: TelemetryEventType
    severity: str = "INFO"
    service: str
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
