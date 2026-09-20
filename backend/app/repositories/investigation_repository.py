from abc import abstractmethod
from threading import Lock
from typing import Dict, Optional
from app.models.investigation import Investigation
from app.repositories.base import BaseRepository


class InvestigationRepositoryInterface(BaseRepository):
    @abstractmethod
    def save(self, investigation: Investigation) -> Investigation:
        pass

    @abstractmethod
    def get_by_incident_id(self, incident_id: str) -> Optional[Investigation]:
        pass


class InMemoryInvestigationRepository(InvestigationRepositoryInterface):
    """Thread-safe in-memory investigation repository."""

    def __init__(self):
        # Map incident_id -> Investigation
        self._storage: Dict[str, Investigation] = {}
        self._lock = Lock()

    def save(self, investigation: Investigation) -> Investigation:
        with self._lock:
            self._storage[investigation.incident_id] = investigation.model_copy()
            return self._storage[investigation.incident_id].model_copy()

    def get_by_incident_id(self, incident_id: str) -> Optional[Investigation]:
        with self._lock:
            inv = self._storage.get(incident_id)
            return inv.model_copy() if inv else None

    def clear(self) -> None:
        with self._lock:
            self._storage.clear()
