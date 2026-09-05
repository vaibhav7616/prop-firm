import { DBEngine } from './db';
import type { TradingAccountEntity, RuleViolationEntity, PositionEntity } from './types';
import { marketDataService } from './marketData';
import { calculateMT5PnL } from './mt5';

export interface RuleEvaluationResult {
  hasBreached: boolean;
  violations: RuleViolationEntity[];
  passedTarget: boolean;
  warnings: string[];
}

export class RuleEngine {
  /**
   * Evaluates all rules for a given account.
   */
  public static evaluateAccount(accountId: string): RuleEvaluationResult {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);

    if (!account) {
      return { hasBreached: false, violations: [], passedTarget: false, warnings: [] };
    }

    if (account.status === 'BREACHED' || account.status === 'CLOSED') {
      return { hasBreached: true, violations: db.rule_violations.filter((v) => v.account_id === accountId), passedTarget: false, warnings: [] };
    }

    // Get active open positions for account
    const openPositions = db.positions.filter((p) => p.account_id === accountId && p.status === 'OPEN');

    // Recalculate floating P&L and equity
    let totalFloatingPnL = 0;
    let totalUsedMargin = 0;

    for (const pos of openPositions) {
      const quote = marketDataService.getQuote(pos.symbol);

      if (quote) {
        const pnlResult = calculateMT5PnL({
          symbol: pos.symbol,
          type: pos.type,
          lotSize: pos.lot_size,
          openPrice: pos.open_price,
          currentBid: quote.bid,
          currentAsk: quote.ask,
          commission: pos.commission,
          swap: pos.swap,
          quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
        });
        pos.floating_pnl = pnlResult.netPnl;

        // Check Automated SL / TP Execution
        let shouldClose = false;
        let closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' = 'STOP_LOSS';
        let execPrice = pnlResult.currentPrice;

        if (pos.stop_loss && pos.stop_loss > 0) {
          if (pos.type === 'BUY' && quote.bid <= pos.stop_loss) {
            shouldClose = true;
            closeReason = 'STOP_LOSS';
            execPrice = pos.stop_loss;
          } else if (pos.type === 'SELL' && quote.ask >= pos.stop_loss) {
            shouldClose = true;
            closeReason = 'STOP_LOSS';
            execPrice = pos.stop_loss;
          }
        }

        if (!shouldClose && pos.take_profit && pos.take_profit > 0) {
          if (pos.type === 'BUY' && quote.bid >= pos.take_profit) {
            shouldClose = true;
            closeReason = 'TAKE_PROFIT';
            execPrice = pos.take_profit;
          } else if (pos.type === 'SELL' && quote.ask <= pos.take_profit) {
            shouldClose = true;
            closeReason = 'TAKE_PROFIT';
            execPrice = pos.take_profit;
          }
        }

        if (shouldClose) {
          pos.status = 'CLOSED';
          pos.close_price = execPrice;
          pos.closed_at = new Date().toISOString();
          pos.close_reason = closeReason;
          pos.realized_pnl = pos.floating_pnl;
          pos.floating_pnl = 0;
          account.current_balance = Number((account.current_balance + pos.realized_pnl).toFixed(2));
          continue;
        }
      }
      totalFloatingPnL += pos.floating_pnl;
      totalUsedMargin += pos.margin;
    }

    // Current Equity = Balance + Floating PnL
    const currentEquity = Number((account.current_balance + totalFloatingPnL).toFixed(2));
    account.current_equity = currentEquity;

    if (currentEquity > account.highest_equity) {
      account.highest_equity = currentEquity;
    }
    if (account.current_balance > account.highest_balance) {
      account.highest_balance = account.current_balance;
    }

    const rules = account.rules;
    const violations: RuleViolationEntity[] = [];
    const warnings: string[] = [];

    // 1. DAILY LOSS LIMIT EVALUATION
    // Start of day baseline balance / equity
    const startOfDayBaseline = Math.max(account.start_of_day_balance, account.start_of_day_equity);
    const maxDailyAllowedLoss = (rules.daily_loss_limit_percent / 100) * startOfDayBaseline;
    const currentDailyLoss = startOfDayBaseline - currentEquity;

