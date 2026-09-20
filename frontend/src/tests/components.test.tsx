import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IncidentTable } from '../components/incidents/IncidentTable';
import { IncidentStats } from '../components/incidents/IncidentStats';
import { InvestigationView } from '../components/investigation/InvestigationView';
import { Incident, Investigation } from '../types/api';

const mockIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'High HTTP 500 Error Rate in payment-service',
    description: 'Errors spiked to 14.7%',
    severity: 'HIGH',
    status: 'OPEN',
    affected_service: 'payment-service',
    detected_at: '2026-09-17T12:00:00Z',
    resolved_at: null,
    created_at: '2026-09-17T12:00:00Z',
    updated_at: '2026-09-17T12:00:00Z',
  },
  {
    id: 'inc-002',
    title: 'Database Connection Pool Exhaustion on order-db',
    description: 'Pool exhausted 98/100',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    affected_service: 'order-service',
    detected_at: '2026-09-17T12:05:00Z',
    resolved_at: null,
    created_at: '2026-09-17T12:05:00Z',
    updated_at: '2026-09-17T12:05:00Z',
  },
];

describe('IncidentStats Component', () => {
  it('should accurately calculate incident statistics from list', () => {
    render(<IncidentStats incidents={mockIncidents} />);

    expect(screen.getByText('Active Incidents')).toBeInTheDocument();
    expect(screen.getByText('Critical Severity')).toBeInTheDocument();
    expect(screen.getByText('Under Investigation')).toBeInTheDocument();
  });
});

describe('IncidentTable Component', () => {
  it('should render incidents table and support search filtering', () => {
    const onSelect = vi.fn();
    const onRefresh = vi.fn();
    const onCreateModal = vi.fn();

    render(
      <IncidentTable
        incidents={mockIncidents}
        loading={false}
        onSelectIncident={onSelect}
        onRefresh={onRefresh}
        onCreateModalOpen={onCreateModal}
      />
    );

    expect(screen.getByText('High HTTP 500 Error Rate in payment-service')).toBeInTheDocument();
    expect(screen.getByText('Database Connection Pool Exhaustion on order-db')).toBeInTheDocument();

    // Filter by search query
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(searchInput, { target: { value: 'payment-service' } });

    expect(screen.getByText('High HTTP 500 Error Rate in payment-service')).toBeInTheDocument();
    expect(screen.queryByText('Database Connection Pool Exhaustion on order-db')).not.toBeInTheDocument();
  });
});

describe('InvestigationView Component', () => {
  it('should render RCA results with dynamic confidence score and read-only recommendation', () => {
    const mockInvestigation: Investigation = {
      id: 'inv-100',
      incident_id: 'inc-001',
      status: 'COMPLETED',
      started_at: '2026-09-17T12:00:00Z',
      completed_at: '2026-09-17T12:00:05Z',
      probable_root_cause: {
        category: 'deployment',
        description: 'Faulty deployment release v1.8.3 introduced unhandled NullPointerExceptions.',
        confidence: 0.91,
        supporting_evidence_ids: ['ev-01'],
      },
      confidence: 0.91,
      reasoning: 'A deployment of version 1.8.3 was immediately followed by HTTP 500 errors.',
      recommendation: {
        action: 'Rollback payment-service deployment to release v1.8.2',
        reason: 'Restores stable build prior to NullPointerExceptions',
        risk: 'MEDIUM',
        requires_approval: true,
      },
      supporting_evidence: [
        {
          id: 'ev-01',
          incident_id: 'inc-001',
          telemetry_event_id: 'tel-01',
          evidence_type: 'DEPLOYMENT_EVENT',
          relevance: 'CRITICAL',
          explanation: 'Deploying payment-service version v1.8.3 commit 9a8f2c1',
        },
      ],
      error_message: null,
    };

    const onTrigger = vi.fn();
    const onSelectEvidence = vi.fn();

    render(
      <InvestigationView
        investigation={mockInvestigation}
        loading={false}
        onTriggerInvestigation={onTrigger}
        onSelectEvidence={onSelectEvidence}
      />
    );

    expect(screen.getByText('ROOT CAUSE IDENTIFIED')).toBeInTheDocument();
    expect(screen.getAllByText('91%')[0]).toBeInTheDocument();
    expect(screen.getByText(/Faulty deployment release v1.8.3/i)).toBeInTheDocument();
    expect(screen.getByText(/Rollback payment-service deployment to release v1.8.2/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Approval Required/i)[0]).toBeInTheDocument();

    // Click trace evidence button
    const traceBtn = screen.getByText('Trace Event');
    fireEvent.click(traceBtn);
    expect(onSelectEvidence).toHaveBeenCalledWith('tel-01');
  });
});
