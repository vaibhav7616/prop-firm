import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number; // seconds
  distance?: number; // pixels up/down
  delay?: number;
  className?: string;
  rotateRange?: number; // slight rotation degrees
}

export function FloatingElement({
  children,
  duration = 5,
  distance = 8,
  delay = 0,
  className,
  rotateRange = 1,
}: FloatingElementProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
        rotate: [-rotateRange, rotateRange, -rotateRange],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}
