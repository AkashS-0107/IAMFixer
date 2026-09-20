import json
import pytest
from unittest.mock import MagicMock

from app.core.config import settings
from app.core.exceptions import BedrockResponseParsingError
from app.models.enums import EvidenceRelevance, IncidentStatus, Severity
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.telemetry import TelemetryEvent
from app.services.rca.baseline_provider import BaselineRCAProvider
from app.services.rca.bedrock_client import BedrockClient
from app.services.rca.bedrock_provider import BedrockRCAProvider
from app.services.rca.factory import AutoRCAProvider, RCAProviderFactory


@pytest.fixture
def sample_data():
    incident = Incident(
        id="inc-factory-1",
        title="Deployment Failure",
        description="Error spike following v1.8.3 deployment",
        severity=Severity.HIGH,
        status=IncidentStatus.INVESTIGATING,
        affected_service="api-gateway",
    )
    telemetry = [
        TelemetryEvent(
            id="t-1",
            incident_id=incident.id,
            source="deployment",
            event_type="DEPLOYMENT",
            severity="INFO",
            service="api-gateway",
            message="Deployment release v1.8.3 deployed to production",
        ),
        TelemetryEvent(
            id="t-2",
            incident_id=incident.id,
            source="logs",
            event_type="LOG",
            severity="ERROR",
            service="api-gateway",
            message="HTTP 500 Internal Server Error rate exceeded 30%",
        ),
    ]
    evidence = [
        Evidence(
            id="ev-1",
            incident_id=incident.id,
            telemetry_event_id="t-1",
            evidence_type="DEPLOYMENT_TRIGGER",
            relevance=EvidenceRelevance.CRITICAL,
            explanation="Deployment event occurred shortly before failure spike",
        )
    ]
    return incident, telemetry, evidence


def test_factory_baseline_mode(sample_data, monkeypatch):
    monkeypatch.setattr(settings, "iamfixer_ai_provider", "baseline")
    provider = RCAProviderFactory.create_provider()

    incident, telemetry, evidence = sample_data
    rc, rec, reasoning, conf = provider.investigate(incident, telemetry, evidence)

    assert provider.last_provider_used == "baseline"
    assert rc.category == "deployment"
    assert conf > 0.0


def test_factory_bedrock_mode_success(sample_data, monkeypatch):
    monkeypatch.setattr(settings, "iamfixer_ai_provider", "bedrock")
    monkeypatch.setattr(settings, "bedrock_model_id", "claude-3-sonnet")

    mock_client = MagicMock(spec=BedrockClient)
    mock_client.invoke_converse.return_value = json.dumps({
        "root_cause": {
            "category": "deployment",
            "description": "Faulty deployment release",
            "confidence": 0.90,
            "supporting_evidence_ids": ["ev-1"]
        },
        "reasoning": "Deployment triggered error spike",
        "recommendation": {
            "action": "Rollback deployment",
            "reason": "Immediate fix",
            "risk": "HIGH",
            "requires_approval": True
        }
    })

    bedrock_prov = BedrockRCAProvider(bedrock_client=mock_client)
    provider = RCAProviderFactory.create_provider(mode="bedrock", bedrock_provider=bedrock_prov)

    incident, telemetry, evidence = sample_data
    rc, rec, reasoning, conf = provider.investigate(incident, telemetry, evidence)

    assert provider.last_provider_used == "bedrock"
    assert rc.category == "deployment"
    assert conf == 0.90


def test_factory_bedrock_mode_failure_raises(sample_data, monkeypatch):
    """In bedrock mode, failure MUST NOT silently fall back to baseline."""
    monkeypatch.setattr(settings, "iamfixer_ai_provider", "bedrock")
    monkeypatch.setattr(settings, "bedrock_model_id", "claude-3-sonnet")

    mock_client = MagicMock(spec=BedrockClient)
    mock_client.invoke_converse.side_effect = Exception("Bedrock API Unavailable")

    bedrock_prov = BedrockRCAProvider(bedrock_client=mock_client)
    provider = RCAProviderFactory.create_provider(mode="bedrock", bedrock_provider=bedrock_prov)

    incident, telemetry, evidence = sample_data
    with pytest.raises(Exception):
        provider.investigate(incident, telemetry, evidence)


def test_factory_auto_mode_success(sample_data, monkeypatch):
    monkeypatch.setattr(settings, "iamfixer_ai_provider", "auto")
    monkeypatch.setattr(settings, "bedrock_model_id", "claude-3-sonnet")

    mock_client = MagicMock(spec=BedrockClient)
    mock_client.invoke_converse.return_value = json.dumps({
        "root_cause": {
            "category": "deployment",
            "description": "Faulty deployment release",
            "confidence": 0.92,
            "supporting_evidence_ids": ["ev-1"]
        },
        "reasoning": "Observed deployment. Inference: release failure.",
        "recommendation": {
            "action": "Rollback",
            "reason": "Immediate mitigation",
            "risk": "HIGH",
            "requires_approval": True
        }
    })

    bedrock_prov = BedrockRCAProvider(bedrock_client=mock_client)
    provider = RCAProviderFactory.create_provider(mode="auto", bedrock_provider=bedrock_prov)

    incident, telemetry, evidence = sample_data
    rc, rec, reasoning, conf = provider.investigate(incident, telemetry, evidence)

    assert provider.last_provider_used == "bedrock"
    assert conf == 0.92


def test_factory_auto_mode_fallback(sample_data, monkeypatch):
    """In auto mode, Bedrock failure MUST fall back to Baseline RCA Provider with correct provider_used metadata."""
    monkeypatch.setattr(settings, "iamfixer_ai_provider", "auto")
    monkeypatch.setattr(settings, "bedrock_model_id", "claude-3-sonnet")

    mock_client = MagicMock(spec=BedrockClient)
    mock_client.invoke_converse.side_effect = BedrockResponseParsingError("Invalid JSON response")

    bedrock_prov = BedrockRCAProvider(bedrock_client=mock_client)
    provider = RCAProviderFactory.create_provider(mode="auto", bedrock_provider=bedrock_prov)

    incident, telemetry, evidence = sample_data
    rc, rec, reasoning, conf = provider.investigate(incident, telemetry, evidence)

    assert provider.last_provider_used == "bedrock_fallback_baseline"
    assert rc.category == "deployment"
    assert conf > 0.0