    // Warning triggers
    if (currentDailyLoss > 0 && maxDailyAllowedLoss > 0) {
      const dailyRatio = currentDailyLoss / maxDailyAllowedLoss;
      if (dailyRatio >= 0.8 && dailyRatio < 1.0) {
        warnings.push(`Warning: You have reached ${(dailyRatio * 100).toFixed(0)}% of your Daily Loss Limit.`);
      }
    }

    if (currentDailyLoss >= maxDailyAllowedLoss && maxDailyAllowedLoss > 0) {
      const violation: RuleViolationEntity = {
        id: `viol-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
        account_id: account.id,
        user_id: account.user_id,
        rule_type: 'DAILY_LOSS',
        threshold_value: maxDailyAllowedLoss,
        actual_value: currentDailyLoss,
        balance_at_breach: account.current_balance,
        equity_at_breach: currentEquity,
        drawdown_at_breach: (currentDailyLoss / startOfDayBaseline) * 100,
        details: `Daily loss limit of $${maxDailyAllowedLoss.toFixed(2)} (${rules.daily_loss_limit_percent}%) exceeded. Current loss: $${currentDailyLoss.toFixed(2)}.`,
        created_at: new Date().toISOString(),
      };
      violations.push(violation);
    }

    // 2. MAXIMUM LOSS / DRAWDOWN EVALUATION
    const initialBalance = account.starting_balance;
    const maxOverallAllowedLoss = (rules.max_loss_limit_percent / 100) * initialBalance;
    let currentOverallLoss = initialBalance - currentEquity;

    if (rules.drawdown_model === 'TRAILING') {
      currentOverallLoss = account.highest_equity - currentEquity;
    }

    if (currentOverallLoss > 0 && maxOverallAllowedLoss > 0) {
      const maxRatio = currentOverallLoss / maxOverallAllowedLoss;
      if (maxRatio >= 0.8 && maxRatio < 1.0) {
        warnings.push(`Warning: You have reached ${(maxRatio * 100).toFixed(0)}% of your Maximum Drawdown Limit.`);
      }
    }

    if (currentOverallLoss >= maxOverallAllowedLoss && maxOverallAllowedLoss > 0) {
      const violation: RuleViolationEntity = {
        id: `viol-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
        account_id: account.id,
        user_id: account.user_id,
        rule_type: 'MAX_LOSS',
        threshold_value: maxOverallAllowedLoss,
        actual_value: currentOverallLoss,
        balance_at_breach: account.current_balance,
        equity_at_breach: currentEquity,
        drawdown_at_breach: (currentOverallLoss / initialBalance) * 100,
        details: `Maximum loss limit of $${maxOverallAllowedLoss.toFixed(2)} (${rules.max_loss_limit_percent}%) exceeded. Current overall loss: $${currentOverallLoss.toFixed(2)}.`,
        created_at: new Date().toISOString(),
      };
      violations.push(violation);
    }

    // HANDLE BREACH IF VIOLATIONS EXIST
    if (violations.length > 0) {
      account.status = 'BREACHED';
      account.breached_at = new Date().toISOString();

      // Automatically close all open positions
      for (const pos of openPositions) {
        if (pos.status === 'OPEN') {
          pos.status = 'CLOSED';
          const quote = marketDataService.getQuote(pos.symbol);
          pos.close_price = quote ? (pos.type === 'BUY' ? quote.bid : quote.ask) : pos.open_price;
          pos.closed_at = new Date().toISOString();
          pos.close_reason = 'BREACH_AUTO_CLOSE';
          pos.realized_pnl = pos.floating_pnl;
          pos.floating_pnl = 0;
          account.current_balance = Number((account.current_balance + pos.realized_pnl).toFixed(2));
        }
      }
      account.current_equity = account.current_balance;

      // Record violations in DB
      db.rule_violations.push(...violations);

      // Add Notification
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: account.user_id,
        title: `Account #${account.account_number} Breached`,
        body: violations[0].details,
        type: 'error',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      // Audit log
      db.audit_logs.push({
        id: `audit-${Date.now()}`,
        actor_id: 'RULE_ENGINE',
        actor_role: 'SYSTEM',
        action: 'ACCOUNT_BREACHED',
        target_id: account.id,
        details: violations[0].details,
        created_at: new Date().toISOString(),
      });

      DBEngine.saveDB();
      return { hasBreached: true, violations, passedTarget: false, warnings };
    }

