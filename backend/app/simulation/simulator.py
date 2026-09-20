from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from app.core.exceptions import SimulationScenarioNotFoundError
from app.models.enums import IncidentStatus, SimulationScenario
from app.models.incident import Incident
from app.models.telemetry import TelemetryEvent
from app.simulation.scenarios import GroundTruth, SCENARIO_DEFINITIONS


class SimulationEngine:
    """
    Deterministic incident & telemetry generator for failure simulation scenarios.
    """

    @staticmethod
    def run_scenario(scenario: SimulationScenario) -> Tuple[Incident, List[TelemetryEvent], GroundTruth]:
        if isinstance(scenario, str):
            try:
                scenario = SimulationScenario(scenario.upper())
            except ValueError:
                raise SimulationScenarioNotFoundError(
                    scenario=scenario,
                    available_scenarios=[s.value for s in SimulationScenario],
                )

        if scenario not in SCENARIO_DEFINITIONS:
            raise SimulationScenarioNotFoundError(
                scenario=str(scenario),
                available_scenarios=[s.value for s in SimulationScenario],
            )

        data = SCENARIO_DEFINITIONS[scenario]
        base_time = datetime.now(timezone.utc) - timedelta(minutes=5)

        incident = Incident(
            title=data.incident_title,
            description=data.incident_description,
            severity=data.severity,
            status=IncidentStatus.OPEN,
            affected_service=data.affected_service,
            detected_at=base_time,
            created_at=base_time,
            updated_at=base_time,
        )

        telemetry_events: List[TelemetryEvent] = []
        for template in data.telemetry_templates:
            event_timestamp = base_time + timedelta(seconds=template["offset_seconds"])
            event = TelemetryEvent(
                incident_id=incident.id,
                timestamp=event_timestamp,
                source=template["source"],
                event_type=template["event_type"],
                severity=template["severity"],
                service=template["service"],
                message=template["message"],
                metadata=template["metadata"],
            )
            telemetry_events.append(event)

        return incident, telemetry_events, data.ground_truth

    @staticmethod
    def get_ground_truth(scenario: SimulationScenario) -> GroundTruth:
        """Returns scenario ground-truth information (FOR EVALUATION/TESTING ONLY)."""
        if scenario not in SCENARIO_DEFINITIONS:
            raise SimulationScenarioNotFoundError(
                scenario=str(scenario),
                available_scenarios=[s.value for s in SimulationScenario],
            )
        return SCENARIO_DEFINITIONS[scenario].ground_truth
