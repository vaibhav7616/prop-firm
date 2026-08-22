import { DBEngine } from './db';
import type { OrderEntity, PaymentEntity, TradingAccountEntity, PaymentMethod } from './types';

export interface PaymentProvider {
  processCheckout(params: {
    userId: string;
    planId: string;
    accountSize: number;
    platform: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }): Promise<{ success: boolean; order?: OrderEntity; account?: TradingAccountEntity; error?: string }>;
}

export class CheckoutPaymentService implements PaymentProvider {
  public async processCheckout(params: {
    userId: string;
    planId: string;
    accountSize: number;
    platform: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }): Promise<{ success: boolean; order?: OrderEntity; account?: TradingAccountEntity; error?: string }> {
    const db = DBEngine.getDB();
    const user = db.users.find((u) => u.id === params.userId);

    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const plan = db.account_plans.find((p) => p.id === params.planId || p.account_size === params.accountSize);
    const planName = plan ? plan.name : `FundedShift $${params.accountSize.toLocaleString()} Challenge`;
    const basePrice = plan ? plan.price : 499;

    let discountAmount = 0;
    if (params.couponCode) {
      const codeUpper = params.couponCode.trim().toUpperCase();
      const promo = db.promo_codes.find((p) => p.code.toUpperCase() === codeUpper && p.is_active);
      if (promo && promo.usage_count < promo.max_uses) {
        if (promo.discount_type === 'PERCENTAGE') {
          discountAmount = (basePrice * promo.discount_value) / 100;
        } else {
          discountAmount = Math.min(basePrice, promo.discount_value);
        }
        promo.usage_count += 1;
      } else if (codeUpper === 'PROPFIRM20') {
        discountAmount = basePrice * 0.2;
      } else if (codeUpper === 'VAIBHAV100') {
        discountAmount = basePrice;
      }
    }

    const totalAmount = Math.max(0, Number((basePrice - discountAmount).toFixed(2)));

    // Create Order Record
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(-4)}`;
    const newOrder: OrderEntity = {
      id: orderId,
      user_id: user.id,
      plan_id: plan ? plan.id : 'plan-2step-100k',
      plan_name: planName,
      account_size: params.accountSize,
      platform: params.platform,
      addons: [],
      coupon_code: params.couponCode,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: 'PAID',
      payment_method: params.paymentMethod,
      created_at: new Date().toISOString(),
    };

    // Create Payment Verification Record
    const paymentId = `pay-${Date.now()}`;
    const newPayment: PaymentEntity = {
      id: paymentId,
      order_id: orderId,
      user_id: user.id,
      method: params.paymentMethod,
      amount: totalAmount,
      currency: 'USD',
      status: 'COMPLETED',
      transaction_id: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      metadata: { method: params.paymentMethod, coupon: params.couponCode || null },
      created_at: new Date().toISOString(),
    };

    // Automatically generate trading credentials
    const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
    const traderPassword = `FS_${Math.random().toString(36).slice(-6)}!`;
    const investorPassword = `INV_${Math.random().toString(36).slice(-6)}#`;

    const rulesConfig = plan ? plan.rules : DBEngine.getDB().account_plans[1].rules;
    const isInstant = plan ? plan.type === 'instant_funding' : false;

    const newAccount: TradingAccountEntity = {
      id: `acc-${Date.now()}`,
      user_id: user.id,
      order_id: orderId,
      account_number: newAccNumber,
      login: newAccNumber,
      password_hash: traderPassword, // raw returned to user response once
      investor_password_hash: investorPassword,
      server: 'FundedShift-Live01',
      plan_id: plan ? plan.id : 'plan-2step-100k',
      plan_name: planName,
      type: plan ? plan.type : 'two_step',
      account_size: params.accountSize,
      starting_balance: params.accountSize,
      current_balance: params.accountSize,
      current_equity: params.accountSize,
      highest_balance: params.accountSize,
      highest_equity: params.accountSize,
      start_of_day_balance: params.accountSize,
      start_of_day_equity: params.accountSize,
      status: isInstant ? 'FUNDED' : 'ACTIVE',
      phase: isInstant ? 3 : 1,
      trading_days: 0,
      leverage: rulesConfig.leverage,
      rules: rulesConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    db.payments.unshift(newPayment);
    db.accounts.unshift(newAccount);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      title: '⚡ Account Provisioned!',
      body: `Your $${params.accountSize.toLocaleString()} ${params.platform.toUpperCase()} trading account #${newAccNumber} is active. Login: ${newAccNumber}, Password: ${traderPassword}`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: user.id,
      actor_role: 'USER',
      action: 'ORDER_COMPLETED',
      target_id: newAccount.id,
      details: `Purchased ${planName} for $${totalAmount} via ${params.paymentMethod}. Account #${newAccNumber} generated.`,
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();

    return {
      success: true,
      order: newOrder,
      account: {
        ...newAccount,
        password_hash: traderPassword, // send readable password in initial creation payload
        investor_password_hash: investorPassword,
      },
    };
  }
}

export const paymentService = new CheckoutPaymentService();
