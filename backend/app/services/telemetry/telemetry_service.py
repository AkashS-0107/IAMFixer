from typing import List
from app.core.exceptions import IncidentNotFoundError
from app.models.telemetry import TelemetryEvent
from app.repositories.incident_repository import IncidentRepositoryInterface
from app.repositories.telemetry_repository import TelemetryRepositoryInterface


class TelemetryService:
    def __init__(
        self,
        telemetry_repo: TelemetryRepositoryInterface,
        incident_repo: IncidentRepositoryInterface,
    ):
        self.telemetry_repo = telemetry_repo
        self.incident_repo = incident_repo

    def add_telemetry_events(self, events: List[TelemetryEvent]) -> List[TelemetryEvent]:
        return self.telemetry_repo.save_bulk(events)

    def get_incident_telemetry(self, incident_id: str) -> List[TelemetryEvent]:
        # Validate incident exists first
        incident = self.incident_repo.get_by_id(incident_id)
        if not incident:
            raise IncidentNotFoundError(incident_id)

        # Requirement #8: Returns events ordered by timestamp ascending
        return self.telemetry_repo.get_by_incident_id(incident_id)
