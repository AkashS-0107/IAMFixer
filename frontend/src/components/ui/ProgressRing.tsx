import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { formatConfidence } from '../../utils/formatters';

interface ProgressRingProps {
  confidence: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  confidence,
  size = 56,
  strokeWidth = 5,
  label = 'Confidence',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  let clampedValue = 0;
  if (confidence != null && typeof confidence === 'number' && !isNaN(confidence)) {
    let raw = confidence <= 1 && confidence >= 0 ? confidence * 100 : confidence;
    clampedValue = Math.max(0, Math.min(100, Math.round(raw)));
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 85) return { stroke: '#06b6d4', text: 'text-cyan-400', bg: 'bg-cyan-950/80 border-cyan-800' };
    if (val >= 70) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-800' };
    if (val >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-800' };
    return { stroke: '#f43f5e', text: 'text-rose-400', bg: 'bg-rose-950/80 border-rose-800' };
  };

  const theme = getColor(clampedValue);

  return (
    <div className={`flex items-center space-x-3 px-3.5 py-1.5 rounded-xl border ${theme.bg} backdrop-blur-md ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={shouldReduceMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className={`absolute text-xs font-mono font-extrabold ${theme.text}`}>
          {clampedValue}%
        </span>
      </div>

      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{label}</div>
        <div className={`text-sm font-extrabold font-mono ${theme.text}`}>
          {formatConfidence(confidence)}
        </div>
      </div>
    </div>
  );
};
