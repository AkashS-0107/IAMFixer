import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface PulseIndicatorProps {
  color?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

const colorMap = {
  emerald: { dot: 'bg-emerald-400', ring: 'bg-emerald-400/40' },
  cyan: { dot: 'bg-cyan-400', ring: 'bg-cyan-400/40' },
  purple: { dot: 'bg-purple-400', ring: 'bg-purple-400/40' },
  amber: { dot: 'bg-amber-400', ring: 'bg-amber-400/40' },
  rose: { dot: 'bg-rose-400', ring: 'bg-rose-400/40' },
  slate: { dot: 'bg-slate-400', ring: 'bg-slate-400/40' },
};

const sizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  color = 'cyan',
  size = 'md',
  className = '',
  pulse = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const c = colorMap[color] || colorMap.cyan;
  const s = sizeMap[size] || sizeMap.md;
  const shouldPulse = pulse && !shouldReduceMotion;

  return (
    <span className={`relative flex items-center justify-center ${s} ${className}`}>
      {shouldPulse && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 rounded-full ${c.ring}`}
        />
      )}
      <span className={`relative rounded-full ${s} ${c.dot}`} />
    </span>
  );
};
