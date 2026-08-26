import type { Variants, Transition } from 'motion/react';

/* =========================================================================
   FUNDEDSHIFT GLOBAL MOTION & TIMING SYSTEM
   Engineered for financial precision, subtle depth, and premium performance.
   ========================================================================= */

// Professional Spring Configs
export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  mass: 0.8,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
  mass: 0.5,
};

export const springSubtle: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
};

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 18,
};

// Standard Easing curves
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutSmooth = [0.4, 0, 0.2, 1] as const;

// Standard Durations (ms)
export const DURATION = {
  micro: 0.18,
  hover: 0.22,
  card: 0.25,
  entry: 0.35,
  hero: 0.6,
  long: 0.8,
};

// =========================================================================
// REUSABLE VARIANTS
// =========================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.entry, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.micro, ease: 'easeIn' },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.entry, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.micro, ease: 'easeIn' },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.entry, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: DURATION.micro, ease: 'easeIn' },
  },
};

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.card, ease: easeOutExpo },
  },
};

export const cardHover: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.008,
    transition: { duration: DURATION.hover, ease: easeOutExpo },
  },
  tap: {
    scale: 0.985,
    transition: { duration: 0.1 },
  },
};

export const buttonMicro: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: DURATION.micro, ease: easeOutExpo },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

export const modalAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const dropdownAnimation: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};
