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

    if (account.status === 'PASSED') {
      return {
        hasBreached: false,
        violations: [],
        passedTarget: true,
        warnings: ['Account has passed this evaluation stage and is locked for trading.'],
      };
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

          // Calculate exact realized PnL at the execution price (SL/TP)
          const closePnl = calculateMT5PnL({
            symbol: pos.symbol,
            type: pos.type,
            lotSize: pos.lot_size,
            openPrice: pos.open_price,
            currentBid: execPrice,
            currentAsk: execPrice,
            commission: pos.commission || 0,
            swap: pos.swap || 0,
            quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
          });

          pos.realized_pnl = closePnl.netPnl;
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
    // Start of day baseline balance / equity with defensive fallbacks
    const sodBal = account.start_of_day_balance && account.start_of_day_balance > 0 ? account.start_of_day_balance : account.starting_balance;
    const sodEq = account.start_of_day_equity && account.start_of_day_equity > 0 ? account.start_of_day_equity : account.starting_balance;
    const startOfDayBaseline = Math.max(sodBal, sodEq);
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
        // Institutional rule: Evaluation requires flat positions (no open risk) to officially pass
        const stillOpenPositions = db.positions.filter((p) => p.account_id === account.id && p.status === 'OPEN');
        if (stillOpenPositions.length === 0) {
          passedTarget = true;
          this.handlePhasePass(account, true);
        } else {
          warnings.push('Profit target reached! Close all open positions to complete evaluation.');
        }
      }
    }

    DBEngine.saveDB();
    return { hasBreached: false, violations: [], passedTarget, warnings };
  }

  /**
   * Transitions or schedules an account transition when profit target is achieved or admin passes account.
   */
  public static handlePhasePass(account: TradingAccountEntity, immediate: boolean = true) {
    const db = DBEngine.getDB();

    account.status = 'PASSED';
    account.passed_at = account.passed_at || new Date().toISOString();

    // Institutional rule: Ensure all remaining open positions are closed flat at current market prices
    const openPositions = db.positions.filter((p) => p.account_id === account.id && p.status === 'OPEN');
    for (const pos of openPositions) {
      const quote = marketDataService.getQuote(pos.symbol);
      const currentBid = quote ? quote.bid : pos.open_price;
      const currentAsk = quote ? quote.ask : pos.open_price;
      const pnlResult = calculateMT5PnL({
        symbol: pos.symbol,
        type: pos.type,
        lotSize: pos.lot_size,
        openPrice: pos.open_price,
        currentBid,
        currentAsk,
        commission: pos.commission || 0,
        swap: pos.swap || 0,
        quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
      });

      pos.status = 'CLOSED';
      pos.close_price = pnlResult.currentPrice;
      pos.closed_at = new Date().toISOString();
      pos.close_reason = 'PHASE_PASSED_FLAT';
      pos.realized_pnl = pnlResult.netPnl;
      pos.floating_pnl = 0;
      account.current_balance = Number((account.current_balance + pnlResult.netPnl).toFixed(2));
    }
    account.current_equity = account.current_balance;

    let target_type: 'step_2' | 'funded' = 'funded';
    let target_title = 'Live Funded Account';

    const accType = (account.type || '').toLowerCase();
    const planId = (account.plan_id || '').toLowerCase();
    const planName = (account.plan_name || '').toLowerCase();

    const isOneStep = accType.includes('one') || accType.includes('1step') || planId.includes('1step') || planName.includes('one-step') || planName.includes('1-step');
    const isTwoStep = !isOneStep && (accType.includes('two') || accType.includes('2step') || planId.includes('2step') || planName.includes('two-step') || planName.includes('2-step') || !account.is_funded);

    if (isOneStep) {
      // 1-Step Challenge: passing Phase 1 -> Immediately Funded Account!
      target_type = 'funded';
      target_title = 'Live Funded Account';
    } else if (isTwoStep) {
      // 2-Step Challenge:
      // Phase 1 -> Step 2 Verification Account
      // Phase 2 -> Live Funded Account
      if (account.phase === 1) {
        target_type = 'step_2';
        target_title = 'Step 2 Verification Account';
      } else {
        target_type = 'funded';
        target_title = 'Live Funded Account';
      }
    } else {
      // Default fallback
      target_type = 'funded';
      target_title = 'Live Funded Account';
    }

    if (immediate) {
      account.scheduled_transition = {
        target_type,
        target_title,
        passed_at: account.passed_at,
        scheduled_for: new Date().toISOString(),
        estimated_hours: 0,
        status: 'SCHEDULED',
      };
      DBEngine.saveDB();
      return this.provisionScheduledAccount(account.id);
    }

    // Schedule next phase in 1 to 2 hours
    const delayMinutes = 60 + Math.floor(Math.random() * 60);
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    account.scheduled_transition = {
      target_type,
      target_title,
      passed_at: account.passed_at,
      scheduled_for: scheduledFor,
      estimated_hours: Number((delayMinutes / 60).toFixed(1)),
      status: 'SCHEDULED',
    };

    let notificationTitle = '🎉 Step Passed!';
    let notificationBody = `Congratulations! You passed your evaluation for account #${account.account_number}. Your ${target_title} is being prepared.`;

    if (isOneStep) {
      notificationTitle = '🎉 One-Step Challenge Passed!';
      notificationBody = `Outstanding job! You passed your One-Step Challenge. Your $${account.account_size.toLocaleString()} Live Funded Account is being provisioned.`;
    } else if (isTwoStep && account.phase === 1) {
      notificationTitle = '🎉 Step 1 Evaluation Passed!';
      notificationBody = `Great work! Phase 1 evaluation complete. Your Step 2 Verification account ($${account.account_size.toLocaleString()}) is being provisioned.`;
    } else if (isTwoStep && account.phase === 2) {
      notificationTitle = '🏆 Challenge Completed! Live Funded Account Ready!';
      notificationBody = `Incredible trading! Phase 2 verification complete. Your $${account.account_size.toLocaleString()} Live Funded Account is being provisioned.`;
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: account.user_id,
      title: notificationTitle,
      body: notificationBody,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: account.user_id,
      actor_role: 'SYSTEM',
      action: 'PHASE_PASSED_TRANSITION_SCHEDULED',
      target_id: account.id,
      details: `Account #${account.account_number} passed. Scheduled ${target_title}.`,
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();
    return null;
  }

  /**
   * Provisions the next account once passed or when scheduled.
   */
  public static provisionScheduledAccount(parentAccountId: string): TradingAccountEntity | null {
    const db = DBEngine.getDB();
    const parent = db.accounts.find((a) => a.id === parentAccountId);
    if (!parent) return null;

    if (!parent.scheduled_transition || (parent.scheduled_transition.status !== 'SCHEDULED' && parent.scheduled_transition.status !== 'PROVISIONED')) {
      return null;
    }

    // If already provisioned, return existing provisioned account
    if (parent.scheduled_transition.status === 'PROVISIONED' && parent.scheduled_transition.provisioned_account_id) {
      const existing = db.accounts.find((a) => a.id === parent.scheduled_transition!.provisioned_account_id);
      if (existing) return existing;
    }

    const { target_type } = parent.scheduled_transition;
    const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
    const traderPassword = `FS_${Math.random().toString(36).slice(-6)}!`;
    const investorPassword = `INV_${Math.random().toString(36).slice(-6)}#`;

    let newAccount: TradingAccountEntity;

    if (target_type === 'step_2') {
      const step2Rules = { ...parent.rules, profit_target_percent: 5, min_trading_days: 0 };
      newAccount = {
        ...parent,
        id: `acc-step2-${Date.now()}`,
        parent_account_id: parent.id,
        account_number: newAccNumber,
        login: newAccNumber,
        password_hash: traderPassword,
        investor_password_hash: investorPassword,
        server: 'FundedShift-Live01',
        plan_name: `$${parent.account_size.toLocaleString()} 2-Step Challenge - Step 2`,
        type: 'two_step',
        phase: 2,
        status: 'ACTIVE',
        is_funded: false,
        account_size: parent.account_size,
        starting_balance: parent.account_size,
        current_balance: parent.account_size,
        current_equity: parent.account_size,
        highest_balance: parent.account_size,
        highest_equity: parent.account_size,
        start_of_day_balance: parent.account_size,
        start_of_day_equity: parent.account_size,
        trading_days: 0,
        rules: step2Rules,
        scheduled_transition: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: parent.user_id,
        title: '⚡ Step 2 Verification Account is Active!',
        body: `Congratulations! You passed Step 1. Your Step 2 Verification account #${newAccNumber} ($${parent.account_size.toLocaleString()}) has been provisioned! You can now trade Step 2.`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else {
      // Live Funded Account
      const fundedRules = {
        ...parent.rules,
        profit_target_percent: 0, // No profit target for funded accounts
        min_trading_days: 0,
      };

      const parentType = (parent.type || '').toLowerCase();
      const isOneStep = parentType.includes('one') || (parent.plan_name || '').toLowerCase().includes('one-step') || (parent.plan_name || '').toLowerCase().includes('1-step');

      newAccount = {
        ...parent,
        id: `acc-funded-${Date.now()}`,
        parent_account_id: parent.id,
        account_number: newAccNumber,
        login: newAccNumber,
        password_hash: traderPassword,
        investor_password_hash: investorPassword,
        server: 'FundedShift-Live01',
        plan_name: `$${parent.account_size.toLocaleString()} Live Funded Account`,
        type: isOneStep ? 'one_step' : parent.type === 'instant_funding' ? 'instant_funding' : 'two_step',
        phase: 1, // Funded accounts are live stage
        status: 'FUNDED',
        is_funded: true,
        account_size: parent.account_size,
        starting_balance: parent.account_size,
        current_balance: parent.account_size,
        current_equity: parent.account_size,
        highest_balance: parent.account_size,
        highest_equity: parent.account_size,
        start_of_day_balance: parent.account_size,
        start_of_day_equity: parent.account_size,
        trading_days: 0,
        rules: fundedRules,
        funded_at: new Date().toISOString(),
        scheduled_transition: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: parent.user_id,
        title: '🎉 Live Funded Account Active!',
        body: `Congratulations! Your $${parent.account_size.toLocaleString()} Live Funded Account #${newAccNumber} is now active and ready for trading!`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    parent.scheduled_transition.status = 'PROVISIONED';
    parent.scheduled_transition.provisioned_account_id = newAccount.id;

    db.accounts.unshift(newAccount);

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: 'SYSTEM',
      actor_role: 'SYSTEM',
      action: 'PROVISION_SCHEDULED_ACCOUNT',
      target_id: newAccount.id,
      details: `Provisioned ${newAccount.plan_name} #${newAccount.account_number} following completed transition from passed parent #${parent.account_number}.`,
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();
    return newAccount;
  }
}
