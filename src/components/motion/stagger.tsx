import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  children: React.ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  className?: string;
  viewportOnce?: boolean;
}

export function StaggerContainer({
  children,
  staggerChildren = 0.07,
  delayChildren = 0.05,
  className,
  viewportOnce = true,
  ...props
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, amount: 0.1 }}
      variants={staggerContainer(staggerChildren, delayChildren)}
      className={className}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div variants={staggerItem} className={className} {...(props as any)}>
      {children}
    </motion.div>
  );
}
