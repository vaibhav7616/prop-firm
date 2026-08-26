import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  colorCoded?: boolean; // If true, automatically paints positive green and negative red
  formatLocale?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 2,
  className,
  colorCoded = false,
  formatLocale = true,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const startValRef = useRef<number>(value);
  const targetValRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Only animate if value changed significantly (> 0.001)
    if (Math.abs(value - targetValRef.current) < 0.001) {
      return;
    }

    startValRef.current = displayValue;
    targetValRef.current = value;
    startTimeRef.current = null;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const nextVal =
        startValRef.current + (targetValRef.current - startValRef.current) * easedProgress;

      setDisplayValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValRef.current);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formattedNumber = formatLocale
    ? displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  let textColor = '';
  if (colorCoded) {
    if (value > 0) textColor = 'text-emerald-500 dark:text-emerald-400';
    else if (value < 0) textColor = 'text-rose-500 dark:text-rose-400';
    else textColor = 'text-muted-foreground';
  }

  return (
    <span className={cn('tabular-nums font-mono', textColor, className)}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
