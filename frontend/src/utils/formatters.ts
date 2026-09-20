import { EvidenceRelevance, IncidentStatus, RemediationRisk, Severity, TelemetrySource } from '../types/api';

/**
 * Normalizes backend confidence (0.0 - 1.0) into formatted string "XX%".
 */
export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined || typeof confidence !== 'number' || isNaN(confidence)) {
    return 'N/A';
  }
  let pct: number;
  if (confidence <= 1 && confidence >= 0) {
    pct = Math.round(confidence * 100);
  } else {
    pct = Math.round(confidence);
  }
  pct = Math.max(0, Math.min(100, pct));
  return `${pct}%`;
}

/**
 * Formats ISO date string into readable SRE timestamp format.
 */
export function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

/**
 * Format relative duration from timestamp to now or between dates.
 */
export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return isoString;
  }
}

export function getSeverityStyle(severity: Severity | string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return {
        badge: 'bg-rose-950/80 text-rose-300 border-rose-800/60 ring-rose-500/20',
        dot: 'bg-rose-500',
        text: 'text-rose-400',
      };
    case 'HIGH':
      return {
        badge: 'bg-orange-950/80 text-orange-300 border-orange-800/60 ring-orange-500/20',
        dot: 'bg-orange-500',
        text: 'text-orange-400',
      };
    case 'MEDIUM':
      return {
        badge: 'bg-amber-950/80 text-amber-300 border-amber-800/60 ring-amber-500/20',
        dot: 'bg-amber-500',
        text: 'text-amber-400',
      };
    case 'LOW':
    default:
      return {
        badge: 'bg-blue-950/80 text-blue-300 border-blue-800/60 ring-blue-500/20',
        dot: 'bg-blue-400',
        text: 'text-blue-400',
      };
  }
}

export function getStatusStyle(status: IncidentStatus | string) {
  switch (status?.toUpperCase()) {
    case 'OPEN':
      return {
        badge: 'bg-red-950/60 text-red-300 border-red-700/50',
        text: 'text-red-400',
      };
    case 'INVESTIGATING':
      return {
        badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50 animate-pulse',
        text: 'text-purple-400',
      };
    case 'RESOLVED':
      return {
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
        text: 'text-emerald-400',
      };
    default:
      return {
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        text: 'text-slate-400',
      };
  }
}

export function getRelevanceStyle(relevance: EvidenceRelevance | string) {
  switch (relevance?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-950/90 text-red-300 border-red-700/60';
    case 'HIGH':
      return 'bg-amber-950/90 text-amber-300 border-amber-700/60';
    case 'MEDIUM':
      return 'bg-sky-950/90 text-sky-300 border-sky-700/60';
    case 'LOW':
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getRiskStyle(risk: RemediationRisk | string) {
  switch (risk?.toUpperCase()) {
    case 'HIGH':
      return 'bg-rose-950/80 text-rose-300 border-rose-800';
    case 'MEDIUM':
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    case 'LOW':
    default:
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
  }
}
