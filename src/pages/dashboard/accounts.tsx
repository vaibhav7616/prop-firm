import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Wallet,
  Copy,
  Eye,
  EyeOff,
  Download,
  ArrowRight,
  Terminal,
  BarChart3,
  Award,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Search,
  Filter,
  Check,
  Layers,
  Key,
  ShieldAlert,
  Server,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  formatAccountSize,
  formatCurrency,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_COLORS,
  PLATFORM_LABELS,
} from '@/lib/constants';
import type { TradingAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, getAccountPassword } from '@/lib/utils';
import { toast } from 'sonner';

import { DEFAULT_ACCOUNTS } from '@/lib/default-data';
import { fetchUserAccounts } from '@/lib/api-client';

export function DashboardAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [showInvestorPassword, setShowInvestorPassword] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'funded' | 'passed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setAccounts(DEFAULT_ACCOUNTS);
        setLoading(false);
        return;
      }
      try {
        const userAccs = await fetchUserAccounts(user.id);
        if (userAccs && userAccs.length > 0) {
          setAccounts(userAccs);
        } else {
          setAccounts(DEFAULT_ACCOUNTS);
        }
      } catch (_) {
        setAccounts(DEFAULT_ACCOUNTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const copyToClipboard = (text: string, label: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllCredentials = (account: TradingAccount) => {
    const broker = account.broker && account.broker !== 'N/A' ? account.broker : 'FundedShift Direct ECN';
    const server = account.server && account.server !== 'N/A' ? account.server : 'FundedShift-Live01';
    const accNum = account.account_number || '7829401';
    const pass = getAccountPassword(account);
    const invPass = account.investor_password || `InvPass${accNum}!`;

    const fullText = `Server: ${server}\nBroker: ${broker}\nAccount Number: ${accNum}\nMaster Password: ${pass}\nInvestor Password: ${invPass}`;
    navigator.clipboard.writeText(fullText);
    toast.success('All credentials copied to clipboard!');
  };

  const downloadCredentials = (account: TradingAccount) => {
    const broker = account.broker && account.broker !== 'N/A' ? account.broker : 'FundedShift Direct ECN';
    const server = account.server && account.server !== 'N/A' ? account.server : 'FundedShift-Live01';
    const accNum = account.account_number || '7829401';
    const pass = getAccountPassword(account);
    const invPass = account.investor_password || `InvPass${accNum}!`;

    const content = `================================================
FUNDED SHIFT OFFICIAL TRADING ACCOUNT CREDENTIALS
================================================
Account Name:     ${account.challenge?.name ?? 'Challenge Account'}
Platform:         ${PLATFORM_LABELS[account.platform as keyof typeof PLATFORM_LABELS] ?? 'FundedShift Web Terminal'}
Account Size:     $${account.account_size.toLocaleString()}
Status:           ${ACCOUNT_STATUS_LABELS[account.status]}

------------------------------------------------
LOGIN DETAILS
------------------------------------------------
Broker:           ${broker}
Server:           ${server}
Login / Account:  ${accNum}
Password:         ${pass}
Investor Pass:    ${invPass}
================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FundedShift_Credentials_${accNum}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials TXT file downloaded');
  };

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Tab filter
      if (activeTab === 'active' && acc.status !== 'active') return false;
      if (activeTab === 'funded' && acc.status !== 'funded') return false;
      if (activeTab === 'passed' && acc.status !== 'passed') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (acc.account_number || '').toLowerCase();
        const name = (acc.challenge?.name || '').toLowerCase();
        return num.includes(q) || name.includes(q);
      }
      return true;
    });
  }, [accounts, activeTab, searchQuery]);

  // Combined Portfolio Metrics
  const portfolioStats = useMemo(() => {
    const totalCap = accounts.reduce((sum, a) => sum + (a.account_size || 0), 0);
    const totalEquity = accounts.reduce((sum, a) => {
      const bal = Number.isFinite(a.current_balance) ? a.current_balance : (a.account_size || 0);
      return sum + bal;
    }, 0);
    const totalPnl = totalEquity - totalCap;
    const fundedAccs = accounts.filter((a) => a.status === 'funded').length;
    const activeAccs = accounts.filter((a) => a.status === 'active').length;

    return { totalCap, totalEquity, totalPnl, fundedAccs, activeAccs };
  }, [accounts]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-card border border-border/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & New Account CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Trading Accounts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your funded evaluation credentials, platform servers, and live account parameters.
          </p>
        </div>

        <Link to="/challenges">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-2">
            <PlusCircle className="h-4 w-4" /> Get New Challenge
          </Button>
        </Link>
      </div>

      {/* Portfolio Overview Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Managed Capital</p>
          <p className="font-display text-xl font-bold mt-1 text-foreground">
            {formatCurrency(portfolioStats.totalCap)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{accounts.length} Total Accounts</p>
        </div>

        <div className="bg-card border border-border/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Combined Balance</p>
          <p className="font-display text-xl font-bold mt-1 text-foreground">
            {formatCurrency(portfolioStats.totalEquity)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Real-time Sync
          </p>
        </div>

        <div className="bg-card border border-border/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Portfolio P&L</p>
          <p
            className={cn(
              'font-display text-xl font-bold mt-1',
              portfolioStats.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {portfolioStats.totalPnl >= 0 ? '+' : ''}
            {formatCurrency(portfolioStats.totalPnl)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Overall Floating Return</p>
        </div>

        <div className="bg-card border border-border/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Status Tiers</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/20">
              {portfolioStats.fundedAccs} Funded
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 text-xs font-bold border border-blue-500/20">
              {portfolioStats.activeAccs} Evaluation
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 p-2 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: `All (${accounts.length})` },
              { id: 'active', label: `Active (${accounts.filter((a) => a.status === 'active').length})` },
              { id: 'funded', label: `Funded (${accounts.filter((a) => a.status === 'funded').length})` },
              { id: 'passed', label: `Passed (${accounts.filter((a) => a.status === 'passed').length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search account # or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-border/80 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-sm">
          <Wallet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg text-foreground">No matching accounts found</h3>
          <p className="text-muted-foreground text-xs mt-1 max-w-md mx-auto">
            Try resetting your active tab filters or search query to view your assigned trading accounts.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className="mt-4"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAccounts.map((account, idx) => {
            const curBal = Number.isFinite(account.current_balance)
              ? account.current_balance
              : account.account_size || 100000;
            const startBal = Number.isFinite(account.starting_balance)
              ? account.starting_balance
              : account.account_size || 100000;
            const rawProfit =
              typeof account.profit === 'number' && !isNaN(account.profit)
                ? account.profit
                : curBal - startBal;
            const profitVal = Number.isFinite(rawProfit) ? rawProfit : 0;
            const profitPct = startBal > 0 ? (profitVal / startBal) * 100 : 0;

            const targetPct = 10; // Default 10% target
            const targetAmount = startBal * (1 + targetPct / 100);
            const progressRatio = Math.min(100, Math.max(0, (profitVal / (startBal * 0.1)) * 100));

            const hasEarnedCert =
              account.status === 'passed' || account.status === 'funded' || account.phase > 1;

            // Fallback credentials formatting
            const broker = account.broker && account.broker !== 'N/A' ? account.broker : 'FundedShift Direct ECN';
            const server = account.server && account.server !== 'N/A' ? account.server : 'FundedShift-Live01';
            const accNumber = account.account_number || '7829401';
            const masterPass = getAccountPassword(account);
            const investorPass = account.investor_password || `InvPass${accNumber}!`;
            const platformName =
              PLATFORM_LABELS[account.platform as keyof typeof PLATFORM_LABELS] || 'FundedShift Web Terminal';

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
              >
                <Card className="bg-card border border-border/90 hover:border-border shadow-sm rounded-2xl overflow-hidden transition-all">
                  {/* Account Card Header */}
                  <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="font-display font-black text-white text-sm">
                          {formatAccountSize(account.account_size)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-display text-lg font-bold text-white tracking-wide">
                            {account.challenge?.name ?? '100K Challenge'}
                          </h2>
                          <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1">
                            #{accNumber}
                            <button
                              onClick={() => copyToClipboard(accNumber, 'Account Number', `acc-${account.id}`)}
                              className="text-slate-400 hover:text-white transition-colors ml-0.5"
                              title="Copy Account Number"
                            >
                              {copiedField === `acc-${account.id}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{platformName}</span>
                          <span>•</span>
                          <span>Server: <strong className="text-slate-200">{server}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={cn(
                          'text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm',
                          ACCOUNT_STATUS_COLORS[account.status]
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        {ACCOUNT_STATUS_LABELS[account.status]}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-6">
                    {/* Performance Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-border/60">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Current Balance
                        </p>
                        <p className="font-display text-lg font-bold text-foreground mt-0.5">
                          {formatCurrency(curBal)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Base: {formatCurrency(startBal)}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Profit / Loss
                        </p>
                        <p
                          className={cn(
                            'font-display text-lg font-bold mt-0.5',
                            profitVal >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          )}
                        >
                          {profitVal >= 0 ? '+' : ''}
                          {formatCurrency(profitVal)}{' '}
                          <span className="text-xs font-normal">
                            ({profitVal >= 0 ? '+' : ''}
                            {profitPct.toFixed(2)}%)
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Net Closed P&L</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Trading Days
                        </p>
                        <p className="font-display text-lg font-bold text-foreground mt-0.5">
                          {account.trading_days}{' '}
                          <span className="text-xs text-muted-foreground font-normal">/ 3 Min</span>
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium">Requirement Passed</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Challenge Phase
                        </p>
                        <p className="font-display text-lg font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                          Phase {account.phase}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {account.status === 'funded' ? 'Funded Capital Account' : 'Evaluation Stage'}
                        </p>
                      </div>
                    </div>

                    {/* Target & Drawdown Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Profit Target Progress */}
                      <div className="bg-card border border-border/70 p-3.5 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" /> Profit Target ({targetPct}%)
                          </span>
                          <span className="font-mono text-muted-foreground font-medium">
                            {formatCurrency(profitVal)} / {formatCurrency(startBal * 0.1)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progressRatio}%` }}
                          />
                        </div>
                      </div>

                      {/* Overall Drawdown Floor */}
                      <div className="bg-card border border-border/70 p-3.5 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Max Drawdown Buffer
                          </span>
                          <span className="font-mono text-emerald-600 font-semibold">100% Safe (Safe Buffer)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-full rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Institutional Login Credentials Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white space-y-3 shadow-inner">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Live Execution Login Credentials
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyAllCredentials(account)}
                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700"
                          >
                            <Copy className="h-3 w-3" /> Copy All Credentials
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        {/* Broker */}
                        <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Broker</p>
                            <p className="font-medium font-mono text-slate-200 mt-0.5">{broker}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(broker, 'Broker', `brk-${account.id}`)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Server */}
                        <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Server</p>
                            <p className="font-medium font-mono text-emerald-400 mt-0.5">{server}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(server, 'Server', `srv-${account.id}`)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Account Number */}
                        <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Account Number</p>
                            <p className="font-bold font-mono text-white mt-0.5">{accNumber}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(accNumber, 'Account Number', `num-${account.id}`)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Password */}
                        <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Master Password</p>
                            <p className="font-medium font-mono text-slate-200 mt-0.5">
                              {showPassword[account.id] ? masterPass : '••••••••'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowPassword((p) => ({ ...p, [account.id]: !p[account.id] }))}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              {showPassword[account.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(masterPass, 'Master Password', `pw-${account.id}`)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Investor Password */}
                        <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Investor (Read-Only)</p>
                            <p className="font-medium font-mono text-slate-200 mt-0.5">
                              {showInvestorPassword[account.id] ? investorPass : '••••••••'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setShowInvestorPassword((p) => ({ ...p, [account.id]: !p[account.id] }))
                              }
                              className="text-slate-400 hover:text-white p-1"
                            >
                              {showInvestorPassword[account.id] ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(investorPass, 'Investor Password', `inv-${account.id}`)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Download File button */}
                        <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Backup File</p>
                            <p className="font-medium text-slate-300 mt-0.5">.txt Config</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadCredentials(account)}
                            className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 p-1 px-2"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to="/dashboard/trading">
                          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm">
                            <Terminal className="h-3.5 w-3.5" /> Launch Web Terminal
                          </Button>
                        </Link>

                        <Link to={`/dashboard/objectives?account=${account.id}`}>
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <BarChart3 className="h-3.5 w-3.5" /> Trading Objectives & Risk
                          </Button>
                        </Link>
                      </div>

                      {hasEarnedCert ? (
                        <Link to="/dashboard/certificates">
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs gap-1 shadow-sm"
                          >
                            <Award className="h-3.5 w-3.5" /> View Earned Certificate
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                          Complete Phase 1 profit target to unlock official certificate
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
