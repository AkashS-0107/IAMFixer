from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.db.models import EvidenceModel, IncidentModel, InvestigationModel, TelemetryEventModel
from app.repositories.incident_repository import IncidentRepositoryInterface
from app.repositories.telemetry_repository import TelemetryRepositoryInterface
from app.repositories.investigation_repository import InvestigationRepositoryInterface
from app.repositories.sqlalchemy_incident_repository import SQLAlchemyIncidentRepository
from app.repositories.sqlalchemy_telemetry_repository import SQLAlchemyTelemetryRepository
from app.repositories.sqlalchemy_investigation_repository import SQLAlchemyInvestigationRepository

from app.services.incidents.incident_service import IncidentService
from app.services.telemetry.telemetry_service import TelemetryService
from app.services.investigation.evidence_extraction_service import EvidenceExtractionService
from app.services.rca.base_provider import RCAProvider
from app.services.rca.factory import RCAProviderFactory
from app.services.investigation.investigation_engine import InvestigationEngine

_evidence_service = EvidenceExtractionService()


def reset_all_repositories() -> None:
    """Helper for clearing all repository state in tests / resets."""
    with SessionLocal() as db:
        db.query(EvidenceModel).delete()
        db.query(InvestigationModel).delete()
        db.query(TelemetryEventModel).delete()
        db.query(IncidentModel).delete()
        db.commit()


def get_incident_repository(db: Session = Depends(get_db)) -> IncidentRepositoryInterface:
    return SQLAlchemyIncidentRepository(session=db)


def get_telemetry_repository(db: Session = Depends(get_db)) -> TelemetryRepositoryInterface:
    return SQLAlchemyTelemetryRepository(session=db)


def get_investigation_repository(db: Session = Depends(get_db)) -> InvestigationRepositoryInterface:
    return SQLAlchemyInvestigationRepository(session=db)


def get_evidence_extraction_service() -> EvidenceExtractionService:
    return _evidence_service


def get_rca_provider() -> RCAProvider:
    return RCAProviderFactory.create_provider()


def get_incident_service(
    incident_repo: IncidentRepositoryInterface = Depends(get_incident_repository),
) -> IncidentService:
    return IncidentService(incident_repo=incident_repo)


def get_telemetry_service(
    telemetry_repo: TelemetryRepositoryInterface = Depends(get_telemetry_repository),
    incident_repo: IncidentRepositoryInterface = Depends(get_incident_repository),
) -> TelemetryService:
    return TelemetryService(telemetry_repo=telemetry_repo, incident_repo=incident_repo)


def get_investigation_engine(
    incident_repo: IncidentRepositoryInterface = Depends(get_incident_repository),
    telemetry_repo: TelemetryRepositoryInterface = Depends(get_telemetry_repository),
    investigation_repo: InvestigationRepositoryInterface = Depends(get_investigation_repository),
    evidence_service: EvidenceExtractionService = Depends(get_evidence_extraction_service),
    rca_provider: RCAProvider = Depends(get_rca_provider),
) -> InvestigationEngine:
    return InvestigationEngine(
        incident_repo=incident_repo,
        telemetry_repo=telemetry_repo,
        investigation_repo=investigation_repo,
        evidence_service=evidence_service,
        rca_provider=rca_provider,
    )
