import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { TrendingUp, ShieldCheck, Zap, Award, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { FloatingElement } from '@/components/motion/floating-element';
import { cn } from '@/lib/utils';

export function Hero3DPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse parallax motion values (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for buttery smooth depth
  const springConfig = { damping: 25, stiffness: 220, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax layers at different depths
  // Background layer: very small movement (3-5px)
  const bgX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const bgY = useTransform(smoothY, [-0.5, 0.5], [-6, 6]);

  // Chart layer: medium movement (10-15px)
  const chartX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const chartY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);

  // Main Card layer: 3D rotation & translation (max 5 deg, 18px movement)
  const cardRotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
  const cardRotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);
  const cardX = useTransform(smoothX, [-0.5, 0.5], [-18, 18]);
  const cardY = useTransform(smoothY, [-0.5, 0.5], [-18, 18]);

  // Floating badges layer: highest movement (22-26px)
  const badge1X = useTransform(smoothX, [-0.5, 0.5], [22, -22]);
  const badge1Y = useTransform(smoothY, [-0.5, 0.5], [22, -22]);
  const badge2X = useTransform(smoothX, [-0.5, 0.5], [-24, 24]);
  const badge2Y = useTransform(smoothY, [-0.5, 0.5], [-24, 24]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const chartBars = [28, 42, 35, 55, 48, 68, 62, 85, 76, 92, 84, 98, 104];
  const maxBar = Math.max(...chartBars);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
      className="relative w-full max-w-xl mx-auto py-6 select-none"
    >
      {/* Background Decorative Ambient Radial Glow */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-brand-400/15 blur-3xl -z-20 pointer-events-none"
      />
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl -z-20 pointer-events-none"
      />

      {/* Floating Backing Card Silhouette */}
      <motion.div
        style={{ x: chartX, y: chartY }}
        className="absolute -top-3 -right-3 w-full h-full rounded-3xl border border-slate-200/80 bg-white/40 dark:bg-slate-900/40 -z-10 shadow-sm hidden sm:block"
      />

      {/* Main 3D Floating $100K Account Card */}
      <motion.div
        style={{
          x: cardX,
          y: cardY,
          rotateX: cardRotateX,
          rotateY: cardRotateY,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-brand-500/10 overflow-hidden"
      >
        {/* Top Header Bar */}
        <div
          style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
          className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  Funded Shift · Terminal
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Phase 2
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">Account #8814662</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>+4.25%</span>
          </div>
        </div>

        {/* Card Body with 3D Depth Layers */}
        <div className="p-5 sm:p-6 space-y-5" style={{ transformStyle: 'preserve-3d' }}>
          {/* Key Financial Stats (Depth: 25px) */}
          <div
            style={{ transform: 'translateZ(25px)', transformStyle: 'preserve-3d' }}
            className="grid grid-cols-3 gap-2.5 sm:gap-3"
          >
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-muted-foreground">Funded Balance</p>
              <p className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1">
                <AnimatedNumber value={104250} prefix="$" decimals={2} />
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Start: $100K</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-muted-foreground">Today's Profit</p>
              <p className="font-display font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 mt-1">
                +<AnimatedNumber value={2890.5} prefix="$" decimals={2} />
              </p>
              <p className="text-[10px] text-emerald-600/80 font-mono mt-0.5">+2.89% Today</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-muted-foreground">Profit Split</p>
              <p className="font-display font-bold text-sm sm:text-base text-brand-600 dark:text-brand-400 mt-1">
                90% Share
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Bi-weekly Payout</p>
            </div>
          </div>

          {/* Performance Chart Simulation (Depth: 15px) */}
          <div
            style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}
            className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Activity className="h-3.5 w-3.5 text-brand-500" />
                <span>Growth Curve (Evaluation Passed)</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground font-bold">$104,250.00</span>
            </div>

            <div className="flex items-end gap-1.5 h-20 pt-2">
              {chartBars.map((val, idx) => {
                const heightPct = (val / maxBar) * 100;
                return (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.03, ease: 'easeOut' }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-brand-500/20 via-brand-500/60 to-brand-500 hover:brightness-125 transition-all"
                  />
                );
              })}
            </div>
          </div>

          {/* Progress Targets (Depth: 20px) */}
          <div
            style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
            className="space-y-2 text-xs"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Profit Target Progress</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">$4,250 / $8,000 (53%)</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '53%' }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Badge 1: Verified Payout $8,420 (High depth movement) */}
      <FloatingElement
        duration={5.2}
        distance={10}
        delay={0.2}
        className="absolute -bottom-4 -left-4 sm:-left-8 z-30 pointer-events-none"
      >
        <motion.div
          style={{ x: badge1X, y: badge1Y }}
          className="flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-md"
        >
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Last Payout Sent
            </p>
            <p className="text-xs sm:text-sm font-display font-bold text-slate-900 dark:text-white">
              $8,420.00 <span className="text-emerald-500 text-[11px] font-normal">via Crypto</span>
            </p>
          </div>
        </motion.div>
      </FloatingElement>

      {/* Floating 3D Badge 2: Institutional ECN Speed */}
      <FloatingElement
        duration={4.8}
        distance={8}
        delay={0.5}
        className="absolute -top-4 -right-4 sm:-right-6 z-30 pointer-events-none"
      >
        <motion.div
          style={{ x: badge2X, y: badge2Y }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-md"
        >
          <div className="h-7 w-7 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-900 dark:text-white">Sub-10ms Matcher</p>
            <p className="text-[9px] text-muted-foreground font-mono">Zero Slippage</p>
          </div>
        </motion.div>
      </FloatingElement>
    </div>
  );
}
