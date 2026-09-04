import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownRight,
  CandlestickChart,
  Wallet,
  Gauge,
  Banknote,
  ShieldAlert,
  Activity,
  CircleDollarSign,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFsAccount } from '@/context/account-context';
import { useFsNotifications } from '@/lib/fs-notifications';
import { fsMetrics, fsRisk, fsAccountMeta, objectiveState, fsTradingDays } from '@/lib/fs-risk';
import { formatCurrency, formatAccountSize, ACCOUNT_STATUS_LABELS } from '@/lib/constants';
import type { Order } from '@/types';
import { fetchUserOrders, fetchAccountPositionsApi } from '@/lib/api-client';
import { DEFAULT_ORDERS } from '@/lib/default-data';
import {
  FsPanel,
  FsPageHeader,
  FsStat,
  FsProgress,
  RingMeter,
  StatusPill,
  FsEmpty,
} from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

export function DashboardOverview() {
  const { user } = useAuth();
  const { selected, accounts, loading: accLoading } = useFsAccount();
  const notifications = useFsNotifications();
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadedOrders, setLoadedOrders] = useState(false);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    fetchAccountPositionsApi(selected.id).then((p) => {
      if (active && Array.isArray(p)) setPositions(p);
    });
    return () => {
      active = false;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (!user || loadedOrders) return;
    fetchUserOrders(user.id).then((o) => {
      if (o && o.length > 0) setOrders(o);
      else setOrders(DEFAULT_ORDERS);
      setLoadedOrders(true);
    });
  }, [user, loadedOrders]);

  const openPos = positions.filter((p) => p.status === 'OPEN');
  const closedPos = positions.filter((p) => p.status === 'CLOSED');
  const floating = openPos.reduce((s, p) => s + (p.floating_pnl || 0), 0);

  const equity = selected ? (selected.current_balance ?? selected.starting_balance ?? 0) + floating : 0;
  const metrics = selected ? fsMetrics(selected, equity) : null;
  const risk = selected ? fsRisk(selected, equity) : null;

  const meta = selected ? fsAccountMeta(selected) : null;
  const state = selected ? objectiveState(selected, metrics ?? undefined) : null;

  const unread = notifications.list.filter((n) => !n.is_read).slice(0, 4);
  const recentActivity = useMemo(() => {
    const rows: any[] = [];
    closedPos.slice(0, 6).forEach((p) =>
      rows.push({
        id: p.id,
        kind: 'close',
        symbol: p.symbol,
        side: p.type,
        lots: p.lot_size,
        pnl: p.realized_pnl || 0,
        at: p.closed_at || p.updated_at,
      })
    );
    return rows.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).slice(0, 6);
  }, [closedPos]);

  if (accLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-md bg-slate-800/70" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800/70" />
          ))}
        </div>
      </div>
    );
  }

  if (!selected || !metrics || !risk) {
    return (
      <FsEmpty
        icon={<Wallet className="h-5 w-5" />}
        title="No trading account yet"
        description="Purchase a challenge to receive a live trading account, or one will appear here once assigned."
        action={
          <Link to="/challenges" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Explore challenges
          </Link>
        }
      />
    );
  }

  const pnl = equity - metrics.start;
  const pnlPct = metrics.start > 0 ? (pnl / metrics.start) * 100 : 0;

  return (
    <div className="space-y-6">
      <FsPageHeader
        eyebrow="Overview"
        title={meta.title}
        description={meta.subtitle}
        actions={
          <>
            <Link
              to="/dashboard/trading"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              <CandlestickChart className="h-4 w-4" /> Web Terminal
            </Link>
            <Link
              to="/dashboard/accounts"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Accounts
            </Link>
          </>
        }
      />

      {/* Hero strip: equity + key answer */}
      <FsPanel className="relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="fs-label">Equity · {ACCOUNT_STATUS_LABELS[selected.status] ?? selected.status}</p>
            <p className="fs-num mt-2 text-4xl font-bold tracking-tight text-slate-50">{formatCurrency(equity)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className={cn('inline-flex items-center gap-1 font-semibold', pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {pnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {formatCurrency(pnl)} ({pnlPct >= 0 ? '+' : ''}
                {pnlPct.toFixed(2)}%)
              </span>
              <span className="text-slate-500">start {formatCurrency(metrics.start)}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800 pt-4 text-center">
              <div>
                <p className="text-[11px] text-slate-500">Account</p>
                <p className="fs-num text-sm font-semibold text-slate-200">#{selected.account_number ?? selected.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Leverage</p>
                <p className="fs-num text-sm font-semibold text-slate-200">1:{metrics.leverage}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Split</p>
                <p className="fs-num text-sm font-semibold text-slate-200">{metrics.profitSplit}%</p>
              </div>
            </div>
          </div>

          {/* Risk summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="fs-label">Risk Monitor</p>
              {state === 'failed' ? (
                <StatusPill tone="rose">Account failed</StatusPill>
              ) : risk.dailyRemaining / metrics.dailyLimitAmt < 0.2 ? (
                <StatusPill tone="amber">Drawdown risk</StatusPill>
              ) : (
                <StatusPill tone="emerald">Within limits</StatusPill>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Daily drawdown left</span>
                  <span className="fs-num font-semibold text-slate-100">
                    {formatCurrency(risk.dailyRemaining)}
                  </span>
                </div>
                <FsProgress value={risk.dailyUsedPct} tone={risk.dailyUsedPct > 0.75 ? 'rose' : risk.dailyUsedPct > 0.5 ? 'amber' : 'indigo'} />
                <p className="mt-1 text-[11px] text-slate-500">
                  {formatCurrency(risk.dailyUsed)} / {formatCurrency(metrics.dailyLimitAmt)} used ({metrics.dailyPct}%)
                </p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Max drawdown left</span>
                  <span className="fs-num font-semibold text-slate-100">
                    {formatCurrency(risk.maxRemaining)}
                  </span>
                </div>
                <FsProgress value={risk.maxUsedPct} tone={risk.maxUsedPct > 0.75 ? 'rose' : risk.maxUsedPct > 0.5 ? 'amber' : 'indigo'} />
                <p className="mt-1 text-[11px] text-slate-500">
                  {formatCurrency(risk.maxUsed)} / {formatCurrency(metrics.maxLossAmt)} used ({metrics.maxPct}%)
                </p>
              </div>
            </div>
          </div>

          {/* Objective gauge */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="fs-label mb-1">Profit Target {metrics.profitTargetPct}%</p>
            {metrics.isFunded ? (
              <div className="flex h-full flex-col items-center justify-center py-4 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                <p className="mt-2 text-sm font-semibold text-slate-200">Funded &amp; active</p>
                <p className="text-xs text-slate-500">Track payouts and growth here.</p>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <RingMeter value={metrics.targetProgress} tone={metrics.targetProgress >= 1 ? 'emerald' : 'indigo'} size={120}>
                  <div className="text-center">
                    <p className="fs-num text-lg font-bold text-slate-50">{(metrics.targetProgress * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-500">target</p>
                  </div>
                </RingMeter>
                <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Progress</span>
                    <span className="fs-num text-slate-100">{formatCurrency(Math.max(0, metrics.netProfit))} / {formatCurrency(metrics.targetAmt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining</span>
                    <span className="fs-num text-emerald-300">{formatCurrency(metrics.targetRemaining)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trading days</span>
                    <span className="fs-num text-slate-100">
                      {fsTradingDays(selected)}
                      {metrics.minDays > 0 ? ` / ${metrics.minDays}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </FsPanel>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FsStat label="Balance" value={formatCurrency(metrics.balance)} sub={<span className="text-slate-500">Realized balance</span>} />
        <FsStat
          label="Floating P/L"
          value={`${floating >= 0 ? '+' : ''}${formatCurrency(floating)}`}
          hint={floating >= 0 ? 'up' : 'down'}
          sub={<span className="text-slate-500">{openPos.length} open position{openPos.length === 1 ? '' : 's'}</span>}
        />
        <FsStat
          label="Net P/L"
          value={`${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`}
          hint={pnl >= 0 ? 'up' : 'down'}
          sub={<span className="text-slate-500">since inception</span>}
        />
        <FsStat
          label="Phase"
          value={selected.status === 'funded' ? 'Funded' : selected.status === 'passed' ? 'Passed' : `Phase ${selected.phase ?? 1}`}
          accent={meta.accent === 'emerald' ? 'emerald' : meta.accent === 'rose' ? 'rose' : 'indigo'}
          sub={
            <span className="text-slate-500">
              {fsTradingDays(selected)} trading days recorded
            </span>
          }
        />
      </div>

      {/* Bottom grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <EquityPanel
            start={metrics.start}
            balance={metrics.balance}
            equity={equity}
            closedPos={closedPos}
            openCount={openPos.length}
          />
          {recentActivity.length > 0 && (
            <FsPanel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="fs-label">Recent Activity</p>
                <Link to="/dashboard/orders" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200">
                  View orders <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-800/80">
                {recentActivity.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="fs-num rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                        {r.side} {r.symbol}
                      </span>
                      <span className="text-slate-500">{r.lots} lots · closed</span>
                    </div>
                    <span className={cn('fs-num font-semibold', r.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {r.pnl >= 0 ? '+' : ''}
                      {formatCurrency(r.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </FsPanel>
          )}
        </div>

        {/* Right rail: orders + notifications */}
        <div className="space-y-4">
          <FsPanel className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="fs-label">Challenges &amp; Orders</p>
              <Link to="/dashboard/orders" className="text-xs text-slate-400 hover:text-slate-200">All</Link>
            </div>
            {orders.length === 0 ? (
              <p className="py-3 text-sm text-slate-500">No orders yet.</p>
            ) : (
              <div className="space-y-2.5">
                {orders.slice(0, 3).map((o) => (
                  <div key={o.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-slate-200">
                        {formatAccountSize(o.account_size)} · {o.challenge?.name || o.plan_name || 'Challenge'}
                      </span>
                      <span className="fs-num text-slate-100">{formatCurrency(o.total_amount)}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {new Date(o.created_at).toLocaleDateString()} · {o.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </FsPanel>

          <FsPanel className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="fs-label">Notifications</p>
              <Link to="/dashboard/notifications" className="text-xs text-slate-400 hover:text-slate-200">All</Link>
            </div>
            {unread.length === 0 ? (
              <p className="flex items-center gap-2 py-3 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> You're all caught up.
              </p>
            ) : (
              <div className="space-y-2.5">
                {unread.map((n) => (
                  <div key={n.id} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FsPanel>

          <Link to="/dashboard/leaderboard" className="group block">
            <FsPanel className="flex items-center justify-between p-4 transition-colors group-hover:border-slate-600">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">Trader Leaderboard</p>
                  <p className="text-xs text-slate-500">See how you compare</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </FsPanel>
          </Link>
        </div>
      </div>

      {/* Advisory */}
      {risk.dailyUsedPct < 1 && risk.maxUsedPct < 1 && state !== 'failed' && (
        <FsPanel className="flex items-start gap-3 border-indigo-500/20 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
          <p className="text-sm text-slate-400">
            Daily loss remaining <span className="fs-num font-semibold text-slate-100">{formatCurrency(risk.dailyRemaining)}</span> · max drawdown buffer{' '}
            <span className="fs-num font-semibold text-slate-100">{formatCurrency(risk.maxRemaining)}</span>. {metrics.minDays > 0 && `You need ${Math.max(0, metrics.minDays - (fsTradingDays(selected)))} more trading day(s) to satisfy the evaluation.`}
          </p>
        </FsPanel>
      )}
    </div>
  );
}

function EquityPanel({
  start,
  balance,
  equity,
  closedPos,
  openCount,
}: {
  start: number;
  balance: number;
  equity: number;
  closedPos: any[];
  openCount: number;
}) {
  const points = useMemo(() => {
    const sorted = [...closedPos]
      .filter((p) => p.closed_at || p.updated_at)
      .sort((a, b) => new Date(a.closed_at || a.updated_at).getTime() - new Date(b.closed_at || b.updated_at).getTime());
    let cum = start;
    const arr = sorted.map((p) => {
      cum += p.realized_pnl || 0;
      return cum;
    });
    return arr;
  }, [closedPos, start]);

  const W = 560;
  const H = 130;
  const max = Math.max(...points, balance, equity, start);
  const min = Math.min(...points, balance, start);
  const span = max - min || 1;
  const path = points.length >= 2;
  const coords = path
    ? points.map((v, i) => {
        const x = (i / (points.length - 1)) * W;
        const y = H - ((v - min) / span) * (H - 12) - 6;
        return [x, y];
      })
    : [];
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const area = coords.length ? `${line} L${W},${H} L0,${H} Z` : '';
  const last = points[points.length - 1] ?? balance;
  const up = last >= start;

  return (
    <FsPanel className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="fs-label">Equity Curve</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Start {formatCurrency(start)}</span>
          <span className="flex items-center gap-1 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Now {formatCurrency(equity)}</span>
        </div>
      </div>
      {!path ? (
        <div className="flex h-[130px] items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-500">
          {openCount > 0 ? 'Open positions not yet marked to market on this view.' : 'Close your first trade to build an equity curve.'}
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[130px] w-full">
          <defs>
            <linearGradient id="fsEqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.2)'} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>
          {area && <path d={area} fill="url(#fsEqFill)" />}
          {line && <path d={line} fill="none" stroke={up ? '#34d399' : '#fb7185'} strokeWidth="2" strokeLinejoin="round" />}
        </svg>
      )}
    </FsPanel>
  );
}
