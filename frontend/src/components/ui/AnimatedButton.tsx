import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const variantStyles = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-600/20 shadow-md font-bold',
  secondary: 'bg-[#0e1422] border border-slate-800 hover:border-indigo-500/60 text-slate-200 hover:text-white font-semibold',
  emerald: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md font-bold',
  danger: 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 font-semibold',
  ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0e1422] font-medium',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs rounded-md space-x-1.5',
  md: 'px-3.5 py-2 text-xs rounded-lg space-x-2',
  lg: 'px-5 py-2.5 text-sm rounded-lg space-x-2.5',
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={!disabled && !loading && !shouldReduceMotion ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`inline-flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </motion.button>
  );
};

