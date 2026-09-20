from datetime import timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.enums import EvidenceRelevance, InvestigationStatus
from app.models.evidence import Evidence
from app.models.investigation import Investigation, Recommendation, RootCause
from app.db.models import EvidenceModel, InvestigationModel
from app.repositories.investigation_repository import InvestigationRepositoryInterface


def _to_domain(model: InvestigationModel) -> Investigation:
    started_at = model.started_at
    if started_at and started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)

    completed_at = model.completed_at
    if completed_at and completed_at.tzinfo is None:
        completed_at = completed_at.replace(tzinfo=timezone.utc)

    root_cause = RootCause(**model.probable_root_cause) if model.probable_root_cause else None
    recommendation = Recommendation(**model.recommendation) if model.recommendation else None
    
    evidence_list = []
    if model.supporting_evidence:
        for ev in model.supporting_evidence:
            rel = EvidenceRelevance(ev["relevance"]) if isinstance(ev.get("relevance"), str) else ev.get("relevance")
            evidence_list.append(
                Evidence(
                    id=ev["id"],
                    incident_id=ev["incident_id"],
                    telemetry_event_id=ev["telemetry_event_id"],
                    evidence_type=ev["evidence_type"],
                    relevance=rel,
                    explanation=ev["explanation"],
                )
            )

    return Investigation(
        id=model.id,
        incident_id=model.incident_id,
        status=InvestigationStatus(model.status),
        started_at=started_at,
        completed_at=completed_at,
        probable_root_cause=root_cause,
        confidence=model.confidence,
        reasoning=model.reasoning,
        recommendation=recommendation,
        supporting_evidence=evidence_list,
        provider_used=model.provider_used,
        error_message=model.error_message,
    )


class SQLAlchemyInvestigationRepository(InvestigationRepositoryInterface):
    """SQLAlchemy 2.x backed Investigation repository."""

    def __init__(self, session: Session):
        self.session = session

    def save(self, investigation: Investigation) -> Investigation:
        # First persist evidence records in evidence table if present
        if investigation.supporting_evidence:
            for ev in investigation.supporting_evidence:
                existing_ev = self.session.get(EvidenceModel, ev.id)
                rel_str = ev.relevance.value if isinstance(ev.relevance, EvidenceRelevance) else str(ev.relevance)
                if existing_ev:
                    existing_ev.incident_id = ev.incident_id
                    existing_ev.telemetry_event_id = ev.telemetry_event_id
                    existing_ev.evidence_type = ev.evidence_type
                    existing_ev.relevance = rel_str
                    existing_ev.explanation = ev.explanation
                else:
                    self.session.add(
                        EvidenceModel(
                            id=ev.id,
                            incident_id=ev.incident_id,
                            telemetry_event_id=ev.telemetry_event_id,
                            evidence_type=ev.evidence_type,
                            relevance=rel_str,
                            explanation=ev.explanation,
                        )
                    )

        # Prepare JSON fields
        rc_json = investigation.probable_root_cause.model_dump() if investigation.probable_root_cause else None
        rec_json = investigation.recommendation.model_dump() if investigation.recommendation else None
        ev_json = (
            [
                {
                    "id": e.id,
                    "incident_id": e.incident_id,
                    "telemetry_event_id": e.telemetry_event_id,
                    "evidence_type": e.evidence_type,
                    "relevance": e.relevance.value if isinstance(e.relevance, EvidenceRelevance) else str(e.relevance),
                    "explanation": e.explanation,
                }
                for e in investigation.supporting_evidence
            ]
            if investigation.supporting_evidence
            else []
        )
        status_str = (
            investigation.status.value
            if isinstance(investigation.status, InvestigationStatus)
            else str(investigation.status)
        )

        existing = self.session.get(InvestigationModel, investigation.id)
        if existing:
            existing.incident_id = investigation.incident_id
            existing.status = status_str
            existing.started_at = investigation.started_at
            existing.completed_at = investigation.completed_at
            existing.probable_root_cause = rc_json
            existing.confidence = investigation.confidence
            existing.reasoning = investigation.reasoning
            existing.recommendation = rec_json
            existing.provider_used = investigation.provider_used
            existing.error_message = investigation.error_message
            existing.supporting_evidence = ev_json
            model = existing
        else:
            model = InvestigationModel(
                id=investigation.id,
                incident_id=investigation.incident_id,
                status=status_str,
                started_at=investigation.started_at,
                completed_at=investigation.completed_at,
                probable_root_cause=rc_json,
                confidence=investigation.confidence,
                reasoning=investigation.reasoning,
                recommendation=rec_json,
                provider_used=investigation.provider_used,
                error_message=investigation.error_message,
                supporting_evidence=ev_json,
            )
            self.session.add(model)

        self.session.flush()
        return _to_domain(model)

    def get_by_incident_id(self, incident_id: str) -> Optional[Investigation]:
        stmt = (
            select(InvestigationModel)
            .where(InvestigationModel.incident_id == incident_id)
            .order_by(InvestigationModel.started_at.desc())
        )
        model = self.session.scalars(stmt).first()
        if not model:
            return None
        return _to_domain(model)

    def clear(self) -> None:
        self.session.query(InvestigationModel).delete()
        self.session.query(EvidenceModel).delete()
        self.session.flush()
