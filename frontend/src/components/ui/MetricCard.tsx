import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor?: string;
  borderColor?: string;
  desc: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  desc,
  onClick,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`p-4 rounded-xl border border-slate-800/90 bg-[#0e1422] hover:border-slate-700/80 backdrop-blur-md transition-all shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <motion.div whileHover={shouldReduceMotion ? undefined : { rotate: 10 }} transition={{ duration: 0.2 }}>
          <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
        </motion.div>
      </div>

      <div className="flex items-baseline justify-between">
        <motion.span
          key={value}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          className="text-2xl font-extrabold font-mono tracking-tight text-white"
        >
          {value}
        </motion.span>
      </div>
      <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">{desc}</p>
    </motion.div>
  );
};

