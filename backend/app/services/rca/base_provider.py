from abc import ABC, abstractmethod
from typing import List, Tuple
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.investigation import Recommendation, RootCause
from app.models.telemetry import TelemetryEvent


class RCAProvider(ABC):
    """
    Abstract interface for Root Cause Analysis providers (Baseline, Bedrock, Strands, etc.).
    Receives incident data, telemetry, and extracted evidence to compute root cause and recommendation.
    MUST NOT depend on ground-truth information.
    """

    @abstractmethod
    def investigate(
        self,
        incident: Incident,
        telemetry: List[TelemetryEvent],
        evidence: List[Evidence],
    ) -> Tuple[RootCause, Recommendation, str, float]:
        """
        Executes root cause investigation based on incident telemetry and evidence.

        Returns:
            Tuple[RootCause, Recommendation, reasoning_text, confidence_score]
        """
        pass
