export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT' | 'FINANCE' | 'RISK_MANAGER';

export type AccountStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'PASSED'
  | 'FUNDED'
  | 'BREACHED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'PAYOUT_PENDING'
  | 'CLOSED';

export type ChallengeType = 'one_step' | 'two_step' | 'instant_funding';

export type OrderType = 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';

export type PositionStatus = 'OPEN' | 'CLOSED';

export type PayoutStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'upi'
  | 'razorpay'
  | 'stripe'
  | 'visa'
  | 'mastercard'
  | 'rupay'
  | 'gpay'
  | 'phonepe'
  | 'paytm'
  | 'bitcoin'
  | 'ethereum'
  | 'usdt_trc20'
  | 'usdt_erc20';

export interface SymbolConfig {
  symbol: string;
  displayName: string;
  assetClass: 'FOREX' | 'INDICES' | 'COMMODITIES' | 'CRYPTO';
  contractSize: number;
  tickSize: number;
  tickValue: number;
  decimalPrecision: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  spreadPips: number;
  marginRequirementPercent: number; // e.g. 1% = 1:100 leverage
  tradingEnabled: boolean;
  marketSession: string;
}

export interface MarketQuote {
  symbol: string;
  price: number; // Real-time Live Market Price (Last Price / Mid Price)
  bid: number;
  ask: number;
  spread: number;
  high: number;
  low: number;
  change24h: number;
  timestamp: string;
  isMarketOpen?: boolean;
}

export interface AccountRuleConfig {
  profit_target_percent: number; // e.g. 8 for 8%
  daily_loss_limit_percent: number; // e.g. 5 for 5%
  max_loss_limit_percent: number; // e.g. 10 for 10%
  drawdown_model: 'STATIC' | 'TRAILING';
  min_trading_days: number;
  max_trading_days: number | null; // null for unlimited
  leverage: number; // e.g. 100
  profit_split_percent: number; // e.g. 80 or 90
  max_lot_size: number;
  max_open_positions: number;
  news_trading_allowed: boolean;
  weekend_holding_allowed: boolean;
  ea_trading_allowed: boolean;
}

export interface AccountPlan {
  id: string;
  name: string;
  type: ChallengeType;
  account_size: number;
  price: number;
  rules: AccountRuleConfig;
  is_active: boolean;
}

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  country: string;
  phone: string;
  affiliate_code: string;
  is_verified: boolean;
  is_2fa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTransition {
  target_type: 'step_2' | 'funded';
  target_title: string;
  passed_at: string;
  scheduled_for: string; // ISO date string (1 to 2 hours from passed_at)
  estimated_hours: number;
  status: 'SCHEDULED' | 'PROVISIONED';
  provisioned_account_id?: string;
}

