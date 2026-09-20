import pytest


def test_create_incident(client):
    payload = {
        "title": "High Error Rate in auth-service",
        "description": "500 errors spiked on login endpoint.",
        "severity": "HIGH",
        "status": "OPEN",
        "affected_service": "auth-service",
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["severity"] == "HIGH"
    assert data["affected_service"] == "auth-service"
    assert "id" in data
    assert "created_at" in data


def test_get_incident_success(client):
    create_resp = client.post(
        "/api/incidents",
        json={
            "title": "Database degradation",
            "description": "Slow query responses.",
            "severity": "CRITICAL",
            "affected_service": "user-db",
        },
    )
    incident_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/incidents/{incident_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == incident_id


def test_get_incident_404_missing(client):
    response = client.get("/api/incidents/nonexistent-id-999")
    assert response.status_code == 404
    assert response.json()["error_type"] == "IncidentNotFoundError"


def test_list_incidents_filtering(client):
    client.post(
        "/api/incidents",
        json={
            "title": "Incident 1",
            "description": "Desc 1",
            "severity": "CRITICAL",
            "affected_service": "payment-service",
        },
    )
    client.post(
        "/api/incidents",
        json={
            "title": "Incident 2",
            "description": "Desc 2",
            "severity": "LOW",
            "affected_service": "auth-service",
        },
    )

    # Filter by severity
    crit_resp = client.get("/api/incidents?severity=CRITICAL")
    assert crit_resp.status_code == 200
    assert len(crit_resp.json()) == 1
    assert crit_resp.json()[0]["title"] == "Incident 1"

    # Filter by service
    auth_resp = client.get("/api/incidents?affected_service=auth-service")
    assert auth_resp.status_code == 200
    assert len(auth_resp.json()) == 1
    assert auth_resp.json()[0]["title"] == "Incident 2"
