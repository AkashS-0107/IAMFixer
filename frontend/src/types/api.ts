export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export type TelemetrySource = 'logs' | 'metrics' | 'deployment' | 'service' | 'database' | 'network';
export type TelemetryEventType = 'LOG' | 'METRIC' | 'DEPLOYMENT' | 'SERVICE_EVENT' | 'DATABASE_EVENT' | 'ALERT';

export type EvidenceRelevance = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RemediationRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type InvestigationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type SimulationScenario =
  | 'BAD_DEPLOYMENT'
  | 'DATABASE_CONNECTION_EXHAUSTION'
  | 'MEMORY_LEAK'
  | 'DEPENDENCY_FAILURE'
  | 'TRAFFIC_SPIKE';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  affected_service: string;
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  severity: Severity;
  status?: IncidentStatus;
  affected_service: string;
  detected_at?: string;
}

export interface TelemetryEvent {
  id: string;
  incident_id: string;
  timestamp: string;
  source: TelemetrySource;
  event_type: TelemetryEventType;
  severity: string; // e.g. "INFO", "WARN", "ERROR", "CRITICAL"
  service: string;
  message: string;
  metadata: Record<string, any>;
}

export interface TelemetryListResponse {
  incident_id: string;
  count: number;
  telemetry: TelemetryEvent[];
}

export interface Evidence {
  id: string;
  incident_id: string;
  telemetry_event_id: string;
  evidence_type: string;
  relevance: EvidenceRelevance;
  explanation: string;
}

export interface RootCause {
  category: string;
  description: string;
  confidence: number;
  supporting_evidence_ids: string[];
}

export interface Recommendation {
  action: string;
  reason: string;
  risk: RemediationRisk;
  requires_approval: boolean;
}

export interface Investigation {
  id: string;
  incident_id: string;
  status: InvestigationStatus;
  started_at: string;
  completed_at: string | null;
  probable_root_cause: RootCause | null;
  confidence: number | null;
  reasoning: string | null;
  recommendation: Recommendation | null;
  supporting_evidence: Evidence[];
  provider_used?: string | null;
  error_message: string | null;
}

export interface SimulationResult {
  incident_id: string;
  scenario: string;
  incident_title: string;
  affected_service: string;
  severity: Severity;
  telemetry_count: number;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  ai_provider?: string;
  bedrock_status?: string;
  database_status?: string;
}


export interface IncidentFilters {
  severity?: Severity;
  status?: IncidentStatus;
  affected_service?: string;
  search?: string;
}
