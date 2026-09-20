from datetime import timezone
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.enums import IncidentStatus, Severity
from app.models.incident import Incident
from app.db.models import IncidentModel
from app.repositories.incident_repository import IncidentRepositoryInterface


def _to_domain(model: IncidentModel) -> Incident:
    detected_at = model.detected_at
    if detected_at and detected_at.tzinfo is None:
        detected_at = detected_at.replace(tzinfo=timezone.utc)

    resolved_at = model.resolved_at
    if resolved_at and resolved_at.tzinfo is None:
        resolved_at = resolved_at.replace(tzinfo=timezone.utc)

    created_at = model.created_at
    if created_at and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    updated_at = model.updated_at
    if updated_at and updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    return Incident(
        id=model.id,
        title=model.title,
        description=model.description,
        severity=Severity(model.severity),
        status=IncidentStatus(model.status),
        affected_service=model.affected_service,
        detected_at=detected_at,
        resolved_at=resolved_at,
        created_at=created_at,
        updated_at=updated_at,
    )


class SQLAlchemyIncidentRepository(IncidentRepositoryInterface):
    """SQLAlchemy 2.x backed Incident repository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, incident: Incident) -> Incident:
        existing = self.session.get(IncidentModel, incident.id)
        sev_str = incident.severity.value if isinstance(incident.severity, Severity) else str(incident.severity)
        stat_str = incident.status.value if isinstance(incident.status, IncidentStatus) else str(incident.status)

        if existing:
            existing.title = incident.title
            existing.description = incident.description
            existing.severity = sev_str
            existing.status = stat_str
            existing.affected_service = incident.affected_service
            existing.detected_at = incident.detected_at
            existing.resolved_at = incident.resolved_at
            existing.updated_at = incident.updated_at
            model = existing
        else:
            model = IncidentModel(
                id=incident.id,
                title=incident.title,
                description=incident.description,
                severity=sev_str,
                status=stat_str,
                affected_service=incident.affected_service,
                detected_at=incident.detected_at,
                resolved_at=incident.resolved_at,
                created_at=incident.created_at,
                updated_at=incident.updated_at,
            )
            self.session.add(model)

        self.session.flush()
        return _to_domain(model)

    def get_by_id(self, incident_id: str) -> Optional[Incident]:
        model = self.session.get(IncidentModel, incident_id)
        if not model:
            return None
        return _to_domain(model)

    def list_incidents(
        self,
        severity: Optional[Severity] = None,
        status: Optional[IncidentStatus] = None,
        affected_service: Optional[str] = None,
    ) -> List[Incident]:
        stmt = select(IncidentModel)

        if severity:
            sev_str = severity.value if isinstance(severity, Severity) else str(severity)
            stmt = stmt.where(IncidentModel.severity == sev_str)

        if status:
            stat_str = status.value if isinstance(status, IncidentStatus) else str(status)
            stmt = stmt.where(IncidentModel.status == stat_str)

        if affected_service:
            stmt = stmt.where(func.lower(IncidentModel.affected_service) == affected_service.lower())

        stmt = stmt.order_by(IncidentModel.created_at.desc())
        models = self.session.scalars(stmt).all()
        return [_to_domain(m) for m in models]

    def clear(self) -> None:
        self.session.query(IncidentModel).delete()
        self.session.flush()
