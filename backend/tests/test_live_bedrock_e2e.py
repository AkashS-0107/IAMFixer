import os
import pytest
from unittest.mock import MagicMock
from botocore.exceptions import ClientError

from app.core.config import settings
from app.models.enums import IncidentStatus, Severity
from app.models.incident import Incident
from app.models.telemetry import TelemetryEvent
from app.models.evidence import Evidence
from app.models.enums import EvidenceRelevance
from app.services.rca.bedrock_client import BedrockClient
from app.services.rca.bedrock_provider import BedrockRCAProvider
from app.services.rca.factory import RCAProviderFactory


@pytest.fixture
def db_exhaustion_incident():
    return Incident(
        id="inc-db-test-999",
        title="Database Connection Pool Exhaustion",
        description="High database latency and connection pool exhaustion under load",
        severity=Severity.HIGH,
        status=IncidentStatus.INVESTIGATING,
        affected_service="order-db-service",
    )


@pytest.fixture
def db_exhaustion_telemetry(db_exhaustion_incident):
    return [
        TelemetryEvent(
            id="tel-db-1",
            incident_id=db_exhaustion_incident.id,
            source="metrics",
            event_type="METRIC",
            severity="CRITICAL",
            service="order-db-service",
            message="Connection pool utilization reached 98% (100/100 active connections)",
        ),
        TelemetryEvent(
            id="tel-db-2",
            incident_id=db_exhaustion_incident.id,
            source="logs",
            event_type="LOG",
            severity="ERROR",
            service="order-db-service",
            message="Database query wait queue timeout after 5000ms",
        ),
    ]


@pytest.fixture
def db_exhaustion_evidence(db_exhaustion_incident):
    return [
        Evidence(
            id="ev-db-1",
            incident_id=db_exhaustion_incident.id,
            telemetry_event_id="tel-db-1",
            evidence_type="POOL_EXHAUSTION",
            relevance=EvidenceRelevance.CRITICAL,
            explanation="Connection pool active connections spiked to 100%",
        ),
        Evidence(
            id="ev-db-2",
            incident_id=db_exhaustion_incident.id,
            telemetry_event_id="tel-db-2",
            evidence_type="QUERY_TIMEOUT",
            relevance=EvidenceRelevance.HIGH,
            explanation="Queries timing out due to pool starvation",
        ),
    ]


def test_mocked_bedrock_failure_fallback_e2e(db_exhaustion_incident, db_exhaustion_telemetry, db_exhaustion_evidence, monkeypatch):
    """
    Verifies that when Bedrock throws an API/Auth error in 'auto' mode,
    the factory gracefully falls back to Baseline RCA with metadata 'bedrock_fallback_baseline'.
    Runs offline without AWS credits.
    """
    monkeypatch.setattr(settings, "bedrock_model_id", "us.anthropic.claude-3-5-sonnet-20241022-v2:0")
    mock_client = MagicMock(spec=BedrockClient)
    mock_client.invoke_converse.side_effect = ClientError(
        {"Error": {"Code": "AccessDeniedException", "Message": "User is not authorized to perform converse"}},
        "Converse",
    )

    bedrock_prov = BedrockRCAProvider(bedrock_client=mock_client)
    provider = RCAProviderFactory.create_provider(mode="auto", bedrock_provider=bedrock_prov)

    root_cause, recommendation, reasoning, confidence = provider.investigate(
        db_exhaustion_incident, db_exhaustion_telemetry, db_exhaustion_evidence
    )

    assert provider.last_provider_used == "bedrock_fallback_baseline"
    assert root_cause.category is not None
    assert confidence > 0.0
    assert isinstance(recommendation.requires_approval, bool)


@pytest.mark.skipif(
    os.getenv("IAMFIXER_LIVE_BEDROCK_TEST") != "true",
    reason="Controlled live Bedrock invocation requires IAMFIXER_LIVE_BEDROCK_TEST=true environment variable"
)
def test_real_aws_bedrock_invocation_e2e(db_exhaustion_incident, db_exhaustion_telemetry, db_exhaustion_evidence):
    """
    Controlled single real AWS Bedrock invocation.
    Gated behind IAMFIXER_LIVE_BEDROCK_TEST=true.
    """
    assert settings.bedrock_model_id, "BEDROCK_MODEL_ID must be configured for live E2E test"

    provider = BedrockRCAProvider()
    root_cause, recommendation, reasoning, confidence = provider.investigate(
        db_exhaustion_incident, db_exhaustion_telemetry, db_exhaustion_evidence
    )

    assert 0.0 <= confidence <= 1.0
    assert root_cause.category is not None
    assert recommendation.requires_approval is True
    assert len(reasoning) > 0
