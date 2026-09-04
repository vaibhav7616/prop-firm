import { useMemo, useState } from 'react';
import { Trophy, Search, ShieldCheck, Award, TrendingUp, Flame, Target } from 'lucide-react';
import { TOP_20_ALL_TIME_TRADERS, type TopTrader, type TimeframePeriod } from '@/data/top-traders';
import { formatCurrency } from '@/lib/constants';
import { FsPanel, FsPageHeader, FsEmpty } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

type TF = 'all' | 'month' | 'week';
const TABS: { id: TF; label: string; key?: TimeframePeriod }[] = [
  { id: 'all', label: 'All Time', key: 'allTime' },
  { id: 'month', label: 'This Month', key: 'monthly' },
  { id: 'week', label: 'This Week', key: 'weekly' },
];

export function DashboardLeaderboard() {
  const [tf, setTf] = useState<TF>('all');
  const [q, setQ] = useState('');

  // Privacy: show first name + last initial only
  const mask = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return name;
    return `${parts[0]} ${parts[1][0]}.`;
  };

  const rows = useMemo(() => {
    const key = TABS.find((t) => t.id === tf)?.key as TimeframePeriod | undefined;
    const arr = TOP_20_ALL_TIME_TRADERS.map((t, i) => {
      const value = key && t.timeframeProfit ? t.timeframeProfit[key] ?? t.totalProfit : t.totalProfit;
      const baseReturn = t.accountTier > 0 ? (t.totalProfit / t.accountTier) * 100 : 0;
      return { trader: t, idx: i, value, baseReturn };
    }).filter((r) => !q || r.trader.traderName.toLowerCase().includes(q.toLowerCase()) || r.trader.topSymbol.toLowerCase().includes(q.toLowerCase()));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [tf, q]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-5">
      <FsPageHeader
        eyebrow="Community"
        title="Trader Leaderboard"
        description="Top Funded Shift traders by verified, paid-out performance."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTf(t.id)} className={cn('rounded-md px-3 py-1 text-xs font-semibold', tf === t.id ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200')}>
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trader or symbol…" className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {podium.map((r, rankIdx) => {
            const t = r.trader;
            const isFirst = rankIdx === 0;
            return (
              <div key={t.traderName} className="contents"><FsPanel className={cn('relative overflow-hidden p-4', isFirst && 'border-indigo-500/40')}>
                {isFirst && <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />}
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold', isFirst ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40' : 'bg-slate-800 text-slate-300')}>
                    {r.idx + 1 <= 3 && r.idx + 1}
                    {r.idx + 1 > 3 && <Flame className="h-4 w-4 text-indigo-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-slate-50">{isFirst ? '🏆 ' : ''}{mask(t.traderName)}</p>
                    <p className="text-[11px] text-slate-500">{t.flag} {t.country} · {t.accountSize}</p>
                  </div>
                  {isFirst && <span className="rounded-full bg-indigo-500/15 px-2 py-px text-[10px] font-bold text-indigo-200">#1</span>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Metric small label="Profit" value={formatCurrency(r.value)} />
                  <Metric small label="Payouts" value={String(t.payoutCount)} />
                  <Metric small label="Win rate" value={`${t.winRate}%`} />
                </div>
              </FsPanel></div>
            );
          })}
        </div>
      )}

      {rest.length === 0 && rows.length === 0 ? (
        <FsEmpty icon={<Trophy className="h-5 w-5" />} title="No traders found" />
      ) : rest.length > 0 ? (
        <FsPanel className="overflow-hidden p-0">
          <div className="fs-scroll overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  {['Rank', 'Trader', 'Return', 'Profit', 'Trades info', 'Top symbol', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {rest.map((r, i) => {
                  const t = r.trader;
                  const ret = t.accountTier > 0 ? (r.value / t.accountTier) * 100 : 0;
                  return (
                    <tr key={t.traderName} className="fs-row-hover">
                      <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-slate-400">{i + 4}</span></td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-100">{mask(t.traderName)}</p>
                        <p className="text-[11px] text-slate-500">{t.flag} {t.country}</p>
                      </td>
                      <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-emerald-400">+{ret.toFixed(0)}%</span></td>
                      <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-slate-100">{formatCurrency(r.value)}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-400">{t.payoutCount} payouts · {t.winRate}% win · PF {t.profitFactor}</td>
                      <td className="px-4 py-3"><span className="fs-num rounded border border-slate-800 bg-slate-900 px-1.5 py-px text-[11px] font-semibold text-indigo-300">{t.topSymbol}</span></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Verified</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FsPanel>
      ) : (
        rows.map((r) => null)
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-600">
        <Award className="h-3.5 w-3.5" /> Rankings use verified, paid-out results. Trader identities are shown as they appear on our public leaderboard for privacy.
      </p>
    </div>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('fs-num mt-0.5 font-semibold text-slate-100', small ? 'text-xs' : 'text-base')}>{value}</p>
    </div>
  );
}
