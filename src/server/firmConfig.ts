/**
 * FundedShift firm-standard trading rules, resolved by EXACT account size and
 * challenge type. This is the single authoritative source used when an account
 * is provisioned (admin manual issue or checkout) so every account always
 * receives loss/profit/leverage limits that match its size — regardless of how
 * many rows happen to exist in the persisted account_plans table.
 */

export type ChallengeType = 'one_step' | 'two_step' | 'instant_funding';

export interface FirmRules {
  profit_target_percent: number;
  daily_loss_limit_percent: number;
  max_loss_limit_percent: number;
  drawdown_model: 'STATIC' | 'TRAILING';
  min_trading_days: number;
  max_trading_days: number | null;
  leverage: number;
  profit_split_percent: number;
  max_lot_size: number;
  max_open_positions: number;
  news_trading_allowed: boolean;
  weekend_holding_allowed: boolean;
  ea_trading_allowed: boolean;
}

/** Standard account sizes we sell / provision. */
export const FIRM_SIZES = [5000, 10000, 25000, 50000, 100000, 200000];

/** Firm-standard profile per challenge type. */
const TYPE_PROFILE: Record<ChallengeType, Omit<FirmRules, 'profit_split_percent' | 'max_lot_size' | 'max_open_positions'>> = {
  one_step: {
    profit_target_percent: 10,
    daily_loss_limit_percent: 4,
    max_loss_limit_percent: 8,
    drawdown_model: 'STATIC',
    min_trading_days: 3,
    max_trading_days: null,
    leverage: 100,
    news_trading_allowed: true,
    weekend_holding_allowed: true,
    ea_trading_allowed: true,
  },
  two_step: {
    profit_target_percent: 8,
    daily_loss_limit_percent: 5,
    max_loss_limit_percent: 10,
    drawdown_model: 'STATIC',
    min_trading_days: 3,
    max_trading_days: null,
    leverage: 100,
    news_trading_allowed: true,
    weekend_holding_allowed: true,
    ea_trading_allowed: true,
  },
  instant_funding: {
    profit_target_percent: 0,
    daily_loss_limit_percent: 5,
    max_loss_limit_percent: 10,
    drawdown_model: 'STATIC',
    min_trading_days: 3,
    max_trading_days: null,
    leverage: 50,
    news_trading_allowed: true,
    weekend_holding_allowed: true,
    ea_trading_allowed: true,
  },
};

function normalizeType(t?: string | null): ChallengeType {
  const s = (t || '').toLowerCase();
  if (s === 'one_step' || s === 'one-step' || s === '1step' || s.includes('1step')) return 'one_step';
  if (s.includes('instant')) return 'instant_funding';
  return 'two_step';
}

function profitSplitBySize(type: ChallengeType, size: number): number {
  if (type === 'instant_funding') return size >= 100000 ? 80 : 75;
  return size >= 100000 ? 90 : size >= 25000 ? 85 : 80;
}

function maxLotBySize(size: number): number {
  if (size >= 100000) return 50;
  if (size >= 50000) return 25;
  if (size >= 25000) return 15;
  return 10;
}

function maxOpenBySize(size: number): number {
  if (size >= 100000) return 20;
  if (size >= 50000) return 15;
  return 10;
}

/** Build correct, complete firm rules for an exact size + type. */
export function buildFirmRules(size: number, type?: string | null): FirmRules {
  const t = normalizeType(type);
  const n = Number(size);
  const base = TYPE_PROFILE[t];
  return {
    ...base,
    profit_split_percent: profitSplitBySize(t, n),
    max_lot_size: maxLotBySize(n),
    max_open_positions: maxOpenBySize(n),
  };
}

export function resolveFirmTypeName(size: number, type?: string | null): string {
  const t = normalizeType(type);
  const sizeLabel = nf(size);
  const label = t === 'one_step' ? 'One-Step Challenge' : t === 'instant_funding' ? 'Instant Funded' : 'Two-Step Evaluation';
  return `FundedShift ${sizeLabel} ${label}`;
}

export function normalizeChallengeType(type?: string | null): ChallengeType {
  return normalizeType(type);
}

function nf(n: number): string {
  return '$' + Number(n).toLocaleString('en-US');
}

/** Returns a fresh plan object whose account_size is guaranteed to match `size`. */
export function makeFirmPlan(size: number, type?: string | null, planIdPrefix = 'plan') {
  const t = normalizeChallengeType(type);
  const rules = buildFirmRules(size, type);
  const n = Number(size);
  return {
    id: `${planIdPrefix}-${t}-${n}`,
    name: resolveFirmTypeName(n, t),
    type: t,
    account_size: n,
    price: 0,
    rules,
    is_active: true,
  };
}
