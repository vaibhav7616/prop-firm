import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Max degrees (recommended: 3 to 6)
  glowColor?: string; // e.g. 'rgba(14, 165, 233, 0.15)'
  enableGlow?: boolean;
  enableElevation?: boolean;
  perspective?: number;
}

export function TiltCard({
  children,
  className,
  maxTilt = 4.5,
  glowColor = 'rgba(56, 189, 248, 0.12)',
  enableGlow = true,
  enableElevation = true,
  perspective = 1000,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Normalized mouse coordinates: -0.5 to 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Mouse position in pixels for radial specular glow
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  // Smooth springs for rotation with professional damping
  const springConfig = { damping: 22, stiffness: 280, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  // Unconditionally declare radial glow transform at top level
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(400px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      mouseX.set(px / width - 0.5);
      mouseY.set(py / height - 0.5);

      glowX.set(px);
      glowY.set(py);
    },
    [mouseX, mouseY, glowX, glowY]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className="relative"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={enableElevation ? { y: -5, transition: { duration: 0.2 } } : undefined}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'relative rounded-2xl transition-shadow duration-300',
          isHovered ? 'shadow-xl shadow-brand-500/5 dark:shadow-cyan-950/20' : '',
          className
        )}
        {...(props as any)}
      >
        {/* Ambient Specular Glow on Hover */}
        {enableGlow && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 z-30"
            style={{
              background: glowBackground,
            }}
          />
        )}

        {/* Content with 3D transform style */}
        <div style={{ transformStyle: 'preserve-3d' }} className="h-full w-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** Helper component to position elements in 3D space inside a TiltCard */
export function TiltDepthLayer({
  z = 20,
  children,
  className,
}: {
  z?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{
        transform: `translateZ(${z}px)`,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
