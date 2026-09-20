from typing import List, Optional, Tuple
from app.core.config import settings
from app.core.exceptions import BedrockError
from app.core.logging import logger
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.investigation import Recommendation, RootCause
from app.models.telemetry import TelemetryEvent
from app.services.rca.base_provider import RCAProvider
from app.services.rca.baseline_provider import BaselineRCAProvider
from app.services.rca.bedrock_provider import BedrockRCAProvider


class AutoRCAProvider(RCAProvider):
    """
    Automatic hybrid RCA provider.
    Attempts Bedrock AI investigation first. If Bedrock fails for any recoverable reason,
    logs diagnostic warnings and seamlessly falls back to BaselineRCAProvider.
    Sets `last_provider_used` to 'bedrock' or 'bedrock_fallback_baseline'.
    """

    def __init__(
        self,
        bedrock_provider: Optional[BedrockRCAProvider] = None,
        baseline_provider: Optional[BaselineRCAProvider] = None,
    ):
        self.bedrock_provider = bedrock_provider or BedrockRCAProvider()
        self.baseline_provider = baseline_provider or BaselineRCAProvider()
        self.last_provider_used: str = "auto"

    def investigate(
        self,
        incident: Incident,
        telemetry: List[TelemetryEvent],
        evidence: List[Evidence],
    ) -> Tuple[RootCause, Recommendation, str, float]:
        try:
            result = self.bedrock_provider.investigate(incident, telemetry, evidence)
            self.last_provider_used = "bedrock"
            logger.info(f"Investigation for incident '{incident.id}' successfully completed using AWS Bedrock.")
            return result
        except Exception as e:
            err_type = type(e).__name__
            logger.warning(
                f"AWS Bedrock investigation failed for incident '{incident.id}' [{err_type}: {e}]. "
                "Executing automatic fallback to Baseline RCA Provider."
            )
            result = self.baseline_provider.investigate(incident, telemetry, evidence)
            self.last_provider_used = "bedrock_fallback_baseline"
            return result


class RCAProviderFactory:
    """
    Factory for instantiating the appropriate RCA provider based on environment configuration.
    Supported modes:
    - 'baseline': BaselineRCAProvider only (last_provider_used = 'baseline')
    - 'bedrock': BedrockRCAProvider only (raises exception on failure, last_provider_used = 'bedrock')
    - 'auto': AutoRCAProvider (attempts Bedrock, falls back to Baseline on error)
    """

    @classmethod
    def create_provider(
        cls,
        mode: Optional[str] = None,
        bedrock_provider: Optional[BedrockRCAProvider] = None,
        baseline_provider: Optional[BaselineRCAProvider] = None,
    ) -> RCAProvider:
        target_mode = (mode or settings.iamfixer_ai_provider or "auto").lower().strip()

        if target_mode == "baseline":
            provider = baseline_provider or BaselineRCAProvider()
            provider.last_provider_used = "baseline"
            return provider

        elif target_mode == "bedrock":
            provider = bedrock_provider or BedrockRCAProvider()
            provider.last_provider_used = "bedrock"
            return provider

        elif target_mode == "auto":
            return AutoRCAProvider(
                bedrock_provider=bedrock_provider,
                baseline_provider=baseline_provider,
            )

        else:
            logger.warning(f"Unknown IAMFIXER_AI_PROVIDER mode '{target_mode}'. Defaulting to 'auto'.")
            return AutoRCAProvider(
                bedrock_provider=bedrock_provider,
                baseline_provider=baseline_provider,
            )
