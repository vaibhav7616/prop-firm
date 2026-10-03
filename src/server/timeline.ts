import { DBEngine } from './db';
import type { PerformanceTimelineEvent } from './types';

export class TraderTimelineEngine {
  public static getAccountTimeline(accountId: string): PerformanceTimelineEvent[] {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) return [];

    const events: PerformanceTimelineEvent[] = [];

    // 1. Account Created
    events.push({
      id: `evt-prov-${account.id}`,
      accountId: account.id,
      eventType: 'ACCOUNT_PROVISIONED',
      title: 'Account Provisioned',
      description: `$${account.account_size.toLocaleString()} ${account.plan_name} account #${account.account_number} created with 1:${account.leverage} leverage.`,
      severity: 'info',
      timestamp: account.created_at,
    });

    // 2. Positions Opened and Closed
    const positions = db.positions.filter((p) => p.account_id === accountId);
    for (const p of positions) {
      if (p.opened_at) {
        events.push({
          id: `evt-op-${p.id}`,
          accountId: account.id,
          eventType: 'TRADE_OPENED',
          title: `Opened ${p.type} ${p.lot_size} Lots ${p.symbol}`,
          description: `Entry price @ ${p.open_price}${p.stop_loss ? ` | SL: ${p.stop_loss}` : ''}${p.take_profit ? ` | TP: ${p.take_profit}` : ''}`,
          severity: 'info',
          timestamp: p.opened_at,
          metadata: { symbol: p.symbol, lotSize: p.lot_size, type: p.type },
        });
      }
      if (p.status === 'CLOSED' && p.closed_at) {
        const isWin = (p.realized_pnl || 0) >= 0;
        events.push({
          id: `evt-cl-${p.id}`,
          accountId: account.id,
          eventType: 'TRADE_CLOSED',
          title: `Closed ${p.type} ${p.symbol} (${isWin ? '+' : ''}$${(p.realized_pnl || 0).toFixed(2)})`,
          description: `Closed @ ${p.close_price || p.open_price}. P&L: ${isWin ? '+' : ''}$${(p.realized_pnl || 0).toFixed(2)} (${p.close_reason || 'MANUAL'}).`,
          severity: isWin ? 'success' : 'warning',
          timestamp: p.closed_at,
          metadata: { realizedPnl: p.realized_pnl, closeReason: p.close_reason },
        });
      }
    }

    // 3. Rule Violations & Breaches
    const violations = db.rule_violations.filter((v) => v.account_id === accountId);
    for (const v of violations) {
      events.push({
        id: `evt-viol-${v.id}`,
        accountId: account.id,
        eventType: 'RULE_BREACH',
        title: `Rule Violation: ${v.rule_type}`,
        description: v.details,
        severity: 'error',
        timestamp: v.created_at,
        metadata: { threshold: v.threshold_value, actual: v.actual_value, drawdown: v.drawdown_at_breach },
      });
    }

    // 4. Phase Passed
    if (account.passed_at) {
      events.push({
        id: `evt-pass-${account.id}`,
        accountId: account.id,
        eventType: 'PHASE_PASSED',
        title: 'Evaluation Objective Passed!',
        description: `Profit target reached with compliant trading days. Account #${account.account_number} successfully passed evaluation.`,
        severity: 'success',
        timestamp: account.passed_at,
      });
    }

    // 5. Funded Active
    if (account.is_funded && account.funded_at) {
      events.push({
        id: `evt-fund-${account.id}`,
        accountId: account.id,
        eventType: 'FUNDED_ACTIVE',
        title: 'Live Funded Account Active',
        description: `Prop firm live capital ($${account.account_size.toLocaleString()}) funded with profit split enabled.`,
        severity: 'success',
        timestamp: account.funded_at,
      });
    }

    // 6. Payout Events
    const payouts = db.payout_requests.filter((p) => p.account_id === accountId);
    for (const p of payouts) {
      events.push({
        id: `evt-payreq-${p.id}`,
        accountId: account.id,
        eventType: 'PAYOUT_REQUESTED',
        title: `Payout Requested ($${p.trader_payout_amount.toLocaleString()})`,
        description: `Trader profit share ($${p.trader_payout_amount.toLocaleString()}) requested via ${p.payout_method}.`,
        severity: 'info',
        timestamp: p.created_at,
      });

      if (p.status === 'PAID' && p.paid_at) {
        events.push({
          id: `evt-paydone-${p.id}`,
          accountId: account.id,
          eventType: 'PAYOUT_APPROVED',
          title: `Payout Completed ($${p.trader_payout_amount.toLocaleString()})`,
          description: `Disbursed to ${p.payout_address} (${p.payout_method}). Account balance reset to starting capital.`,
          severity: 'success',
          timestamp: p.paid_at,
        });
      }
    }

    // Sort chronologically descending (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events;
  }
}
