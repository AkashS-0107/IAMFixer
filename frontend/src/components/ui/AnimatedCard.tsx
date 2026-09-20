import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'motion/react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  glowOnHover = true,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
      whileHover={
        glowOnHover && !shouldReduceMotion
          ? {
              y: -2,
              boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.20)',
              transition: { type: 'spring', stiffness: 400, damping: 25 },
            }
          : undefined
      }
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className={`bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

