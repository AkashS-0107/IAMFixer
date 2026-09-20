from typing import List, Tuple
from app.models.enums import EvidenceRelevance, RemediationRisk
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.investigation import Recommendation, RootCause
from app.models.telemetry import TelemetryEvent
from app.services.rca.base_provider import RCAProvider


class BaselineRCAProvider(RCAProvider):
    """
    Deterministic Root Cause Analysis Investigator.
    Correlates evidence signals to detect failure patterns without ground truth.
    Calculates explainable, weighted confidence scores and produces actionable recommendations.
    """

    def investigate(
        self,
        incident: Incident,
        telemetry: List[TelemetryEvent],
        evidence: List[Evidence],
    ) -> Tuple[RootCause, Recommendation, str, float]:
        if not telemetry or not evidence:
            return (
                RootCause(
                    category="unknown",
                    description="Insufficient telemetry or evidence to determine root cause.",
                    confidence=0.10,
                    supporting_evidence_ids=[],
                ),
                Recommendation(
                    action="Collect additional diagnostic telemetry and observe system behavior.",
                    reason="No significant anomaly signals were extracted from available telemetry.",
                    risk=RemediationRisk.LOW,
                    requires_approval=False,
                ),
                "Investigation inconclusive due to lack of telemetry signals.",
                0.10,
            )

        evidence_types = {e.evidence_type: e for e in evidence}

        # Scenario 1: Bad Deployment Pattern
        if "DEPLOYMENT_TRIGGER" in evidence_types:
            matching_ev = [e for e in evidence if e.evidence_type in ["DEPLOYMENT_TRIGGER", "ERROR_SPIKE", "LATENCY_SPIKE", "ALERT_TRIGGERED"]]
            supporting_ids = [e.id for e in matching_ev]

            weight = 0.0
            if "DEPLOYMENT_TRIGGER" in evidence_types:
                weight += 0.45
            if "ERROR_SPIKE" in evidence_types:
                weight += 0.25
            if "LATENCY_SPIKE" in evidence_types:
                weight += 0.15
            if "ALERT_TRIGGERED" in evidence_types:
                weight += 0.10

            confidence = round(min(max(weight, 0.20), 0.95), 2)
            dep_ev = evidence_types["DEPLOYMENT_TRIGGER"]

            root_cause = RootCause(
                category="deployment",
                description=f"Faulty deployment detected on affected service '{incident.affected_service}'. {dep_ev.explanation}",
                confidence=confidence,
                supporting_evidence_ids=supporting_ids,
            )

            recommendation = Recommendation(
                action=f"Rollback the latest deployment on '{incident.affected_service}' to the previous stable release and verify error rates return to baseline.",
                reason="Application error rate and latency spiked immediately following recent deployment.",
                risk=RemediationRisk.HIGH,
                requires_approval=True,
            )

            reasoning = (
                f"Deployment event was identified shortly before error rate and latency degraded on service '{incident.affected_service}'. "
                f"Extracted {len(supporting_ids)} supporting evidence signals confirming correlation between release deployment and application failures."
            )
            return root_cause, recommendation, reasoning, confidence

        # Scenario 2: Database Connection Pool Exhaustion Pattern
        elif "DB_POOL_EXHAUSTION" in evidence_types:
            matching_ev = [e for e in evidence if e.evidence_type in ["DB_POOL_EXHAUSTION", "ERROR_SPIKE", "ALERT_TRIGGERED", "TRAFFIC_SPIKE_SIGNAL"]]
            supporting_ids = [e.id for e in matching_ev]

            weight = 0.0
            if "DB_POOL_EXHAUSTION" in evidence_types:
                weight += 0.50
            if "ERROR_SPIKE" in evidence_types:
                weight += 0.25
            if "ALERT_TRIGGERED" in evidence_types:
                weight += 0.15
            if "TRAFFIC_SPIKE_SIGNAL" in evidence_types:
                weight += 0.05

            confidence = round(min(max(weight, 0.20), 0.95), 2)
            db_ev = evidence_types["DB_POOL_EXHAUSTION"]

            root_cause = RootCause(
                category="database",
                description=f"Database connection pool exhaustion detected on '{incident.affected_service}'. {db_ev.explanation}",
                confidence=confidence,
                supporting_evidence_ids=supporting_ids,
            )

            recommendation = Recommendation(
                action=f"Increase connection-pool capacity or mitigate unclosed connection leakage on '{incident.affected_service}'.",
                reason="Database connection pool was saturated, causing query timeouts and application HTTP 503 failures.",
                risk=RemediationRisk.MEDIUM,
                requires_approval=True,
            )

            reasoning = (
                f"Telemetry indicates database connection pool reached maximum capacity on service '{incident.affected_service}', "
                f"leading to connection wait timeouts and cascading API errors. {len(supporting_ids)} evidence signals support this diagnosis."
            )
            return root_cause, recommendation, reasoning, confidence

        # Scenario 3: Memory Leak Pattern
        elif "MEMORY_LEAK_SIGNAL" in evidence_types:
            matching_ev = [e for e in evidence if e.evidence_type in ["MEMORY_LEAK_SIGNAL", "LATENCY_SPIKE", "ALERT_TRIGGERED", "ERROR_SPIKE"]]
            supporting_ids = [e.id for e in matching_ev]

            weight = 0.0
            if "MEMORY_LEAK_SIGNAL" in evidence_types:
                weight += 0.50
            if "LATENCY_SPIKE" in evidence_types:
                weight += 0.20
            if "ALERT_TRIGGERED" in evidence_types:
                weight += 0.15
            if "ERROR_SPIKE" in evidence_types:
                weight += 0.08

            confidence = round(min(max(weight, 0.20), 0.95), 2)
            mem_ev = evidence_types["MEMORY_LEAK_SIGNAL"]

            root_cause = RootCause(
                category="memory",
                description=f"Memory growth and process instability detected on '{incident.affected_service}'. {mem_ev.explanation}",
                confidence=confidence,
                supporting_evidence_ids=supporting_ids,
            )

            recommendation = Recommendation(
                action=f"Restart affected instances of '{incident.affected_service}' as immediate mitigation, then profile application memory for unbounded leaks.",
                reason="JVM heap memory exceeded safety threshold, causing excessive stop-the-world GC pauses and process instability.",
                risk=RemediationRisk.MEDIUM,
                requires_approval=True,
            )

            reasoning = (
                f"Observed heap memory growth crossing threshold combined with stop-the-world GC pauses and OutOfMemory errors "
                f"on service '{incident.affected_service}'. {len(supporting_ids)} evidence signals confirm memory saturation."
            )
            return root_cause, recommendation, reasoning, confidence

        # Scenario 4: Dependency Failure Pattern
        elif "DEPENDENCY_FAILURE_SIGNAL" in evidence_types:
            matching_ev = [e for e in evidence if e.evidence_type in ["DEPENDENCY_FAILURE_SIGNAL", "ERROR_SPIKE", "ALERT_TRIGGERED"]]
            supporting_ids = [e.id for e in matching_ev]

            weight = 0.0
            if "DEPENDENCY_FAILURE_SIGNAL" in evidence_types:
                weight += 0.50
            if "ERROR_SPIKE" in evidence_types:
                weight += 0.25
            if "ALERT_TRIGGERED" in evidence_types:
                weight += 0.15

            confidence = round(min(max(weight, 0.20), 0.95), 2)
            dep_ev = evidence_types["DEPENDENCY_FAILURE_SIGNAL"]

            root_cause = RootCause(
                category="dependency",
                description=f"External/upstream dependency failure affecting '{incident.affected_service}'. {dep_ev.explanation}",
                confidence=confidence,
                supporting_evidence_ids=supporting_ids,
            )

            recommendation = Recommendation(
                action=f"Verify dependency health and enable existing fallback path or circuit breaker for upstream services called by '{incident.affected_service}'.",
                reason="Upstream service dependency timed out and exhausted retry budget, propagating errors to downstream clients.",
                risk=RemediationRisk.MEDIUM,
                requires_approval=True,
            )

            reasoning = (
                f"Telemetry shows connection timeouts and retry exhaustion against external dependencies on service '{incident.affected_service}'. "
                f"{len(supporting_ids)} evidence signals substantiate dependency failure as the primary cause."
            )
            return root_cause, recommendation, reasoning, confidence

        # Scenario 5: Traffic Spike Pattern
        elif "TRAFFIC_SPIKE_SIGNAL" in evidence_types:
            matching_ev = [e for e in evidence if e.evidence_type in ["TRAFFIC_SPIKE_SIGNAL", "LATENCY_SPIKE", "ERROR_SPIKE", "ALERT_TRIGGERED"]]
            supporting_ids = [e.id for e in matching_ev]

            weight = 0.0
            if "TRAFFIC_SPIKE_SIGNAL" in evidence_types:
                weight += 0.45
            if "LATENCY_SPIKE" in evidence_types:
                weight += 0.25
            if "ERROR_SPIKE" in evidence_types:
                weight += 0.15
            if "ALERT_TRIGGERED" in evidence_types:
                weight += 0.10

            confidence = round(min(max(weight, 0.20), 0.90), 2)
            tr_ev = evidence_types["TRAFFIC_SPIKE_SIGNAL"]

            root_cause = RootCause(
                category="traffic",
                description=f"Unanticipated traffic surge causing CPU saturation and latency degradation on '{incident.affected_service}'. {tr_ev.explanation}",
                confidence=confidence,
                supporting_evidence_ids=supporting_ids,
            )

            recommendation = Recommendation(
                action=f"Scale out instances for '{incident.affected_service}' and verify latency and error rates after capacity expansion.",
                reason="Traffic volume spiked significantly beyond baseline capacity, overwhelming worker queues and CPU capacity.",
                risk=RemediationRisk.LOW,
                requires_approval=True,
            )

            reasoning = (
                f"Sudden traffic surge caused CPU saturation and queue buildup on service '{incident.affected_service}'. "
                f"Extracted {len(supporting_ids)} evidence signals indicating resource overload rather than application code defect."
            )
            return root_cause, recommendation, reasoning, confidence

        # Fallback for generic errors
        else:
            all_ids = [e.id for e in evidence]
            root_cause = RootCause(
                category="unknown",
                description=f"Uncategorized anomaly signals observed on service '{incident.affected_service}'.",
                confidence=0.35,
                supporting_evidence_ids=all_ids,
            )

            recommendation = Recommendation(
                action=f"Inspect system logs for service '{incident.affected_service}' and verify component health.",
                reason="Telemetry contained generic anomalies without a clear single failure signature.",
                risk=RemediationRisk.LOW,
                requires_approval=False,
            )

            reasoning = f"Analyzed {len(telemetry)} telemetry events and extracted {len(evidence)} evidence items, but no single dominant failure pattern exceeded confidence threshold."
            return root_cause, recommendation, reasoning, 0.35
