import { DBEngine } from './db';
import type { TradeSimulationRequest, TradeSimulationResult, RecoveryProgramOption } from './types';
import { marketDataService } from './marketData';
import { calculateMT5PnL, calculateInstitutionalMargin } from './mt5';

export class TradeSimulatorEngine {
  /**
   * Evaluates What-If prospective trade risk against daily and max drawdown limits
   */
  public static simulateTrade(params: TradeSimulationRequest): TradeSimulationResult | { error: string } {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === params.accountId);

    if (!account) {
      return { error: 'Account not found.' };
    }

    const symbolConfig = db.symbols.find((s) => s.symbol === params.symbol);
    const quote = marketDataService.getQuote(params.symbol);

    if (!symbolConfig || !quote) {
      return { error: `Market quote for ${params.symbol} is currently unavailable.` };
    }

    const entryPrice = params.type === 'BUY' ? quote.ask : quote.bid;
    const effLeverage = account.leverage || 100;

    // Calculate required margin
    const requiredMargin = calculateInstitutionalMargin({
      symbol: params.symbol,
      lotSize: params.lotSize,
      entryPrice,
      leverage: effLeverage,
      contractSize: symbolConfig.contractSize,
      quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
    });

    const openPositions = db.positions.filter((p) => p.account_id === account.id && p.status === 'OPEN');
    const currentUsedMargin = openPositions.reduce((sum, p) => sum + p.margin, 0);
    const availableMarginBefore = Math.max(0, account.current_equity - currentUsedMargin);
    const availableMarginAfter = Math.max(0, availableMarginBefore - requiredMargin);

    const estimatedCommission = Number((params.lotSize * 6.0).toFixed(2));

    // Calculate dollar risk at stop loss
    let riskAtStopLoss: number | null = null;
    if (params.stopLoss && params.stopLoss > 0) {
      const slPnl = calculateMT5PnL({
        symbol: params.symbol,
        type: params.type,
        lotSize: params.lotSize,
        openPrice: entryPrice,
        currentBid: params.stopLoss,
        currentAsk: params.stopLoss,
        commission: estimatedCommission,
        swap: 0,
        quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
      });
      riskAtStopLoss = Math.abs(Math.min(0, slPnl.netPnl));
    }

    // Calculate dollar reward at take profit
    let rewardAtTakeProfit: number | null = null;
    if (params.takeProfit && params.takeProfit > 0) {
      const tpPnl = calculateMT5PnL({
        symbol: params.symbol,
        type: params.type,
        lotSize: params.lotSize,
        openPrice: entryPrice,
        currentBid: params.takeProfit,
        currentAsk: params.takeProfit,
        commission: estimatedCommission,
        swap: 0,
        quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
      });
      rewardAtTakeProfit = Math.max(0, tpPnl.netPnl);
    }

    const riskRewardRatio =
      riskAtStopLoss && rewardAtTakeProfit && riskAtStopLoss > 0
        ? Number((rewardAtTakeProfit / riskAtStopLoss).toFixed(2))
        : null;

    // Daily Drawdown Analysis
    const startOfDay = Math.max(
      account.start_of_day_balance || account.starting_balance,
      account.start_of_day_equity || account.starting_balance
    );
    const maxDailyAllowedLoss = (account.rules.daily_loss_limit_percent / 100) * startOfDay;
    const currentDailyLoss = Math.max(0, startOfDay - account.current_equity);
    const remainingDailyLossAllowance = Math.max(0, maxDailyAllowedLoss - currentDailyLoss);

    const projectedDailyLossIfStoppedOut = riskAtStopLoss !== null ? Number((currentDailyLoss + riskAtStopLoss).toFixed(2)) : null;
    const wouldBreachDaily = projectedDailyLossIfStoppedOut !== null ? projectedDailyLossIfStoppedOut >= maxDailyAllowedLoss : false;

    // Overall Maximum Drawdown Analysis
    const maxOverallAllowedLoss = (account.rules.max_loss_limit_percent / 100) * account.starting_balance;
    const currentOverallLoss = Math.max(0, account.starting_balance - account.current_equity);
    const remainingOverallLossAllowance = Math.max(0, maxOverallAllowedLoss - currentOverallLoss);

    const projectedOverallLossIfStoppedOut = riskAtStopLoss !== null ? Number((currentOverallLoss + riskAtStopLoss).toFixed(2)) : null;
    const wouldBreachMax = projectedOverallLossIfStoppedOut !== null ? projectedOverallLossIfStoppedOut >= maxOverallAllowedLoss : false;

    // Max safe lot size estimation (based on 1% equity risk or remaining daily buffer)
    const safeRiskBudget = Math.min(account.current_equity * 0.015, remainingDailyLossAllowance * 0.35);
    const stopDistance =
      params.stopLoss && params.stopLoss > 0 ? Math.abs(entryPrice - params.stopLoss) : entryPrice * 0.005;
    const contractMultiplier = symbolConfig.contractSize || 100000;
    const maxSafeLot = Math.max(
      symbolConfig.minLot,
      Number((safeRiskBudget / (stopDistance * contractMultiplier || 1)).toFixed(2))
    );

