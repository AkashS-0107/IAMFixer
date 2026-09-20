from app.services.investigation.evidence_extraction_service import EvidenceExtractionService
from app.services.rca.baseline_provider import BaselineRCAProvider
from app.simulation.simulator import SimulationEngine
from app.models.enums import SimulationScenario


def test_baseline_rca_provider_isolated_from_ground_truth():
    """
    Demonstrates that BaselineRCAProvider operates strictly on Incident, Telemetry,
    and Evidence without any access to or dependency on the GroundTruth object.
    """
    # 1. Generate scenario (ground truth is ignored)
    incident, telemetry, ground_truth = SimulationEngine.run_scenario(SimulationScenario.MEMORY_LEAK)

    # 2. Extract evidence using telemetry only
    evidence_service = EvidenceExtractionService()
    extracted_evidence = evidence_service.extract_evidence(incident, telemetry)

    # 3. Instantiate investigator (no ground truth parameter)
    provider = BaselineRCAProvider()

    # 4. Perform investigation using only incident, telemetry, evidence
    root_cause, recommendation, reasoning, confidence = provider.investigate(
        incident=incident,
        telemetry=telemetry,
        evidence=extracted_evidence,
    )

    # 5. Assert that root cause category matches ground truth expectation,
    # proving investigator derived correct conclusion independently!
    assert root_cause.category == ground_truth.category
    assert confidence > 0.50
    assert recommendation.requires_approval is True
    assert "analytics-processor" in root_cause.description
