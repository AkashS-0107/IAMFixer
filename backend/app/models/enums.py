from enum import Enum


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"


class TelemetrySource(str, Enum):
    LOGS = "logs"
    METRICS = "metrics"
    DEPLOYMENT = "deployment"
    SERVICE = "service"
    DATABASE = "database"
    NETWORK = "network"


class TelemetryEventType(str, Enum):
    LOG = "LOG"
    METRIC = "METRIC"
    DEPLOYMENT = "DEPLOYMENT"
    SERVICE_EVENT = "SERVICE_EVENT"
    DATABASE_EVENT = "DATABASE_EVENT"
    ALERT = "ALERT"


class EvidenceRelevance(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RemediationRisk(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class InvestigationStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SimulationScenario(str, Enum):
    BAD_DEPLOYMENT = "BAD_DEPLOYMENT"
    DATABASE_CONNECTION_EXHAUSTION = "DATABASE_CONNECTION_EXHAUSTION"
    MEMORY_LEAK = "MEMORY_LEAK"
    DEPENDENCY_FAILURE = "DEPENDENCY_FAILURE"
    TRAFFIC_SPIKE = "TRAFFIC_SPIKE"
