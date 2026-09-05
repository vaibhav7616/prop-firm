import type { TradingAccount } from '@/types';

/**
 * Pure helpers that derive Funded Shift account/objective numbers from a
 * TradingAccount (and an optional live equity). No fake data is introduced
 * here — every value is computed from the account record + rules.
 */

/** Normalize an account status to lowercase so comparisons are robust against
    both backend (uppercase: ACTIVE/BREACHED/FUNDED/PASSED) and offline
    (lowercase: active/breached/funded/passed) data sources. */
export function fsStatusKey(status?: string | null): string {
  return (status || '').trim().toLowerCase();
}
function num(v: number | null | undefined, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export interface FsMetrics {
  start: number;
  balance: number;
  profit: number;
  profitTargetPct: number;
  dailyPct: number;
  maxPct: number;
  minDays: number;
  leverage: number;
  profitSplit: number;
  targetAmt: number;
  dailyLimitAmt: number;
  maxLossAmt: number;
  breachFloor: number; // static max-drawdown floor
  netProfit: number;
  targetRemaining: number;
  targetProgress: number; // 0..1 capped
  isEval: boolean;
  isFunded: boolean;
}

export function fsMetrics(account: TradingAccount, equity?: number): FsMetrics {
  const r = account.rules || ({} as any);
  const start = num(account.starting_balance, num(account.account_size, 100000));
  const balance = num(account.current_balance, start);
  const profit = num(account.profit, balance - start);
  const profitTargetPct = num(r.profit_target ?? r.profit_target_percent, 8);
  const dailyPct = num(r.daily_drawdown ?? r.daily_drawdown_percent ?? r.daily_loss_limit_percent, 5);
  const maxPct = num(r.max_drawdown ?? r.max_drawdown_percent ?? r.max_loss_limit_percent, 10);
  const minDays = num(r.min_trading_days, 0);
  const leverage = num(r.leverage, 100);
  const profitSplit = num(r.profit_split ?? r.profit_split_percent, 80);
  const targetAmt = (profitTargetPct / 100) * start;
  const dailyLimitAmt = (dailyPct / 100) * start;
  const maxLossAmt = (maxPct / 100) * start;
  const breachFloor = start - maxLossAmt;
  const netProfit = equity !== undefined ? equity - start : profit;
  const targetRemaining = Math.max(0, targetAmt - netProfit);
  const targetProgress = targetAmt > 0 ? Math.min(1, Math.max(0, netProfit / targetAmt)) : netProfit > 0 ? 1 : 0;
  const isFunded = fsStatusKey(account.status) === 'funded';
  const st = fsStatusKey(account.status);
  const isEval = (!isFunded && st === 'active') || st === 'passed';
  return {
    start, balance, profit, profitTargetPct, dailyPct, maxPct, minDays, leverage, profitSplit,
    targetAmt, dailyLimitAmt, maxLossAmt, breachFloor, netProfit, targetRemaining,
    targetProgress, isEval, isFunded,
  };
}

export interface FsRisk {
  // all expressed in dollars
  dailyUsed: number;
  dailyRemaining: number;
  maxUsed: number;
  maxRemaining: number;
  dailyUsedPct: number; // of daily limit
  maxUsedPct: number;   // of max-drawdown limit
  equity: number;
}

export function fsRisk(account: TradingAccount, equity?: number): FsRisk {
  const m = fsMetrics(account, equity);
  const eq = m.balance + Math.max(0, (equity ?? m.balance) - m.balance);
  const usedEquity = equity ?? m.balance;
  // daily loss measured from starting baseline (demo static baseline)
  const dailyUsed = Math.max(0, m.start - usedEquity);
  const dailyRemaining = Math.max(0, m.dailyLimitAmt - dailyUsed);
  const maxUsed = Math.max(0, m.start - Math.max(usedEquity, m.breachFloor));
  const maxRemaining = Math.max(0, usedEquity - m.breachFloor);
  return {
    dailyUsed,
    dailyRemaining,
    maxUsed,
    maxRemaining,
    dailyUsedPct: m.dailyLimitAmt > 0 ? Math.min(1, dailyUsed / m.dailyLimitAmt) : 0,
    maxUsedPct: maxUsed > 0 ? Math.min(1, maxUsed / m.maxLossAmt) : 0,
    equity: usedEquity,
  };
}

export type ObjState = 'completed' | 'in_progress' | 'at_risk' | 'failed';

export function objectiveState(account: TradingAccount, metrics?: FsMetrics): ObjState {
  const st = fsStatusKey(account.status);
  if (st === 'failed' || st === 'breached') return 'failed';
  const m = metrics || fsMetrics(account);
  // funded accounts have no remaining eval objective
  if (m.isFunded) return 'completed';
  return m.targetProgress >= 1 ? 'completed' : 'in_progress';
}

/** Trading days may be stored as trading_days or trading_days_count depending on source. */
export function fsTradingDays(account: TradingAccount): number {
  const a = account as any;
  return num(a.trading_days, num(a.trading_days_count, 0));
}

export interface FsAccountLabel {
  title: string;
  subtitle: string;
  accent: 'indigo' | 'emerald' | 'rose' | 'amber';
}

export function fsAccountMeta(account: TradingAccount): FsAccountLabel {
  const plan = account.plan_name || account.challenge?.name || `${(account.account_size / 1000).toFixed(0)}K ${account.status}`;
  const size = `$${(account.account_size / 1000).toFixed(0)}K`;
  const st = account.status || 'active';
  let accent: FsAccountLabel['accent'] = 'indigo';
  if (st === 'funded' || st === 'passed') accent = 'emerald';
  else if (st === 'failed' || st === 'breached') accent = 'rose';
  else if (st === 'pending') accent = 'amber';
  return { title: plan, subtitle: `${size} · ${st === 'funded' ? 'Funded Account' : st === 'passed' ? 'Passed' : st === 'active' ? 'Evaluation' : st}`, accent };
}
