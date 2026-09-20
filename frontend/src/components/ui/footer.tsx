import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Github,
  BookOpen,
  Terminal,
  ShieldCheck,
  HeartPulse,
  ExternalLink,
  X,
  Cpu,
  Database,
  Brain,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { PulseIndicator } from './PulseIndicator';

export interface FooterProps {
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentPath = '/' }) => {
  const shouldReduceMotion = useReducedMotion();
  const currentYear = new Date().getFullYear();

  const [activeModal, setActiveModal] = useState<'about' | 'health' | null>(null);

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const isHome = currentPath === '/' || currentPath === '';
  const isDashboard = currentPath === '/dashboard' || currentPath.startsWith('/incidents');
  const isSimulation = currentPath === '/simulation';

  return (
    <motion.footer
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="contentinfo"
      className="relative w-full border-t border-slate-800/80 bg-[#090d16]/95 text-slate-400 backdrop-blur-md mt-auto"
    >
      {/* Top Accent Glow Border */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & SRE Description Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white font-sans">
                  IAMFixer
                </span>
                <p className="text-xs font-mono text-indigo-400/90 font-medium mt-0.5">
                  Find the failure. Understand the cause. Fix it.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-sans">
              AI-powered incident investigation for modern applications. Automates telemetry ingestion, AWS Bedrock AI diagnosis, and zero-risk remediation workflow.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Navigation
            </h4>
            <nav aria-label="Footer Navigation" className="flex flex-col space-y-1.5 text-xs font-medium">
              <button
                onClick={() => handleNav('/')}
                className={`flex items-center space-x-2 text-left w-fit px-2 py-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isHome ? 'text-indigo-300 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNav('/dashboard')}
                className={`flex items-center space-x-2 text-left w-fit px-2 py-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isDashboard ? 'text-indigo-300 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>Operations Console</span>
              </button>

              <button
                onClick={() => handleNav('/simulation')}
                className={`flex items-center space-x-2 text-left w-fit px-2 py-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isSimulation ? 'text-indigo-300 font-semibold bg-slate-900/60' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Simulation Lab</span>
              </button>

              <button
                onClick={() => setActiveModal('health')}
                className="flex items-center space-x-2 text-left w-fit px-2 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>System Health</span>
              </button>

              <button
                onClick={() => setActiveModal('about')}
                className="flex items-center space-x-2 text-left w-fit px-2 py-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>About IAMFixer</span>
              </button>
            </nav>
          </div>

          {/* Social & Community Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Resources & Repositories
            </h4>
            <div className="flex flex-wrap gap-2">
              <motion.a
                href="https://github.com/AkashS-0107/IAMFixer"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0e1422] border border-slate-800 text-xs font-mono text-slate-300 hover:text-indigo-300 hover:border-indigo-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Github className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden="true" />
              </motion.a>

              <motion.a
                href="https://github.com/AkashS-0107/IAMFixer#readme"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Documentation & Guides"
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0e1422] border border-slate-800 text-xs font-mono text-slate-300 hover:text-indigo-300 hover:border-indigo-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
                <span>Docs</span>
                <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden="true" />
              </motion.a>

              <motion.a
                href="https://github.com/AkashS-0107/IAMFixer"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SRE API Specification"
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0e1422] border border-slate-800 text-xs font-mono text-slate-300 hover:text-indigo-300 hover:border-indigo-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Terminal className="h-4 w-4 shrink-0 text-purple-400" aria-hidden="true" />
                <span>API Docs</span>
                <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden="true" />
              </motion.a>

              <motion.button
                onClick={() => setActiveModal('health')}
                aria-label="Telemetry Operational Status"
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0e1422] border border-slate-800 text-xs font-mono text-slate-300 hover:text-emerald-400 hover:border-emerald-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <HeartPulse className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>Telemetry Status</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Section with Divider */}
        <div className="mt-8 pt-6 border-t border-slate-900/90 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-500">
            <span>© {currentYear} IAMFixer</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400 font-medium">SRE Console</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
            <span>React</span>
            <span className="text-slate-700">•</span>
            <span>FastAPI</span>
            <span className="text-slate-700">•</span>
            <span className="text-purple-300 font-semibold">AWS Bedrock</span>
          </div>
        </div>
      </div>

      {/* Interactive Modals for About & Health */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090d16]/80 backdrop-blur-sm">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-[#0e1422] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <HeartPulse className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                  <h3 id="modal-title" className="text-base font-bold text-slate-100 font-mono">
                    {activeModal === 'about' ? 'About IAMFixer SRE Engine' : 'System Health & Diagnostics'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {activeModal === 'about' ? (
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>
                    <strong className="text-indigo-400 font-mono">IAMFixer</strong> is an enterprise-grade SRE Application Monitoring and Root Cause Analysis platform designed for AWS cloud and microservice environments.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                    <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 flex items-start space-x-2">
                      <Brain className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-purple-300">AWS Bedrock AI</div>
                        <div className="text-slate-400 text-[10px]">Claude / Titan reasoning with deterministic baseline fallback</div>
                      </div>
                    </div>
                    <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 flex items-start space-x-2">
                      <Database className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-indigo-300">SQLite Telemetry</div>
                        <div className="text-slate-400 text-[10px]">High-performance log & trace ingestion engine</div>
                      </div>
                    </div>
                    <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-300">Chaos Simulator</div>
                        <div className="text-slate-400 text-[10px]">Real-time fault injection & scenario validation</div>
                      </div>
                    </div>
                    <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 flex items-start space-x-2">
                      <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-emerald-300">Safety Guardrails</div>
                        <div className="text-slate-400 text-[10px]">Human-in-the-loop validation for automated remediation</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4 text-indigo-400" />
                        <span>Backend API Service</span>
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>OPERATIONAL</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-indigo-400" />
                        <span>Database Connectivity</span>
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>CONNECTED</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span>RCA Analysis Engine</span>
                      </span>
                      <span className="text-purple-400 font-bold flex items-center space-x-1">
                        <PulseIndicator color="purple" size="sm" />
                        <span>READY</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    All telemetry ingestion pipelines, health check polling loops, and automated root cause analysis engines are running within normal parameters.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.footer>
  );
};

export default Footer;

