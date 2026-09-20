from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.enums import IncidentStatus, Severity
from app.models.incident import Incident


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, json_schema_extra={"example": "High HTTP Error Rate in payment-service"})
    description: str = Field(..., min_length=5, json_schema_extra={"example": "500 errors spiked above baseline after v1.8.3 deployment."})
    severity: Severity = Field(..., json_schema_extra={"example": Severity.HIGH})
    status: IncidentStatus = Field(default=IncidentStatus.OPEN, json_schema_extra={"example": IncidentStatus.OPEN})
    affected_service: str = Field(..., min_length=1, max_length=100, json_schema_extra={"example": "payment-service"})
    detected_at: Optional[datetime] = None

    @field_validator("title", "description", "affected_service")
    @classmethod
    def check_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or blank")
        return v.strip()


IncidentResponse = Incident
