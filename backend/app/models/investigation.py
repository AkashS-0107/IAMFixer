from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field, model_validator
from app.models.enums import InvestigationStatus, RemediationRisk
from app.models.evidence import Evidence


class RootCause(BaseModel):
    category: str
    description: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    supporting_evidence_ids: List[str] = Field(default_factory=list)


class Recommendation(BaseModel):
    action: str
    reason: str
    risk: RemediationRisk
    requires_approval: bool = True


class Investigation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    incident_id: str
    status: InvestigationStatus = InvestigationStatus.IN_PROGRESS
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    probable_root_cause: Optional[RootCause] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    reasoning: Optional[str] = None
    recommendation: Optional[Recommendation] = None
    supporting_evidence: List[Evidence] = Field(default_factory=list)
    provider_used: Optional[str] = None
    error_message: Optional[str] = None


    @model_validator(mode="after")
    def validate_completed_state(self) -> "Investigation":
        """Ensure required fields are populated when investigation is COMPLETED."""
        if self.status == InvestigationStatus.COMPLETED:
            if self.probable_root_cause is None:
                raise ValueError("probable_root_cause must be populated when status is COMPLETED")
            if self.confidence is None:
                raise ValueError("confidence must be populated when status is COMPLETED")
            if self.recommendation is None:
                raise ValueError("recommendation must be populated when status is COMPLETED")
            if not self.reasoning:
                raise ValueError("reasoning must be populated when status is COMPLETED")
        return self
