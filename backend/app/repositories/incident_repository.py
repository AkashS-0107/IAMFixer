from abc import abstractmethod
from threading import Lock
from typing import Dict, List, Optional
from app.models.enums import IncidentStatus, Severity
from app.models.incident import Incident
from app.repositories.base import BaseRepository


class IncidentRepositoryInterface(BaseRepository):
    @abstractmethod
    def save(self, incident: Incident) -> Incident:
        pass

    @abstractmethod
    def get_by_id(self, incident_id: str) -> Optional[Incident]:
        pass

    @abstractmethod
    def list_incidents(
        self,
        severity: Optional[Severity] = None,
        status: Optional[IncidentStatus] = None,
        affected_service: Optional[str] = None,
    ) -> List[Incident]:
        pass


class InMemoryIncidentRepository(IncidentRepositoryInterface):
    """Thread-safe in-memory incident repository."""

    def __init__(self):
        self._storage: Dict[str, Incident] = {}
        self._lock = Lock()

    def save(self, incident: Incident) -> Incident:
        with self._lock:
            self._storage[incident.id] = incident.model_copy()
            return self._storage[incident.id].model_copy()

    def get_by_id(self, incident_id: str) -> Optional[Incident]:
        with self._lock:
            incident = self._storage.get(incident_id)
            return incident.model_copy() if incident else None

    def list_incidents(
        self,
        severity: Optional[Severity] = None,
        status: Optional[IncidentStatus] = None,
        affected_service: Optional[str] = None,
    ) -> List[Incident]:
        with self._lock:
            results = list(self._storage.values())

        if severity:
            results = [i for i in results if i.severity == severity]
        if status:
            results = [i for i in results if i.status == status]
        if affected_service:
            results = [i for i in results if i.affected_service.lower() == affected_service.lower()]

        # Sort by created_at descending
        results.sort(key=lambda x: x.created_at, reverse=True)
        return [i.model_copy() for i in results]

    def clear(self) -> None:
        with self._lock:
            self._storage.clear()
