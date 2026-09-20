from datetime import datetime


def test_get_telemetry_missing_incident(client):
    response = client.get("/api/incidents/missing-id/telemetry")
    assert response.status_code == 404
    assert response.json()["error_type"] == "IncidentNotFoundError"


def test_get_telemetry_chronological_ordering(client):
    sim_resp = client.post("/api/simulation/BAD_DEPLOYMENT")
    assert sim_resp.status_code == 201
    incident_id = sim_resp.json()["incident_id"]

    tel_resp = client.get(f"/api/incidents/{incident_id}/telemetry")
    assert tel_resp.status_code == 200
    data = tel_resp.json()
    assert data["incident_id"] == incident_id
    assert data["count"] > 0

    events = data["telemetry"]
    timestamps = [datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00")) for e in events]
    assert timestamps == sorted(timestamps), "Telemetry events must be sorted chronologically ascending"
