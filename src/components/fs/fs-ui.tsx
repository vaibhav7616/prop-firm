import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* Light presentational kit for the Funded Shift authenticated OS.
   All styling uses the .fs-shell scoped tokens / tailwind absolutes, so it is
   fully isolated from the public (pre-login) frontend. */

export type Accent = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';

const accentDot: Record<Accent, string> = {
  indigo: 'bg-indigo-400',
  emerald: 'bg-emerald-400',
  rose: 'bg-rose-400',
  amber: 'bg-amber-400',
  slate: 'bg-slate-400',
};
const accentText: Record<Accent, string> = {
  indigo: 'text-indigo-300',
  emerald: 'text-emerald-300',
  rose: 'text-rose-300',
  amber: 'text-amber-300',
  slate: 'text-slate-300',
};

export function FsPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('fs-panel', className)}>{children}</div>;
}

export function FsPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="fs-label mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FsStat({
  label,
  value,
  hint,
  accent = 'slate',
  mono = true,
  sub,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: Accent;
  mono?: boolean;
  sub?: ReactNode;
}) {
  return (
    <FsPanel className="p-4">
      <div className="flex items-center justify-between">
        <p className="fs-label">{label}</p>
        <span className={cn('h-1.5 w-1.5 rounded-full', accentDot[accent])} />
      </div>
      <p
        className={cn(
          'mt-2 text-xl font-semibold tracking-tight text-slate-50',
          mono && 'fs-num',
          hint === 'up' && 'text-emerald-400',
          hint === 'down' && 'text-rose-400'
        )}
      >
        {value}
      </p>
      {sub && <div className="mt-1.5 text-xs text-slate-400">{sub}</div>}
    </FsPanel>
  );
}

export function FsProgress({
  value,
  className,
  tone = 'indigo',
  trackClass,
}: {
  value: number; // 0..1
  className?: string;
  tone?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
  trackClass?: string;
}) {
  const fill: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400',
  };
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-800', trackClass, className)}>
      <div
        className={cn('fs-grow-x h-full rounded-full', fill[tone])}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

export function RingMeter({
  value,
  size = 116,
  stroke = 9,
  tone = 'indigo',
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: Accent;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const col: Record<Accent, string> = {
    indigo: '#818cf8',
    emerald: '#34d399',
    rose: '#fb7185',
    amber: '#fbbf24',
    slate: '#94a3b8',
  };
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="fs-ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function StatusPill({ tone = 'slate', children }: { tone?: Accent; children: ReactNode }) {
  const dot = accentDot[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-200">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {children}
    </span>
  );
}

export function FsEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <FsPanel className="flex flex-col items-center justify-center border-dashed px-6 py-14 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">{icon}</div>}
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </FsPanel>
  );
}

export function FsLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('fs-label', className)}>{children}</p>;
}

export function FsSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-800/70', className)} />;
}

export { accentDot, accentText };
