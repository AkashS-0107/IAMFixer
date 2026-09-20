from datetime import datetime, timezone
from typing import List, Optional
from app.core.exceptions import IncidentNotFoundError
from app.models.enums import IncidentStatus, Severity
from app.models.incident import Incident
from app.repositories.incident_repository import IncidentRepositoryInterface
from app.schemas.incident import IncidentCreate


class IncidentService:
    def __init__(self, incident_repo: IncidentRepositoryInterface):
        self.incident_repo = incident_repo

    def create_incident(self, data: IncidentCreate) -> Incident:
        now = datetime.now(timezone.utc)
        incident = Incident(
            title=data.title,
            description=data.description,
            severity=data.severity,
            status=data.status,
            affected_service=data.affected_service,
            detected_at=data.detected_at or now,
            created_at=now,
            updated_at=now,
        )
        return self.incident_repo.save(incident)

    def get_incident(self, incident_id: str) -> Incident:
        incident = self.incident_repo.get_by_id(incident_id)
        if not incident:
            raise IncidentNotFoundError(incident_id)
        return incident

    def list_incidents(
        self,
        severity: Optional[Severity] = None,
        status: Optional[IncidentStatus] = None,
        affected_service: Optional[str] = None,
    ) -> List[Incident]:
        return self.incident_repo.list_incidents(
            severity=severity,
            status=status,
            affected_service=affected_service,
        )

    def update_incident_status(self, incident_id: str, new_status: IncidentStatus) -> Incident:
        incident = self.get_incident(incident_id)
        incident.status = new_status
        incident.updated_at = datetime.now(timezone.utc)
        return self.incident_repo.save(incident)
