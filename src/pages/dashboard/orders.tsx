import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Search, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFsAccount } from '@/context/account-context';
import { formatCurrency, formatAccountSize, formatDateTime, ORDER_STATUS_LABELS } from '@/lib/constants';
import type { Order } from '@/types';
import { fetchUserOrders } from '@/lib/api-client';
import { DEFAULT_ORDERS } from '@/lib/default-data';
import { FsPanel, FsPageHeader, FsStat, FsEmpty, FsSkeleton } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

const PAGE = 8;

export function DashboardOrders() {
  const { user } = useAuth();
  const { selected } = useFsAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchUserOrders(user?.id ?? '').then((o) => {
      if (o && o.length > 0) setOrders(o);
      else setOrders(DEFAULT_ORDERS);
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => {
    let arr = orders.filter((o) => {
      const matchQ = !q || o.id.toLowerCase().includes(q.toLowerCase()) || (o.challenge?.name || o.plan_name || '').toLowerCase().includes(q.toLowerCase());
      const matchS = status === 'ALL' || o.status === status;
      return matchQ && matchS;
    });
    arr = [...arr].sort((a, b) => (dir === 'asc' ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    return arr;
  }, [orders, q, status, dir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const totalSpent = orders.reduce((s, o) => s + o.total_amount, 0);
  const activeCount = orders.filter((o) => o.status === 'assigned').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-md bg-slate-800/70" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="contents"><FsSkeleton className="h-20" /></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FsPageHeader eyebrow="Billing" title="Orders" description="Your challenge purchase history." />
      {selected && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FsStat label="Total orders" value={String(orders.length)} />
          <FsStat label="Total invested" value={formatCurrency(totalSpent)} />
          <FsStat label="Assigned accounts" value={String(activeCount)} />
          <FsStat label="Current account" value={selected.account_number ? `#${selected.account_number}` : '—'} accent="indigo" />
        </div>
      )}

      {orders.length === 0 ? (
        <FsEmpty icon={<ShoppingCart className="h-5 w-5" />} title="No orders yet" description="Purchase a challenge to see your order history here." />
      ) : (
        <>
          <FsPanel className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder="Search order ID or challenge…"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-200 focus:outline-none">
                <option value="ALL">All statuses</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button onClick={() => setDir((d) => (d === 'desc' ? 'asc' : 'desc'))} className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-2 text-sm text-slate-300 hover:border-slate-700">
                {dir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />} Date
              </button>
            </div>
          </FsPanel>

          <FsPanel className="overflow-hidden p-0">
            <div className="fs-scroll overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800 bg-slate-900/50">
                  <tr>
                    {['Order', 'Challenge / Account', 'Size', 'Add-ons', 'Discount', 'Total', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {rows.map((o) => (
                    <tr key={o.id} className="fs-row-hover">
                      <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-indigo-300">{o.id.toUpperCase()}</span></td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-100">{o.challenge?.name || o.plan_name || 'Prop Challenge'}</p>
                        <p className="text-[11px] text-slate-500">{o.platform}</p>
                      </td>
                      <td className="px-4 py-3"><span className="fs-num text-sm text-slate-200">{formatAccountSize(o.account_size)}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-400">{o.addons && o.addons.length > 0 ? o.addons.map((a) => a.name).join(', ') : '—'}</td>
                      <td className="px-4 py-3">
                        {o.discount_amount > 0 ? <span className="text-sm text-emerald-400">−{formatCurrency(o.discount_amount)}</span> : <span className="text-sm text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-slate-50">{formatCurrency(o.total_amount)}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(o.created_at)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No orders match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-500">Showing {rows.length} of {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-md border border-slate-800 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <span className="px-2 text-xs text-slate-400">{safePage + 1} / {pageCount}</span>
                <button disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="rounded-md border border-slate-800 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </FsPanel>
          <p className="flex items-center gap-1.5 text-xs text-slate-600"><FileText className="h-3.5 w-3.5" /> Realized trade orders (positions, P&L, SL/TP) appear in Web Terminal → History.</p>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'assigned' || status === 'paid' ? 'emerald' : status === 'cancelled' || status === 'refunded' ? 'rose' : 'slate';
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-px text-[11px] font-semibold',
      tone === 'emerald' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      tone === 'rose' && 'border-rose-500/40 bg-rose-500/10 text-rose-300',
      tone === 'slate' && 'border-slate-700 bg-slate-800 text-slate-300'
    )}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
