export type ChallengeType = 'one_step' | 'two_step' | 'instant_funding';
export type Platform = 'fundedshift_terminal';
export type OrderType = 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'waiting_assignment'
  | 'assigned'
  | 'cancelled'
  | 'refunded';
export type AccountStatus = 'pending' | 'active' | 'passed' | 'failed' | 'breached' | 'funded';
export type UserRole = 'trader' | 'admin';
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
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type KycStatus = 'pending' | 'approved' | 'rejected';
export type KycDocumentType = 'passport' | 'national_id' | 'driving_license';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface ChallengeRules {
  profit_target: number;
  daily_drawdown: number;
  max_drawdown: number;
  min_trading_days: number;
  max_trading_days: number;
  leverage: number;
  profit_split: number;
  news_trading: boolean;
  weekend_holding: boolean;
  consistency: number;
  scaling_plan: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  country: string | null;
  phone: string | null;
  avatar_url: string | null;
  affiliate_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  name: string;
  type: ChallengeType;
  account_size: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  rules: ChallengeRules;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Order {
  id: string;
  user_id: string;
  challenge_id: string;
  account_size: number;
  platform: Platform;
  addons: Addon[];
  coupon_code: string | null;
  discount_amount: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  challenge?: Challenge;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'issued' | 'paid' | 'void';
  pdf_url: string | null;
  created_at: string;
}

export interface TradingAccount {
  id: string;
  order_id: string;
  user_id: string;
  challenge_id: string;
  account_size: number;
  platform: Platform;
  broker: string | null;
  account_number: string | null;
  password: string | null;
  investor_password: string | null;
  server: string | null;
  status: AccountStatus;
  current_balance: number;
  starting_balance: number;
  profit: number;
  highest_balance: number;
  trading_days: number;
  max_trading_days: number | null;
  phase: number;
  rules: ChallengeRules;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
  challenge?: Challenge;
  plan_name?: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  code?: string;
  clicks: number;
  conversions: number;
  earnings: number;
  withdrawn: number;
  status?: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  messages: Array<{ sender: string; message: string; created_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface Kyc {
  id: string;
  user_id: string;
  document_type: KycDocumentType;
  document_url: string | null;
  selfie_url: string | null;
  proof_of_address_url: string | null;
  status: KycStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  tags: string[];
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: string | null;
  is_public: boolean;
}

export interface Certificate {
  id: string;
  user_id: string;
  account_id?: string;
  title: string;
  type: 'step1_passed' | 'step2_passed' | 'funded' | 'payout' | 'passed_phase1' | 'passed_phase2' | string;
  subtitle?: string;
  recipient_name?: string;
  account_size?: number;
  amount?: number;
  account_number?: string;
  challenge_name?: string;
  certificate_number?: string;
  issued_at: string;
  pdf_url?: string | null;
}
