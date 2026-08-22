import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Target, TrendingDown, Calendar, BarChart3, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { formatAccountSize, formatCurrency, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS } from '@/lib/constants';
import type { TradingAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function DashboardObjectives() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (queryAccount) setSelectedId(queryAccount);
        else if (accs.length > 0) setSelectedId(accs[0].id);
      } catch (_) {
        const { DEFAULT_ACCOUNTS } = await import('@/lib/default-data');
        setAccounts(DEFAULT_ACCOUNTS);
        if (DEFAULT_ACCOUNTS.length > 0) setSelectedId(DEFAULT_ACCOUNTS[0].id);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, searchParams]);

  const selected = accounts.find((a) => a.id === selectedId);

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl glass animate-pulse" />)}</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-20">
        <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
        <h2 className="font-display text-xl font-semibold mb-2">No Trading Objectives</h2>
        <p className="text-muted-foreground text-sm">Purchase a challenge to start tracking your objectives.</p>
      </div>
    );
  }

  const rawRules = selected?.rules || {};
  const accountSize = selected?.account_size || 100000;
  const curBal = Number.isFinite(selected?.current_balance) ? selected!.current_balance : accountSize;
  const startBal = Number.isFinite(selected?.starting_balance) ? selected!.starting_balance : accountSize;
  const currentProfit = Number.isFinite(selected?.profit) ? selected!.profit : (curBal - startBal);

  const isInstant = (selected?.challenge_type || selected?.challenge?.type || '').toLowerCase().includes('instant') || selected?.status === 'funded';
  const isPhase2 = selected?.phase === 2;

  const profitTargetPct = rawRules.profit_target ?? rawRules.profit_target_percent ?? (isInstant ? 0 : (isPhase2 ? 5 : 8));
  const maxDrawdownPct = rawRules.max_drawdown ?? rawRules.max_loss_limit_percent ?? 10;
  const dailyDrawdownPct = rawRules.daily_drawdown ?? rawRules.daily_loss_limit_percent ?? 5;
  const profitSplitPct = rawRules.profit_split ?? rawRules.profit_split_percent ?? (isInstant ? 70 : 80);
  const leverageVal = rawRules.leverage ?? 100;
  const consistencyPct = rawRules.consistency ?? rawRules.consistency_rule_percent ?? 50;
  const minDays = rawRules.min_trading_days ?? 3;
  const maxDays = rawRules.max_trading_days ?? 0;
  const newsAllowed = rawRules.news_trading ?? rawRules.news_trading_allowed ?? true;
  const weekendAllowed = rawRules.weekend_holding ?? rawRules.weekend_holding_allowed ?? true;
  const scalingPlan = rawRules.scaling_plan ?? true;

  const profitTargetAmount = (accountSize * profitTargetPct) / 100;
  const maxDrawdownAmount = (accountSize * maxDrawdownPct) / 100;
  const dailyDrawdownAmount = (accountSize * dailyDrawdownPct) / 100;

  const profitProgress = profitTargetAmount > 0 ? Math.min(100, Math.max(0, (currentProfit / profitTargetAmount) * 100)) : 100;
  const drawdownUsed = maxDrawdownAmount > 0 ? Math.min(100, (Math.abs(Math.min(0, currentProfit)) / maxDrawdownAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Trading Objectives</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your progress toward passing your challenge.</p>
      </div>

      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedId(acc.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedId === acc.id ? 'glass-gold gold-border text-gold-400' : 'glass text-muted-foreground hover:text-foreground'
              )}
            >
              {formatAccountSize(acc.account_size)} · {ACCOUNT_STATUS_LABELS[acc.status]}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          {/* Status banner */}
          <div className="rounded-2xl glass p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gold-gradient flex items-center justify-center">
                <span className="font-display font-bold text-black">{formatAccountSize(selected.account_size)}</span>
              </div>
              <div>
                <p className="font-display font-semibold">{selected.challenge?.name || `${formatAccountSize(selected.account_size)} Account`}</p>
                <p className="text-xs text-muted-foreground">Phase {selected.phase || 1} · {selected.trading_days || 0} trading days</p>
              </div>
            </div>
            <span className={cn('text-sm px-3 py-1.5 rounded-full font-medium', ACCOUNT_STATUS_COLORS[selected.status])}>
              {ACCOUNT_STATUS_LABELS[selected.status]}
            </span>
          </div>

          {/* Objective cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profit Target */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} whileHover={{ y: -3 }}>
              <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-base">Profit Target</CardTitle>
                      <p className="text-xs text-muted-foreground">{profitTargetPct}% of account size ({formatCurrency(profitTargetAmount)})</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-medium">Progress</span>
                    <span className="font-display font-semibold font-mono">{formatCurrency(currentProfit)} / {formatCurrency(profitTargetAmount)}</span>
                  </div>
                  <Progress value={profitProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{profitProgress.toFixed(1)}% complete</p>
                  {profitProgress >= 100 && profitTargetAmount > 0 ? <p className="text-xs text-success mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> Target reached</p> : null}
                </CardContent>
              </Card>
            </motion.div>

            {/* Max Drawdown */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} whileHover={{ y: -3 }}>
              <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-base">Maximum Drawdown</CardTitle>
                      <p className="text-xs text-muted-foreground">{maxDrawdownPct}% of account size ({formatCurrency(maxDrawdownAmount)})</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-medium">Used</span>
                    <span className="font-display font-semibold font-mono">{formatCurrency(Math.min(0, currentProfit))} / -{formatCurrency(maxDrawdownAmount)}</span>
                  </div>
                  <Progress value={drawdownUsed} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{drawdownUsed.toFixed(1)}% used</p>
                  {drawdownUsed >= 100 ? <p className="text-xs text-destructive mt-1 flex items-center gap-1"><X className="h-3 w-3" /> Drawdown breached</p> : null}
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Drawdown */}
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-base">Daily Drawdown</CardTitle>
                    <p className="text-xs text-muted-foreground">{dailyDrawdownPct}% per day ({formatCurrency(dailyDrawdownAmount)})</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-medium">Daily Limit</span>
                  <span className="font-display font-semibold font-mono">-{formatCurrency(dailyDrawdownAmount)}</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Resets daily at 00:00 server time</p>
              </CardContent>
            </Card>

            {/* Trading Days */}
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-base">Trading Days</CardTitle>
                    <p className="text-xs text-muted-foreground">Min {minDays} days{maxDays ? `, max ${maxDays}` : ''}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-medium">Completed</span>
                  <span className="font-display font-semibold font-mono">{selected.trading_days || 0} / {minDays || '∞'}</span>
                </div>
                <Progress value={minDays > 0 ? Math.min(100, ((selected.trading_days || 0) / minDays) * 100) : 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {(selected.trading_days || 0) >= minDays ? <span className="text-success flex items-center gap-1"><Check className="h-3 w-3" /> Minimum days met</span> : `${minDays - (selected.trading_days || 0)} more days needed`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rules summary */}
          <Card className="glass border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-gold-400" />
                </div>
                <CardTitle className="font-display text-base">Challenge Rules</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <RuleItem label="Profit Split" value={`Up to ${profitSplitPct}%`} />
                <RuleItem label="Leverage" value={`1:${leverageVal}`} />
                <RuleItem label="Consistency" value={`${consistencyPct}% max per day`} />
                <RuleItem label="News Trading" value={newsAllowed ? 'Allowed' : 'Not Allowed'} positive={newsAllowed} />
                <RuleItem label="Weekend Holding" value={weekendAllowed ? 'Allowed' : 'Not Allowed'} positive={weekendAllowed} />
                <RuleItem label="Scaling Plan" value={scalingPlan ? 'Available' : 'N/A'} positive={scalingPlan} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function RuleItem({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-card/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('font-medium mt-1', positive === true && 'text-success', positive === false && 'text-muted-foreground')}>{value}</p>
    </div>
  );
}
