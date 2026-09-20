from app.services.investigation.evidence_extraction_service import EvidenceExtractionService
from app.simulation.simulator import SimulationEngine
from app.models.enums import SimulationScenario


def test_evidence_extraction_links_to_real_telemetry():
    incident, telemetry, _ = SimulationEngine.run_scenario(SimulationScenario.DATABASE_CONNECTION_EXHAUSTION)

    service = EvidenceExtractionService()
    evidence_items = service.extract_evidence(incident, telemetry)

    assert len(evidence_items) > 0
    telemetry_ids = {t.id for t in telemetry}

    for ev in evidence_items:
        assert ev.incident_id == incident.id
        assert ev.telemetry_event_id in telemetry_ids, "Every evidence item must link back to a valid telemetry event ID"
