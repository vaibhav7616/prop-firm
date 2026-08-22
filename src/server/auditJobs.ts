import { DBEngine } from './db';
import { RuleEngine } from './ruleEngine';

export class ScheduledJobsEngine {
  private static dailyTimer: NodeJS.Timeout | null = null;
  private static ruleMonitorTimer: NodeJS.Timeout | null = null;

  public static startJobs() {
    // Continuous rule evaluation monitor every 5 seconds
    this.ruleMonitorTimer = setInterval(() => {
      this.runContinuousRuleCheck();
    }, 5000);

    // Daily reset check every minute (resets start-of-day baselines at 00:00 UTC)
    this.dailyTimer = setInterval(() => {
      const now = new Date();
      if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        this.runDailyBaselineReset();
      }
    }, 60000);

    console.log('[ScheduledJobs] Background prop firm risk monitor & daily reset jobs started.');
  }

  /**
   * Resets start_of_day_balance and start_of_day_equity at 00:00 UTC
   */
  public static runDailyBaselineReset() {
    const db = DBEngine.getDB();
    for (const acc of db.accounts) {
      if (acc.status === 'ACTIVE' || acc.status === 'FUNDED') {
        acc.start_of_day_balance = acc.current_balance;
        acc.start_of_day_equity = acc.current_equity;

        // Increment trading day count if user traded yesterday
        const tradedToday = db.positions.some((p) => p.account_id === acc.id);
        if (tradedToday) {
          acc.trading_days += 1;
        }
      }
    }

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: 'CRON_JOB',
      actor_role: 'SYSTEM',
      action: 'DAILY_BASELINE_RESET',
      details: 'Start-of-day equity and balance baselines reset for all active accounts.',
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();
  }

  /**
   * Runs rule checks on all active trading accounts
   */
  public static runContinuousRuleCheck() {
    const db = DBEngine.getDB();
    const activeAccounts = db.accounts.filter((a) => a.status === 'ACTIVE' || a.status === 'FUNDED');

    for (const acc of activeAccounts) {
      RuleEngine.evaluateAccount(acc.id);
    }
  }
}
