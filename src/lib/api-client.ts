import type { TradingAccount, Order, Notification, Platform, ChallengeRules } from '@/types';

export async function fetchUserAccounts(userId: string): Promise<TradingAccount[]> {
  try {
    const res = await fetch('/api/accounts', {
      headers: { 'x-user-id': userId },
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
}) {
  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
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
    const res = await fetch('/api/trading/order', {
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
    return { success: false, error: err.message || 'Trade execution failed.' };
  }
}

export async function closePositionApi(params: {
  userId: string;
  accountId: string;
  positionId: string;
}) {
  try {
    const res = await fetch('/api/trading/close-position', {
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
    return { success: false, error: err.message || 'Position close failed.' };
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

export async function fetchAdminStatsApi() {
  try {
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch admin stats:', err);
  }
  return null;
}

export async function updateAccountStatusApi(account_id: string, status: string) {
  try {
    const res = await fetch('/api/admin/accounts/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id, status }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to update account status:', err);
  }
  return null;
}

export async function processPayoutAdminApi(payoutId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
  try {
    const res = await fetch('/api/admin/payouts/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  platform?: string;
  broker?: string;
}) {
  try {
    const res = await fetch('/api/admin/accounts/issue-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export async function updateChallengePriceApi(id: string, price: number, rules?: any): Promise<any> {
  try {
    const res = await fetch('/api/admin/challenges/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, price, rules }),
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
      headers: { 'Content-Type': 'application/json' },
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
      total_earnings: 480,
      approved_withdrawn: 0,
      pending_withdrawn: 0,
      available_balance: 480,
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
    const res = await fetch('/api/admin/affiliate/withdrawals');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to process withdrawal action.' };
  }
}

