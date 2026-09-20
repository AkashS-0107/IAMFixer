import React from 'react';
import { motion } from 'motion/react';
import { IncidentStatus } from '../../types/api';
import { getStatusStyle } from '../../utils/formatters';
import { PulseIndicator } from './PulseIndicator';

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', pulse = true }) => {
  const style = getStatusStyle(status);
  const isInvestigating = status === 'INVESTIGATING';

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${style.badge} ${className}`}
    >
      {isInvestigating && pulse && <PulseIndicator color="purple" size="sm" />}
      {status === 'OPEN' && pulse && <PulseIndicator color="rose" size="sm" />}
      {status === 'RESOLVED' && <PulseIndicator color="emerald" size="sm" pulse={false} />}
      <span>{status}</span>
    </motion.span>
  );
};
