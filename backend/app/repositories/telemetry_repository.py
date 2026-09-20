from abc import abstractmethod
from threading import Lock
from typing import Dict, List
from app.models.telemetry import TelemetryEvent
from app.repositories.base import BaseRepository


class TelemetryRepositoryInterface(BaseRepository):
    @abstractmethod
    def save(self, event: TelemetryEvent) -> TelemetryEvent:
        pass

    @abstractmethod
    def save_bulk(self, events: List[TelemetryEvent]) -> List[TelemetryEvent]:
        pass

    @abstractmethod
    def get_by_incident_id(self, incident_id: str) -> List[TelemetryEvent]:
        pass


class InMemoryTelemetryRepository(TelemetryRepositoryInterface):
    """Thread-safe in-memory telemetry repository."""

    def __init__(self):
        self._storage: Dict[str, TelemetryEvent] = {}
        self._incident_index: Dict[str, List[str]] = {}
        self._lock = Lock()

    def save(self, event: TelemetryEvent) -> TelemetryEvent:
        with self._lock:
            self._storage[event.id] = event.model_copy()
            if event.incident_id not in self._incident_index:
                self._incident_index[event.incident_id] = []
            if event.id not in self._incident_index[event.incident_id]:
                self._incident_index[event.incident_id].append(event.id)
            return self._storage[event.id].model_copy()

    def save_bulk(self, events: List[TelemetryEvent]) -> List[TelemetryEvent]:
        saved_events = []
        for e in events:
            saved_events.append(self.save(e))
        return saved_events

    def get_by_incident_id(self, incident_id: str) -> List[TelemetryEvent]:
        with self._lock:
            event_ids = self._incident_index.get(incident_id, [])
            events = [self._storage[eid].model_copy() for eid in event_ids if eid in self._storage]

        # Requirement #8: Sort telemetry chronologically by timestamp ascending!
        events.sort(key=lambda x: x.timestamp)
        return events

    def clear(self) -> None:
        with self._lock:
            self._storage.clear()
            self._incident_index.clear()
