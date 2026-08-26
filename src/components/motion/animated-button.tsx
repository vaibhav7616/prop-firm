import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, glow = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
      return (
        <button ref={ref} className={className} {...props}>
          {children}
        </button>
      );
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        className={cn('relative transition-shadow duration-200', glow && 'hover:shadow-lg hover:shadow-brand-500/20', className)}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