    // 3. PROFIT TARGET EVALUATION
    let passedTarget = false;
    if (rules.profit_target_percent > 0 && account.status === 'ACTIVE') {
      const profitTargetAmount = (rules.profit_target_percent / 100) * initialBalance;
      const currentProfit = currentEquity - initialBalance;

      if (currentProfit >= profitTargetAmount && account.trading_days >= rules.min_trading_days) {
        passedTarget = true;
        this.handlePhasePass(account);
      }
    }

    DBEngine.saveDB();
    return { hasBreached: false, violations: [], passedTarget, warnings };
  }

  /**
   * Transitions an account when profit target is achieved.
   */
  private static handlePhasePass(account: TradingAccountEntity) {
    const db = DBEngine.getDB();

    if (account.type === 'one_step') {
      // Pass 1-step -> Transition to Funded
      account.status = 'PASSED';
      account.passed_at = new Date().toISOString();

      // Provision Funded Account
      const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
      const fundedAccount: TradingAccountEntity = {
        ...account,
        id: `acc-funded-${Date.now()}`,
        parent_account_id: account.id,
        account_number: newAccNumber,
        login: newAccNumber,
        status: 'FUNDED',
        phase: 3,
        starting_balance: account.account_size,
        current_balance: account.account_size,
        current_equity: account.account_size,
        highest_balance: account.account_size,
        highest_equity: account.account_size,
        start_of_day_balance: account.account_size,
        start_of_day_equity: account.account_size,
        trading_days: 0,
        funded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.accounts.unshift(fundedAccount);

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: account.user_id,
        title: '🎉 Congratulations! Challenge Passed!',
        body: `You passed your One-Step Challenge! Your Funded Account #${newAccNumber} with $${account.account_size.toLocaleString()} capital has been activated.`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else if (account.type === 'two_step') {
      if (account.phase === 1) {
        // Step 1 Passed -> Move to Step 2
        account.status = 'PASSED';
        account.passed_at = new Date().toISOString();

        const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        const step2Rules = { ...account.rules, profit_target_percent: 5 }; // Phase 2 target 5%

        const step2Account: TradingAccountEntity = {
          ...account,
          id: `acc-step2-${Date.now()}`,
          parent_account_id: account.id,
          account_number: newAccNumber,
          login: newAccNumber,
          status: 'ACTIVE',
          phase: 2,
          starting_balance: account.account_size,
          current_balance: account.account_size,
          current_equity: account.account_size,
          highest_balance: account.account_size,
          highest_equity: account.account_size,
          start_of_day_balance: account.account_size,
          start_of_day_equity: account.account_size,
          trading_days: 0,
          rules: step2Rules,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.accounts.unshift(step2Account);

        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: account.user_id,
          title: 'Step 1 Passed!',
          body: `Phase 1 evaluation complete! Your Step 2 Verification Account #${newAccNumber} is ready.`,
          type: 'success',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } else if (account.phase === 2) {
        // Step 2 Passed -> Provision Funded Account
        account.status = 'PASSED';
        account.passed_at = new Date().toISOString();

        const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        const fundedAccount: TradingAccountEntity = {
          ...account,
          id: `acc-funded-${Date.now()}`,
          parent_account_id: account.id,
          account_number: newAccNumber,
          login: newAccNumber,
          status: 'FUNDED',
          phase: 3,
          starting_balance: account.account_size,
          current_balance: account.account_size,
          current_equity: account.account_size,
          highest_balance: account.account_size,
          highest_equity: account.account_size,
          start_of_day_balance: account.account_size,
          start_of_day_equity: account.account_size,
          trading_days: 0,
          funded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.accounts.unshift(fundedAccount);

        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: account.user_id,
          title: '🎉 Two-Step Challenge Passed!',
          body: `Phase 2 verification passed! Your $${account.account_size.toLocaleString()} Funded Account #${newAccNumber} is live!`,
          type: 'success',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }
}
