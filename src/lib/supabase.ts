import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder-propfirm.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const DATABASE = {
  PROFILES: 'profiles',
  CHALLENGES: 'challenges',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  INVOICES: 'invoices',
  TRADING_ACCOUNTS: 'trading_accounts',
  COUPONS: 'coupons',
  AFFILIATES: 'affiliates',
  NOTIFICATIONS: 'notifications',
  SUPPORT_TICKETS: 'support_tickets',
  KYC: 'kyc',
  BLOGS: 'blogs',
  SETTINGS: 'settings',
} as const;
