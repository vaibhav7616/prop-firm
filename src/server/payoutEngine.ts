import { DBEngine } from './db';
import type { PayoutRequestEntity } from './types';
import { EmailService } from './emailService';

export class PayoutEngine {
  /**
   * Validates if an account is eligible for a payout.
   */
  public static checkPayoutEligibility(accountId: string, userId: string): { eligible: boolean; profit: number; reason?: string } {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId && a.user_id === userId);

    if (!account) {
      return { eligible: false, profit: 0, reason: 'Account not found.' };
    }

    if (account.status !== 'FUNDED') {
      return { eligible: false, profit: 0, reason: 'Only active Funded accounts are eligible for payouts.' };
    }

    // Check for open positions: Institutional rule requires flat positions
    const openPositions = db.positions.filter((p) => p.account_id === accountId && p.status === 'OPEN');
    if (openPositions.length > 0) {
      return {
        eligible: false,
        profit: 0,
        reason: 'Cannot request payout while positions are still open. Please close all open positions first.',
      };
    }

    // Check for breaches
    const breaches = db.rule_violations.filter((v) => v.account_id === accountId);
    if (breaches.length > 0) {
      return { eligible: false, profit: 0, reason: 'Account has active rule violations.' };
    }

    // Calculate total net profit
    const netProfit = Number((account.current_balance - account.starting_balance).toFixed(2));
    if (netProfit <= 0) {
      return { eligible: false, profit: 0, reason: 'Account currently has no realized profits.' };
    }

    // Minimum payout threshold ($100)
    const MIN_PAYOUT_AMOUNT = 100;
    if (netProfit < MIN_PAYOUT_AMOUNT) {
      return {
        eligible: false,
        profit: netProfit,
        reason: `Minimum payout threshold is $${MIN_PAYOUT_AMOUNT}. Current realized profit is $${netProfit.toFixed(2)}.`,
      };
    }

    // Check for pending payout requests
    const existingPending = db.payout_requests.find(
      (p) => p.account_id === accountId && (p.status === 'REQUESTED' || p.status === 'UNDER_REVIEW' || p.status === 'PROCESSING')
    );

    if (existingPending) {
      return { eligible: false, profit: netProfit, reason: 'A payout request for this account is already in progress.' };
    }

