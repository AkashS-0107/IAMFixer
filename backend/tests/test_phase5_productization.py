import pytest
from app.models.enums import RemediationRisk
from app.simulation.simulator import SimulationEngine


def test_health_endpoint_metadata_and_security(client):
    """
    Verify health endpoint exposes safe operational metadata and zero credentials.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "IAMFixer"
    assert "version" in data
    assert "ai_provider" in data
    assert "bedrock_status" in data
    assert data["bedrock_status"] in ["configured", "not_configured"]
    assert data["database_status"] == "connected"

    # Security check: no credentials present in health payload
    payload_str = str(data).lower()
    for forbidden in ["aws_access_key", "aws_secret", "session_token", "password", "secret_key"]:
        assert forbidden not in payload_str


def test_simulation_scenarios_and_evidence_traceability(client):
    """
    Verify all 5 simulation scenarios create incidents, generate telemetry,
    and investigation produces traceable evidence linked to real telemetry events.
    """
    scenarios = [
        "BAD_DEPLOYMENT",
        "DATABASE_CONNECTION_EXHAUSTION",
        "MEMORY_LEAK",
        "DEPENDENCY_FAILURE",
        "TRAFFIC_SPIKE",
    ]

    for scenario in scenarios:
        # 1. Trigger simulation
        sim_resp = client.post(f"/api/simulation/{scenario}")
        assert sim_resp.status_code == 201
        sim_data = sim_resp.json()
        incident_id = sim_data["incident_id"]

        # 2. Get telemetry
        tel_resp = client.get(f"/api/incidents/{incident_id}/telemetry")
        assert tel_resp.status_code == 200
        telemetry_events = tel_resp.json()["telemetry"]
        assert len(telemetry_events) > 0
        valid_telemetry_ids = {t["id"] for t in telemetry_events}

        # 3. Trigger investigation
        inv_resp = client.post(f"/api/incidents/{incident_id}/investigate")
        assert inv_resp.status_code == 200
        inv_data = inv_resp.json()

        assert inv_data["status"] == "COMPLETED"
        assert inv_data["provider_used"] in ["baseline", "bedrock", "bedrock_fallback_baseline"]
        assert inv_data["probable_root_cause"] is not None

        # 4. Verify Evidence Traceability: every supporting evidence references a real telemetry event ID
        evidence_list = inv_data["supporting_evidence"]
        assert len(evidence_list) > 0
        for ev in evidence_list:
            assert ev["telemetry_event_id"] in valid_telemetry_ids
            assert ev["incident_id"] == incident_id

        # 5. Verify Remediation Safety: High/Medium risk requires approval
        rec = inv_data["recommendation"]
        assert rec is not None
        if rec["risk"] in [RemediationRisk.HIGH.value, RemediationRisk.MEDIUM.value]:
            assert rec["requires_approval"] is True


def test_no_credentials_in_api_responses(client):
    """
    Verify that API endpoints do not leak credentials or sensitive keys.
    """
    # Create incident
    inc_resp = client.post(
        "/api/incidents",
        json={
            "title": "Security Audit Incident",
            "description": "Checking payload security",
            "severity": "MEDIUM",
            "affected_service": "auth-service",
        },
    )
    assert inc_resp.status_code == 201
    incident_id = inc_resp.json()["id"]

    # Retrieve incident details
    det_resp = client.get(f"/api/incidents/{incident_id}")
    assert det_resp.status_code == 200

    # Retrieve incident list
    list_resp = client.get("/api/incidents")
    assert list_resp.status_code == 200

    for resp in [inc_resp, det_resp, list_resp]:
        payload_text = resp.text.lower()
        assert "aws_secret_access_key" not in payload_text
        assert "aws_access_key_id" not in payload_text
        assert "aws_session_token" not in payload_text
