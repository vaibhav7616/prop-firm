import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  UserEntity,
  TradingAccountEntity,
  OrderEntity,
  PaymentEntity,
  PositionEntity,
  TradeOrderEntity,
  RuleViolationEntity,
  PayoutRequestEntity,
  NotificationEntity,
  AuditLogEntity,
  PromoCodeEntity,
  AffiliateWithdrawalEntity,
  SymbolConfig,
  AccountPlan,
} from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'propfirm_database.json');

export interface DatabaseSchema {
  users: UserEntity[];
  account_plans: AccountPlan[];
  challenges: any[];
  symbols: SymbolConfig[];
  accounts: TradingAccountEntity[];
  orders: OrderEntity[];
  payments: PaymentEntity[];
  positions: PositionEntity[];
  trade_orders: TradeOrderEntity[];
  rule_violations: RuleViolationEntity[];
  payout_requests: PayoutRequestEntity[];
  affiliate_withdrawals: AffiliateWithdrawalEntity[];
  notifications: NotificationEntity[];
  audit_logs: AuditLogEntity[];
  promo_codes: PromoCodeEntity[];
}

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'fundedshift_salt_2026', 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const checkHash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(checkHash));
}

// Default symbols configuration
export const DEFAULT_SYMBOLS: SymbolConfig[] = [
  // FOREX MAJORS
  {
    symbol: 'EURUSD',
    displayName: 'EUR/USD',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.2,
    marginRequirementPercent: 1.0, // 1:100 leverage
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'GBPUSD',
    displayName: 'GBP/USD',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.4,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'USDJPY',
    displayName: 'USD/JPY',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.001,
    tickValue: 0.67,
    decimalPrecision: 3,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.3,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'AUDUSD',
    displayName: 'AUD/USD',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.5,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'USDCAD',
    displayName: 'USD/CAD',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.5,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'USDCHF',
    displayName: 'USD/CHF',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.5,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'NZDUSD',
    displayName: 'NZD/USD',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.6,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },

  // FOREX MINORS & CROSSES
  {
    symbol: 'EURGBP',
    displayName: 'EUR/GBP',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.00001,
    tickValue: 1.25,
    decimalPrecision: 5,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.6,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'EURJPY',
    displayName: 'EUR/JPY',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.001,
    tickValue: 0.67,
    decimalPrecision: 3,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.6,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },
  {
    symbol: 'GBPJPY',
    displayName: 'GBP/JPY',
    assetClass: 'FOREX',
    contractSize: 100000,
    tickSize: 0.001,
    tickValue: 0.67,
    decimalPrecision: 3,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    spreadPips: 0.9,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '24/5',
  },

  // METALS & COMMODITIES
  {
    symbol: 'XAUUSD',
    displayName: 'Gold Spot CFD',
    assetClass: 'COMMODITIES',
    contractSize: 100,
    tickSize: 0.01,
    tickValue: 1,
    decimalPrecision: 2,
    minLot: 0.01,
    maxLot: 20,
    lotStep: 0.01,
    spreadPips: 1.0,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '23/5',
  },
  {
    symbol: 'XAGUSD',
    displayName: 'Silver Spot CFD',
    assetClass: 'COMMODITIES',
    contractSize: 5000,
    tickSize: 0.001,
    tickValue: 5,
    decimalPrecision: 3,
    minLot: 0.01,
    maxLot: 20,
    lotStep: 0.01,
    spreadPips: 1.8,
    marginRequirementPercent: 1.0,
    tradingEnabled: true,
    marketSession: '23/5',
  },
  {
    symbol: 'USOIL',
    displayName: 'Crude Oil (WTI Spot)',
    assetClass: 'COMMODITIES',
    contractSize: 1000,
    tickSize: 0.01,
    tickValue: 10,
    decimalPrecision: 2,
    minLot: 0.01,
    maxLot: 30,
    lotStep: 0.01,
    spreadPips: 2.0,
    marginRequirementPercent: 2.0,
    tradingEnabled: true,
    marketSession: '23/5',
  },

  // INDICES
  {
    symbol: 'NAS100',
    displayName: 'US Tech 100 Cash CFD',
    assetClass: 'INDICES',
    contractSize: 20,
    tickSize: 0.1,
    tickValue: 2,
    decimalPrecision: 1,
    minLot: 0.1,
    maxLot: 50,
    lotStep: 0.1,
    spreadPips: 1.0,
    marginRequirementPercent: 2.0, // 1:50 leverage
    tradingEnabled: true,
    marketSession: '23/5',
  },
  {
    symbol: 'US30',
    displayName: 'Wall Street 30 Cash CFD',
    assetClass: 'INDICES',
    contractSize: 10,
    tickSize: 1.0,
    tickValue: 10,
    decimalPrecision: 1,
    minLot: 0.1,
    maxLot: 50,
    lotStep: 0.1,
    spreadPips: 1.5,
    marginRequirementPercent: 2.0,
    tradingEnabled: true,
    marketSession: '23/5',
  },
  {
    symbol: 'SPX500',
    displayName: 'US 500 Cash CFD',
    assetClass: 'INDICES',
    contractSize: 50,
    tickSize: 0.1,
    tickValue: 5,
    decimalPrecision: 1,
    minLot: 0.1,
    maxLot: 50,
    lotStep: 0.1,
    spreadPips: 0.8,
    marginRequirementPercent: 2.0,
    tradingEnabled: true,
    marketSession: '23/5',
  },
  {
    symbol: 'GER40',
    displayName: 'Germany 40 (DAX)',
    assetClass: 'INDICES',
    contractSize: 25,
    tickSize: 0.1,
    tickValue: 2.5,
    decimalPrecision: 1,
    minLot: 0.1,
    maxLot: 50,
    lotStep: 0.1,
    spreadPips: 1.1,
    marginRequirementPercent: 2.0,
    tradingEnabled: true,
    marketSession: '23/5',
  },

  // CRYPTOCURRENCIES
  {
    symbol: 'BTCUSD',
    displayName: 'Bitcoin / USD',
    assetClass: 'CRYPTO',
    contractSize: 1,
    tickSize: 0.1,
    tickValue: 0.1,
    decimalPrecision: 2,
    minLot: 0.01,
    maxLot: 10,
    lotStep: 0.01,
    spreadPips: 15.0,
    marginRequirementPercent: 3.33, // 1:30 leverage
    tradingEnabled: true,
    marketSession: '24/7',
  },
  {
    symbol: 'ETHUSD',
    displayName: 'Ethereum / USD',
    assetClass: 'CRYPTO',
    contractSize: 10,
    tickSize: 0.01,
    tickValue: 0.1,
    decimalPrecision: 2,
    minLot: 0.01,
    maxLot: 20,
    lotStep: 0.01,
    spreadPips: 2.5,
    marginRequirementPercent: 3.33,
    tradingEnabled: true,
    marketSession: '24/7',
  },
  {
    symbol: 'SOLUSD',
    displayName: 'Solana / USD',
    assetClass: 'CRYPTO',
    contractSize: 100,
    tickSize: 0.01,
    tickValue: 1,
    decimalPrecision: 2,
    minLot: 0.1,
    maxLot: 50,
    lotStep: 0.1,
    spreadPips: 0.15,
    marginRequirementPercent: 5.0,
    tradingEnabled: true,
    marketSession: '24/7',
  },
];

