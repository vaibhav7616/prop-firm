import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Eye,
  EyeOff,
  Download,
  ShieldCheck,
  Server,
  User,
  KeyRound,
  Check,
  Wallet,
  CandlestickChart,
  FileText,
} from 'lucide-react';
import { useFsAccount } from '@/context/account-context';
import { fsMetrics, fsAccountMeta, fsTradingDays } from '@/lib/fs-risk';
import { formatCurrency, formatAccountSize, ACCOUNT_STATUS_LABELS, PLATFORM_LABELS } from '@/lib/constants';
import type { TradingAccount } from '@/types';
import { FsPanel, FsPageHeader, FsStat, StatusPill, FsEmpty, FsProgress } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardAccounts() {
  const { accounts, selected, selectAccount, hasBackend } = useFsAccount();
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 1600);
  };

  const downloadCredentials = (acc: TradingAccount) => {
    const broker = acc.broker && acc.broker !== 'N/A' ? acc.broker : 'FundedShift Direct ECN';
    const server = acc.server && acc.server !== 'N/A' ? acc.server : 'FundedShift-Live01';
    const content = `FUNDED SHIFT — TRADING ACCOUNT\n=============================\nAccount:   ${acc.challenge?.name ?? acc.plan_name ?? 'Challenge'}\nSize:      $${acc.account_size.toLocaleString()}\nStatus:    ${ACCOUNT_STATUS_LABELS[acc.status] ?? acc.status}\nPlatform:  ${PLATFORM_LABELS[acc.platform] ?? acc.platform}\n\nBroker:            ${broker}\nServer:            ${server}\nLogin / Account:   ${acc.account_number ?? '—'}\nMaster Password:   ${acc.password ?? '—'}\nInvestor Password: ${acc.investor_password ?? '—'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fundedshift-${acc.account_number ?? acc.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials downloaded');
  };

  if (accounts.length === 0) {
    return (
      <FsEmpty
        icon={<Wallet className="h-5 w-5" />}
        title="No trading accounts"
        description="Once you complete checkout, a challenge account will appear here."
        action={<Link to="/challenges" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">Get funded</Link>}
      />
    );
  }

  const detail = selected;

  return (
    <div className="space-y-6">
      <FsPageHeader
        eyebrow="Portfolio"
        title="Trading Accounts"
        description={hasBackend ? 'Accounts assigned to your profile.' : 'Demo accounts loaded for this environment.'}
        actions={
          <Link to="/challenges" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            + New Challenge
          </Link>
        }
      />

      {/* Account cards selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((acc) => {
          const m = fsMetrics(acc);
          const meta = fsAccountMeta(acc);
          const sel = acc.id === detail?.id;
          return (
            <button
              key={acc.id}
              onClick={() => selectAccount(acc.id)}
              className={cn(
                'relative rounded-xl border p-4 text-left transition-all',
                sel ? 'border-indigo-500/60 bg-indigo-500/[0.06] ring-1 ring-indigo-500/30' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              )}
            >
              {sel && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-indigo-500 px-2 py-px text-[10px] font-bold text-white">Active</span>}
              <div className="flex items-center justify-between">
                <p className="fs-num text-sm font-bold text-slate-100">#{acc.account_number ?? acc.id}</p>
                <StatusPill tone={meta.accent as any}>{ACCOUNT_STATUS_LABELS[acc.status] ?? acc.status}</StatusPill>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{acc.challenge?.name ?? acc.plan_name ?? 'Challenge account'}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="fs-label">Balance</p>
                  <p className="fs-num text-lg font-semibold text-slate-50">{formatCurrency(m.balance)}</p>
                </div>
                <div className="text-right">
                  <p className="fs-label">Size</p>
                  <p className="fs-num text-sm font-semibold text-indigo-300">{formatAccountSize(acc.account_size)}</p>
                </div>
              </div>
              {!m.isFunded && (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Target {m.profitTargetPct}%</span>
                    <span className="fs-num">{(m.targetProgress * 100).toFixed(0)}%</span>
                  </div>
                  <FsProgress value={m.targetProgress} className="mt-1" />
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-600">Trading days: {fsTradingDays(acc)} · 1:{m.leverage}</p>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {detail && <Detail account={detail} reveal={reveal[detail.id]} onToggle={() => setReveal((r) => ({ ...r, [detail.id]: !r[detail.id] }))} onCopy={copy} onDownload={() => downloadCredentials(detail)} copied={copied} />}
    </div>
  );
}

function Detail({
  account,
  reveal,
  onToggle,
  onCopy,
  onDownload,
  copied,
}: {
  account: TradingAccount;
  reveal?: boolean;
  onToggle: () => void;
  onCopy: (text: string, key: string) => void;
  onDownload: () => void;
  copied: string | null;
}) {
  const m = fsMetrics(account);
  const meta = fsAccountMeta(account);
  const cred: Array<{ label: string; icon: any; value: string; secret?: boolean; key: string }> = [
    { label: 'Broker', icon: ShieldCheck, value: account.broker || 'FundedShift Direct ECN', key: 'broker' },
    { label: 'Server', icon: Server, value: account.server || 'FundedShift-Live01', key: 'server' },
    { label: 'Account Number', icon: User, value: account.account_number || '—', key: 'acc' },
    { label: 'Master Password', icon: KeyRound, value: account.password || '—', secret: true, key: 'pass' },
    { label: 'Investor Password', icon: KeyRound, value: account.investor_password || '—', secret: true, key: 'inv' },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <FsPanel className="space-y-4 p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="fs-label">Account Detail</p>
            <h3 className="font-display text-lg font-bold text-slate-50">
              #{account.account_number ?? account.id} <span className="text-slate-400">· {formatAccountSize(account.account_size)}</span>
            </h3>
            <p className="text-xs text-slate-500">{account.challenge?.name ?? account.plan_name}</p>
          </div>
          <StatusPill tone={meta.accent as any}>{ACCOUNT_STATUS_LABELS[account.status] ?? account.status}</StatusPill>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Balance" value={formatCurrency(m.balance)} />
          <MiniStat label="Profit" value={`${m.netProfit >= 0 ? '+' : ''}${formatCurrency(m.netProfit)}`} tone={m.netProfit >= 0 ? 'up' : 'down'} />
          <MiniStat label="Equity" value={formatCurrency(m.balance)} />
          <MiniStat label="Trading days" value={String(fsTradingDays(account))} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="fs-label">Trading Objectives</p>
            <Link to="/dashboard/objectives" className="text-xs text-indigo-300 hover:text-indigo-200">Full view</Link>
          </div>
          {m.isFunded ? (
            <p className="text-sm text-slate-400">Funded account — no evaluation target remains. Track payouts from the Payouts page.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400"><span>Profit target {m.profitTargetPct}%</span><span className="fs-num text-slate-200">{formatCurrency(m.netProfit)} / {formatCurrency(m.targetAmt)}</span></div>
                <FsProgress value={m.targetProgress} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Min days: </span>
                  <span className="fs-num text-slate-200">{fsTradingDays(account)} / {m.minDays || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Leverage: </span>
                  <span className="fs-num text-slate-200">1:{m.leverage}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link to="/dashboard/trading" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            <CandlestickChart className="h-4 w-4" /> Open Web Terminal
          </Link>
          <Link to="/dashboard/orders" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            <FileText className="h-4 w-4" /> View related orders
          </Link>
        </div>
      </FsPanel>

      <FsPanel className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="fs-label">Login Credentials</p>
          <button onClick={onToggle} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
            {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {reveal ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div className="space-y-2.5">
          {cred.map((c) => {
            const Icon = c.icon;
            const val = reveal ? c.value : c.secret ? '••••••••' : c.value;
            return (
              <div key={c.key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</p>
                  <p className={cn('fs-num truncate text-sm text-slate-100', c.secret && !reveal && 'tracking-widest')}>{val}</p>
                </div>
                <button onClick={() => onCopy(c.value, c.key)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100" title="Copy">
                  {copied === c.key ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={onDownload} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
          <Download className="h-4 w-4" /> Download credentials
        </button>
        <p className="mt-3 text-[11px] text-slate-600">These are your broker login details for this account. Keep them private.</p>
      </FsPanel>
    </div>
  );
}

function MiniStat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
      <p className="fs-label">{label}</p>
      <p className={cn('fs-num mt-1 text-base font-semibold', tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-slate-100')}>{value}</p>
    </div>
  );
}
