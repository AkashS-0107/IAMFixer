from typing import List
from app.models.enums import EvidenceRelevance, TelemetryEventType, TelemetrySource
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.telemetry import TelemetryEvent


class EvidenceExtractionService:
    """
    Analyzes telemetry events associated with an incident and extracts structured
    evidence signals linked directly to specific telemetry event IDs.
    Does NOT use ground truth.
    """

    def extract_evidence(self, incident: Incident, telemetry: List[TelemetryEvent]) -> List[Evidence]:
        evidence_list: List[Evidence] = []

        for event in telemetry:
            msg_lower = event.message.lower()
            evt_type = event.event_type
            source = event.source
            sev = event.severity.upper()

            # 1. System Alerts (explicit alert events)
            if evt_type == TelemetryEventType.ALERT or msg_lower.startswith("alert triggered"):
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="ALERT_TRIGGERED",
                        relevance=EvidenceRelevance.HIGH,
                        explanation=f"System alert triggered for service '{event.service}': {event.message}",
                    )
                )

            # 2. Deployment Evidence
            elif source == TelemetrySource.DEPLOYMENT or evt_type == TelemetryEventType.DEPLOYMENT or "deploying" in msg_lower:
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="DEPLOYMENT_TRIGGER",
                        relevance=EvidenceRelevance.CRITICAL,
                        explanation=f"Deployment event detected on service '{event.service}': {event.message}",
                    )
                )

            # 3. Latency Metrics
            elif "p99_latency" in msg_lower or "p95_latency" in msg_lower or "latency degraded" in msg_lower:
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="LATENCY_SPIKE",
                        relevance=EvidenceRelevance.MEDIUM,
                        explanation=f"Latency degradation metric observed on service '{event.service}': {event.message}",
                    )
                )

            # 4. Error Rate Metrics & Spikes
            elif "error_rate" in msg_lower or "failure_rate" in msg_lower or "503 service unavailable" in msg_lower or "504 gateway timeout" in msg_lower:
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="ERROR_SPIKE",
                        relevance=EvidenceRelevance.HIGH,
                        explanation=f"Elevated error rate signal on service '{event.service}': {event.message}",
                    )
                )

            # 5. Database Pool Exhaustion Evidence
            elif source == TelemetrySource.DATABASE or evt_type == TelemetryEventType.DATABASE_EVENT or "connection pool" in msg_lower or "psqlexception" in msg_lower or "connectiontimeout" in msg_lower:
                relevance = EvidenceRelevance.CRITICAL if ("exhausted" in msg_lower or "timeout" in msg_lower or sev == "ERROR") else EvidenceRelevance.HIGH
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="DB_POOL_EXHAUSTION",
                        relevance=relevance,
                        explanation=f"Database connection pool issue detected on service '{event.service}': {event.message}",
                    )
                )

            # 6. Memory Leak / Heap / OutOfMemory Evidence
            elif "heap metric" in msg_lower or "outofmemory" in msg_lower or "garbage collection" in msg_lower or "heap limit" in msg_lower:
                relevance = EvidenceRelevance.CRITICAL if ("outofmemory" in msg_lower or "exceeded" in msg_lower or sev in ["ERROR", "CRITICAL"]) else EvidenceRelevance.HIGH
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="MEMORY_LEAK_SIGNAL",
                        relevance=relevance,
                        explanation=f"Memory/Heap metric or exception detected on service '{event.service}': {event.message}",
                    )
                )

            # 7. Dependency Failure Evidence
            elif "dependency" in msg_lower or "connecttimeoutexception" in msg_lower or "retry 3/3" in msg_lower:
                relevance = EvidenceRelevance.CRITICAL if ("failed" in msg_lower or "retry" in msg_lower or sev in ["ERROR", "CRITICAL"]) else EvidenceRelevance.HIGH
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="DEPENDENCY_FAILURE_SIGNAL",
                        relevance=relevance,
                        explanation=f"Upstream/external dependency issue detected on service '{event.service}': {event.message}",
                    )
                )

            # 8. Traffic Spike / CPU Saturation Evidence
            elif "traffic spike" in msg_lower or "request_rate jumped" in msg_lower or "cpu utilization" in msg_lower or "worker thread pool queue" in msg_lower:
                relevance = EvidenceRelevance.HIGH if ("spike" in msg_lower or "cpu" in msg_lower) else EvidenceRelevance.MEDIUM
                evidence_list.append(
                    Evidence(
                        incident_id=incident.id,
                        telemetry_event_id=event.id,
                        evidence_type="TRAFFIC_SPIKE_SIGNAL",
                        relevance=relevance,
                        explanation=f"Traffic surge or resource saturation detected on service '{event.service}': {event.message}",
                    )
                )

        return evidence_list