export const DEFAULT_PLANS: AccountPlan[] = [
  // 5K Plans
  {
    id: 'plan-2step-5k',
    name: '$5,000 Two-Step Evaluation',
    type: 'two_step',
    account_size: 5000,
    price: 39,
    rules: {
      profit_target_percent: 8,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 0,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 5,
      max_open_positions: 10,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
  {
    id: 'plan-1step-5k',
    name: '$5,000 One-Step Challenge',
    type: 'one_step',
    account_size: 5000,
    price: 29,
    rules: {
      profit_target_percent: 10,
      daily_loss_limit_percent: 4,
      max_loss_limit_percent: 8,
      drawdown_model: 'STATIC',
      min_trading_days: 3,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 5,
      max_open_positions: 10,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
  {
    id: 'plan-instant-5k',
    name: '$5,000 Instant Funded',
    type: 'instant_funding',
    account_size: 5000,
    price: 69,
    rules: {
      profit_target_percent: 0,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 7,
      max_trading_days: null,
      leverage: 50,
      profit_split_percent: 70,
      max_lot_size: 5,
      max_open_positions: 10,
      news_trading_allowed: true,
      weekend_holding_allowed: false,
      ea_trading_allowed: true,
    },
    is_active: true,
  },

  // 10K Plans
  {
    id: 'plan-1step-10k',
    name: '$10,000 One-Step Challenge',
    type: 'one_step',
    account_size: 10000,
    price: 49,
    rules: {
      profit_target_percent: 10,
      daily_loss_limit_percent: 4,
      max_loss_limit_percent: 8,
      drawdown_model: 'STATIC',
      min_trading_days: 3,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 10,
      max_open_positions: 10,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
  {
    id: 'plan-2step-10k',
    name: '$10,000 Two-Step Evaluation',
    type: 'two_step',
    account_size: 10000,
    price: 69,
    rules: {
      profit_target_percent: 8,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 0,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 10,
      max_open_positions: 10,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
  {
    id: 'plan-instant-10k',
    name: '$10,000 Instant Funded',
    type: 'instant_funding',
    account_size: 10000,
    price: 119,
    rules: {
      profit_target_percent: 0,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 7,
      max_trading_days: null,
      leverage: 50,
      profit_split_percent: 70,
      max_lot_size: 10,
      max_open_positions: 10,
      news_trading_allowed: true,
      weekend_holding_allowed: false,
      ea_trading_allowed: true,
    },
    is_active: true,
  },

  // 25K Plans
  {
    id: 'plan-2step-25k',
    name: '$25,000 Two-Step Evaluation',
    type: 'two_step',
    account_size: 25000,
    price: 129,
    rules: {
      profit_target_percent: 8,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 0,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 20,
      max_open_positions: 15,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
  {
    id: 'plan-1step-25k',
    name: '$25,000 One-Step Challenge',
    type: 'one_step',
    account_size: 25000,
    price: 109,
    rules: {
      profit_target_percent: 10,
      daily_loss_limit_percent: 4,
      max_loss_limit_percent: 8,
      drawdown_model: 'STATIC',
      min_trading_days: 3,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 20,
      max_open_positions: 15,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },

  // 50K Plans
  {
    id: 'plan-2step-50k',
    name: '$50,000 Two-Step Evaluation',
    type: 'two_step',
    account_size: 50000,
    price: 199,
    rules: {
      profit_target_percent: 8,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 0,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 35,
      max_open_positions: 20,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
  {
    id: 'plan-instant-50k',
    name: '$50,000 Instant Funded',
    type: 'instant_funding',
    account_size: 50000,
    price: 479,
    rules: {
      profit_target_percent: 0,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 7,
      max_trading_days: null,
      leverage: 50,
      profit_split_percent: 70,
      max_lot_size: 25,
      max_open_positions: 15,
      news_trading_allowed: true,
      weekend_holding_allowed: false,
      ea_trading_allowed: true,
    },
    is_active: true,
  },

  // 100K Plans
  {
    id: 'plan-2step-100k',
    name: '$100,000 Two-Step Evaluation',
    type: 'two_step',
    account_size: 100000,
    price: 299,
    rules: {
      profit_target_percent: 8, // Phase 1: 8%, Phase 2: 5%
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 0,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 50,
      max_open_positions: 20,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },

  // 200K Plans
  {
    id: 'plan-2step-200k',
    name: '$200,000 Two-Step Evaluation',
    type: 'two_step',
    account_size: 200000,
    price: 549,
    rules: {
      profit_target_percent: 8,
      daily_loss_limit_percent: 5,
      max_loss_limit_percent: 10,
      drawdown_model: 'STATIC',
      min_trading_days: 0,
      max_trading_days: null,
      leverage: 100,
      profit_split_percent: 90,
      max_lot_size: 100,
      max_open_positions: 30,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_trading_allowed: true,
    },
    is_active: true,
  },
];

export class DBEngine {
  private static db: DatabaseSchema | null = null;

  public static getDB(): DatabaseSchema {
    if (!this.db) {
      this.db = this.init();
    }
    return this.db;
  }

  private static init(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const demoTraderPasswordHash = hashPassword('Trader123!');
      const adminPasswordHash = hashPassword('9545884016aA@');

      const initial: DatabaseSchema = {
        challenges: [],
        users: [
          {
            id: 'demo-trader-id-12345',
            email: 'trader@propfirm.com',
            password_hash: demoTraderPasswordHash,
            full_name: 'Alex Vance',
            role: 'USER',
            country: 'United States',
            phone: '+1 555-0192',
            affiliate_code: 'ALEX99',
            is_verified: true,
            is_2fa_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'admin-vaibhav-id-999',
            email: 'vaibhav7616@propfirm.com',
            password_hash: adminPasswordHash,
            full_name: 'Vaibhav (Admin)',
            role: 'ADMIN',
            country: 'Global',
            phone: '+1 800-FUNDEDSHIFT',
            affiliate_code: 'ADMIN_PRO',
            is_verified: true,
            is_2fa_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        account_plans: DEFAULT_PLANS,
        symbols: DEFAULT_SYMBOLS,
        accounts: [
          {
            id: 'acc-demo-1',
            user_id: 'demo-trader-id-12345',
            order_id: 'ord-demo-1',
            account_number: '8820491',
            login: '8820491',
            password_hash: hashPassword('TraderSecret99!'),
            investor_password_hash: hashPassword('InvRead44#'),
            server: 'FundedShift-Live01',
            plan_id: 'plan-2step-100k',
            plan_name: 'FundedShift $100k 2-Step Challenge',
            type: 'two_step',
            account_size: 100000,
            starting_balance: 100000,
            current_balance: 106420,
            current_equity: 106420,
            highest_balance: 106420,
            highest_equity: 106420,
            start_of_day_balance: 100000,
            start_of_day_equity: 100000,
            status: 'ACTIVE',
            phase: 1,
            trading_days: 8,
            leverage: 100,
            rules: DEFAULT_PLANS[1].rules,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        orders: [
          {
            id: 'ord-demo-1',
            user_id: 'demo-trader-id-12345',
            plan_id: 'plan-2step-100k',
            plan_name: 'FundedShift $100k 2-Step Challenge',
            account_size: 100000,
            platform: 'fundedshift_terminal',
            addons: [],
            discount_amount: 0,
            total_amount: 499,
            status: 'PAID',
            payment_method: 'visa',
            created_at: new Date().toISOString(),
          },
        ],
        payments: [
          {
            id: 'pay-demo-1',
            order_id: 'ord-demo-1',
            user_id: 'demo-trader-id-12345',
            method: 'visa',
            amount: 499,
            currency: 'USD',
            status: 'COMPLETED',
            transaction_id: 'TXN-994827102',
            metadata: { card_brand: 'Visa', last4: '4242' },
            created_at: new Date().toISOString(),
          },
        ],
        positions: [
          {
            id: 'pos-demo-1',
            account_id: 'acc-demo-1',
            user_id: 'demo-trader-id-12345',
            symbol: 'EURUSD',
            type: 'BUY',
            lot_size: 2.0,
            open_price: 1.0820,
            margin: 2164,
            floating_pnl: 140.0,
            swap: 0,
            commission: 12.0,
            status: 'OPEN',
            opened_at: new Date().toISOString(),
          },
        ],
        trade_orders: [],
        rule_violations: [],
        payout_requests: [],
        affiliate_withdrawals: [
          {
            id: 'aff-wd-demo-1',
            user_id: 'demo-trader-id-12345',
            user_email: 'trader@propfirm.com',
            user_name: 'Alex Vance',
            amount: 250,
            method: 'Crypto',
            payment_details: {
              crypto_network: 'USDT (TRC20)',
              wallet_address: 'TXu8vN4pL3qKz9mR2wX1yZ0aB5cC7dE9fG',
            },
            status: 'APPROVAL PENDING',
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
        ],
        notifications: [
          {
            id: 'notif-1',
            user_id: 'demo-trader-id-12345',
            title: 'Account Provisioned Successfully',
            body: 'Your $100,000 MT5 trading account #8820491 is active.',
            type: 'success',
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ],
        audit_logs: [
          {
            id: 'audit-1',
            actor_id: 'SYSTEM',
            actor_role: 'SYSTEM',
            action: 'SYSTEM_BOOT',
            details: 'Database initialized with demo trader and admin accounts.',
            created_at: new Date().toISOString(),
          },
        ],
        promo_codes: [
          { id: 'promo-1', code: 'PROPFIRM20', discount_type: 'PERCENTAGE', discount_value: 20, usage_count: 14, max_uses: 500, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-2', code: 'WELCOME10', discount_type: 'PERCENTAGE', discount_value: 10, usage_count: 32, max_uses: 1000, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-3', code: 'PROP50', discount_type: 'FIXED', discount_value: 50, usage_count: 5, max_uses: 100, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-4', code: 'VAIBHAV100', discount_type: 'PERCENTAGE', discount_value: 100, usage_count: 3, max_uses: 50, is_active: true, created_at: new Date().toISOString() },
        ],
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      if (!loaded.promo_codes) {
        loaded.promo_codes = [
          { id: 'promo-1', code: 'PROPFIRM20', discount_type: 'PERCENTAGE', discount_value: 20, usage_count: 14, max_uses: 500, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-2', code: 'WELCOME10', discount_type: 'PERCENTAGE', discount_value: 10, usage_count: 32, max_uses: 1000, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-3', code: 'PROP50', discount_type: 'FIXED', discount_value: 50, usage_count: 5, max_uses: 100, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-4', code: 'VAIBHAV100', discount_type: 'PERCENTAGE', discount_value: 100, usage_count: 3, max_uses: 50, is_active: true, created_at: new Date().toISOString() },
        ];
      }
      if (!loaded.challenges || loaded.challenges.length === 0) {
        loaded.challenges = [];
      }
      if (!loaded.affiliate_withdrawals) {
        loaded.affiliate_withdrawals = [];
      }
      return loaded;
    } catch (err) {
      console.error('Error reading database file:', err);
      return {
        challenges: [],
        users: [],
        account_plans: DEFAULT_PLANS,
        symbols: DEFAULT_SYMBOLS,
        accounts: [],
        orders: [],
        payments: [],
        positions: [],
        trade_orders: [],
        rule_violations: [],
        payout_requests: [],
        affiliate_withdrawals: [],
        notifications: [],
        audit_logs: [],
        promo_codes: [
          { id: 'promo-1', code: 'PROPFIRM20', discount_type: 'PERCENTAGE', discount_value: 20, usage_count: 14, max_uses: 500, is_active: true, created_at: new Date().toISOString() },
          { id: 'promo-2', code: 'WELCOME10', discount_type: 'PERCENTAGE', discount_value: 10, usage_count: 32, max_uses: 1000, is_active: true, created_at: new Date().toISOString() },
        ],
      };
    }
  }

  public static saveDB(): void {
    if (!this.db) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2));
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }
}
