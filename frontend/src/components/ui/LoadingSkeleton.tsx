import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`bg-slate-800/80 rounded ${className}`}
    />
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-slate-800/60">
      <td className="py-3.5 px-4"><Skeleton className="h-5 w-16" /></td>
      <td className="py-3.5 px-4"><Skeleton className="h-5 w-20" /></td>
      <td className="py-3.5 px-4">
        <Skeleton className="h-4 w-64 mb-1.5" />
        <Skeleton className="h-3 w-32" />
      </td>
      <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
      <td className="py-3.5 px-4 text-right"><Skeleton className="h-7 w-16 ml-auto" /></td>
    </tr>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-2">
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
};
