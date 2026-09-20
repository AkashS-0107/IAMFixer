from datetime import timezone
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.enums import TelemetryEventType, TelemetrySource
from app.models.telemetry import TelemetryEvent
from app.db.models import TelemetryEventModel
from app.repositories.telemetry_repository import TelemetryRepositoryInterface


def _to_domain(model: TelemetryEventModel) -> TelemetryEvent:
    ts = model.timestamp
    if ts and ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    source_val = TelemetrySource(model.source) if isinstance(model.source, str) else model.source
    type_val = TelemetryEventType(model.event_type) if isinstance(model.event_type, str) else model.event_type

    return TelemetryEvent(
        id=model.id,
        incident_id=model.incident_id,
        timestamp=ts,
        source=source_val,
        event_type=type_val,
        severity=model.severity,
        service=model.service,
        message=model.message,
        metadata=model.metadata_json or {},
    )


class SQLAlchemyTelemetryRepository(TelemetryRepositoryInterface):
    """SQLAlchemy 2.x backed Telemetry repository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, event: TelemetryEvent) -> TelemetryEvent:
        existing = self.session.get(TelemetryEventModel, event.id)
        src_str = event.source.value if isinstance(event.source, TelemetrySource) else str(event.source)
        evt_str = event.event_type.value if isinstance(event.event_type, TelemetryEventType) else str(event.event_type)

        if existing:
            existing.incident_id = event.incident_id
            existing.timestamp = event.timestamp
            existing.source = src_str
            existing.event_type = evt_str
            existing.severity = event.severity
            existing.service = event.service
            existing.message = event.message
            existing.metadata_json = event.metadata or {}
            model = existing
        else:
            model = TelemetryEventModel(
                id=event.id,
                incident_id=event.incident_id,
                timestamp=event.timestamp,
                source=src_str,
                event_type=evt_str,
                severity=event.severity,
                service=event.service,
                message=event.message,
                metadata_json=event.metadata or {},
            )
            self.session.add(model)

        self.session.flush()
        return _to_domain(model)

    def save_bulk(self, events: List[TelemetryEvent]) -> List[TelemetryEvent]:
        saved_events = []
        for event in events:
            saved_events.append(self.save(event))
        return saved_events

    def get_by_incident_id(self, incident_id: str) -> List[TelemetryEvent]:
        stmt = (
            select(TelemetryEventModel)
            .where(TelemetryEventModel.incident_id == incident_id)
            .order_by(TelemetryEventModel.timestamp.asc())
        )
        models = self.session.scalars(stmt).all()
        return [_to_domain(m) for m in models]

    def clear(self) -> None:
        self.session.query(TelemetryEventModel).delete()
        self.session.flush()
