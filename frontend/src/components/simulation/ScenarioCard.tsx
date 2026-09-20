import React from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  Database,
  GitCommit,
  Globe,
  Play,
  Zap,
} from 'lucide-react';
import { SimulationScenario } from '../../types/api';
import { AnimatedCard } from '../ui/AnimatedCard';
import { AnimatedButton } from '../ui/AnimatedButton';
import { SeverityBadge } from '../ui/SeverityBadge';

export interface ScenarioDefinition {
  id: SimulationScenario;
  title: string;
  affectedService: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  telemetryHighlights: string[];
  icon: React.ElementType;
}

export const SCENARIOS_LIST: ScenarioDefinition[] = [
  {
    id: 'BAD_DEPLOYMENT',
    title: 'Bad Application Deployment',
    affectedService: 'payment-service',
    severity: 'HIGH',
    description:
      'Deploy faulty release v1.8.3 causing unhandled NullPointerExceptions during payment processing and spiking 500 error rates to 14.7%.',
    telemetryHighlights: ['CI/CD Deployment v1.8.3', 'NullPointerException log', 'Error rate spike > 14.7%'],
    icon: GitCommit,
  },
  {
    id: 'DATABASE_CONNECTION_EXHAUSTION',
    title: 'Database Connection Pool Exhaustion',
    affectedService: 'order-service',
    severity: 'CRITICAL',
    description:
      'Simulate connection leak on order-db saturating active connection limit (98/100) and failing order creation requests with HTTP 503.',
    telemetryHighlights: ['Pool utilization 98%', 'ConnectionTimeoutException', 'HTTP 503 service unavailable'],
    icon: Database,
  },
  {
    id: 'MEMORY_LEAK',
    title: 'JVM Heap Memory Leak & Stop-the-World GC',
    affectedService: 'analytics-processor',
    severity: 'HIGH',
    description:
      'Unbounded cache leak causing JVM heap saturation (94.5%), 4820ms Stop-The-World GC pauses, and OutOfMemoryErrors.',
    telemetryHighlights: ['Heap 94.5% saturation', '4820ms GC pause', 'java.lang.OutOfMemoryError'],
    icon: Cpu,
  },
  {
    id: 'DEPENDENCY_FAILURE',
    title: 'External Auth Provider Outage',
    affectedService: 'checkout-service',
    severity: 'HIGH',
    description:
      'External auth service (auth.external-api.com) returns 504 Gateway Timeouts, causing retry storm and 42.1% checkout flow failures.',
    telemetryHighlights: ['Outbound 10,000ms latency', 'Retry 3/3 exhausted', 'Checkout failure rate 42.1%'],
    icon: Globe,
  },
  {
    id: 'TRAFFIC_SPIKE',
    title: '5x Unanticipated Traffic Surge',
    affectedService: 'user-feed-service',
    severity: 'MEDIUM',
    description:
      'Sudden 5.1x traffic spike from 1200 to 6200 req/sec resulting in 96.8% host CPU utilization and worker queue saturation.',
    telemetryHighlights: ['5.1x request rate jump', 'CPU saturation 96.8%', 'p95 latency degraded to 1420ms'],
    icon: Zap,
  },
];

interface ScenarioCardProps {
  scenario: ScenarioDefinition;
  loading: boolean;
  onRunScenario: (scenarioId: SimulationScenario) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  loading,
  onRunScenario,
}) => {
  const Icon = scenario.icon;

  return (
    <AnimatedCard className="flex flex-col justify-between group hover:border-indigo-500/50">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-10 w-10 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors shadow-inner"
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 bg-[#090d16] px-1.5 py-0.5 rounded border border-slate-800">
                {scenario.affectedService}
              </span>
              <h3 className="text-base font-extrabold text-slate-100 mt-0.5 group-hover:text-indigo-300 transition-colors">
                {scenario.title}
              </h3>
            </div>
          </div>

          <SeverityBadge severity={scenario.severity} />
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
          {scenario.description}
        </p>

        {/* Telemetry Highlights */}
        <div className="space-y-1.5 mb-5 bg-[#090d16]/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 block">
            Generated Telemetry Sequence:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {scenario.telemetryHighlights.map((highlight, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono text-slate-300 bg-[#0e1422] px-2 py-0.5 rounded border border-slate-800"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <AnimatedButton
        onClick={() => onRunScenario(scenario.id)}
        loading={loading}
        variant="primary"
        size="md"
        className="w-full"
        icon={<Play className="h-4 w-4 fill-white" />}
      >
        {loading ? 'Simulating Failure Scenario...' : 'Simulate Incident'}
      </AnimatedButton>
    </AnimatedCard>
  );
};

