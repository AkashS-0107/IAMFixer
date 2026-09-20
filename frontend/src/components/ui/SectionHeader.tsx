import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80 ${className}`}>
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2.5">
          {Icon && <Icon className="h-6 w-6 text-indigo-400 shrink-0" />}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex items-center space-x-2">{action}</div>}
    </div>
  );
};

