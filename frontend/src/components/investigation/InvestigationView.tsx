import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCheck2,
  HelpCircle,
  Link as LinkIcon,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Investigation } from '../../types/api';
import { getRelevanceStyle, getRiskStyle } from '../../utils/formatters';
import { ProgressRing } from '../ui/ProgressRing';
import { AnimatedButton } from '../ui/AnimatedButton';
import { PulseIndicator } from '../ui/PulseIndicator';

interface InvestigationViewProps {
  investigation: Investigation | null;
  loading: boolean;
  onTriggerInvestigation: () => void;
  onSelectEvidence: (telemetryEventId: string) => void;
}

const UI_PROGRESS_STEPS = [
  'Collecting Telemetry',
  'Extracting Evidence',
  'Running RCA',
  'Validating Evidence',
  'Generating Recommendation',
];

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  investigation,
  loading,
  onTriggerInvestigation,
  onSelectEvidence,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Simulate visual UI progress steps during active network request
  React.useEffect(() => {
    let interval: any;
    if (loading) {
      setCurrentStepIndex(0);
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev < UI_PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
      }, 350);
    } else {
      setCurrentStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const hasResult = investigation && investigation.status === 'COMPLETED';

  const getProviderBadge = (provider?: string | null) => {
    if (!provider) return null;
    let label = 'Baseline RCA';
    let color = 'bg-indigo-950/90 text-indigo-300 border-indigo-800';
    let icon = <Cpu className="h-3 w-3 text-indigo-400 inline mr-1" aria-hidden="true" />;

    if (provider === 'bedrock') {
      label = 'AWS Bedrock';
      color = 'bg-purple-950/90 text-purple-300 border-purple-700';
      icon = <Sparkles className="h-3 w-3 text-purple-400 inline mr-1" aria-hidden="true" />;
    } else if (provider === 'bedrock_fallback_baseline') {
      label = 'AWS Bedrock → Baseline Fallback';
      color = 'bg-amber-950/90 text-amber-300 border-amber-700';
      icon = <Sparkles className="h-3 w-3 text-amber-400 inline mr-1" aria-hidden="true" />;
    } else if (provider === 'baseline') {
      label = 'Baseline RCA';
      color = 'bg-indigo-950/90 text-indigo-300 border-indigo-800';
      icon = <Cpu className="h-3 w-3 text-indigo-400 inline mr-1" aria-hidden="true" />;
    }

    return (
      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border uppercase flex items-center ${color}`}>
        {icon}
        <span>Provider: {label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Investigation Control Bar */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-slate-100 uppercase tracking-wide font-mono">
              Root Cause Analysis Engine
            </h3>
            {investigation && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center space-x-1 ${
                  investigation.status === 'COMPLETED'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : investigation.status === 'IN_PROGRESS'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}
              >
                {investigation.status === 'IN_PROGRESS' && <PulseIndicator color="purple" size="sm" />}
                <span>{investigation.status}</span>
              </span>
            )}
            {getProviderBadge(investigation?.provider_used)}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Hybrid AI & Deterministic RCA pipeline inspecting telemetry stream, logs, metrics, and evidence.
          </p>
        </div>

        <div>
          <AnimatedButton
            onClick={onTriggerInvestigation}
            loading={loading}
            variant={hasResult ? 'secondary' : 'primary'}
            size="lg"
            aria-label={hasResult ? 'Re-run Investigation' : 'Investigate Incident'}
            icon={hasResult ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
          >
            {loading ? 'Running Investigation Engine...' : hasResult ? 'Re-run Investigation' : 'Investigate Incident'}
          </AnimatedButton>
        </div>
      </div>

      {/* Loading Progress Pipeline State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="bg-[#0e1422] border border-indigo-800/60 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4 overflow-hidden"
          >
            <div className="flex items-center space-x-3">
              <PulseIndicator color="purple" size="lg" />
              <span className="text-sm font-bold text-indigo-300 font-mono">
                RCA Analysis Engine Pipeline Executing...
              </span>
            </div>

            <div className="space-y-2.5">
              {UI_PROGRESS_STEPS.map((step, idx) => {
                const isCurrent = idx === currentStepIndex;
                const isDone = idx < currentStepIndex;
                return (
                  <motion.div
                    key={idx}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center space-x-3 text-xs font-mono transition-colors ${
                      isDone
                        ? 'text-emerald-400 font-medium'
                        : isCurrent
                        ? 'text-indigo-300 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    <div className="relative flex items-center justify-center h-4 w-4">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      ) : isCurrent ? (
                        <PulseIndicator color="purple" size="sm" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-800" />
                      )}
                    </div>
                    <span>
                      Stage {idx + 1}: {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
              Note: Final results are populated dynamically from backend response.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Investigation Failed State */}
      {investigation && investigation.status === 'FAILED' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-6 shadow-xl text-rose-300 space-y-2"
        >
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertOctagon className="h-5 w-5 text-rose-400" aria-hidden="true" />
            <span>Investigation Failed</span>
          </div>
          <p className="text-xs text-rose-300/80 font-mono">
            {investigation.error_message || 'An unexpected error occurred during root cause analysis.'}
          </p>
        </motion.div>
      )}

      {/* Investigation Empty / Not Run State */}
      {!loading && !investigation && (
        <div className="bg-[#0e1422] border border-slate-800/80 rounded-xl p-10 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400">
            <Sparkles className="h-6 w-6 text-indigo-400" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Investigation Has Not Been Run</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
            Click "Investigate Incident" above to run the RCA engine on all telemetry events, extract evidence, and generate remediation guidance.
          </p>
        </div>
      )}

      {/* Investigation Completed Results */}
      {!loading && hasResult && investigation.probable_root_cause && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          className="space-y-6"
        >
          {/* PROMINENT ROOT CAUSE CARD */}
          <div className="bg-[#0e1422] border-2 border-indigo-500/60 rounded-xl p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0e1422] via-[#0e1422] to-indigo-950/30">
            {/* Top Badge & Confidence Ring */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                  ROOT CAUSE IDENTIFIED
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Category: <strong className="text-slate-100">{investigation.probable_root_cause.category}</strong>
                </span>
              </div>

              {/* Dynamic Confidence Meter */}
              <ProgressRing confidence={investigation.confidence} />
            </div>

            {/* Root Cause Title & Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold text-white tracking-tight font-sans">
                {investigation.probable_root_cause.description}
              </h3>

              {/* Reasoning */}
              {investigation.reasoning && (
                <div className="mt-4 p-4 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-indigo-400">
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Analysis & Correlation Reasoning</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {investigation.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SUPPORTING EVIDENCE LIST */}
          <div className="bg-[#0e1422] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 font-mono">
                  Supporting Telemetry Evidence ({investigation.supporting_evidence.length})
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Click evidence to trace to exact telemetry event
              </span>
            </div>

            <div className="grid gap-3">
              {investigation.supporting_evidence.map((evidence) => {
                const relevanceClass = getRelevanceStyle(evidence.relevance);

                return (
                  <motion.div
                    key={evidence.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Trace evidence ${evidence.evidence_type} to telemetry event`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectEvidence(evidence.telemetry_event_id);
                      }
                    }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.01, x: 2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                    onClick={() => onSelectEvidence(evidence.telemetry_event_id)}
                    className="p-4 rounded-xl bg-[#090d16]/70 border border-slate-800 hover:border-indigo-500/60 hover:bg-[#090d16] cursor-pointer transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-indigo-300 uppercase">
                          {evidence.evidence_type}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${relevanceClass}`}
                        >
                          {evidence.relevance} Relevance
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-sans">
                        {evidence.explanation}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-mono text-indigo-400 group-hover:text-indigo-300 shrink-0 font-semibold">
                      <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Trace Event</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* PROMINENT REMEDIATION SAFETY PANEL */}
          {investigation.recommendation && (
            <div className="bg-[#0e1422] border-2 border-emerald-800/80 rounded-xl p-6 shadow-xl space-y-4 bg-gradient-to-br from-[#0e1422] to-emerald-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" aria-hidden="true" />
                  <h4 className="text-base font-extrabold uppercase tracking-wider text-slate-100 font-mono">
                    REMEDIATION SAFETY
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border uppercase ${getRiskStyle(
                      investigation.recommendation.risk
                    )}`}
                  >
                    Risk Level: {investigation.recommendation.risk}
                  </span>

                  {(investigation.recommendation.requires_approval ||
                    investigation.recommendation.risk === 'MEDIUM' ||
                    investigation.recommendation.risk === 'HIGH') && (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-purple-950/80 text-purple-300 border border-purple-800 uppercase flex items-center space-x-1">
                      <ShieldAlert className="h-3 w-3 text-purple-400" aria-hidden="true" />
                      <span>Approval Required</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-slate-400 block mb-1">
                    Recommended Action Strategy:
                  </span>
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-sm font-bold text-emerald-300 font-mono">
                    {investigation.recommendation.action}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase font-bold text-slate-400 block mb-1">
                    Rationale & Expected Operational Impact:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#090d16]/60 p-3 rounded-lg border border-slate-800/60">
                    {investigation.recommendation.reason}
                  </p>
                </div>

                {/* Explicit Read-Only Governance Notice */}
                <div className="p-4 rounded-xl bg-[#090d16]/90 border border-emerald-900/60 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  <span className="flex items-center space-x-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>Recommendation only. Human approval required.</span>
                  </span>
                  <span className="text-purple-300 text-[11px] font-semibold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    No Automated Infrastructure Modifications Triggered
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

