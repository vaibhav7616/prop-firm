import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldQuestion,
  Send,
  Copy,
  Check,
  CalendarClock,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFsAccount } from '@/context/account-context';
import { fetchPayoutEligibilityApi, requestPayoutApi } from '@/lib/api-client';
import { fsMetrics } from '@/lib/fs-risk';
import { formatCurrency } from '@/lib/constants';
import { FsPanel, FsPageHeader, StatusPill, FsStat, FsEmpty, RingMeter } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const METHODS = ['UPI', 'Crypto', 'Bank Transfer', 'PayPal'] as const;

export function DashboardPayouts() {
  const { user } = useAuth();
  const { selected } = useFsAccount();
  const [elig, setElig] = useState<any>(null);
  const [loadingElig, setLoadingElig] = useState(false);
  const [open, setOpen] = useState(false);
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
  const [copied, setCopied] = useState(false);

  const m = selected ? fsMetrics(selected) : null;

  useEffect(() => {
    if (!selected || !user) {
      setElig(null);
      return;
    }
    let active = true;
    setLoadingElig(true);
    fetchPayoutEligibilityApi(selected.id, user.id).then((res) => {
      if (active) setElig(res);
      setLoadingElig(false);
    });
    return () => {
      active = false;
    };
  }, [selected?.id, user]);

  if (!selected || !m) {
    return <FsEmpty icon={<Banknote className="h-5 w-5" />} title="No account to check payouts" />;
  }

  const eligible = elig?.eligible === true;
  const estPayout = m.isFunded ? Math.max(0, Math.round(m.netProfit * (m.profitSplit / 100))) : 0;

  const submit = async () => {
    if (!selected || !user) return;
    let payoutAddress = '';
    if (method === 'UPI') payoutAddress = upi;
    else if (method === 'Crypto') payoutAddress = crypto;
    else if (method === 'Bank Transfer') payoutAddress = `${bankHolder} | ${bankName} | ${bankNum} | ${ifsc}`;
    else payoutAddress = paypal;
    if (!payoutAddress.trim()) {
      toast.error('Enter your payout address details.');
      return;
    }
    setSubmitting(true);
    const res = await requestPayoutApi({ userId: user.id, accountId: selected.id, payoutMethod: method, payoutAddress });
    setSubmitting(false);
    if (res.success) {
      toast.success('Payout request submitted. Our team will review it.');
      setOpen(false);
    } else {
      toast.error(res.error || 'Payout request failed.');
    }
  };

  const copyAcct = () => {
    if (!selected) return;
    try {
      navigator.clipboard.writeText(`Funded Shift Account #${selected.account_number ?? selected.id}`);
    } catch { /* */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      <FsPageHeader eyebrow="Earnings" title="Payouts" description="Request and track profit-share withdrawals. Switch account from the top header." />

      {/* Eligibility card */}
      <FsPanel className="relative overflow-hidden p-5">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RingMeter
              value={eligible ? 1 : loadingElig ? 0 : 0}
              tone={eligible ? 'emerald' : 'amber'}
              size={132}
            >
              <div className="text-center">
                {eligible ? <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" /> : <Clock className="mx-auto h-7 w-7 text-amber-400" />}
                <p className="fs-num mt-1 text-xs font-bold text-slate-100">{eligible ? 'ELIGIBLE' : 'PENDING'}</p>
              </div>
            </RingMeter>
          </div>
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="fs-label">Selected account</p>
                <p className="fs-num text-lg font-bold text-slate-50">#{selected.account_number ?? selected.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={eligible ? 'emerald' : eligible === false ? 'rose' : 'amber'}>
                  {loadingElig ? 'Checking…' : eligible ? 'Eligible for payout' : elig?.reason ? 'Not eligible yet' : 'Pending review'}
                </StatusPill>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FsStat label="Account status" value={selected.status} accent={m.isFunded ? 'emerald' : 'indigo'} mono={false} />
              <FsStat label="Profit" value={`${m.netProfit >= 0 ? '+' : ''}${formatCurrency(m.netProfit)}`} hint={m.netProfit >= 0 ? 'up' : 'down'} />
              <FsStat label="Profit split" value={`${m.profitSplit}%`} />
              <FsStat label="Est. available" value={formatCurrency(estPayout)} accent={estPayout > 0 ? 'emerald' : 'slate'} />
            </div>

            {!eligible && !loadingElig && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">
                <p className="flex items-start gap-2"><ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0" /> <span>{elig?.reason || 'This account is not currently eligible for a payout.'}</span></p>
                {!m.isFunded && <p className="mt-1 text-xs text-amber-200/70">Profit share unlocks after the account becomes funded.</p>}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => (eligible ? setOpen(true) : toast.error(elig?.reason || 'Not eligible yet'))}
                disabled={loadingElig}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
              >
                <Send className="h-4 w-4" /> Request payout
              </button>
              <button onClick={copyAcct} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} Copy account ref
              </button>
            </div>
          </div>
        </div>
      </FsPanel>

      {/* history + timeline */}
      <div className="grid gap-5 lg:grid-cols-3">
        <FsPanel className="p-5 lg:col-span-2">
          <p className="fs-label mb-3">Payout history</p>
          <EmptyHistory />
        </FsPanel>
        <FsPanel className="space-y-3 p-5">
          <p className="fs-label">Funded Shift payout policy</p>
          <Policy />
        </FsPanel>
      </div>

      {/* Request modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c0f16] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-50">Request Payout</h3>
                <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><XClose /></button>
              </div>
              <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-xs text-slate-500">Estimated available (gross, before review)</p>
                <p className="fs-num text-2xl font-bold text-emerald-400">{formatCurrency(estPayout)}</p>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {METHODS.map((mm) => (
                  <button key={mm} onClick={() => setMethod(mm)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-semibold', method === mm ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}>{mm}</button>
                ))}
              </div>
              <div className="space-y-2.5">
                {method === 'UPI' && <InputBox label="UPI ID" value={upi} onChange={setUpi} placeholder="name@upi" />}
                {method === 'Crypto' && (
                  <>
                    <label className="block"><span className="fs-label">Network</span><select value={network} onChange={(e) => setNetwork(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100">{['USDT (TRC20)', 'USDT (ERC20)', 'BTC', 'ETH'].map((n) => <option key={n}>{n}</option>)}</select></label>
                    <InputBox label="Wallet address" value={crypto} onChange={setCrypto} placeholder="0x… / bc1…" />
                  </>
                )}
                {method === 'Bank Transfer' && (
                  <>
                    <InputBox label="Account holder" value={bankHolder} onChange={setBankHolder} />
                    <InputBox label="Bank name" value={bankName} onChange={setBankName} />
                    <InputBox label="Account number" value={bankNum} onChange={setBankNum} />
                    <InputBox label="IFSC / routing" value={ifsc} onChange={setIfsc} />
                  </>
                )}
                {method === 'PayPal' && <InputBox label="PayPal email" value={paypal} onChange={setPaypal} />}
              </div>
              <button onClick={submit} disabled={submitting} className="mt-4 w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function XClose() {
  return <span className="block h-4 w-4">✕</span>;
}

function InputBox({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="fs-label">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
    </label>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 py-10 text-center">
      <CalendarClock className="h-8 w-8 text-slate-600" />
      <p className="mt-2 text-sm text-slate-400">No payouts yet</p>
      <p className="mt-1 max-w-xs text-xs text-slate-600">Approved payouts and their statuses will appear here after your first request is processed by the funding desk.</p>
    </div>
  );
}

function Policy() {
  const items = [
    { icon: CircleDollarSign, text: 'Profit split is paid on closed, verified profits.' },
    { icon: CheckCircle2, text: 'Payouts reviewed within 24–72 hours of request.' },
    { icon: AlertCircle, text: 'Requests subject to account-rule and consistency checks.' },
  ];
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={i} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            <p className="text-xs text-slate-400">{it.text}</p>
          </div>
        );
      })}
    </div>
  );
}
