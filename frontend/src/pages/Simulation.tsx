import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { SimulationResult, SimulationScenario } from '../types/api';
import { SCENARIOS_LIST, ScenarioCard } from '../components/simulation/ScenarioCard';
import { PageTransition, SectionHeader, AnimatedButton } from '../components/ui';

interface SimulationProps {
  onNavigate: (path: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

export const Simulation: React.FC<SimulationProps> = ({ onNavigate, showToast }) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunScenario = async (scenarioId: SimulationScenario) => {
    setLoadingScenario(scenarioId);
    setErrorMsg(null);
    try {
      const result = await api.runSimulation(scenarioId);
      setLatestResult(result);
      if (showToast) {
        showToast(`Simulation "${result.scenario}" created incident #${result.incident_id.substring(0, 8)}.`, 'success');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to run simulation. Please verify backend is running.');
      }
      if (showToast) {
        showToast('Simulation trigger failed.', 'error');
      }
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="Failure Scenario Simulation Lab"
        subtitle="Trigger realistic microservice failure scenarios with deterministic telemetry events for demonstration and RCA evaluation."
        icon={FlaskConical}
      />

      {/* Error Banner */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center justify-between shadow-lg overflow-hidden font-mono"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest Simulation Result Banner */}
      <AnimatePresence>
        {latestResult && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-[#0e1422] border-2 border-emerald-500/60 rounded-xl p-5 shadow-2xl space-y-3 bg-gradient-to-r from-[#0e1422] via-[#0e1422] to-emerald-950/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Simulation Scenario Triggered Successfully
                </span>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Generated {latestResult.telemetry_count} telemetry events
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-[#090d16] px-2 py-0.5 rounded border border-slate-800">
                    {latestResult.affected_service}
                  </span>
                  <span className="text-sm font-bold text-slate-100 font-sans">{latestResult.incident_title}</span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Incident ID: <strong className="text-indigo-400">{latestResult.incident_id}</strong>
                </p>
              </div>

              <AnimatedButton
                onClick={() => onNavigate(`/incidents/${latestResult.incident_id}`)}
                variant="emerald"
                size="md"
                className="shrink-0"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Inspect Incident & Run RCA
              </AnimatedButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenarios Grid */}
      <motion.div
        variants={gridContainerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {SCENARIOS_LIST.map((sc) => (
          <motion.div key={sc.id} variants={cardItemVariants}>
            <ScenarioCard
              scenario={sc}
              loading={loadingScenario === sc.id}
              onRunScenario={handleRunScenario}
            />
          </motion.div>
        ))}
      </motion.div>
    </PageTransition>
  );
};

