import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Target, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { formatAccountSize, formatCurrency, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS } from '@/lib/constants';
import type { TradingAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DashboardProgress() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { fetchUserAccounts } = await import('@/lib/api-client');
        const userAccs = await fetchUserAccounts(user.id);
        setAccounts(userAccs);
      } catch (_) {
        const { DEFAULT_ACCOUNTS } = await import('@/lib/default-data');
        setAccounts(DEFAULT_ACCOUNTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 rounded-2xl glass animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Challenge Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your evaluation progress across all accounts.</p>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-20">
          <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
          <p className="text-muted-foreground text-sm mb-4">No active challenges.</p>
          <Link to="/challenges">
            <Button className="bg-gold-gradient text-black hover:opacity-90 font-semibold">Buy a Challenge</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account, idx) => {
            const rules = account.rules;
            const isInstant = (account.challenge_type || account.challenge?.type || '').toLowerCase().includes('instant') || account.status === 'funded';
            const profitTargetPct = rules?.profit_target ?? (rules as any)?.profit_target_percent ?? (isInstant ? 0 : (account.phase === 2 ? 5 : 8));
            const profitTargetAmount = profitTargetPct > 0 ? (account.account_size * profitTargetPct) / 100 : 0;
            const curBal = Number.isFinite(account.current_balance) ? account.current_balance : account.account_size;
            const startBal = Number.isFinite(account.starting_balance) ? account.starting_balance : account.account_size;
            const currentProfit = Number.isFinite(account.profit) ? account.profit : (curBal - startBal);
            const profitProgress = profitTargetAmount > 0 ? Math.min(100, Math.max(0, (currentProfit / profitTargetAmount) * 100)) : 100;
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.35 }}
              >
                <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center">
                        <span className="font-display font-bold text-black">{formatAccountSize(account.account_size)}</span>
                      </div>
                      <div>
                        <CardTitle className="font-display text-lg">{account.challenge?.name || `${formatAccountSize(account.account_size)} Account`}</CardTitle>
                        <p className="text-xs text-muted-foreground">Phase {account.phase || 1} · {account.trading_days || 0} trading days</p>
                      </div>
                    </div>
                    <span className={cn('text-xs px-3 py-1.5 rounded-full font-medium', ACCOUNT_STATUS_COLORS[account.status])}>
                      {ACCOUNT_STATUS_LABELS[account.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Profit Target ({profitTargetPct > 0 ? `${profitTargetPct}%` : 'Funded'})</span>
                        <span className="font-medium font-mono">
                          {profitTargetAmount > 0 ? `${formatCurrency(currentProfit)} / ${formatCurrency(profitTargetAmount)}` : `${formatCurrency(currentProfit)} (No Limit)`}
                        </span>
                      </div>
                      <Progress value={profitProgress} className="h-2" />
                    </div>
                    <Link to={`/dashboard/objectives?account=${account.id}`}>
                      <Button variant="ghost" size="sm" className="text-gold-400">
                        View Detailed Objectives <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
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
