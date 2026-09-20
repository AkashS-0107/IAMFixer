from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_incident_repository, get_telemetry_repository
from app.repositories.incident_repository import IncidentRepositoryInterface
from app.repositories.telemetry_repository import TelemetryRepositoryInterface
from app.schemas.simulation import SimulationResult
from app.simulation.simulator import SimulationEngine

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


@router.post(
    "/{scenario}",
    response_model=SimulationResult,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger Incident Simulation Scenario",
    description="Generate a realistic failure scenario with deterministic telemetry events (BAD_DEPLOYMENT, DATABASE_CONNECTION_EXHAUSTION, MEMORY_LEAK, DEPENDENCY_FAILURE, TRAFFIC_SPIKE).",
)
async def run_simulation(
    scenario: str,
    incident_repo: IncidentRepositoryInterface = Depends(get_incident_repository),
    telemetry_repo: TelemetryRepositoryInterface = Depends(get_telemetry_repository),
):
    incident, telemetry_events, _ = SimulationEngine.run_scenario(scenario)

    incident_repo.save(incident)
    telemetry_repo.save_bulk(telemetry_events)

    return SimulationResult(
        incident_id=incident.id,
        scenario=scenario.upper(),
        incident_title=incident.title,
        affected_service=incident.affected_service,
        severity=incident.severity,
        telemetry_count=len(telemetry_events),
        created_at=incident.created_at,
    )
