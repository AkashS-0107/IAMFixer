from datetime import datetime, timezone
import pytest
from app.models.enums import EvidenceRelevance, IncidentStatus, Severity, TelemetryEventType, TelemetrySource
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.investigation import Investigation, Recommendation, RootCause
from app.models.telemetry import TelemetryEvent
from app.repositories.sqlalchemy_incident_repository import SQLAlchemyIncidentRepository
from app.repositories.sqlalchemy_telemetry_repository import SQLAlchemyTelemetryRepository
from app.repositories.sqlalchemy_investigation_repository import SQLAlchemyInvestigationRepository


def test_sqlalchemy_incident_repository_crud_and_filtering(db_session):
    repo = SQLAlchemyIncidentRepository(db_session)

    inc1 = Incident(
        id="inc-db-1",
        title="Payment Gateway Timeout",
        description="504 errors on payment checkout",
        severity=Severity.CRITICAL,
        status=IncidentStatus.OPEN,
        affected_service="payment-service",
    )
    inc2 = Incident(
        id="inc-db-2",
        title="Auth Service CPU Spike",
        description="High CPU usage on auth pod",
        severity=Severity.LOW,
        status=IncidentStatus.RESOLVED,
        affected_service="auth-service",
    )

    repo.save(inc1)
    repo.save(inc2)

    # Get by ID
    fetched = repo.get_by_id("inc-db-1")
    assert fetched is not None
    assert fetched.title == "Payment Gateway Timeout"
    assert fetched.severity == Severity.CRITICAL

    # Update
    inc1.status = IncidentStatus.INVESTIGATING
    repo.save(inc1)
    updated = repo.get_by_id("inc-db-1")
    assert updated.status == IncidentStatus.INVESTIGATING

    # Filtering at DB level
    crit_list = repo.list_incidents(severity=Severity.CRITICAL)
    assert len(crit_list) == 1
    assert crit_list[0].id == "inc-db-1"

    svc_list = repo.list_incidents(affected_service="AUTH-SERVICE")
    assert len(svc_list) == 1
    assert svc_list[0].id == "inc-db-2"

    missing = repo.get_by_id("non-existent-id")
    assert missing is None


def test_sqlalchemy_telemetry_repository_sorting_and_bulk(db_session):
    t_repo = SQLAlchemyTelemetryRepository(db_session)

    t1 = datetime(2026, 9, 18, 10, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 9, 18, 10, 5, 0, tzinfo=timezone.utc)
    t3 = datetime(2026, 9, 18, 10, 2, 0, tzinfo=timezone.utc)

    e1 = TelemetryEvent(
        id="tel-1",
        incident_id="inc-telemetry",
        timestamp=t1,
        source=TelemetrySource.SERVICE,
        event_type=TelemetryEventType.SERVICE_EVENT,
        severity="INFO",
        service="order-service",
        message="Order created",
    )
    e2 = TelemetryEvent(
        id="tel-2",
        incident_id="inc-telemetry",
        timestamp=t2,
        source=TelemetrySource.LOGS,
        event_type=TelemetryEventType.LOG,
        severity="ERROR",
        service="order-service",
        message="Database connection error",
    )
    e3 = TelemetryEvent(
        id="tel-3",
        incident_id="inc-telemetry",
        timestamp=t3,
        source=TelemetrySource.METRICS,
        event_type=TelemetryEventType.METRIC,
        severity="WARN",
        service="order-service",
        message="High latency metric",
    )

    t_repo.save_bulk([e1, e2, e3])

    events = t_repo.get_by_incident_id("inc-telemetry")
    assert len(events) == 3
    # Check chronological ascending order
    assert events[0].id == "tel-1"
    assert events[1].id == "tel-3"
    assert events[2].id == "tel-2"


def test_sqlalchemy_investigation_repository_persistence(db_session):
    inv_repo = SQLAlchemyInvestigationRepository(db_session)

    ev = Evidence(
        id="ev-db-1",
        incident_id="inc-inv-1",
        telemetry_event_id="tel-inv-1",
        evidence_type="DB_POOL_EXHAUSTION",
        relevance=EvidenceRelevance.CRITICAL,
        explanation="Connection pool exhausted",
    )

    inv = Investigation(
        id="inv-db-1",
        incident_id="inc-inv-1",
        status="COMPLETED",
        probable_root_cause=RootCause(
            category="database",
            description="Database pool exhausted",
            confidence=0.95,
            supporting_evidence_ids=["ev-db-1"],
        ),
        confidence=0.95,
        reasoning="Exhausted pool caused timeouts",
        recommendation=Recommendation(
            action="Increase max pool size",
            reason="Relieve connection queue",
            risk="LOW",
            requires_approval=True,
        ),
        supporting_evidence=[ev],
        provider_used="bedrock_fallback_baseline",
    )

    inv_repo.save(inv)

    fetched = inv_repo.get_by_incident_id("inc-inv-1")
    assert fetched is not None
    assert fetched.id == "inv-db-1"
    assert fetched.provider_used == "bedrock_fallback_baseline"
    assert fetched.probable_root_cause.category == "database"
    assert len(fetched.supporting_evidence) == 1
    assert fetched.supporting_evidence[0].id == "ev-db-1"
