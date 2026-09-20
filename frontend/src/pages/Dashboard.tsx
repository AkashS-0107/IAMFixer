import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { api, ApiError } from '../services/api';
import { Incident } from '../types/api';
import { IncidentStats } from '../components/incidents/IncidentStats';
import { IncidentTable } from '../components/incidents/IncidentTable';
import { CreateIncidentModal } from '../components/incidents/CreateIncidentModal';
import { PageTransition, AnimatedButton, SectionHeader } from '../components/ui';

interface DashboardProps {
  onNavigate: (path: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, showToast }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchIncidents = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.listIncidents();
      setIncidents(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to connect to IAMFixer backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreatedIncident = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    if (showToast) {
      showToast(`Incident "${newIncident.title}" reported successfully.`, 'success');
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="AI Incident Operations Console"
        subtitle="Real-time monitoring of application failures, telemetry streams, and root-cause analysis status."
        icon={LayoutDashboard}
        action={
          <AnimatedButton
            onClick={fetchIncidents}
            loading={loading}
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </AnimatedButton>
        }
      />

      {/* Backend Error Banner */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-4 shadow-lg overflow-hidden"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <strong className="font-bold">Backend Communication Error</strong>
                <p className="text-rose-300/80 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <AnimatedButton
              onClick={fetchIncidents}
              variant="danger"
              size="sm"
            >
              Retry Connection
            </AnimatedButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incident Statistics Metrics */}
      <IncidentStats incidents={incidents} />

      {/* Incidents Table */}
      <IncidentTable
        incidents={incidents}
        loading={loading}
        onSelectIncident={(id) => onNavigate(`/incidents/${id}`)}
        onRefresh={fetchIncidents}
        onCreateModalOpen={() => setIsModalOpen(true)}
      />

      {/* Manual Incident Creation Modal */}
      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreatedIncident}
      />
    </PageTransition>
  );
};

