import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import IncidentModel, TelemetryEventModel, InvestigationModel
from app.models.enums import IncidentStatus, Severity
from app.models.incident import Incident
from app.models.telemetry import TelemetryEvent
from app.models.enums import TelemetrySource, TelemetryEventType
from app.repositories.sqlalchemy_incident_repository import SQLAlchemyIncidentRepository
from app.repositories.sqlalchemy_telemetry_repository import SQLAlchemyTelemetryRepository
from app.repositories.sqlalchemy_investigation_repository import SQLAlchemyInvestigationRepository
from app.services.rca.factory import RCAProviderFactory


def test_database_restart_persistence():
    """
    Restart Persistence Test:
    Creates an incident & telemetry in Session 1, disposes the engine/session,
    creates Session 2 with a new engine connection to the same file,
    and verifies all data still exists!
    """
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_file.close()
    db_path = db_file.name
    db_url = f"sqlite:///{db_path}"

    try:
        # Step 1: Session 1 - Create & Save
        engine1 = create_engine(db_url, connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine1)
        Session1 = sessionmaker(bind=engine1, autocommit=False, autoflush=False)
        s1 = Session1()

        inc_repo1 = SQLAlchemyIncidentRepository(s1)
        tel_repo1 = SQLAlchemyTelemetryRepository(s1)

        inc = Incident(
            id="inc-restart-100",
            title="Database Restart Test Incident",
            description="Testing disk persistence across session restarts.",
            severity=Severity.HIGH,
            status=IncidentStatus.OPEN,
            affected_service="inventory-service",
        )
        inc_repo1.save(inc)

        event = TelemetryEvent(
            id="tel-restart-100",
            incident_id=inc.id,
            source=TelemetrySource.SERVICE,
            event_type=TelemetryEventType.SERVICE_EVENT,
            severity="ERROR",
            service="inventory-service",
            message="Database connection reset by peer",
        )
        tel_repo1.save(event)

        s1.commit()
        s1.close()
        engine1.dispose()

        # Step 2: Session 2 - Restart & Retrieve from fresh connection
        engine2 = create_engine(db_url, connect_args={"check_same_thread": False})
        Session2 = sessionmaker(bind=engine2, autocommit=False, autoflush=False)
        s2 = Session2()

        inc_repo2 = SQLAlchemyIncidentRepository(s2)
        tel_repo2 = SQLAlchemyTelemetryRepository(s2)

        fetched_inc = inc_repo2.get_by_id("inc-restart-100")
        assert fetched_inc is not None
        assert fetched_inc.title == "Database Restart Test Incident"
        assert fetched_inc.severity == Severity.HIGH
        assert fetched_inc.affected_service == "inventory-service"

        fetched_telemetry = tel_repo2.get_by_incident_id("inc-restart-100")
        assert len(fetched_telemetry) == 1
        assert fetched_telemetry[0].id == "tel-restart-100"
        assert fetched_telemetry[0].message == "Database connection reset by peer"

        s2.close()
        engine2.dispose()

    finally:
        if os.path.exists(db_path):
            os.remove(db_path)


def test_investigation_rerun_persistence_semantics(client):
    """
    Test investigation rerun behavior:
    1. First run creates an investigation.
    2. Rerun with rerun=True updates/adds investigation result.
    3. get_by_incident_id retrieves the latest investigation result.
    """
    sim_resp = client.post("/api/simulation/MEMORY_LEAK")
    assert sim_resp.status_code == 201
    incident_id = sim_resp.json()["incident_id"]

    # Initial investigation
    inv1_resp = client.post(f"/api/incidents/{incident_id}/investigate")
    assert inv1_resp.status_code == 200
    inv1_data = inv1_resp.json()
    assert inv1_data["status"] == "COMPLETED"
    assert inv1_data["provider_used"] is not None

    # Retrieve stored investigation
    get_resp1 = client.get(f"/api/incidents/{incident_id}/investigation")
    assert get_resp1.status_code == 200
    assert get_resp1.json()["id"] == inv1_data["id"]

    # Force Rerun investigation
    inv2_resp = client.post(f"/api/incidents/{incident_id}/investigate?rerun=true")
    assert inv2_resp.status_code == 200
    inv2_data = inv2_resp.json()
    assert inv2_data["status"] == "COMPLETED"

    # GET investigation returns the latest result
    get_resp2 = client.get(f"/api/incidents/{incident_id}/investigation")
    assert get_resp2.status_code == 200
    assert get_resp2.json()["id"] == inv2_data["id"]


def test_five_scenarios_persistence_end_to_end(client):
    scenarios = [
        "BAD_DEPLOYMENT",
        "DATABASE_CONNECTION_EXHAUSTION",
        "MEMORY_LEAK",
        "DEPENDENCY_FAILURE",
        "TRAFFIC_SPIKE",
    ]

    for scenario in scenarios:
        # 1. Trigger Simulation
        sim_resp = client.post(f"/api/simulation/{scenario}")
        assert sim_resp.status_code == 201
        inc_id = sim_resp.json()["incident_id"]

        # 2. Get Incident
        inc_resp = client.get(f"/api/incidents/{inc_id}")
        assert inc_resp.status_code == 200

        # 3. Get Telemetry
        tel_resp = client.get(f"/api/incidents/{inc_id}/telemetry")
        assert tel_resp.status_code == 200
        assert tel_resp.json()["count"] > 0

        # 4. Investigate
        inv_resp = client.post(f"/api/incidents/{inc_id}/investigate")
        assert inv_resp.status_code == 200
        inv_data = inv_resp.json()
        assert inv_data["status"] == "COMPLETED"
        assert inv_data["provider_used"] in ["baseline", "bedrock", "bedrock_fallback_baseline"]

        # 5. Fetch Investigation
        fetch_inv = client.get(f"/api/incidents/{inc_id}/investigation")
        assert fetch_inv.status_code == 200
        assert fetch_inv.json()["id"] == inv_data["id"]