export interface TradingAccountEntity {
  id: string;
  user_id: string;
  order_id: string;
  account_number: string;
  login: string;
  password_hash: string;
  investor_password_hash: string;
  server: string;
  broker?: string;
  platform?: string;
  plan_id: string;
  plan_name: string;
  type: ChallengeType;
  account_size: number;
  starting_balance: number;
  current_balance: number;
  current_equity: number;
  highest_balance: number;
  highest_equity: number;
  start_of_day_balance: number;
  start_of_day_equity: number;
  status: AccountStatus;
  phase: number; // 1 for Step 1, 2 for Step 2, 1 (or 3) for Funded
  is_funded?: boolean;
  trading_days: number;
  leverage: number;
  rules: AccountRuleConfig;
  parent_account_id?: string;
  scheduled_transition?: ScheduledTransition;
  breached_at?: string;
  passed_at?: string;
  funded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PositionEntity {
  id: string;
  account_id: string;
  user_id: string;
  symbol: string;
  type: OrderType;
  lot_size: number;
  open_price: number;
  close_price?: number;
  stop_loss?: number;
  take_profit?: number;
  margin: number;
  floating_pnl: number;
  realized_pnl?: number;
  swap: number;
  commission: number;
  status: PositionStatus;
  opened_at: string;
  closed_at?: string;
  close_reason?: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'BREACH_AUTO_CLOSE' | 'ADMIN' | 'PHASE_PASSED_FLAT';
}

export interface TradeOrderEntity {
  id: string;
  account_id: string;
  user_id: string;
  symbol: string;
  type: OrderType;
  lot_size: number;
  price: number;
  stop_loss?: number;
  take_profit?: number;
  status: 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  executed_at: string;
}

export interface RuleViolationEntity {
  id: string;
  account_id: string;
  user_id: string;
  rule_type: string; // 'DAILY_LOSS' | 'MAX_LOSS' | 'MAX_LOT' | 'RESTRICTED_SYMBOL'
  threshold_value: number;
  actual_value: number;
  triggering_trade_id?: string;
  balance_at_breach: number;
  equity_at_breach: number;
  drawdown_at_breach: number;
  details: string;
  created_at: string;
}

export interface OrderEntity {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  account_size: number;
  platform: string;
  addons: any[];
  coupon_code?: string;
  discount_amount: number;
  total_amount: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'WAITING_ASSIGNMENT' | 'ASSIGNED' | 'CANCELLED' | 'REFUNDED';
  payment_method: PaymentMethod;
  created_at: string;
}

export interface PaymentEntity {
  id: string;
  order_id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transaction_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PayoutRequestEntity {
  id: string;
  account_id: string;
  user_id: string;
  account_number: string;
  user_email?: string;
  user_name?: string;
  total_profit: number;
  trader_split_percent: number;
  trader_payout_amount: number;
  firm_share_amount: number;
  payout_method: string;
  payout_address: string;
  payment_details?: {
    upi_id?: string;
    crypto_network?: string;
    wallet_address?: string;
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    ifsc_code?: string;
    paypal_email?: string;
  };
  status: PayoutStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface NotificationEntity {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntity {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_id?: string;
  entity_type?: string;
  details: string;
  ip_address?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PromoCodeEntity {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  usage_count: number;
  max_uses: number;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateWithdrawalEntity {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  method: 'UPI' | 'Crypto' | 'Bank Transfer' | 'PayPal';
  payment_details: {
    upi_id?: string;
    crypto_network?: string;
    wallet_address?: string;
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    ifsc_code?: string;
    paypal_email?: string;
  };
  status: 'APPROVAL PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

// -------------------------------------------------------------
// DIFFERENTIATED PROP FIRM FEATURES INTERFACES
// -------------------------------------------------------------

export interface ExplainableBreach {
  id: string;
  account_id: string;
  rule_violated: 'DAILY_LOSS' | 'MAX_LOSS' | 'MAX_LOT' | 'RESTRICTED_SYMBOL' | 'WEEKEND_HOLDING' | 'NEWS_RESTRICTION' | 'CONSISTENCY';
  threshold_amount: number;
  threshold_percent: number;
  actual_loss_amount: number;
  actual_loss_percent: number;
  breach_time: string;
  timezone: string;
  triggering_trade_id?: string;
  symbol?: string;
  balance_at_breach: number;
  equity_at_breach: number;
  start_of_day_baseline: number;
  starting_balance: number;
  drawdown_percent: number;
  math_explanation: string;
  recommendations: string[];
}

export interface TradeSimulationRequest {
  accountId: string;
  symbol: string;
  type: OrderType;
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradeSimulationResult {
  symbol: string;
  type: OrderType;
  lotSize: number;
  currentBid: number;
  currentAsk: number;
  estimatedEntryPrice: number;
  requiredMargin: number;
  availableMarginBefore: number;
  availableMarginAfter: number;
  estimatedCommission: number;
  riskAtStopLoss: number | null;
  rewardAtTakeProfit: number | null;
  riskRewardRatio: number | null;
  currentDailyLoss: number;
  maxDailyAllowedLoss: number;
  projectedDailyLossIfStoppedOut: number | null;
  remainingDailyLossAllowance: number;
  wouldBreachDaily: boolean;
  currentOverallLoss: number;
  maxOverallAllowedLoss: number;
  projectedOverallLossIfStoppedOut: number | null;
  remainingOverallLossAllowance: number;
  wouldBreachMax: boolean;
  maxSafeLotSize: number;
  safetyAdvice: string;
}

export interface TraderRiskProfile {
  accountId: string;
  userId: string;
  totalTrades: number;
  closedTrades: number;
  openPositions: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
  maxDrawdownExperienced: number;
  maxDrawdownPercent: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  averageHoldingTimeMinutes: number;
  holdingStyle: 'SCALPER' | 'DAY_TRADER' | 'SWING_TRADER';
  symbolConcentration: Array<{ symbol: string; tradesCount: number; percentage: number }>;
  overtradingScore: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH';
  revengeTradingDetected: boolean;
  revengeTradingEvents: number;
  currentNetExposureUSD: number;
  maxHistoricalExposureUSD: number;
  riskRating: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'HIGH_RISK';
}

export interface TraderHealthScore {
  accountId: string;
  overallScore: number; // 0 - 100
  tier: 'INSTITUTIONAL' | 'PROFESSIONAL' | 'MODERATE' | 'NEEDS_DISCIPLINE';
  breakdown: {
    drawdownControl: { score: number; max: 30; label: string };
    riskRewardDiscipline: { score: number; max: 20; label: string };
    positionSizingDiscipline: { score: number; max: 20; label: string };
    ruleAdherence: { score: number; max: 20; label: string };
    tradingPacing: { score: number; max: 10; label: string };
  };
  strengths: string[];
  vulnerabilities: string[];
  recommendations: string[];
}

export interface StrategyFingerprint {
  accountId: string;
  primaryStyle: 'SCALPER' | 'DAY_TRADER' | 'SWING_TRADER';
  tradeStyleConfidence: number; // %
  attributes: {
    isNewsTrader: boolean;
    isHighFrequency: boolean;
    hasMartingaleBehavior: boolean;
    isGridTrader: boolean;
    isSingleInstrumentSpecialist: boolean;
    prefersStopLoss: boolean;
    stopLossUsageRate: number; // %
  };
  primaryAssetsTraded: string[];
  sessionPreference: 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'CROSS_SESSION';
  consistencyScore: number; // %
}

export interface DynamicRiskShieldConfig {
  enabled: boolean;
  warningThresholdPercent: number; // e.g. 70% of daily DD
  restrictHighRiskThresholdPercent: number; // e.g. 85% of daily DD
  reducedMaxLotMultiplier: number; // e.g. 0.5 (cuts max lot by 50%)
  requireStopLossUnderPressure: boolean;
  autoCloseAtPercent: number; // e.g. 98% of daily DD (safety barrier)
}

export interface RiskShieldStatus {
  accountId: string;
  shieldActive: boolean;
  currentDailyDDRatio: number;
  currentMaxDDRatio: number;
  state: 'NORMAL' | 'ELEVATED_WATCH' | 'SHIELD_ENGAGED' | 'RESTRICTED';
  warnings: string[];
  allowedMaxLot: number;
  stopLossEnforced: boolean;
}

export interface PerformanceTimelineEvent {
  id: string;
  accountId: string;
  eventType:
    | 'ACCOUNT_PROVISIONED'
    | 'TRADE_OPENED'
    | 'TRADE_CLOSED'
    | 'PROFIT_MILESTONE'
    | 'DRAWDOWN_WARNING'
    | 'RULE_BREACH'
    | 'PHASE_PASSED'
    | 'FUNDED_ACTIVE'
    | 'PAYOUT_REQUESTED'
    | 'PAYOUT_APPROVED'
    | 'PAYOUT_REJECTED';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RecoveryProgramOption {
  accountId: string;
  accountNumber: string;
  accountSize: number;
  type: ChallengeType;
  isEligible: boolean;
  discountPercent: number;
  resetPrice: number;
  reason: string;
  conditions: string[];
}

export interface KycSubmissionEntity {
  id: string;
  user_id: string;
  trader_name: string;
  email: string;
  document_type: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
  document_number?: string;
  country: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'user' | 'admin' | 'support';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface SupportTicketEntity {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportTicketMessage[];
  created_at: string;
  updated_at: string;
}



