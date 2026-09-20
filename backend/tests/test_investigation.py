import pytest
from app.simulation.simulator import SimulationEngine


@pytest.mark.parametrize(
    "scenario,expected_category",
    [
        ("BAD_DEPLOYMENT", "deployment"),
        ("DATABASE_CONNECTION_EXHAUSTION", "database"),
        ("MEMORY_LEAK", "memory"),
        ("DEPENDENCY_FAILURE", "dependency"),
        ("TRAFFIC_SPIKE", "traffic"),
    ],
)
def test_full_investigation_end_to_end(client, scenario, expected_category):
    # Step 1: Trigger simulation
    sim_resp = client.post(f"/api/simulation/{scenario}")
    assert sim_resp.status_code == 201
    sim_data = sim_resp.json()
    incident_id = sim_data["incident_id"]

    # Step 2: Fetch incident
    inc_resp = client.get(f"/api/incidents/{incident_id}")
    assert inc_resp.status_code == 200
    assert inc_resp.json()["id"] == incident_id

    # Step 3: Fetch telemetry
    tel_resp = client.get(f"/api/incidents/{incident_id}/telemetry")
    assert tel_resp.status_code == 200
    tel_data = tel_resp.json()
    telemetry_list = tel_data["telemetry"]
    telemetry_ids = {t["id"] for t in telemetry_list}
    assert len(telemetry_ids) > 0

    # Step 4: Run investigation
    inv_post_resp = client.post(f"/api/incidents/{incident_id}/investigate")
    assert inv_post_resp.status_code == 200
    inv_data = inv_post_resp.json()

    assert inv_data["status"] == "COMPLETED"
    assert inv_data["incident_id"] == incident_id
    assert inv_data["completed_at"] is not None

    # Step 5: Verify RCA semantics
    rca = inv_data["probable_root_cause"]
    assert rca is not None
    assert rca["category"] == expected_category
    assert 0.0 <= rca["confidence"] <= 1.0

    confidence = inv_data["confidence"]
    assert 0.0 <= confidence <= 1.0

    recommendation = inv_data["recommendation"]
    assert recommendation is not None
    assert recommendation["requires_approval"] is True
    assert len(recommendation["action"]) > 0

    supporting_evidence = inv_data["supporting_evidence"]
    assert len(supporting_evidence) > 0

    # Step 6: Verify evidence links back to real telemetry IDs
    for ev in supporting_evidence:
        assert ev["telemetry_event_id"] in telemetry_ids, f"Evidence telemetry_event_id {ev['telemetry_event_id']} must correspond to real telemetry event!"

    # Step 7: Retrieve persisted investigation
    inv_get_resp = client.get(f"/api/incidents/{incident_id}/investigation")
    assert inv_get_resp.status_code == 200
    assert inv_get_resp.json()["id"] == inv_data["id"]


def test_investigation_404_missing_incident(client):
    response = client.post("/api/incidents/nonexistent-id-123/investigate")
    assert response.status_code == 404
    assert response.json()["error_type"] == "IncidentNotFoundError"


def test_investigation_idempotent_behavior(client):
    sim_resp = client.post("/api/simulation/BAD_DEPLOYMENT")
    incident_id = sim_resp.json()["incident_id"]

    inv1 = client.post(f"/api/incidents/{incident_id}/investigate").json()
    inv2 = client.post(f"/api/incidents/{incident_id}/investigate").json()

    assert inv1["id"] == inv2["id"], "Subsequent investigation calls must return persisted investigation if rerun=False"
