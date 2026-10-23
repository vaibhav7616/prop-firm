import type { TradingAccount, Order, Notification, Platform, ChallengeRules } from '@/types';

export async function fetchUserAccounts(userId: string): Promise<TradingAccount[]> {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = { 'x-user-id': userId };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/accounts', {
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as TradingAccount[];
    }
  } catch (err) {
    console.warn('API fetch accounts fallback:', err);
  }
  return [];
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders', {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Order[];
    }
  } catch (err) {
    console.warn('API fetch orders fallback:', err);
  }
  return [];
}

export async function createChallengeOrder(params: {
  userId: string;
  account_size: number;
  challenge_id: string;
  challenge_name: string;
  platform: string;
  total_amount: number;
  payment_method: string;
  coupon_code?: string;
  plan_id?: string;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...params,
        plan_id: params.plan_id || params.challenge_id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('API create order error:', err);
  }
  return { success: false, error: 'Failed to process checkout.' };
}

export async function executeOrderApi(params: {
  userId: string;
  accountId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const termToken = typeof localStorage !== 'undefined' ? localStorage.getItem('terminal_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (termToken) headers['x-terminal-token'] = termToken;

    const res = await fetch('/api/trading/order', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Trade execution failed.' };
  }
}

export async function closePositionApi(params: {
  userId: string;
  accountId: string;
  positionId: string;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const termToken = typeof localStorage !== 'undefined' ? localStorage.getItem('terminal_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (termToken) headers['x-terminal-token'] = termToken;

    const res = await fetch('/api/trading/close-position', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Position close failed.' };
  }
}

export async function updatePositionSLTPApi(params: {
  userId: string;
  accountId: string;
  positionId: string;
  stopLoss?: number | null;
  takeProfit?: number | null;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const termToken = typeof localStorage !== 'undefined' ? localStorage.getItem('terminal_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (termToken) headers['x-terminal-token'] = termToken;

    const res = await fetch('/api/trading/update-sltp', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'SL/TP update failed.' };
  }
}

export async function fetchAccountPositionsApi(accountId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/positions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch positions:', err);
  }
  return [];
}

export async function fetchAccountViolationsApi(accountId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/violations`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch violations:', err);
  }
  return [];
}

export async function fetchPayoutEligibilityApi(accountId: string, userId: string) {
  try {
    const res = await fetch(`/api/payouts/eligibility/${accountId}`, {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch payout eligibility:', err);
  }
  return { eligible: false, profit: 0, reason: 'Error checking eligibility.' };
}

export async function requestPayoutApi(params: {
  userId: string;
  accountId: string;
  payoutMethod: string;
  payoutAddress: string;
}) {
  try {
    const res = await fetch('/api/payouts/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Payout request failed.' };
  }
}

export async function adminLoginApi(username: string, password: string) {
  const res = await fetch('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid admin credentials');
  }
  return res.json();
}

function getAdminHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
  };
}

export async function fetchAdminStatsApi() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: getAdminHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch admin stats:', err);
  }
  return null;
}

export async function updateAccountStatusApi(account_id: string, status: string, immediate: boolean = false) {
  try {
    const res = await fetch('/api/admin/accounts/update-status', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ account_id, status, immediate }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to update account status:', err);
  }
  return null;
}

export async function expediteTransitionApi(accountId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/expedite-transition`, {
      method: 'POST',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to expedite transition' };
  }
}

export async function processPayoutAdminApi(payoutId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
  try {
    const res = await fetch('/api/admin/payouts/process', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ payoutId, action, reason }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to process payout:', err);
  }
  return null;
}

export async function issueManualAccountApi(params: {
  email: string;
  full_name?: string;
  account_size: number;
  type: string;
  stage?: string;
  platform?: string;
  broker?: string;
}) {
  try {
    const res = await fetch('/api/admin/accounts/issue-manual', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to issue account' };
  }
}

export async function validatePromoCodeApi(code: string, amount: number) {
  try {
    const res = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount }),
    });
    return await res.json();
  } catch (err: any) {
    return { valid: false, error: 'Network error validating code' };
  }
}

export async function fetchChallengesApi(): Promise<any[]> {
  try {
    const res = await fetch('/api/challenges');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('fundedshift_challenges', JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch challenges from server:', err);
  }

  // Fallback to local storage or null
  try {
    const saved = localStorage.getItem('fundedshift_challenges');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (_) {}

  return [];
}

export async function updateChallengePriceApi(
  id: string,
  priceOrData: number | { price: number; original_price?: number; offer_active?: boolean; discount_badge?: string; rules?: any },
  rulesParam?: any
): Promise<any> {
  try {
    const payload =
      typeof priceOrData === 'number'
        ? { id, price: priceOrData, rules: rulesParam }
        : { id, ...priceOrData, rules: priceOrData.rules || rulesParam };

    const res = await fetch('/api/admin/challenges/update', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.challenges) {
        localStorage.setItem('fundedshift_challenges', JSON.stringify(data.challenges));
      }
      return data;
    }
  } catch (err) {
    console.warn('Failed to update challenge price on server:', err);
  }
  return { success: false };
}

export async function batchOfferApi(params: {
  discount_percent?: number;
  discount_badge?: string;
  target_type?: string;
  clear_offers?: boolean;
}): Promise<any> {
  try {
    const res = await fetch('/api/admin/challenges/batch-offer', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.challenges) {
        localStorage.setItem('fundedshift_challenges', JSON.stringify(data.challenges));
      }
      return data;
    }
  } catch (err) {
    console.warn('Failed to apply batch offer on server:', err);
  }
  return { success: false };
}

export async function fetchPromoCodesApi() {
  try {
    const res = await fetch('/api/promo-codes');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch promo codes:', err);
  }
  return [];
}

export async function createPromoCodeApi(params: {
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  max_uses?: number;
}) {
  try {
    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create promo code' };
  }
}

export async function togglePromoCodeApi(id: string) {
  try {
    const res = await fetch(`/api/admin/promo-codes/${id}/toggle`, {
      method: 'PUT',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function deletePromoCodeApi(id: string) {
  try {
    const res = await fetch(`/api/admin/promo-codes/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

// -------------------------------------------------------------
// AFFILIATE WITHDRAWAL API CLIENT HELPERS
// -------------------------------------------------------------
export async function fetchAffiliateWithdrawalsApi(userId: string) {
  try {
    const res = await fetch('/api/affiliate/withdrawals', {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch affiliate withdrawals:', err);
  }
  return {
    withdrawals: [],
    stats: {
      total_earnings: 0,
      approved_withdrawn: 0,
      pending_withdrawn: 0,
      available_balance: 0,
      min_withdrawal: 250,
    },
  };
}

export async function submitAffiliateWithdrawalApi(params: {
  userId: string;
  amount: number;
  method: string;
  payment_details: any;
}) {
  try {
    const res = await fetch('/api/affiliate/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit withdrawal request.' };
  }
}

export async function fetchAdminAffiliateWithdrawalsApi() {
  try {
    const res = await fetch('/api/admin/affiliate/withdrawals', {
      headers: getAdminHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch admin affiliate withdrawals:', err);
  }
  return [];
}

export async function processAdminAffiliateWithdrawalApi(params: {
  withdrawalId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}) {
  try {
    const res = await fetch('/api/admin/affiliate/withdraw/process', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to process withdrawal action.' };
  }
}

// -------------------------------------------------------------
// DIFFERENTIATED PROP FIRM API CLIENT HELPERS
// -------------------------------------------------------------
export async function partialClosePositionApi(params: {
  userId: string;
  accountId: string;
  positionId: string;
  lotsToClose: number;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const termToken = typeof localStorage !== 'undefined' ? localStorage.getItem('terminal_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (termToken) headers['x-terminal-token'] = termToken;

    const res = await fetch('/api/trading/partial-close', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Partial close failed.' };
  }
}

export async function simulateTradeApi(params: {
  accountId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
}) {
  try {
    const res = await fetch('/api/trading/simulate-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Trade simulation failed.' };
  }
}

export async function fetchViolationsExplainApi(accountId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/violations/explain`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch breach explanation:', err);
  }
  return [];
}

export async function fetchRiskProfileApi(accountId: string) {
  try {
    const res = await fetch(`/api/trader/risk-profile/${accountId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch risk profile:', err);
  }
  return null;
}

export async function fetchHealthScoreApi(accountId: string) {
  try {
    const res = await fetch(`/api/trader/health-score/${accountId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch health score:', err);
  }
  return null;
}

export async function fetchStrategyFingerprintApi(accountId: string) {
  try {
    const res = await fetch(`/api/trader/strategy-fingerprint/${accountId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch strategy fingerprint:', err);
  }
  return null;
}

export async function fetchTimelineApi(accountId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/timeline`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch timeline:', err);
  }
  return [];
}

export async function fetchRecoveryOptionsApi(accountId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/recovery-options`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch recovery options:', err);
  }
  return null;
}

export async function executeRecoveryResetApi(accountId: string, userId: string) {
  try {
    const res = await fetch(`/api/accounts/${accountId}/recovery-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Recovery reset failed.' };
  }
}

export async function fetchAdminAuditLogsApi(params?: { search?: string; limit?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch audit logs:', err);
  }
  return { total: 0, logs: [] };
}

export async function registerUserApi(params: {
  email: string;
  password: string;
  full_name?: string;
  country?: string;
  phone?: string;
  referred_by?: string;
}) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register account.');
  }
  return data;
}

export async function loginUserApi(params: {
  email: string;
  password: string;
}) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password.');
  }
  return data;
}

// -------------------------------------------------------------
// ADMIN USER MANAGEMENT API
// -------------------------------------------------------------
export async function updateUserRoleApi(userId: string, role: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
    const res = await fetch(`/api/admin/users/${userId}/update-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
      },
      body: JSON.stringify({ role }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user role.' };
  }
}

export async function toggleUserStatusApi(userId: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
    const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
      },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle user status.' };
  }
}

// -------------------------------------------------------------
// KYC & IDENTITY VERIFICATION API
// -------------------------------------------------------------
export async function fetchKycStatusApi(userId?: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/kyc/status', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
      },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch KYC status:', err);
  }
  return { is_verified: false, submission: null };
}

export async function submitKycApi(params: {
  userId?: string;
  document_type: string;
  document_number?: string;
  country?: string;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(params.userId ? { 'x-user-id': params.userId } : {}),
      },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit KYC.' };
  }
}

export async function fetchAdminKycSubmissionsApi() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/admin/kyc/submissions', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
      },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch admin KYC submissions:', err);
  }
  return [];
}

export async function reviewKycSubmissionApi(params: {
  submissionId: string;
  status: 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/admin/kyc/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
      },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to review KYC submission.' };
  }
}

// -------------------------------------------------------------
// SUPPORT TICKETS API
// -------------------------------------------------------------
export async function fetchUserSupportTicketsApi(userId?: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/support/tickets', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
      },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch support tickets:', err);
  }
  return [];
}

export async function createSupportTicketApi(params: {
  userId?: string;
  subject: string;
  category?: string;
  priority?: string;
  message: string;
}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(params.userId ? { 'x-user-id': params.userId } : {}),
      },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create support ticket.' };
  }
}

export async function replySupportTicketApi(ticketId: string, message: string, userId?: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('admin_token') || localStorage.getItem('auth_token')) : null;
    const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : (!token ? { 'x-user-id': 'admin-vaibhav-id-999' } : {})),
      },
      body: JSON.stringify({ message }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reply to ticket.' };
  }
}

export async function fetchAdminSupportTicketsApi() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/admin/support/tickets', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
      },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch admin support tickets:', err);
  }
  return [];
}

export async function adminUpdateSupportTicketStatusApi(ticketId: string, status: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token') : null;
    const res = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-id': 'admin-vaibhav-id-999' }),
      },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update ticket status.' };
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS API CLIENT HELPERS
// -------------------------------------------------------------
export async function fetchNotificationsApi(userId?: string): Promise<Notification[]> {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/notifications', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Failed to fetch notifications:', err);
  }
  return [];
}

export async function markNotificationReadApi(id?: string, userId?: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
      },
      body: JSON.stringify({ id, userId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark notifications read' };
  }
}

// -------------------------------------------------------------
// ADMIN EMAIL ENGINE API CLIENT HELPERS
// -------------------------------------------------------------
export async function fetchEmailConfigApi() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/admin/email/config', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch email config:', err);
  }
  return { configured: false, provider: 'Unavailable', from: '', replyTo: '' };
}

export async function fetchEmailLogsApi(limit = 50) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch(`/api/admin/email/logs?limit=${limit}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch email logs:', err);
  }
  return { total: 0, logs: [] };
}

export async function sendTestEmailApi(to: string) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/admin/email/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ to }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send test email' };
  }
}

// -------------------------------------------------------------
// WEB TERMINAL AUTHENTICATION & SESSION APIS
// -------------------------------------------------------------

export async function loginTerminalApi(params: { login: string; password: string }) {
  try {
    const webToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/terminal/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webToken ? { Authorization: `Bearer ${webToken}` } : {}),
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.success && data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('terminal_token', data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to authenticate trading account.' };
  }
}

export async function fetchTerminalSessionApi(accountId?: string, explicitLogout?: boolean) {
  try {
    const termToken = typeof localStorage !== 'undefined' ? localStorage.getItem('terminal_token') : null;
    const webToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {};
    if (termToken) headers['x-terminal-token'] = termToken;
    if (webToken) headers['Authorization'] = `Bearer ${webToken}`;
    if (explicitLogout) headers['x-terminal-logout'] = 'true';

    let url = '/api/terminal/session';
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    if (explicitLogout) params.set('explicitLogout', 'true');
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('terminal_token', data.token);
      }
      return data;
    }
  } catch (err) {
    console.warn('Terminal session check error:', err);
  }
  return { authenticated: false, reason: 'NETWORK_ERROR' };
}

export async function logoutTerminalApi() {
  try {
    const termToken = typeof localStorage !== 'undefined' ? localStorage.getItem('terminal_token') : null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('terminal_token');
    }
    if (termToken) {
      await fetch('/api/terminal/logout', {
        method: 'POST',
        headers: { 'x-terminal-token': termToken },
      });
    }
  } catch (err) {
    console.warn('Terminal logout notice:', err);
  }
  return { success: true };
}

export async function fetchTerminalAccountsApi() {
  try {
    const webToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/terminal/accounts', {
      headers: {
        ...(webToken ? { Authorization: `Bearer ${webToken}` } : {}),
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch terminal accounts:', err);
  }
  return [];
}

export async function fetchTerminalCandlesApi(symbol: string, timeframe: string = '15m', limit: number = 60) {
  try {
    const res = await fetch(`/api/terminal/candles/${encodeURIComponent(symbol)}?timeframe=${timeframe}&limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Failed to fetch candles for ${symbol}:`, err);
  }
  return { symbol, timeframe, candles: [] };
}



