import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, ApiError } from '../services/api';

describe('API Client Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch health check successfully', async () => {
    const mockHealth = { status: 'ok', service: 'IAMFixer', version: '1.0.0' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const result = await api.getHealth();
    expect(result).toEqual(mockHealth);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/health', expect.any(Object));
  });

  it('should construct correct query params when listing incidents with filters', async () => {
    const mockIncidents = [
      {
        id: 'inc-123',
        title: 'High Error Rate',
        description: 'Errors spiking',
        severity: 'CRITICAL',
        status: 'OPEN',
        affected_service: 'payment-service',
        detected_at: '2026-09-17T12:00:00Z',
        resolved_at: null,
        created_at: '2026-09-17T12:00:00Z',
        updated_at: '2026-09-17T12:00:00Z',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockIncidents,
    });

    const result = await api.listIncidents({ severity: 'CRITICAL', status: 'OPEN' });
    expect(result).toEqual(mockIncidents);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/incidents?severity=CRITICAL&status=OPEN',
      expect.any(Object)
    );
  });

  it('should normalize HTTP errors into human-readable ApiError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Incident not found' }),
    });

    await expect(api.getIncident('non-existent')).rejects.toThrow('Incident not found');
  });

  it('should handle network connection failures gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.getHealth()).rejects.toThrow('Unable to connect to IAMFixer backend');
  });
});
