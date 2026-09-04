import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Network, Copy, Check, Users, MousePointerClick, TrendingUp, Wallet, Share2, ArrowUpRight, X, Send } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/constants';
import type { Affiliate } from '@/types';
import { fetchAffiliateWithdrawalsApi, submitAffiliateWithdrawalApi } from '@/lib/api-client';
import { FsPanel, FsPageHeader, FsStat, FsSkeleton, StatusPill } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const METHODS = ['UPI', 'Crypto', 'Bank Transfer', 'PayPal'] as const;

export function DashboardAffiliate() {
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_earnings: 0, approved_withdrawn: 0, pending_withdrawn: 0, available_balance: 0, min_withdrawal: 250 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // withdrawal modal
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState<(typeof METHODS)[number]>('UPI');
  const [upi, setUpi] = useState('');
  const [network, setNetwork] = useState('USDT (TRC20)');
  const [crypto, setCrypto] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankNum, setBankNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [paypal, setPaypal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const userId = user?.id || 'demo-trader-id-12345';
    try {
      const res = await fetchAffiliateWithdrawalsApi(userId);
      if (res) {
        setWithdrawals(res.withdrawals || []);
        if (res.stats) setStats(res.stats);
      }
    } catch {
      /* fall to defaults below */
    }
    if (stats.total_earnings === 0 && !affiliate) {
      setStats({ total_earnings: 0, approved_withdrawn: 0, pending_withdrawn: 0, available_balance: 0, min_withdrawal: 250 });
    }
    setAffiliate({
      id: `aff-${userId}`,
      user_id: userId,
      referral_code: profile?.affiliate_code || '',
      code: profile?.affiliate_code || '',
      clicks: 0,
      conversions: 0,
      earnings: 0,
      withdrawn: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const code = profile?.affiliate_code || affiliate?.code || '';
  const link = `${window.location.origin}/register${code ? `?ref=${code}` : ''}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* */ }
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1600);
  };

  const min = stats.min_withdrawal || 250;
  const available = stats.available_balance || 0;
  const totalEarnings = stats.total_earnings || 0;
  const paid = stats.approved_withdrawn || 0;
  const pending = stats.pending_withdrawn || 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (amount < min) return toast.error(`Minimum withdrawal is $${min}.`);
    if (amount > available) return toast.error(`Amount exceeds available balance (${formatCurrency(available)}).`);
    let details: any;
    if (method === 'UPI') {
      if (!upi.trim()) return toast.error('Enter a valid UPI ID.');
      details = { upi_id: upi.trim() };
    } else if (method === 'Crypto') {
      if (!crypto.trim()) return toast.error('Enter your wallet address.');
      details = { crypto_network: network, wallet_address: crypto.trim() };
    } else if (method === 'Bank Transfer') {
      if (!bankHolder.trim() || !bankName.trim() || !bankNum.trim() || !ifsc.trim()) return toast.error('Fill in all bank details.');
      details = { account_holder: bankHolder.trim(), bank_name: bankName.trim(), account_number: bankNum.trim(), ifsc_code: ifsc.trim() };
    } else {
      if (!paypal.trim() || !paypal.includes('@')) return toast.error('Enter a valid PayPal email.');
      details = { paypal_email: paypal.trim() };
    }
    setSubmitting(true);
    try {
      const res = await submitAffiliateWithdrawalApi({ userId: user?.id || 'demo-trader-id-12345', amount, method, payment_details: details });
      if (res?.success) {
        toast.success(`Withdrawal of $${amount} submitted (pending approval).`);
        setOpen(false);
        await load();
      } else {
        toast.error(res?.error || 'Withdrawal failed.');
      }
    } catch {
      toast.error('Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-md bg-slate-800/70" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="contents"><FsSkeleton className="h-24" /></div>)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FsPageHeader
        eyebrow="Referrals"
        title="Affiliate"
        description="Earn 15% commission on every funded account your referrals buy."
      />

      {/* referral link */}
      <FsPanel className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="fs-label">Your referral code</p>
            <p className="fs-num mt-1 font-mono text-lg font-bold text-indigo-300">{code || '—'}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"><Network className="h-3.5 w-3.5" /> Active</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300">{link || 'No affiliate code assigned yet.'}</div>
          <button onClick={() => code && copy(link)} disabled={!code} className="rounded-lg bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </FsPanel>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FsStat label="Total commission" value={formatCurrency(totalEarnings)} accent={totalEarnings > 0 ? 'emerald' : 'slate'} />
        <FsStat label="Available" value={formatCurrency(available)} accent="indigo" />
        <FsStat label="Paid out" value={formatCurrency(paid)} />
        <FsStat label="Pending" value={formatCurrency(pending)} accent="amber" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FsStat label="Referrals (clicks)" value={String(affiliate?.clicks ?? 0)} />
        <FsStat label="Conversions" value={String(affiliate?.conversions ?? 0)} />
        <FsStat label="Commission rate" value="15%" />
        <FsStat label="Min withdrawal" value={formatCurrency(min)} />
      </div>

      {/* CTA + withdrawals */}
      <div className="grid gap-5 lg:grid-cols-3">
        <FsPanel className="flex flex-col p-5 lg:col-span-1">
          <p className="fs-label mb-2">Withdraw earnings</p>
          <p className="text-sm text-slate-400">Available balance {formatCurrency(available)}</p>
          <button
            onClick={() => {
              if (available < min) return toast.error(`Minimum withdrawal is $${min}.`);
              setAmount(available);
              setOpen(true);
            }}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            <Wallet className="h-4 w-4" /> Request withdrawal
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><ArrowUpRight className="h-3.5 w-3.5" /> Via UPI, crypto, bank or PayPal</div>
        </FsPanel>

        <FsPanel className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="fs-label">Withdrawal history</p>
            <button onClick={load} className="text-xs text-slate-500 hover:text-slate-300">Refresh</button>
          </div>
          {withdrawals.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No withdrawal requests yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {withdrawals.map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="fs-num font-medium text-slate-100">{formatCurrency(w.amount)}</p>
                    <p className="text-[11px] text-slate-500">{w.method} · {new Date(w.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <StatusPill tone={/PAID|APPROVED|COMPLETED/i.test(w.status) ? 'emerald' : /PENDING/i.test(w.status) ? 'amber' : 'rose'}>
                    {w.status || 'Pending'}
                  </StatusPill>
                </div>
              ))}
            </div>
          )}
        </FsPanel>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
            <motion.form onSubmit={submit} initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c0f16] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-50">Withdraw commission</h3>
                <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button>
              </div>
              <label className="block">
                <span className="fs-label">Amount (min ${min})</span>
                <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} min={min} max={available} className="fs-num mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none" />
              </label>
              <div className="mb-3 mt-3 flex flex-wrap gap-1.5">
                {METHODS.map((mm) => (
                  <button key={mm} type="button" onClick={() => setMethod(mm)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-semibold', method === mm ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}>{mm}</button>
                ))}
              </div>
              <div className="space-y-2.5">
                {method === 'UPI' && <AField label="UPI ID" value={upi} onChange={setUpi} placeholder="name@upi" />}
                {method === 'Crypto' && (
                  <>
                    <label className="block"><span className="fs-label">Network</span><select value={network} onChange={(e) => setNetwork(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100">{['USDT (TRC20)', 'USDT (ERC20)', 'BTC', 'ETH'].map((n) => <option key={n}>{n}</option>)}</select></label>
                    <AField label="Wallet address" value={crypto} onChange={setCrypto} />
                  </>
                )}
                {method === 'Bank Transfer' && (
                  <>
                    <AField label="Account holder" value={bankHolder} onChange={setBankHolder} />
                    <AField label="Bank name" value={bankName} onChange={setBankName} />
                    <AField label="Account number" value={bankNum} onChange={setBankNum} />
                    <AField label="IFSC / SWIFT" value={ifsc} onChange={setIfsc} />
                  </>
                )}
                {method === 'PayPal' && <AField label="PayPal email" value={paypal} onChange={setPaypal} />}
              </div>
              <button type="submit" disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
                <Send className="h-4 w-4" /> {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="fs-label">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
    </label>
  );
}
