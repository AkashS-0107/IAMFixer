import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, AlertOctagon, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { Incident } from '../../types/api';
import { MetricCard } from '../ui/MetricCard';

interface IncidentStatsProps {
  incidents: Incident[];
  activeFilter?: string;
  onFilterClick?: (filterType: string, value: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

export const IncidentStats: React.FC<IncidentStatsProps> = ({ incidents }) => {
  const totalCount = incidents.length;
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL');
  const investigatingIncidents = incidents.filter((i) => i.status === 'INVESTIGATING');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED');

  const stats = [
    {
      label: 'Active Incidents',
      value: activeIncidents.length,
      icon: ShieldAlert,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/30',
      borderColor: 'border-amber-800/40',
      desc: 'OPEN or INVESTIGATING',
    },
    {
      label: 'Total Incidents',
      value: totalCount,
      icon: AlertCircle,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/30',
      borderColor: 'border-cyan-800/40',
      desc: 'All recorded system events',
    },
    {
      label: 'Critical Severity',
      value: criticalIncidents.length,
      icon: AlertOctagon,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/30',
      borderColor: 'border-rose-800/40',
      desc: 'High impact failures',
    },
    {
      label: 'Under Investigation',
      value: investigatingIncidents.length,
      icon: Search,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/30',
      borderColor: 'border-purple-800/40',
      desc: 'RCA engine running',
    },
    {
      label: 'Resolved',
      value: resolvedIncidents.length,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-800/40',
      desc: 'Mitigated failures',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"
    >
      {stats.map((stat, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <MetricCard
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            borderColor={stat.borderColor}
            desc={stat.desc}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