    let safetyAdvice = 'Trade parameters are within conservative risk thresholds.';
    if (wouldBreachDaily) {
      safetyAdvice = 'CRITICAL: If this trade hits Stop Loss, your account will BREACH the Daily Loss Limit! Reduce lot size or tighten stop loss.';
    } else if (wouldBreachMax) {
      safetyAdvice = 'CRITICAL: If this trade hits Stop Loss, your account will BREACH the Maximum Drawdown Limit! Reduce lot size immediately.';
    } else if (riskAtStopLoss && riskAtStopLoss > remainingDailyLossAllowance * 0.5) {
      safetyAdvice = 'CAUTION: This trade risks more than 50% of your remaining daily loss allowance.';
    }

    return {
      symbol: params.symbol,
      type: params.type,
      lotSize: params.lotSize,
      currentBid: quote.bid,
      currentAsk: quote.ask,
      estimatedEntryPrice: entryPrice,
      requiredMargin: Number(requiredMargin.toFixed(2)),
      availableMarginBefore: Number(availableMarginBefore.toFixed(2)),
      availableMarginAfter: Number(availableMarginAfter.toFixed(2)),
      estimatedCommission,
      riskAtStopLoss,
      rewardAtTakeProfit,
      riskRewardRatio,
      currentDailyLoss: Number(currentDailyLoss.toFixed(2)),
      maxDailyAllowedLoss: Number(maxDailyAllowedLoss.toFixed(2)),
      projectedDailyLossIfStoppedOut,
      remainingDailyLossAllowance: Number(remainingDailyLossAllowance.toFixed(2)),
      wouldBreachDaily,
      currentOverallLoss: Number(currentOverallLoss.toFixed(2)),
      maxOverallAllowedLoss: Number(maxOverallAllowedLoss.toFixed(2)),
      projectedOverallLossIfStoppedOut,
      remainingOverallLossAllowance: Number(remainingOverallLossAllowance.toFixed(2)),
      wouldBreachMax,
      maxSafeLotSize: Math.min(account.rules.max_lot_size || 50, maxSafeLot),
      safetyAdvice,
    };
  }

  /**
   * Evaluates eligibility for Account Recovery / Re-evaluation Program
   */
  public static evaluateRecoveryEligibility(accountId: string): RecoveryProgramOption | null {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) return null;

    const isBreached = account.status === 'BREACHED';
    const plan = db.account_plans.find((p) => p.id === account.plan_id) || db.account_plans[0];
    const basePrice = plan ? plan.price : 99;

    const discountPercent = 20; // 20% discount on re-evaluation / reset
    const resetPrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));

    return {
      accountId: account.id,
      accountNumber: account.account_number,
      accountSize: account.account_size,
      type: account.type,
      isEligible: isBreached,
      discountPercent,
      resetPrice,
      reason: isBreached
        ? 'Account has breached risk rules and is eligible for a discounted re-evaluation reset.'
        : 'Account is currently active and does not require recovery.',
      conditions: [
        'Resets starting balance and daily baselines to initial account size.',
        'Preserves historical trade timeline and performance analytics for audit.',
        'Gives an immediate 20% loyalty re-evaluation discount.',
      ],
    };
  }

  /**
   * Executes Account Reset / Re-evaluation
   */
  public static executeAccountRecovery(accountId: string, userId: string): { success: boolean; account?: any; error?: string } {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId && a.user_id === userId);

    if (!account) {
      return { success: false, error: 'Account not found or unauthorized.' };
    }

    if (account.status !== 'BREACHED') {
      return { success: false, error: 'Only breached accounts can be reset under the recovery program.' };
    }

    // Reset account state back to clean ACTIVE baseline
    account.status = 'ACTIVE';
    account.current_balance = account.starting_balance;
    account.current_equity = account.starting_balance;
    account.highest_balance = account.starting_balance;
    account.highest_equity = account.starting_balance;
    account.start_of_day_balance = account.starting_balance;
    account.start_of_day_equity = account.starting_balance;
    account.trading_days = 0;
    account.breached_at = undefined;
    account.updated_at = new Date().toISOString();

    // Close any residual open positions
    const openPos = db.positions.filter((p) => p.account_id === account.id && p.status === 'OPEN');
    for (const p of openPos) {
      p.status = 'CLOSED';
      p.closed_at = new Date().toISOString();
      p.close_reason = 'MANUAL';
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: account.user_id,
      title: '🔄 Account Reset Successfully',
      body: `Your account #${account.account_number} ($${account.account_size.toLocaleString()}) has been reset and reactivated.`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: userId,
      actor_role: 'USER',
      action: 'ACCOUNT_RECOVERY_RESET',
      target_id: account.id,
      details: `Account #${account.account_number} reset to starting balance of $${account.starting_balance.toLocaleString()}.`,
      created_at: new Date().toISOString(),
    });

    DBEngine.saveDB();

    return { success: true, account };
  }
}
