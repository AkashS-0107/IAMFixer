import pytest


@pytest.mark.parametrize(
    "scenario",
    [
        "BAD_DEPLOYMENT",
        "DATABASE_CONNECTION_EXHAUSTION",
        "MEMORY_LEAK",
        "DEPENDENCY_FAILURE",
        "TRAFFIC_SPIKE",
    ],
)
def test_simulation_scenarios(client, scenario):
    response = client.post(f"/api/simulation/{scenario}")
    assert response.status_code == 201
    data = response.json()

    assert "incident_id" in data
    assert data["scenario"] == scenario
    assert data["telemetry_count"] > 0
    assert "affected_service" in data
    assert "severity" in data

    # Requirement: Ground truth must NOT be in the response!
    assert "ground_truth" not in data
    assert "root_cause" not in data


def test_simulation_unknown_scenario_returns_400(client):
    response = client.post("/api/simulation/INVALID_SCENARIO_NAME")
    assert response.status_code == 400
    data = response.json()
    assert data["error_type"] == "SimulationScenarioNotFoundError"
    assert "Unknown simulation scenario" in data["detail"]
