import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  TrendingDown,
  ShieldAlert,
  CalendarDays,
  Scale,
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
  XCircle,
  Wallet,
} from 'lucide-react';
import { useFsAccount } from '@/context/account-context';
import { fsMetrics, fsRisk, objectiveState, fsAccountMeta, fsTradingDays } from '@/lib/fs-risk';
import { formatCurrency, formatAccountSize, ACCOUNT_STATUS_LABELS } from '@/lib/constants';
import type { TradingAccount } from '@/types';
import { FsPanel, FsPageHeader, StatusPill, RingMeter, FsProgress, FsEmpty } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

export function DashboardObjectives() {
  const { selected, accounts, selectAccount } = useFsAccount();
  const m = selected ? fsMetrics(selected) : null;
  const r = selected ? fsRisk(selected) : null;
  const meta = selected ? fsAccountMeta(selected) : null;
  const state = selected && m ? objectiveState(selected, m) : null;

  if (!selected || !m || !r) {
    return (
      <FsEmpty
        icon={<Target className="h-5 w-5" />}
        title="Select a trading account"
        description="Choose an account to view its evaluation objectives and risk limits."
        action={<Link to="/dashboard/accounts" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">View accounts</Link>}
      />
    );
  }

  const account = selected;
  const dayProgress = m.minDays > 0 ? Math.min(1, fsTradingDays(account) / m.minDays) : 0;
  const consistency = (account.rules as any)?.consistency || 0;

  return (
    <div className="space-y-6">
      <FsPageHeader
        eyebrow="Evaluation"
        title="Trading Objectives"
        description={`${ACCOUNT_STATUS_LABELS[account.status] ?? account.status} · ${formatAccountSize(account.account_size)} · Phase ${account.phase ?? 1}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill tone={meta?.accent as any}>#{account.account_number ?? account.id}</StatusPill>
            {state === 'failed' && <StatusPill tone="rose">Account failed</StatusPill>}
            {state === 'completed' && <StatusPill tone="emerald">Completed</StatusPill>}
            {state === 'at_risk' && <StatusPill tone="amber">At risk</StatusPill>}
            {state === 'in_progress' && <StatusPill tone="indigo">In progress</StatusPill>}
          </div>
        }
      />

      {/* Summary of all accounts at a glance */}
      {accounts.length > 1 && (
        <div className="fs-scroll flex gap-2 overflow-x-auto pb-1">
          {accounts.map((a) => {
            const am = fsMetrics(a);
            const sel = a.id === selected.id;
            return (
              <button
                key={a.id}
                onClick={() => selectAccount(a.id)}
                type="button"
                aria-pressed={sel}
                className={cn(
                  'shrink-0 rounded-lg border px-3 py-1.5 text-left transition-colors',
                  sel
                    ? 'cursor-default border-indigo-500/60 bg-indigo-500/10'
                    : 'cursor-pointer border-slate-800 bg-slate-900/40 hover:border-indigo-500/40 hover:bg-slate-800/60'
                )}
              >
                <p className="fs-num text-xs font-bold text-slate-100">#{a.account_number ?? a.id}</p>
                <p className="text-[10px] text-slate-500">{am.isFunded ? 'Funded' : `${(am.targetProgress * 100).toFixed(0)}% target`}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Risk monitor headline */}
      <FsPanel className="grid gap-6 p-5 lg:grid-cols-4">
        <div className="flex flex-col items-center justify-center lg:col-span-1">
          <RingMeter
            value={Math.max(r.dailyUsedPct, r.maxUsedPct)}
            tone={state === 'failed' ? 'rose' : Math.max(r.dailyUsedPct, r.maxUsedPct) > 0.75 ? 'amber' : 'emerald'}
            size={150}
          >
            <div className="text-center">
              <p className="fs-num text-2xl font-bold text-slate-50">{Math.max(r.dailyUsedPct, r.maxUsedPct) === 0 ? 0 : (Math.max(r.dailyUsedPct, r.maxUsedPct) * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-slate-500">risk used</p>
            </div>
          </RingMeter>
          <p className="mt-2 text-xs text-slate-500">Lowest remaining buffer drives this gauge.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-3">
          <RiskRow label="Daily loss used" used={r.dailyUsed} usedPct={r.dailyUsedPct} />
          <RiskRow label="Max drawdown used" used={r.maxUsed} usedPct={r.maxUsedPct} />
        </div>
      </FsPanel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Profit target */}
        <ObjectiveCard
          icon={<Target className="h-4 w-4" />}
          accent="indigo"
          title={`Profit Target · ${m.profitTargetPct}%`}
          status={m.isFunded ? 'completed' : m.targetProgress >= 1 ? 'completed' : account.status === 'failed' || account.status === 'breached' ? 'failed' : r.maxUsedPct > 0.75 ? 'at_risk' : 'in_progress'}
          body={
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <KV label="Current" value={formatCurrency(Math.max(0, m.netProfit))} up />
                <KV label="Target" value={formatCurrency(m.targetAmt)} />
                <KV label="Remaining" value={formatCurrency(m.targetRemaining)} warn />
              </div>
              <div>
                <FsProgress value={m.targetProgress} tone={m.targetProgress >= 1 ? 'emerald' : 'indigo'} />
                <p className="mt-1 text-right fs-num text-xs text-slate-500">{(m.targetProgress * 100).toFixed(1)}% complete</p>
              </div>
              {m.isFunded && <p className="text-xs text-slate-500">Funded account — target reached; track payouts instead.</p>}
            </div>
          }
        />

        {/* Daily drawdown */}
        <ObjectiveCard
          icon={<TrendingDown className="h-4 w-4" />}
          accent="amber"
          title={`Daily Drawdown · ${m.dailyPct}%`}
          status={account.status === 'failed' || account.status === 'breached' ? 'failed' : r.dailyUsedPct >= 1 ? 'at_risk' : r.dailyUsedPct > 0.75 ? 'at_risk' : 'in_progress'}
          body={
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <KV label="Used" value={formatCurrency(r.dailyUsed)} down />
                <KV label="Limit" value={formatCurrency(m.dailyLimitAmt)} />
                <KV label="Remaining" value={formatCurrency(r.dailyRemaining)} up />
              </div>
              <FsProgress value={r.dailyUsedPct} tone={r.dailyUsedPct > 0.75 ? 'rose' : r.dailyUsedPct > 0.5 ? 'amber' : 'indigo'} />
              <p className="text-[11px] text-slate-600">Daily loss is measured from the start-of-day balance. Keep losses below this limit to stay safe.</p>
            </div>
          }
        />

        {/* Max drawdown */}
        <ObjectiveCard
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="rose"
          title={`Maximum Drawdown · ${m.maxPct}%`}
          status={account.status === 'failed' || account.status === 'breached' ? 'failed' : r.maxUsedPct >= 1 ? 'failed' : r.maxUsedPct > 0.75 ? 'at_risk' : 'in_progress'}
          body={
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <KV label="Used" value={formatCurrency(r.maxUsed)} down />
                <KV label="Limit" value={formatCurrency(m.maxLossAmt)} />
                <KV label="Remaining" value={formatCurrency(r.maxRemaining)} up />
              </div>
              <FsProgress value={r.maxUsedPct} tone={r.maxUsedPct > 0.75 ? 'rose' : r.maxUsedPct > 0.5 ? 'amber' : 'indigo'} />
              {r.maxUsedPct >= 1 && <p className="text-xs text-rose-400">Maximum drawdown breached — account stopped.</p>}
            </div>
          }
        />

        {/* Minimum trading days */}
        <ObjectiveCard
          icon={<CalendarDays className="h-4 w-4" />}
          accent="emerald"
          title={`Minimum Trading Days${m.minDays > 0 ? ` · ${m.minDays}` : ''}`}
          status={m.minDays === 0 ? 'completed' : fsTradingDays(account) >= m.minDays ? 'completed' : 'in_progress'}
          body={
            m.minDays === 0 ? (
              <p className="py-2 text-sm text-slate-500">No minimum day requirement on this program.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <KV label="Current" value={`${fsTradingDays(account)}`} />
                  <KV label="Required" value={`${m.minDays}`} />
                </div>
                <FsProgress value={dayProgress} tone="emerald" />
              </div>
            )
          }
        />

        {/* Consistency */}
        {consistency > 0 && (
          <ObjectiveCard
            icon={<Scale className="h-4 w-4" />}
            accent="slate"
            title={`Consistency Rule · ${consistency}%`}
            status="in_progress"
            body={<p className="py-2 text-sm text-slate-500">Largest trade should not exceed {consistency}% of total profit to pass consistency verification.</p>}
          />
        )}
      </div>
    </div>
  );
}

function KV({ label, value, up, down, warn }: { label: string; value: string; up?: boolean; down?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('fs-num mt-1 text-sm font-semibold', up ? 'text-emerald-400' : down ? 'text-rose-400' : warn ? 'text-amber-300' : 'text-slate-100')}>{value}</p>
    </div>
  );
}

function RiskRow({ label, used, usedPct }: { label: string; used: number; usedPct: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="fs-label">{label}</p>
      <p className="fs-num mt-1 text-2xl font-bold text-slate-50">{formatCurrency(used)}</p>
      <FsProgress value={usedPct} className="mt-3" tone={usedPct > 0.75 ? 'rose' : usedPct > 0.5 ? 'amber' : 'indigo'} />
    </div>
  );
}

const statusMap = {
  in_progress: { icon: CircleDashed, label: 'In Progress', cls: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' },
  completed: { icon: CheckCircle2, label: 'Completed', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' },
  at_risk: { icon: AlertTriangle, label: 'At Risk', cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200' },
  failed: { icon: XCircle, label: 'Failed', cls: 'border-rose-500/40 bg-rose-500/10 text-rose-200' },
} as const;

function ObjectiveCard({ icon, title, body, status, accent }: { icon: ReactNode; title: string; body: ReactNode; status: keyof typeof statusMap; accent: string }) {
  const S = statusMap[status];
  const Icon = S.icon;
  return (
    <FsPanel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300">{icon}</span>
          <h3 className="font-display text-sm font-bold text-slate-50">{title}</h3>
        </div>
        <span className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', S.cls)}>
          <Icon className="h-3.5 w-3.5" /> {S.label}
        </span>
      </div>
      {body}
    </FsPanel>
  );
}
