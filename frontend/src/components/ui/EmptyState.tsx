import React from 'react';
import { motion } from 'motion/react';
import { Server } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Server,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400">
        <Icon className="h-6 w-6 stroke-1.5" />
      </div>
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      {description && (
        <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <div className="pt-2">
          <AnimatedButton onClick={onAction} variant="secondary" size="sm">
            {actionText}
          </AnimatedButton>
        </div>
      )}
    </motion.div>
  );
};
