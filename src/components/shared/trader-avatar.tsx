import React from 'react';
import { cn } from '@/lib/utils';

interface TraderAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  flag?: string;
  showFlag?: boolean;
}

const GRADIENT_PALETTES = [
  'from-blue-600 to-indigo-700 text-white border-blue-400/40',
  'from-emerald-600 to-teal-700 text-white border-emerald-400/40',
  'from-amber-600 to-orange-700 text-white border-amber-400/40',
  'from-purple-600 to-violet-700 text-white border-purple-400/40',
  'from-cyan-600 to-blue-700 text-white border-cyan-400/40',
  'from-rose-600 to-pink-700 text-white border-rose-400/40',
  'from-slate-700 to-slate-900 text-white border-slate-500/40',
  'from-indigo-600 to-sky-700 text-white border-indigo-400/40',
  'from-teal-600 to-emerald-700 text-white border-teal-400/40',
  'from-violet-600 to-purple-800 text-white border-violet-400/40',
];

function getInitials(name: string): string {
  if (!name) return 'TR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradientIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % GRADIENT_PALETTES.length;
}

export function TraderAvatar({
  name,
  size = 'md',
  className,
  flag,
  showFlag = false,
}: TraderAvatarProps) {
  const initials = getInitials(name);
  const paletteIndex = getGradientIndex(name);
  const palette = GRADIENT_PALETTES[paletteIndex];

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  };

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <div
        className={cn(
          'rounded-full bg-gradient-to-br flex items-center justify-center font-bold tracking-wider select-none shadow-sm border',
          sizeClasses[size],
          palette,
          className
        )}
      >
        <span>{initials}</span>
      </div>
      {showFlag && flag && (
        <span
          className="absolute -bottom-1 -right-1 text-xs select-none leading-none bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-xs border border-slate-200 dark:border-slate-800"
          title={name}
        >
          {flag}
        </span>
      )}
    </div>
  );
}
