import {
  HealthStatus,
  Incident,
  IncidentCreate,
  IncidentFilters,
  Investigation,
  SimulationResult,
  TelemetryListResponse,
} from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} Error`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      if (response.status === 404) {
        errorMessage = 'Requested resource not found.';
      } else if (response.status === 500) {
        errorMessage = 'Internal server error occurred on IAMFixer backend.';
      }
    }
    throw new ApiError(errorMessage, response.status);
  }
  return response.json() as Promise<T>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    return await handleResponse<T>(response);
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'Unable to connect to IAMFixer backend. Please ensure backend is running at ' + BASE_URL
    );
  }
}

export const api = {
  getHealth: (): Promise<HealthStatus> => {
    return request<HealthStatus>('/health');
  },

  listIncidents: (filters?: IncidentFilters): Promise<Incident[]> => {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.affected_service) params.append('affected_service', filters.affected_service);
    const queryString = params.toString();
    return request<Incident[]>(`/api/incidents${queryString ? `?${queryString}` : ''}`);
  },

  getIncident: (incidentId: string): Promise<Incident> => {
    return request<Incident>(`/api/incidents/${encodeURIComponent(incidentId)}`);
  },

  createIncident: (payload: IncidentCreate): Promise<Incident> => {
    return request<Incident>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getIncidentTelemetry: (incidentId: string): Promise<TelemetryListResponse> => {
    return request<TelemetryListResponse>(`/api/incidents/${encodeURIComponent(incidentId)}/telemetry`);
  },

  investigateIncident: (incidentId: string, rerun = false): Promise<Investigation> => {
    const queryString = rerun ? '?rerun=true' : '';
    return request<Investigation>(`/api/incidents/${encodeURIComponent(incidentId)}/investigate${queryString}`, {
      method: 'POST',
    });
  },

  getInvestigationResult: (incidentId: string): Promise<Investigation> => {
    return request<Investigation>(`/api/incidents/${encodeURIComponent(incidentId)}/investigation`);
  },

  runSimulation: (scenario: string): Promise<SimulationResult> => {
    return request<SimulationResult>(`/api/simulation/${encodeURIComponent(scenario)}`, {
      method: 'POST',
    });
  },
};
