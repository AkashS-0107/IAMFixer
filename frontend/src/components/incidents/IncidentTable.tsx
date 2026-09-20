import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpDown,
  ChevronRight,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Server,
  Plus,
} from 'lucide-react';
import { Incident, IncidentStatus, Severity } from '../../types/api';
import { formatTimeAgo, formatTimestamp } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { SeverityBadge } from '../ui/SeverityBadge';
import { TableRowSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';
import { AnimatedButton } from '../ui/AnimatedButton';

interface IncidentTableProps {
  incidents: Incident[];
  loading: boolean;
  onSelectIncident: (id: string) => void;
  onRefresh: () => void;
  onCreateModalOpen: () => void;
}

type SortField = 'detected_at' | 'severity' | 'status' | 'title';
type SortOrder = 'asc' | 'desc';

const SEVERITY_WEIGHT: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  loading,
  onSelectIncident,
  onRefresh,
  onCreateModalOpen,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  const [sortField, setSortField] = useState<SortField>('detected_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Unique services list
  const uniqueServices = Array.from(new Set(incidents.map((i) => i.affected_service))).filter(Boolean);

  // Filter incidents
  const filtered = incidents.filter((incident) => {
    if (severityFilter !== 'ALL' && incident.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && incident.status !== statusFilter) return false;
    if (serviceFilter !== 'ALL' && incident.affected_service !== serviceFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = incident.title.toLowerCase().includes(q);
      const serviceMatch = incident.affected_service.toLowerCase().includes(q);
      const descMatch = incident.description.toLowerCase().includes(q);
      const idMatch = incident.id.toLowerCase().includes(q);
      if (!titleMatch && !serviceMatch && !descMatch && !idMatch) return false;
    }
    return true;
  });

  // Sort incidents
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'detected_at') {
      comparison = new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime();
    } else if (sortField === 'severity') {
      comparison = (SEVERITY_WEIGHT[a.severity] || 0) - (SEVERITY_WEIGHT[b.severity] || 0);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl">
      {/* Table Action Bar */}
      <div className="p-4 border-b border-slate-800/90 bg-[#090d16]/70 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, service name, or incident ID..."
            className="w-full bg-[#090d16] border border-slate-800 focus:border-indigo-500/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity filter */}
          <div className="flex items-center space-x-1.5 bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#090d16] text-slate-300">Severity: All</option>
              <option value="CRITICAL" className="bg-[#090d16] text-rose-400">CRITICAL</option>
              <option value="HIGH" className="bg-[#090d16] text-orange-400">HIGH</option>
              <option value="MEDIUM" className="bg-[#090d16] text-amber-400">MEDIUM</option>
              <option value="LOW" className="bg-[#090d16] text-indigo-400">LOW</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-1.5 bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#090d16] text-slate-300">Status: All</option>
              <option value="OPEN" className="bg-[#090d16] text-red-400">OPEN</option>
              <option value="INVESTIGATING" className="bg-[#090d16] text-purple-400">INVESTIGATING</option>
              <option value="RESOLVED" className="bg-[#090d16] text-emerald-400">RESOLVED</option>
            </select>
          </div>

          {/* Service filter */}
          {uniqueServices.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <Server className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-mono focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL" className="bg-[#090d16] text-slate-300">Service: All</option>
                {uniqueServices.map((svc) => (
                  <option key={svc} value={svc} className="bg-[#090d16] text-slate-300">
                    {svc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 bg-[#090d16] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh Incidents"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Report Incident Modal Trigger */}
          <AnimatedButton
            onClick={onCreateModalOpen}
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Report Incident
          </AnimatedButton>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/90 bg-[#090d16]/90 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th
                onClick={() => toggleSort('severity')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors w-[120px]"
              >
                <div className="flex items-center space-x-1">
                  <span>Severity</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors w-[130px]"
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors min-w-[280px]"
              >
                <div className="flex items-center space-x-1">
                  <span>Incident Title & Service</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('detected_at')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors w-[170px]"
              >
                <div className="flex items-center space-x-1">
                  <span>Detected</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3 px-4 text-right w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs font-sans">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => <TableRowSkeleton key={idx} />)
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    title="No active incidents match filter criteria"
                    description="Try resetting your severity, status, or search query filter, or trigger a failure scenario from the Simulation Lab."
                  />
                </td>
              </tr>
            ) : (
              sorted.map((incident) => (
                  <motion.tr
                    key={incident.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    whileHover={{ backgroundColor: 'rgba(21, 28, 46, 0.7)' }}
                    onClick={() => onSelectIncident(incident.id)}
                    className="cursor-pointer transition-colors group"
                  >
                    {/* Severity */}
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={incident.severity} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={incident.status} />
                    </td>

                    {/* Title & Service */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {incident.title}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="text-slate-500">svc:</span>
                        <span className="text-indigo-300 bg-[#090d16] px-1.5 py-0.5 rounded border border-slate-800">
                          {incident.affected_service}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500">ID: {incident.id.substring(0, 8)}...</span>
                      </div>
                    </td>

                    {/* Detected Time */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{formatTimestamp(incident.detected_at)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatTimeAgo(incident.detected_at)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident(incident.id);
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-[#090d16] hover:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 transition-colors"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-2.5 bg-[#090d16]/70 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Showing {sorted.length} of {incidents.length} incidents</span>
        <span>Click row to view telemetry & trigger RCA engine</span>
      </div>
    </div>
  );
};

