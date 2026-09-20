import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck2,
  FlaskConical,
  Flame,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Server,
  ServerOff,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { HealthStatus } from '../types/api';
import {
  AnimatedButton,
  GlassPanel,
  PulseIndicator,
  SectionHeader,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '../components/ui';

interface LandingProps {
  onNavigate: (path: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const shouldReduceMotion = useReducedMotion();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'incident' | 'telemetry' | 'rca' | 'safety'>('incident');

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
      setHealthError(false);
    } catch {
      setHealthError(true);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAiProviderLabel = (provider?: string) => {
    if (!provider || provider === 'auto') return 'AWS Bedrock / Baseline Auto';
    if (provider === 'bedrock') return 'AWS Bedrock';
    if (provider === 'baseline') return 'Baseline RCA';
    if (provider === 'bedrock_fallback_baseline') return 'AWS Bedrock → Baseline Fallback';
    return provider.toUpperCase();
  };

  const getDbStatusLabel = (dbStatus?: string) => {
    if (!dbStatus || dbStatus === 'connected') return 'SQLite Connected';
    return 'Offline';
  };

  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION */}
      <ScrollReveal as="section" aria-labelledby="hero-heading" className="relative pt-4 lg:pt-8 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-600/10 blur-[120px] pointer-events-none -z-10 rounded-full"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Main Headline & Wordmark */}
          <div className="space-y-3">
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight font-sans"
            >
              IAMFixer
              <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-300 mt-2">
                Turn Production Incidents Into Actionable Intelligence.
              </span>
            </h1>
          </div>

          {/* SRE Product Copy */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
            Correlate application telemetry, logs, metrics, and deployment evidence using AWS Bedrock AI and deterministic baseline engines. Pinpoint root causes with exact evidence traceability and risk-managed recommendations.
          </p>

          {/* Hero Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <AnimatedButton
              onClick={() => onNavigate('/dashboard')}
              variant="primary"
              size="lg"
              className="shadow-indigo-500/20 shadow-xl"
              icon={<LayoutDashboard className="h-5 w-5" />}
            >
              Open Operations Console
            </AnimatedButton>

            <AnimatedButton
              onClick={() => onNavigate('/simulation')}
              variant="secondary"
              size="lg"
              icon={<FlaskConical className="h-5 w-5 text-purple-400" />}
            >
              Run Simulation
            </AnimatedButton>
          </div>
        </div>
      </ScrollReveal>

      {/* SYSTEM HEALTH RIBBON */}
      <ScrollReveal
        as="section"
        aria-label="Infrastructure & AI Telemetry Status"
        delay={0.1}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-[#0e1422]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold uppercase tracking-wider">
              <Activity className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              <span>Infrastructure & AI Telemetry Status</span>
            </div>

            <button
              onClick={checkHealth}
              className="text-slate-400 hover:text-indigo-300 transition-colors flex items-center space-x-1 text-[11px] focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-2 py-0.5"
              aria-label="Refresh system health"
            >
              <RefreshCw className={`h-3 w-3 ${healthLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{healthLoading ? 'Polling...' : 'Refresh Status'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
            {/* Backend API Service */}
            <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Server className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Backend Service</div>
                  <div className="text-slate-200 font-bold">FastAPI REST</div>
                </div>
              </div>
              <div>
                {healthError ? (
                  <span className="text-rose-400 font-bold text-[11px] flex items-center space-x-1 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                    <ServerOff className="h-3 w-3" />
                    <span>OFFLINE</span>
                  </span>
                ) : health ? (
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center space-x-1.5 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    <PulseIndicator color="emerald" size="sm" />
                    <span>OPERATIONAL</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Connecting...</span>
                )}
              </div>
            </div>

            {/* Database Connection */}
            <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Database</div>
                  <div className="text-slate-200 font-bold">SQLite Telemetry</div>
                </div>
              </div>
              <div>
                {healthError ? (
                  <span className="text-rose-400 text-[11px] font-bold">DISCONNECTED</span>
                ) : (
                  <span className="text-indigo-300 font-bold text-[11px] flex items-center space-x-1.5 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                    <PulseIndicator color="cyan" size="sm" />
                    <span>{getDbStatusLabel(health?.database_status)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* AI Provider */}
            <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Brain className="h-4 w-4 text-purple-400 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">RCA Engine</div>
                  <div className="text-slate-200 font-bold">AI Diagnosis</div>
                </div>
              </div>
              <div>
                <span className="text-purple-300 font-bold text-[11px] flex items-center space-x-1.5 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                  <PulseIndicator color="purple" size="sm" />
                  <span>{getAiProviderLabel(health?.ai_provider)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* SRE WORKFLOW PRODUCT PREVIEW */}
      <ScrollReveal as="section" aria-labelledby="preview-heading" className="space-y-4">
        <SectionHeader
          title="Incident Intelligence"
          subtitle="Explore the end-to-end incident lifecycle: Telemetry Ingestion → AI RCA → Evidence Traceability → Safety Governance."
          icon={Terminal}
        />

        <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
          {/* Interactive Flow Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3" role="tablist">
            {[
              { id: 'incident', label: '1. Active Incident', icon: Flame },
              { id: 'telemetry', label: '2. Telemetry Stream', icon: Zap },
              { id: 'rca', label: '3. AWS Bedrock RCA', icon: Cpu },
              { id: 'safety', label: '4. Safety & Governance', icon: ShieldCheck },
            ].map((tab) => {
              const isActive = activePreviewTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`preview-panel-${tab.id}`}
                  onClick={() => setActivePreviewTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    isActive
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-md'
                      : 'bg-[#090d16] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Preview Panel Content */}
          <div className="min-h-[220px]">
            {activePreviewTab === 'incident' && (
              <motion.div
                key="preview-incident"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#090d16] rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase">
                        CRITICAL SEVERITY
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                        INVESTIGATING
                      </span>
                      <span className="text-xs font-mono text-slate-400">service: payment-api</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 font-sans">
                      Payment API Degradation & High Error Rate Spike
                    </h4>
                  </div>
                  <AnimatedButton
                    onClick={() => onNavigate('/dashboard')}
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    View in Live Dashboard
                  </AnimatedButton>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#090d16]/70 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">AFFECTED SYSTEM</span>
                    <span className="text-slate-200 font-bold mt-0.5 block">payment-api microservice</span>
                  </div>
                  <div className="p-3 bg-[#090d16]/70 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">DETECTION TIME</span>
                    <span className="text-slate-200 font-bold mt-0.5 block">2 minutes ago</span>
                  </div>
                  <div className="p-3 bg-[#090d16]/70 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TELEMETRY COUNT</span>
                    <span className="text-indigo-300 font-bold mt-0.5 block">14 correlated logs/metrics</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activePreviewTab === 'telemetry' && (
              <motion.div
                key="preview-telemetry"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 font-mono text-xs"
              >
                <div className="p-3 rounded-xl bg-[#090d16] border border-rose-900/50 flex items-start space-x-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded">
                    ERROR
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>source: app.log</span>
                      <span>14:22:01 UTC</span>
                    </div>
                    <p className="text-rose-200">
                      DB connection pool exhausted. 500 Internal Server Error returned for POST /v1/charge
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#090d16] border border-amber-900/50 flex items-start space-x-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded">
                    WARN
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>source: db.metric</span>
                      <span>14:21:45 UTC</span>
                    </div>
                    <p className="text-amber-200">
                      Active connections (100/100) exceeded threshold. Queue length: 42 waiting requests
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 flex items-start space-x-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                    DEPLOY
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>source: github.action</span>
                      <span>14:18:30 UTC</span>
                    </div>
                    <p className="text-slate-300">
                      Deployment v2.4.1 completed. Modified DB pool size configuration from 50 to 10.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activePreviewTab === 'rca' && (
              <motion.div
                key="preview-rca"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="p-4 bg-[#090d16] border-2 border-indigo-500/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        AWS BEDROCK AI
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Category: DATABASE_EXHAUSTION
                      </span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                      92% RCA Confidence
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white font-sans">
                    Database Connection Pool Size Misconfiguration
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Deployment v2.4.1 reduced max database pool connections to 10 under peak traffic of 400 req/min, leading to thread starvation and cascading 500 errors.
                  </p>
                </div>

                <div className="p-3 bg-[#090d16]/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <FileCheck2 className="h-4 w-4 text-indigo-400" />
                    <span>Evidence Linked: 3 telemetry events verified</span>
                  </span>
                  <span className="text-indigo-300 font-semibold">Traceable to exact log timestamps</span>
                </div>
              </motion.div>
            )}

            {activePreviewTab === 'safety' && (
              <motion.div
                key="preview-safety"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="p-4 bg-[#090d16] border-2 border-emerald-800/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
                        Recommended Strategy
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      RISK LEVEL: MEDIUM
                    </span>
                  </div>

                  <div className="font-mono text-xs text-slate-200 font-bold bg-[#0e1422] p-2.5 rounded border border-slate-800">
                    Rollback deployment v2.4.1 to v2.4.0 or expand DB_MAX_CONNECTIONS to 50 via environment config.
                  </div>

                  {/* MANDATORY GOVERNANCE BANNERS */}
                  <div className="p-3 rounded-lg bg-[#0e1422] border border-emerald-900/60 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 font-semibold">
                      <Lock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Recommendation only. Human approval required.</span>
                    </span>
                    <span className="text-purple-300 text-[10px] font-semibold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                      No Automated Infrastructure Modifications Triggered
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* ARCHITECTURE & CAPABILITIES PILLARS */}
      <ScrollReveal as="section" aria-labelledby="capabilities-heading" className="space-y-6">
        <SectionHeader
          title="How IAMFixer Works"
          subtitle="IAMFixer integrates five core engineering pillars to eliminate investigation guesswork without sacrificing system safety."
          icon={Cpu}
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {/* Pillar 1 */}
          <StaggerItem>
            <GlassPanel className="p-5 space-y-3 h-full" borderVariant="indigo">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">1. Telemetry Ingestion</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Automatically ingests application error logs, latency metrics, database connection pool locks, and CI/CD deployment markers in real-time.
              </p>
            </GlassPanel>
          </StaggerItem>

          {/* Pillar 2 */}
          <StaggerItem>
            <GlassPanel className="p-5 space-y-3 h-full" borderVariant="indigo">
              <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-400">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">2. Hybrid AI & Baseline RCA</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Utilizes AWS Bedrock Claude models backed by deterministic fallback algorithms to analyze failure patterns and output confidence scores.
              </p>
            </GlassPanel>
          </StaggerItem>

          {/* Pillar 3 */}
          <StaggerItem>
            <GlassPanel className="p-5 space-y-3 h-full" borderVariant="indigo">
              <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">3. Evidence Traceability</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Every AI assertion links directly back to specific raw log lines and telemetry timestamps. No hallucinated causes without supporting evidence.
              </p>
            </GlassPanel>
          </StaggerItem>

          {/* Pillar 4 */}
          <StaggerItem>
            <GlassPanel className="p-5 space-y-3 h-full" borderVariant="indigo">
              <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-400">
                <FlaskConical className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">4. Chaos Simulation Lab</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Safely inject 5 failure scenarios (Bad Deployments, DB Connection Exhaustion, Memory Leaks, Dependency Outages, Traffic Spikes) to test RCA accuracy.
              </p>
            </GlassPanel>
          </StaggerItem>

          {/* Pillar 5 */}
          <StaggerItem className="md:col-span-2 lg:col-span-2">
            <GlassPanel className="p-5 space-y-3 h-full" borderVariant="emerald">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">5. Human-in-the-Loop Governance</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                IAMFixer generates clear remediation strategies and risk levels, requiring explicit SRE approval before any action. No unvetted infrastructure changes are ever executed autonomously.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Strict Governance Protocol: Recommendation only. Human approval required.</span>
              </div>
            </GlassPanel>
          </StaggerItem>
        </StaggerContainer>
      </ScrollReveal>

      {/* BOTTOM CALL TO ACTION PASSAGE */}
      <ScrollReveal
        as="section"
        className="bg-gradient-to-r from-[#0e1422] via-[#151c2e] to-[#0e1422] border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
          Ready to Investigate Production Incidents?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-sans">
          Access real-time telemetry streams, inspect active incidents, or trigger failure simulations in the Operations Console.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <AnimatedButton
            onClick={() => onNavigate('/dashboard')}
            variant="primary"
            size="lg"
            icon={<LayoutDashboard className="h-5 w-5" />}
          >
            Launch Operations Console
          </AnimatedButton>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default Landing;
