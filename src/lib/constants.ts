import type { Addon, ChallengeType, PaymentMethod, Platform } from '@/types';

export const ACCOUNT_SIZES = [5000, 10000, 25000, 50000, 100000, 200000] as const;

export const ACCOUNT_SIZE_LABELS: Record<number, string> = {
  5000: '5K',
  10000: '10K',
  25000: '25K',
  50000: '50K',
  100000: '100K',
  200000: '200K',
};

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  one_step: 'One Step',
  two_step: 'Two Step',
  instant_funding: 'Instant Funding',
};

export const CHALLENGE_TYPE_DESCRIPTIONS: Record<ChallengeType, string> = {
  one_step: 'Pass a single evaluation phase to unlock a funded account. The fastest path to trading institutional capital.',
  two_step: 'A two-phase evaluation that rewards consistency. Prove your skill across both phases to get funded.',
  instant_funding: 'Skip the evaluation entirely. Get a funded account immediately and start trading right away.',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  fundedshift_terminal: 'FundedShift Web Terminal',
};

export const ADDONS: Addon[] = [
  { id: 'higher_leverage', name: 'Higher Leverage', price: 29, description: 'Increase leverage up to 1:200' },
  { id: 'weekend_holding', name: 'Weekend Holding', price: 19, description: 'Hold positions over the weekend' },
  { id: 'fast_payout', name: 'Fast Payout', price: 39, description: 'Get your first payout in 7 days' },
  { id: 'no_daily_drawdown', name: 'No Daily Drawdown', price: 49, description: 'Remove the daily drawdown limit' },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; group: string }[] = [
  { id: 'upi', label: 'UPI', group: 'UPI' },
  { id: 'razorpay', label: 'Razorpay', group: 'Cards & Wallets' },
  { id: 'stripe', label: 'Stripe', group: 'Cards & Wallets' },
  { id: 'visa', label: 'Visa', group: 'Cards & Wallets' },
  { id: 'mastercard', label: 'MasterCard', group: 'Cards & Wallets' },
  { id: 'rupay', label: 'RuPay', group: 'Cards & Wallets' },
  { id: 'gpay', label: 'Google Pay', group: 'Wallets' },
  { id: 'phonepe', label: 'PhonePe', group: 'Wallets' },
  { id: 'paytm', label: 'Paytm', group: 'Wallets' },
  { id: 'bitcoin', label: 'Bitcoin', group: 'Crypto' },
  { id: 'ethereum', label: 'Ethereum', group: 'Crypto' },
  { id: 'usdt_trc20', label: 'USDT (TRC20)', group: 'Crypto' },
  { id: 'usdt_erc20', label: 'USDT (ERC20)', group: 'Crypto' },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  waiting_assignment: 'Waiting for Account Assignment',
  assigned: 'Assigned',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  passed: 'Passed (Locked)',
  failed: 'Failed',
  breached: 'Breached',
  funded: 'Funded',
  PENDING: 'Pending',
  PENDING_PAYMENT: 'Pending Payment',
  PENDING_ACTIVATION: 'Pending Activation',
  ACTIVE: 'Active',
  PASSED: 'Passed (Locked)',
  FAILED: 'Failed',
  BREACHED: 'Breached',
  FUNDED: 'Funded',
  SUSPENDED: 'Suspended',
  EXPIRED: 'Expired',
  PAYOUT_PENDING: 'Payout Pending',
  CLOSED: 'Closed',
};

export const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted-foreground/20 text-muted-foreground',
  active: 'bg-blue-500/15 text-blue-400',
  passed: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-destructive/15 text-destructive',
  breached: 'bg-destructive/15 text-destructive',
  funded: 'bg-amber-500/15 text-amber-400',
  PENDING: 'bg-muted-foreground/20 text-muted-foreground',
  PENDING_PAYMENT: 'bg-amber-500/15 text-amber-400',
  PENDING_ACTIVATION: 'bg-blue-500/15 text-blue-400',
  ACTIVE: 'bg-blue-500/15 text-blue-400',
  PASSED: 'bg-emerald-500/15 text-emerald-400',
  FAILED: 'bg-destructive/15 text-destructive',
  BREACHED: 'bg-destructive/15 text-destructive',
  FUNDED: 'bg-amber-500/15 text-amber-400',
  SUSPENDED: 'bg-muted-foreground/20 text-muted-foreground',
  EXPIRED: 'bg-muted-foreground/20 text-muted-foreground',
  PAYOUT_PENDING: 'bg-purple-500/15 text-purple-400',
  CLOSED: 'bg-muted-foreground/20 text-muted-foreground',
};

export function getAccountStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Active';
  return ACCOUNT_STATUS_LABELS[status] || ACCOUNT_STATUS_LABELS[status.toLowerCase()] || status;
}

export function getAccountPhaseLabel(acc: {
  type?: string;
  phase?: number;
  status?: string;
  is_funded?: boolean;
  plan_name?: string;
} | null | undefined): string {
  if (!acc) return 'Step 1';
  const status = (acc.status || '').toUpperCase();
  const type = (acc.type || '').toLowerCase();
  const plan = (acc.plan_name || '').toLowerCase();
  const phase = acc.phase || 1;

  if (
    type === 'instant_funding' ||
    status === 'FUNDED' ||
    phase >= 3 ||
    acc.is_funded ||
    plan.includes('funded') ||
    plan.includes('instant')
  ) {
    return 'Funded';
  }
  if (type === 'one_step' || plan.includes('1-step') || plan.includes('one-step')) {
    return 'Step 1';
  }
  if (phase === 2) {
    return 'Step 2';
  }
  return 'Step 1';
}

export function formatAccountDropdownLabel(acc: {
  account_size?: number;
  type?: string;
  phase?: number;
  status?: string;
  account_number?: string;
  is_funded?: boolean;
  plan_name?: string;
}): string {
  const sizeStr = formatAccountSize(acc.account_size || 5000);
  const phaseLabel = getAccountPhaseLabel(acc);
  const statusLabel = getAccountStatusLabel(acc.status);
  const accNum = acc.account_number ? ` #${acc.account_number}` : '';

  if (phaseLabel === 'Funded') {
    return `${sizeStr} Funded${accNum} - ${statusLabel}`;
  }
  return `${sizeStr} (${phaseLabel})${accNum} - ${statusLabel}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const hasDecimals = val % 1 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatAccountSize(size: number): string {
  if (size >= 1000) return `${size / 1000}K`;
  return `${size}`;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `FS-${year}-${random}`;
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
