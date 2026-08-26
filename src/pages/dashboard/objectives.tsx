import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  TrendingDown,
  Calendar,
  BarChart3,
  Check,
  X,
  ArrowRight,
  ChevronDown,
  LineChart,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  formatAccountSize,
  formatCurrency,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_COLORS,
} from '@/lib/constants';
import type { TradingAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function DashboardObjectives() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const detailedSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { fetchUserAccounts } = await import('@/lib/api-client');
        const accs = await fetchUserAccounts(user.id);
        setAccounts(accs);
        const queryAccount = searchParams.get('account');
        if (queryAccount && accs.some((a) => a.id === queryAccount)) {
          setSelectedId(queryAccount);
        } else if (accs.length > 0) {
          setSelectedId(accs[0].id);
        }
      } catch (_) {
        const { DEFAULT_ACCOUNTS } = await import('@/lib/default-data');
        setAccounts(DEFAULT_ACCOUNTS);
        const queryAccount = searchParams.get('account');
        if (queryAccount && DEFAULT_ACCOUNTS.some((a) => a.id === queryAccount)) {
          setSelectedId(queryAccount);
        } else if (DEFAULT_ACCOUNTS.length > 0) {
          setSelectedId(DEFAULT_ACCOUNTS[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, searchParams]);

  const handleSelectAccount = (accId: string, scrollToDetail = false) => {
    setSelectedId(accId);
    setSearchParams({ account: accId }, { replace: true });
    if (scrollToDetail && detailedSectionRef.current) {
      detailedSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selected = accounts.find((a) => a.id === selectedId) || accounts[0];

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-secondary animate-pulse rounded-lg" />
          <div className="h-4 w-96 bg-secondary/60 animate-pulse rounded-lg" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Target className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">No Trading Accounts Found</h2>
        <p className="text-muted-foreground text-sm mb-6">
          You don't have any active challenges or funded accounts yet. Start your trader evaluation today.
        </p>
        <Link to="/challenges">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm">
            Get Funded · Buy Challenge
          </Button>
        </Link>
      </div>
    );
  }

  // Selected account calculations
  const rawRules = selected?.rules || {};
  const accountSize = selected?.account_size || 100000;
  const curBal = Number.isFinite(selected?.current_balance) ? selected.current_balance : accountSize;
  const startBal = Number.isFinite(selected?.starting_balance) ? selected.starting_balance : accountSize;
  const currentProfit = Number.isFinite(selected?.profit) ? selected.profit : curBal - startBal;

  const isInstant =
    (selected?.challenge_type || selected?.challenge?.type || '').toLowerCase().includes('instant') ||
    selected?.status === 'funded';
  const isPhase2 = selected?.phase === 2;

  const profitTargetPct =
    rawRules.profit_target ??
    (rawRules as any).profit_target_percent ??
    (isInstant ? 0 : isPhase2 ? 5 : 8);
  const maxDrawdownPct = rawRules.max_drawdown ?? (rawRules as any).max_loss_limit_percent ?? 10;
  const dailyDrawdownPct = rawRules.daily_drawdown ?? (rawRules as any).daily_loss_limit_percent ?? 5;
  const profitSplitPct =
    rawRules.profit_split ?? (rawRules as any).profit_split_percent ?? (isInstant ? 70 : 80);
  const leverageVal = rawRules.leverage ?? 100;
  const consistencyPct =
    rawRules.consistency ?? (rawRules as any).consistency_rule_percent ?? 50;
  const minDays = rawRules.min_trading_days ?? 3;
  const maxDays = rawRules.max_trading_days ?? 0;
  const newsAllowed = rawRules.news_trading ?? (rawRules as any).news_trading_allowed ?? true;
  const weekendAllowed =
    rawRules.weekend_holding ?? (rawRules as any).weekend_holding_allowed ?? true;
  const scalingPlan = rawRules.scaling_plan ?? true;

  const profitTargetAmount = profitTargetPct > 0 ? (accountSize * profitTargetPct) / 100 : 0;
  const maxDrawdownAmount = (accountSize * maxDrawdownPct) / 100;
  const dailyDrawdownAmount = (accountSize * dailyDrawdownPct) / 100;

  const profitProgress =
    profitTargetAmount > 0
      ? Math.min(100, Math.max(0, (currentProfit / profitTargetAmount) * 100))
      : 100;
  const drawdownUsed =
    maxDrawdownAmount > 0
      ? Math.min(100, (Math.abs(Math.min(0, currentProfit)) / maxDrawdownAmount) * 100)
      : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Trading Objectives
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          Track your evaluation progress, profit milestones, and risk parameters across all accounts.
        </p>
      </div>

      {/* Accounts List (Exact UI from Screenshot) */}
      <div className="space-y-4">
        {accounts.map((account, idx) => {
          const accRules = account.rules || {};
          const isAccInstant =
            (account.challenge_type || account.challenge?.type || '').toLowerCase().includes('instant') ||
            account.status === 'funded';
          const accProfitTargetPct =
            accRules.profit_target ??
            (accRules as any)?.profit_target_percent ??
            (isAccInstant ? 0 : account.phase === 2 ? 5 : 8);
          const accProfitTargetAmount =
            accProfitTargetPct > 0 ? (account.account_size * accProfitTargetPct) / 100 : 0;
          const accCurBal = Number.isFinite(account.current_balance)
            ? account.current_balance
            : account.account_size;
          const accStartBal = Number.isFinite(account.starting_balance)
            ? account.starting_balance
            : account.account_size;
          const accProfit = Number.isFinite(account.profit)
            ? account.profit
            : accCurBal - accStartBal;
          const accProgress =
            accProfitTargetAmount > 0
              ? Math.min(100, Math.max(0, (accProfit / accProfitTargetAmount) * 100))
              : 100;
          const isSelected = selected?.id === account.id;

          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
              onClick={() => handleSelectAccount(account.id, false)}
              className={cn(
                'group relative rounded-2xl bg-card border p-6 transition-all duration-200 cursor-pointer shadow-xs',
                isSelected
                  ? 'border-brand-500/80 ring-2 ring-brand-500/20 dark:border-brand-400/80 dark:ring-brand-400/20'
                  : 'border-border/80 hover:border-slate-400 dark:hover:border-slate-600'
              )}
            >
              {/* Top Row: Account Badge, Title, Phase & Status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Blue 100K Badge as in screenshot */}
                  <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                    <span>{formatAccountSize(account.account_size)}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                      {account.challenge?.name || `${formatAccountSize(account.account_size)} Account`}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Phase {account.phase || 1} · {account.trading_days || 0} trading days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      <Check className="h-3 w-3" /> Active View
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium',
                      ACCOUNT_STATUS_COLORS[account.status] || 'bg-secondary text-foreground'
                    )}
                  >
                    {ACCOUNT_STATUS_LABELS[account.status] || account.status}
                  </span>
                </div>
              </div>

              {/* Progress Row */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-medium text-foreground">
                    Profit Target {accProfitTargetPct > 0 ? `(${accProfitTargetPct}%)` : '(Funded)'}
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {accProfitTargetAmount > 0
                      ? `${formatCurrency(accProfit)} / ${formatCurrency(accProfitTargetAmount)}`
                      : `${formatCurrency(accProfit)} (No Limit)`}
                  </span>
                </div>

                {/* Progress bar container matching screenshot */}
                <div className="h-2.5 w-full bg-brand-100 dark:bg-brand-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 dark:bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${accProgress}%` }}
                  />
                </div>
              </div>

              {/* View Detailed Objectives Link as in screenshot */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAccount(account.id, true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group-hover:underline"
                >
                  <span>View Detailed Objectives</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div className="text-xs text-muted-foreground font-mono">
                  {accProgress.toFixed(1)}% complete
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Account Detailed Objectives Section */}
      {selected && (
        <div ref={detailedSectionRef} className="space-y-6 pt-4 border-t border-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>Detailed Objectives Breakdown</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Detailed real-time metrics for {selected.challenge?.name || `${formatAccountSize(selected.account_size)} Account`} (Phase {selected.phase || 1})
              </p>
            </div>

            {/* Quick Switch Dropdown if multiple accounts */}
            {accounts.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:inline">Account:</span>
                <select
                  value={selected.id}
                  onChange={(e) => handleSelectAccount(e.target.value, false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card border border-border text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {formatAccountSize(acc.account_size)} (Phase {acc.phase || 1}) - {ACCOUNT_STATUS_LABELS[acc.status]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 4 Objective Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Profit Target */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="bg-card border-border/80 shadow-xs hover:border-brand-500/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-base font-bold">Profit Target</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {profitTargetPct > 0
                            ? `${profitTargetPct}% target (${formatCurrency(profitTargetAmount)})`
                            : 'No Profit Cap (Funded)'}
                        </p>
                      </div>
                    </div>
                    {profitProgress >= 100 && profitTargetAmount > 0 ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Passed
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-medium text-muted-foreground">
                        {profitProgress.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-baseline justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Current Realized Profit</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(currentProfit)}
                      {profitTargetAmount > 0 && ` / ${formatCurrency(profitTargetAmount)}`}
                    </span>
                  </div>
                  <Progress value={profitProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      {profitProgress >= 100
                        ? 'Target achieved. Ready for review/next phase.'
                        : `${formatCurrency(Math.max(0, profitTargetAmount - currentProfit))} remaining to pass target.`}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* 2. Maximum Drawdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
            >
              <Card className="bg-card border-border/80 shadow-xs hover:border-brand-500/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <TrendingDown className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-base font-bold">Maximum Drawdown</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {maxDrawdownPct}% of starting balance ({formatCurrency(maxDrawdownAmount)})
                        </p>
                      </div>
                    </div>
                    {drawdownUsed >= 100 ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 flex items-center gap-1 border border-rose-500/20">
                        <X className="h-3 w-3" /> Breached
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Safe
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-baseline justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Max Loss Buffer Used</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(Math.min(0, currentProfit))} / -{formatCurrency(maxDrawdownAmount)}
                    </span>
                  </div>
                  <Progress
                    value={drawdownUsed}
                    className={cn(
                      'h-2',
                      drawdownUsed > 75 ? '[&>div]:bg-rose-500' : drawdownUsed > 50 ? '[&>div]:bg-amber-500' : ''
                    )}
                  />
                  <p className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      {drawdownUsed >= 100
                        ? 'Drawdown limit breached.'
                        : `${formatCurrency(maxDrawdownAmount + Math.min(0, currentProfit))} loss cushion remaining.`}
                    </span>
                    <span className="font-mono">{drawdownUsed.toFixed(1)}% used</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3. Daily Drawdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <Card className="bg-card border-border/80 shadow-xs hover:border-brand-500/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-base font-bold">Daily Drawdown</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {dailyDrawdownPct}% daily risk limit ({formatCurrency(dailyDrawdownAmount)})
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                      <Check className="h-3 w-3" /> Safe
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-baseline justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Today's Max Loss Limit</span>
                    <span className="font-mono font-bold text-foreground">
                      -{formatCurrency(dailyDrawdownAmount)}
                    </span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>Resets daily at 00:00 server time based on starting day equity.</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* 4. Trading Days */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              <Card className="bg-card border-border/80 shadow-xs hover:border-brand-500/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-base font-bold">Trading Days</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Min {minDays} trading days{maxDays ? ` · Max ${maxDays} days` : ' · No time limit'}
                        </p>
                      </div>
                    </div>
                    {(selected.trading_days || 0) >= minDays ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Met
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-medium text-muted-foreground">
                        {selected.trading_days || 0}/{minDays}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-baseline justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Days Completed</span>
                    <span className="font-mono font-bold text-foreground">
                      {selected.trading_days || 0} / {minDays || '∞'}
                    </span>
                  </div>
                  <Progress
                    value={minDays > 0 ? Math.min(100, ((selected.trading_days || 0) / minDays) * 100) : 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(selected.trading_days || 0) >= minDays ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Minimum trading days criteria met.
                      </span>
                    ) : (
                      `${minDays - (selected.trading_days || 0)} more trading day(s) required to pass evaluation.`
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Challenge Rules & Account Specs Grid */}
          <Card className="bg-card border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="font-display text-base font-bold">Challenge Rules & Parameters</CardTitle>
                  <p className="text-xs text-muted-foreground">Specifications assigned to this account tier</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <RuleItem label="Profit Split" value={`Up to ${profitSplitPct}%`} />
                <RuleItem label="Leverage" value={`1:${leverageVal}`} />
                <RuleItem label="Consistency" value={`${consistencyPct}% max / trade`} />
                <RuleItem label="News Trading" value={newsAllowed ? 'Allowed' : 'Restricted'} positive={newsAllowed} />
                <RuleItem label="Weekend Holding" value={weekendAllowed ? 'Allowed' : 'Restricted'} positive={weekendAllowed} />
                <RuleItem label="Scaling Plan" value={scalingPlan ? 'Eligible' : 'Standard'} positive={scalingPlan} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Navigation Bar */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Ready to take positions on {formatAccountSize(selected.account_size)}?
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Link to={`/dashboard/trading`}>
                <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs gap-1.5 shadow-xs">
                  <LineChart className="h-3.5 w-3.5" />
                  Launch Web Terminal
                </Button>
              </Link>
              <Link to={`/dashboard/accounts`}>
                <Button size="sm" variant="outline" className="text-xs border-border/80 hover:bg-secondary">
                  Account Credentials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleItem({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-left">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-xs font-bold mt-1 text-foreground',
          positive === true && 'text-emerald-600 dark:text-emerald-400',
          positive === false && 'text-rose-600 dark:text-rose-400'
        )}
      >
        {value}
      </p>
    </div>
  );
}
