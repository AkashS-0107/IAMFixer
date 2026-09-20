from abc import ABC, abstractmethod


class BaseRepository(ABC):
    """Abstract base repository interface with reset/clear support."""

    @abstractmethod
    def clear(self) -> None:
        """Clear all stored entities (used for testing/resets)."""
        pass
