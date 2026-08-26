import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, fadeIn, scaleIn } from '@/lib/motion';

interface RevealOnScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  children: React.ReactNode;
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn';
  delay?: number;
  className?: string;
  amount?: number | 'some' | 'all';
  once?: boolean;
}

export function RevealOnScroll({
  children,
  variant = 'fadeUp',
  delay = 0,
  className,
  amount = 0.2,
  once = true,
}: RevealOnScrollProps) {
  const shouldReduceMotion = useReducedMotion();

  const variantMap = {
    fadeUp,
    fadeIn,
    scaleIn,
  };

  const selectedVariant = variantMap[variant] || fadeUp;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={selectedVariant}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
