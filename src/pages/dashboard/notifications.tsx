import { useState } from 'react';
import { Bell, CheckCheck, Check, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useFsNotifications } from '@/lib/fs-notifications';
import { formatDateTime } from '@/lib/constants';
import { FsPanel, FsPageHeader, FsEmpty, FsSkeleton } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

const FILTERS = ['All', 'Unread', 'Account', 'Risk', 'Performance', 'Payout', 'System'] as const;
const KIND: Record<string, string> = {
  account: 'Account',
  risk: 'Risk',
  performance: 'Performance',
  payout: 'Payout',
  system: 'System',
};

export function DashboardNotifications() {
  const store = useFsNotifications();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [loading] = useState(false);

  const list = store.list;

  const filtered = list.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.is_read;
    const kind = inferKind(n);
    return kind === filter;
  });

  const markAll = () => {
    store.markAllRead();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-md bg-slate-800/70" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="contents"><FsSkeleton className="h-16" /></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FsPageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={`${store.unread} unread · ${list.length} total`}
        actions={
          <button onClick={markAll} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      <div className="fs-scroll flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold', filter === f ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <FsEmpty icon={<Bell className="h-5 w-5" />} title="No notifications" description="New account, risk, payout and system alerts will appear here." />
      ) : (
        <FsPanel className="overflow-hidden p-0">
          <div className="divide-y divide-slate-800/70">
            {filtered.map((n) => {
              const kind = inferKind(n);
              return (
                <div key={n.id} className={cn('flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-900/30', !n.is_read && 'bg-indigo-500/[0.03]')}>
                  <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', toneBox(n, kind))}>
                    <KindIcon n={n} kind={kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm', n.is_read ? 'font-medium text-slate-300' : 'font-semibold text-slate-50')}>{n.title}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded bg-slate-800 px-1.5 py-px text-[10px] font-semibold text-slate-400">{kind}</span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-indigo-400" />}
                      </div>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate-600">{formatDateTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => store.markRead(n.id)} className="shrink-0 rounded-md border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100" title="Mark read">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </FsPanel>
      )}
    </div>
  );
}

function inferKind(n: { title: string; type: string }): string {
  const t = (n.title + ' ' + n.type).toLowerCase();
  if (t.includes('drawdown') || t.includes('risk') || t.includes('breach') || t.includes('loss')) return 'Risk';
  if (t.includes('payout') || t.includes('profit split') || t.includes('withdraw')) return 'Payout';
  if (t.includes('target') || t.includes('performance') || t.includes('milestone')) return 'Performance';
  if (t.includes('account') || t.includes('funded') || t.includes('challenge')) return 'Account';
  return 'System';
}

function toneBox(n: { type: string }, kind: string) {
  if (kind === 'Risk') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (kind === 'Payout' || kind === 'Performance') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (kind === 'Account') return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300';
  return 'border-slate-700 bg-slate-800 text-slate-300';
}

function KindIcon({ n, kind }: { n: { type: string }; kind: string }) {
  if (kind === 'Risk') return <AlertTriangle className="h-4 w-4" />;
  if (kind === 'Payout') return <CheckCircle2 className="h-4 w-4" />;
  if (kind === 'Performance') return <ShieldAlert className="h-4 w-4" />;
  if (kind === 'Account') return <Info className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}
