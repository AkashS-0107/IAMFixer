import React from 'react';
import { motion } from 'motion/react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
  borderVariant?: 'default' | 'cyan' | 'emerald' | 'rose' | 'purple' | 'amber' | 'indigo';
  onClick?: () => void;
}

const borderStyles = {
  default: 'border-slate-800 hover:border-slate-700',
  indigo: 'border-indigo-800/60 hover:border-indigo-500/80',
  cyan: 'border-cyan-800/60 hover:border-cyan-500/80',
  emerald: 'border-emerald-800/60 hover:border-emerald-500/80',
  rose: 'border-rose-800/60 hover:border-rose-500/80',
  purple: 'border-purple-800/60 hover:border-purple-500/80',
  amber: 'border-amber-800/60 hover:border-amber-500/80',
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  hoverGlow = false,
  borderVariant = 'default',
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverGlow ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`bg-[#0e1422]/80 backdrop-blur-md border rounded-xl shadow-xl transition-colors ${
        borderStyles[borderVariant]
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

