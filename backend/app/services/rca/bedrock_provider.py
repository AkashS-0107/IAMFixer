import json
import re
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings
from app.core.exceptions import (
    BedrockConfigurationError,
    BedrockError,
    BedrockEvidenceIntegrityError,
    BedrockResponseParsingError,
    BedrockValidationError,
)
from app.core.logging import logger
from app.models.enums import EvidenceRelevance, RemediationRisk
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.investigation import Recommendation, RootCause
from app.models.telemetry import TelemetryEvent
from app.services.rca.base_provider import RCAProvider
from app.services.rca.bedrock_client import BedrockClient
from app.services.rca.prompt_builder import PromptBuilder


class BedrockRootCauseSchema(BaseModel):
    category: str
    description: str
    confidence: float
    supporting_evidence_ids: List[str] = Field(default_factory=list)


class BedrockRecommendationSchema(BaseModel):
    action: str
    reason: str
    risk: RemediationRisk
    requires_approval: bool = True


class BedrockRCADataSchema(BaseModel):
    root_cause: BedrockRootCauseSchema
    reasoning: str
    recommendation: BedrockRecommendationSchema


class BedrockRCAProvider(RCAProvider):
    """
    AWS Bedrock AI Root Cause Analysis Provider.
    Invokes Amazon Bedrock LLM inference layer, parses structured JSON,
    and performs strict schema, confidence, safety, and evidence integrity validation.
    """

    def __init__(self, bedrock_client: Optional[BedrockClient] = None):
        self.client = bedrock_client or BedrockClient()

    def _extract_json_string(self, raw_text: str) -> str:
        """Strips markdown code fences and extracts raw JSON text."""
        text = raw_text.strip()
        # Remove markdown code fences if present
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        # Regex fallback to find first JSON block if surrounded by prose
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            return match.group(1)
        return text

    def investigate(
        self,
        incident: Incident,
        telemetry: List[TelemetryEvent],
        evidence: List[Evidence],
    ) -> Tuple[RootCause, Recommendation, str, float]:
        """
        Executes AI Root Cause Investigation via Amazon Bedrock.
        """
        model_id = settings.bedrock_model_id
        if not model_id:
            logger.warning("Bedrock model ID is not configured in settings.")
            raise BedrockConfigurationError("BEDROCK_MODEL_ID is not configured in environment or settings.")

        # 1. Build Prompts with Data Boundary & Context Budgeting
        system_prompt = PromptBuilder.SYSTEM_PROMPT
        user_prompt = PromptBuilder.build_user_prompt(incident, telemetry, evidence)

        # 2. Invoke Bedrock Client via converse API
        raw_output = self.client.invoke_converse(
            model_id=model_id,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            region_name=settings.aws_region,
        )

        # 3. Parse JSON Output
        json_str = self._extract_json_string(raw_output)
        try:
            parsed_dict = json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}. Raw text snippet: {raw_output[:200]}")
            raise BedrockResponseParsingError(f"Bedrock LLM response was not valid JSON: {str(e)}")

        # 4. Pydantic Schema Validation
        try:
            validated_data = BedrockRCADataSchema(**parsed_dict)
        except ValidationError as ve:
            logger.error(f"Pydantic validation error on LLM response: {ve}")
            raise BedrockValidationError(f"Bedrock output failed schema validation: {ve.errors()}")

        rc_data = validated_data.root_cause
        rec_data = validated_data.recommendation
        reasoning_text = validated_data.reasoning

        # 5. Strict Confidence Score Validation (Require 0.0 <= confidence <= 1.0)
        confidence = rc_data.confidence
        if not (0.0 <= confidence <= 1.0):
            logger.error(f"Invalid confidence score returned by LLM: {confidence}")
            raise BedrockValidationError(f"Confidence score {confidence} is out of valid bounds [0.0, 1.0].")

        # 6. Strict Evidence & Incident Ownership Integrity Validation
        valid_supplied_map = {e.id: e for e in evidence if e.incident_id == incident.id}
        incident_telemetry_ids = {t.id for t in telemetry if t.incident_id == incident.id}

        validated_evidence_ids = []
        for eid in rc_data.supporting_evidence_ids:
            if eid in valid_supplied_map:
                ev_obj = valid_supplied_map[eid]
                if ev_obj.telemetry_event_id in incident_telemetry_ids:
                    validated_evidence_ids.append(eid)

        # If LLM returned evidence IDs but NONE survived validation, reject result
        if rc_data.supporting_evidence_ids and not validated_evidence_ids:
            logger.error("All supporting evidence IDs returned by Bedrock were hallucinated or invalid.")
            raise BedrockEvidenceIntegrityError("AI returned invalid or hallucinated evidence references.")

        # 7. Recommendation Risk & Approval Safety Enforcement
        requires_approval = rec_data.requires_approval
        if rec_data.risk in [RemediationRisk.HIGH, RemediationRisk.MEDIUM]:
            requires_approval = True  # Strict safety rule enforcement

        # Build Domain Output Objects
        final_root_cause = RootCause(
            category=rc_data.category.lower(),
            description=rc_data.description,
            confidence=round(confidence, 2),
            supporting_evidence_ids=validated_evidence_ids,
        )

        final_recommendation = Recommendation(
            action=rec_data.action,
            reason=rec_data.reason,
            risk=rec_data.risk,
            requires_approval=requires_approval,
        )

        return final_root_cause, final_recommendation, reasoning_text, round(confidence, 2)
