from datetime import datetime, timezone
from typing import Optional
from app.core.exceptions import IncidentNotFoundError, InvestigationNotFoundError
from app.models.enums import IncidentStatus, InvestigationStatus
from app.models.investigation import Investigation
from app.repositories.incident_repository import IncidentRepositoryInterface
from app.repositories.investigation_repository import InvestigationRepositoryInterface
from app.repositories.telemetry_repository import TelemetryRepositoryInterface
from app.services.investigation.evidence_extraction_service import EvidenceExtractionService
from app.services.rca.base_provider import RCAProvider


class InvestigationEngine:
    """
    Orchestrates the end-to-end investigation pipeline:
    Incident -> Telemetry -> Evidence Extraction -> RCA Provider -> Persisted Investigation.
    """

    def __init__(
        self,
        incident_repo: IncidentRepositoryInterface,
        telemetry_repo: TelemetryRepositoryInterface,
        investigation_repo: InvestigationRepositoryInterface,
        evidence_service: EvidenceExtractionService,
        rca_provider: RCAProvider,
    ):
        self.incident_repo = incident_repo
        self.telemetry_repo = telemetry_repo
        self.investigation_repo = investigation_repo
        self.evidence_service = evidence_service
        self.rca_provider = rca_provider

    def get_investigation(self, incident_id: str) -> Investigation:
        """Fetch persisted investigation for an incident."""
        incident = self.incident_repo.get_by_id(incident_id)
        if not incident:
            raise IncidentNotFoundError(incident_id)

        investigation = self.investigation_repo.get_by_incident_id(incident_id)
        if not investigation:
            raise InvestigationNotFoundError(incident_id)
        return investigation

    def start_investigation(self, incident_id: str, rerun: bool = False) -> Investigation:
        """
        Runs an investigation workflow for an incident.
        Idempotent: if already completed and rerun=False, returns persisted result.
        """
        incident = self.incident_repo.get_by_id(incident_id)
        if not incident:
            raise IncidentNotFoundError(incident_id)

        # Check existing investigation
        existing_inv = self.investigation_repo.get_by_incident_id(incident_id)
        if existing_inv and existing_inv.status == InvestigationStatus.COMPLETED and not rerun:
            return existing_inv

        # 1. Update incident status
        incident.status = IncidentStatus.INVESTIGATING
        incident.updated_at = datetime.now(timezone.utc)
        self.incident_repo.save(incident)

        # 2. Initialize IN_PROGRESS investigation state
        start_time = datetime.now(timezone.utc)
        investigation = Investigation(
            incident_id=incident_id,
            status=InvestigationStatus.IN_PROGRESS,
            started_at=start_time,
        )
        self.investigation_repo.save(investigation)

        # 3. Retrieve telemetry (ordered chronologically)
        telemetry = self.telemetry_repo.get_by_incident_id(incident_id)
        if not telemetry:
            investigation.status = InvestigationStatus.FAILED
            investigation.completed_at = datetime.now(timezone.utc)
            investigation.error_message = "No telemetry events were available for this incident."
            investigation.reasoning = "Investigation failed due to missing telemetry."
            return self.investigation_repo.save(investigation)

        # 4. Extract evidence signals
        evidence = self.evidence_service.extract_evidence(incident, telemetry)

        # 5. Execute Root Cause Analysis
        try:
            root_cause, recommendation, reasoning, confidence = self.rca_provider.investigate(
                incident=incident,
                telemetry=telemetry,
                evidence=evidence,
            )
            provider_used = getattr(self.rca_provider, "last_provider_used", None) or getattr(self.rca_provider, "provider_name", "baseline")
        except Exception as exc:
            investigation.status = InvestigationStatus.FAILED
            investigation.completed_at = datetime.now(timezone.utc)
            investigation.error_message = str(exc)
            investigation.reasoning = f"Investigation failed due to provider error: {str(exc)}"
            return self.investigation_repo.save(investigation)

        # 6. Finalize COMPLETED investigation state
        investigation.status = InvestigationStatus.COMPLETED
        investigation.completed_at = datetime.now(timezone.utc)
        investigation.probable_root_cause = root_cause
        investigation.confidence = confidence
        investigation.reasoning = reasoning
        investigation.recommendation = recommendation
        investigation.supporting_evidence = evidence
        investigation.provider_used = provider_used

        saved_inv = self.investigation_repo.save(investigation)

        return saved_inv