    // Check 14-day payout cooldown if previously paid
    const lastPaid = db.payout_requests
      .filter((p) => p.account_id === accountId && p.status === 'PAID' && p.paid_at)
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())[0];

    if (lastPaid && lastPaid.paid_at) {
      const daysSinceLastPayout = (Date.now() - new Date(lastPaid.paid_at).getTime()) / (1000 * 60 * 60 * 24);
      const COOLDOWN_DAYS = 14;
      if (daysSinceLastPayout < COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSinceLastPayout);
        return {
          eligible: false,
          profit: netProfit,
          reason: `Payout cooldown period active. Next payout eligible in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`,
        };
      }
    }

    return { eligible: true, profit: netProfit };
  }

  /**
   * Submits a payout request
   */
  public static requestPayout(params: {
    accountId: string;
    userId: string;
    payoutMethod: string;
    payoutAddress: string;
    paymentDetails?: any;
    userEmail?: string;
    userName?: string;
  }): { success: boolean; payout?: PayoutRequestEntity; error?: string } {
    const eligibility = this.checkPayoutEligibility(params.accountId, params.userId);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason };
    }

    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === params.accountId)!;
    const userObj = db.users.find((u) => u.id === params.userId);

    const profit = eligibility.profit;
    const defaultSplit = (account.type || '').toUpperCase().includes('INSTANT') || (account.plan_name || '').toUpperCase().includes('INSTANT') ? 70 : 80;
    const traderSplit = account.rules?.profit_split_percent || defaultSplit;
    const traderAmount = Number(((traderSplit / 100) * profit).toFixed(2));
    const firmAmount = Number((profit - traderAmount).toFixed(2));

    const payoutRequest: PayoutRequestEntity = {
      id: `payout-${Date.now()}`,
      account_id: account.id,
      user_id: account.user_id,
      user_email: params.userEmail || userObj?.email || 'trader@propfirm.com',
      user_name: params.userName || userObj?.full_name || 'Valued Trader',
      account_number: account.account_number,
      total_profit: profit,
      trader_split_percent: traderSplit,
      trader_payout_amount: traderAmount,
      firm_share_amount: firmAmount,
      payout_method: params.payoutMethod,
      payout_address: params.payoutAddress,
      payment_details: params.paymentDetails || {},
      status: 'REQUESTED',
      created_at: new Date().toISOString(),
    };

    db.payout_requests.unshift(payoutRequest);
    account.status = 'PAYOUT_PENDING';

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: account.user_id,
      title: 'Payout Request Submitted',
      body: `Your request for $${traderAmount.toLocaleString()} (${traderSplit}% split) on account #${account.account_number} has been received and is under review.`,
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: account.user_id,
      actor_role: 'USER',
      action: 'PAYOUT_REQUESTED',
      target_id: payoutRequest.id,
      details: `Requested payout of $${traderAmount} on account #${account.account_number}.`,
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();

    return { success: true, payout: payoutRequest };
  }

  /**
   * Admin approves or rejects a payout request
   */
  public static processPayoutAdmin(params: {
    payoutId: string;
    adminId: string;
    action: 'APPROVE' | 'REJECT';
    reason?: string;
  }): { success: boolean; payout?: PayoutRequestEntity; error?: string } {
    const db = DBEngine.getDB();
    const payout = db.payout_requests.find((p) => p.id === params.payoutId);

    if (!payout) {
      return { success: false, error: 'Payout request not found.' };
    }

    const account = db.accounts.find((a) => a.id === payout.account_id);

    if (params.action === 'APPROVE') {
      payout.status = 'PAID';
      payout.reviewed_by = params.adminId;
      payout.reviewed_at = new Date().toISOString();
      payout.paid_at = new Date().toISOString();

      if (account) {
        // Reset balance back to initial starting balance after payout
        account.current_balance = account.starting_balance;
        account.current_equity = account.starting_balance;
        account.start_of_day_balance = account.starting_balance;
        account.start_of_day_equity = account.starting_balance;
        account.status = 'FUNDED';
      }

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: payout.user_id,
        title: '💵 Payout Approved & Paid!',
        body: `Your payout of $${payout.trader_payout_amount.toLocaleString()} has been processed and sent via ${payout.payout_method}.`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else {
      payout.status = 'REJECTED';
      payout.rejection_reason = params.reason || 'Risk audit review declined request.';
      payout.reviewed_by = params.adminId;
      payout.reviewed_at = new Date().toISOString();

      if (account) {
        account.status = 'FUNDED';
      }

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: payout.user_id,
        title: 'Payout Request Declined',
        body: `Your payout request of $${payout.trader_payout_amount.toLocaleString()} was declined. Reason: ${payout.rejection_reason}`,
        type: 'error',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: params.adminId,
      actor_role: 'ADMIN',
      action: params.action === 'APPROVE' ? 'PAYOUT_APPROVED' : 'PAYOUT_REJECTED',
      target_id: payout.id,
      details: `Payout ${params.action}D for account #${payout.account_number}. Amount: $${payout.trader_payout_amount}`,
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();

    if (params.action === 'APPROVE') {
      const user = db.users.find((u) => u.id === payout.user_id);
      const recipientEmail = payout.user_email || user?.email;
      if (recipientEmail) {
        EmailService.sendPayoutDisbursedEmail({
          recipientEmail,
          recipientName: payout.user_name || user?.name || recipientEmail.split('@')[0],
          payoutId: payout.id,
          accountNumber: payout.account_number,
          totalProfit: payout.total_profit,
          traderShare: payout.trader_payout_amount,
          firmShare: payout.firm_share_amount,
          payoutMethod: payout.payout_method,
          destination: payout.payout_address,
        }).catch((err) => console.error('[EmailService] Failed to send payout disbursed email:', err));
      }
    }

    return { success: true, payout };
  }
}
