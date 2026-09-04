import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, Download, Eye, X, ShieldCheck, Award, TrendingUp, FileCheck2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFsAccount } from '@/context/account-context';
import { formatAccountSize, formatCurrency, formatDate } from '@/lib/constants';
import type { Certificate, TradingAccount } from '@/types';
import { DEFAULT_CERTIFICATES } from '@/lib/default-data';
import { FsPanel, FsPageHeader, FsEmpty, FsSkeleton } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardCertificates() {
  const { user, profile } = useAuth();
  const { accounts } = useFsAccount();
  const [extra, setExtra] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'step1' | 'funded' | 'payout'>('all');
  const [view, setView] = useState<Certificate | null>(null);

  useEffect(() => {
    setLoading(true);
    let payouts: any[] = [];
    const run = async () => {
      if (user?.id) {
        try {
          const res = await fetch('/api/payouts', { headers: { 'x-user-id': user.id } });
          if (res.ok) {
            const d = await res.json();
            if (Array.isArray(d)) payouts = d;
          }
        } catch {
          /* ignore */
        }
      }
      setExtra(payouts);
      setLoading(false);
    };
    run();
  }, [user]);

  const certs = useMemo(() => {
    const dynamic: Certificate[] = [];
    const traderName = profile?.full_name || user?.email?.split('@')[0] || 'Funded Shift Trader';

    accounts.forEach((accAny, idx) => {
      const acc = accAny as TradingAccount & any;
      const startBal = acc.starting_balance || acc.account_size || 100000;
      const curBal = acc.current_balance || startBal;
      const profitAmt = typeof acc.profit === 'number' && !isNaN(acc.profit) ? acc.profit : curBal - startBal;
      const targetPct = (acc.rules as any)?.profit_target ?? 8;
      const p1Target = (startBal * targetPct) / 100;
      const hasStep1 = acc.status === 'passed' || acc.status === 'funded' || acc.phase > 1 || (acc.phase === 1 && profitAmt >= p1Target && acc.status !== 'failed');
      const hasStep2 = acc.status === 'funded' || acc.phase > 2 || (acc.phase === 2 && (acc.status === 'passed' || profitAmt >= startBal * 0.05));

      if (hasStep1) {
        dynamic.push({
          id: `cert-step1-${acc.id}`, user_id: acc.user_id, account_id: acc.id,
          title: 'EVALUATION STEP 1 PASSED', subtitle: 'Phase 1 target reached & account verified', type: 'step1_passed',
          recipient_name: traderName, account_size: acc.account_size, account_number: acc.account_number || `884019${idx}`,
          challenge_name: acc.challenge?.name || acc.plan_name || `${formatAccountSize(acc.account_size)} Challenge`,
          certificate_number: `FS-ST1-2026-${1000 + idx * 47}`, issued_at: acc.assigned_at || acc.created_at,
        });
      }
      if (hasStep2) {
        dynamic.push({
          id: `cert-funded-${acc.id}`, user_id: acc.user_id, account_id: acc.id,
          title: 'OFFICIAL FUNDED TRADER', subtitle: 'Evaluation completed & capital allocated', type: 'funded',
          recipient_name: traderName, account_size: acc.account_size, account_number: acc.account_number || `884019${idx}`,
          challenge_name: acc.challenge?.name || acc.plan_name || `${formatAccountSize(acc.account_size)} Funded Account`,
          certificate_number: `FS-FND-2026-${2000 + idx * 83}`, issued_at: acc.assigned_at || acc.created_at,
        });
      }
    });

    extra.forEach((pay: any, pIdx: number) => {
      if (pay.status === 'PAID' || pay.status === 'APPROVED' || pay.status === 'COMPLETED') {
        dynamic.push({
          id: `cert-payout-${pay.id}`, user_id: pay.user_id, account_id: pay.account_id,
          title: 'PROFIT SPLIT PAYOUT', subtitle: 'Approved payout disbursement', type: 'payout',
          recipient_name: pay.user_name || profile?.full_name || 'Funded Shift Trader',
          account_size: pay.starting_balance || 100000, account_number: pay.account_number || `PAY${pIdx}`,
          amount: pay.trader_payout_amount, challenge_name: `Funded Account #${pay.account_number || ''}`,
          certificate_number: `FS-PAY-2026-${String(pIdx + 1).padStart(4, '0')}`, issued_at: pay.processed_at || pay.created_at,
        });
      }
    });

    const defaultToUse = DEFAULT_CERTIFICATES;
    const seen = new Set(dynamic.map((c) => c.id));
    return [...dynamic, ...defaultToUse.filter((c) => !seen.has(c.id))].sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  }, [accounts, extra, profile, user]);

  const filtered = filter === 'all' ? certs : certs.filter((c) => c.type === filter);
  const counts = {
    all: certs.length,
    step1: certs.filter((c) => c.type === 'step1_passed').length,
    funded: certs.filter((c) => c.type === 'funded').length,
    payout: certs.filter((c) => c.type === 'payout').length,
  };

  const download = (c: Certificate) => {
    const blob = new Blob([certHtml(c)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.certificate_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Certificate downloaded');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-md bg-slate-800/70" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="contents"><FsSkeleton className="h-44" /></div>)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FsPageHeader eyebrow="Achievements" title="Certificates" description="Official Funded Shift credentials you've earned." />

      <div className="flex flex-wrap gap-2">
        {(['all', 'step1', 'funded', 'payout'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize', filter === f ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}>
            {f === 'step1' ? 'Step 1 Passed' : f === 'funded' ? 'Funded' : f === 'payout' ? 'Payout' : 'All'} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <FsEmpty icon={<BadgeCheck className="h-5 w-5" />} title="No certificates yet" description="Pass an evaluation phase or complete a funded milestone to earn certificates." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="contents"><CertCard cert={c} onView={() => setView(c)} onDownload={() => download(c)} /></div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {view && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => setView(null)}>
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} onClick={(e) => e.stopPropagation()} className="my-auto w-full max-w-3xl">
              <div className="mb-3 flex items-center justify-end gap-2">
                <button onClick={() => download(view)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"><Download className="h-4 w-4" /> Download</button>
                <button onClick={() => setView(null)} className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"><X className="h-4 w-4" /></button>
              </div>
              <CertDisplay cert={view} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function certTone(type: string) {
  if (type === 'funded') return { ring: 'from-emerald-500/40 via-transparent', icon: TrendingUp, label: 'Funded' };
  if (type === 'payout') return { ring: 'from-indigo-500/40 via-transparent', icon: Award, label: 'Payout' };
  return { ring: 'from-indigo-500/30 via-transparent', icon: FileCheck2, label: 'Step 1' };
}

function CertCard({ cert, onView, onDownload }: { cert: Certificate; onView: () => void; onDownload: () => void }) {
  const tone = certTone(cert.type);
  const Icon = tone.icon;
  return (
    <FsPanel className="group relative overflow-hidden p-5">
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r', tone.ring)} />
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-slate-700 px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-slate-400">{tone.label}</span>
      </div>
      <h3 className="mt-4 font-display text-sm font-bold text-slate-50">{cert.title}</h3>
      <p className="mt-1 text-xs text-slate-500">{cert.subtitle}</p>
      <div className="mt-3 space-y-1 text-xs text-slate-400">
        <p><span className="text-slate-600">Recipient: </span>{cert.recipient_name}</p>
        <p><span className="text-slate-600">Account: </span>#{cert.account_number} · {formatAccountSize(cert.account_size)}</p>
        <p><span className="text-slate-600">Issued: </span>{formatDate(cert.issued_at)}</p>
        {cert.amount ? <p className="fs-num text-indigo-300">{formatCurrency(cert.amount)}</p> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onView} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"><Eye className="h-3.5 w-3.5" /> View</button>
        <button onClick={onDownload} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"><Download className="h-3.5 w-3.5" /> Download</button>
      </div>
    </FsPanel>
  );
}

function CertDisplay({ cert }: { cert: Certificate }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#10162b] via-[#0b0e15] to-[#111327] p-8 text-center shadow-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #6366f1 0, transparent 45%)' }} />
      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/10">
          <ShieldCheck className="h-7 w-7 text-indigo-300" />
        </div>
        <p className="mt-4 font-display text-2xl font-black tracking-wide text-slate-50">{cert.title}</p>
        <p className="mt-1 text-sm text-indigo-200/80">{cert.subtitle}</p>
        <div className="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-400">This certifies that</p>
        <p className="mt-2 font-display text-2xl font-bold text-slate-50">{cert.recipient_name}</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-400">
          has successfully earned the {cert.title} on account <span className="text-slate-200">#{cert.account_number}</span> · {cert.challenge_name} · {formatAccountSize(cert.account_size)}
        </p>
        {cert.amount ? <p className="fs-num mt-2 text-lg font-bold text-emerald-300">{formatCurrency(cert.amount)}</p> : null}
        <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-6 text-left text-xs">
          <div><p className="text-slate-500">Certificate no.</p><p className="fs-num mt-0.5 text-slate-200">{cert.certificate_number}</p></div>
          <div className="text-right"><p className="text-slate-500">Issued</p><p className="fs-num mt-0.5 text-slate-200">{formatDate(cert.issued_at)}</p></div>
        </div>
        <p className="mt-8 text-[10px] text-slate-600">Verify authenticity at fundedshift.trade · signed Funded Shift</p>
      </div>
    </div>
  );
}

function certHtml(c: Certificate): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${c.certificate_number}</title><style>body{background:#0b0e15;color:#e2e8f0;font-family:Arial,Helvetica,sans-serif;padding:30px;text-align:center}.card{max-width:820px;margin:auto;border:2px solid #6366f1;border-radius:20px;padding:60px;background:linear-gradient(145deg,#10162b,#0b0e15)}h1{letter-spacing:.06em}.mono{font-family:ui-monospace,monospace;color:#c7d2fe}</style></head><body><div class="card"><p>FUNDED SHIFT</p><h1>${c.title}</h1><p>${c.subtitle}</p><hr style="width:160px;border-color:#475569"><p>This certifies that</p><h2 style="font-size:30px">${c.recipient_name}</h2><p>has earned this credential on account #${c.account_number} · ${c.challenge_name} · ${formatAccountSize(c.account_size)}</p>${c.amount ? `<p style="font-size:22px;color:#34d399">${formatCurrency(c.amount)}</p>` : ''}<div style="margin-top:30px;font-size:12px;color:#94a3b8">No. <span class="mono">${c.certificate_number}</span></div></div></body></html>`;
}
