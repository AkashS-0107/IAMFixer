import React from 'react';
import { motion } from 'motion/react';
import { Severity } from '../../types/api';
import { getSeverityStyle } from '../../utils/formatters';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className = '',
  showDot = true,
}) => {
  const style = getSeverityStyle(severity);

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${style.badge} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      <span>{severity}</span>
    </motion.span>
  );
};
