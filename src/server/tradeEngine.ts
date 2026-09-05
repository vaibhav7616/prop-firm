import { DBEngine } from './db';
import type { PositionEntity, TradeOrderEntity, OrderType } from './types';
import { marketDataService } from './marketData';
import { RuleEngine } from './ruleEngine';
import { calculateMT5PnL } from './mt5';

// Trading Provider Abstraction Interface
export interface TradingProvider {
  executeMarketOrder(params: {
    accountId: string;
    userId: string;
    symbol: string;
    type: OrderType;
    lotSize: number;
    stopLoss?: number;
    takeProfit?: number;
  }): Promise<{ success: boolean; position?: PositionEntity; error?: string }>;

  closePosition(params: {
    positionId: string;
    accountId: string;
    userId: string;
  }): Promise<{ success: boolean; closedPosition?: PositionEntity; error?: string }>;
}

export class TradeExecutionService implements TradingProvider {
  /**
   * Executes a market order (BUY / SELL)
   */
  public async executeMarketOrder(params: {
    accountId: string;
    userId: string;
    symbol: string;
    type: OrderType;
    lotSize: number;
    stopLoss?: number;
    takeProfit?: number;
  }): Promise<{ success: boolean; position?: PositionEntity; error?: string }> {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === params.accountId && a.user_id === params.userId);

    if (!account) {
      return { success: false, error: 'Trading account not found or unauthorized.' };
    }

    if (account.status !== 'ACTIVE' && account.status !== 'FUNDED') {
      return { success: false, error: `Account is currently ${account.status}. Trading is disabled.` };
    }

    const symbolConfig = db.symbols.find((s) => s.symbol === params.symbol && s.tradingEnabled);
    if (!symbolConfig) {
      return { success: false, error: `Symbol ${params.symbol} is not available for trading.` };
    }

    // Lot size checks
    if (params.lotSize < symbolConfig.minLot || params.lotSize > symbolConfig.maxLot) {
      return {
        success: false,
        error: `Lot size must be between ${symbolConfig.minLot} and ${symbolConfig.maxLot} lots for ${params.symbol}.`,
      };
    }

    if (account.rules.max_lot_size > 0 && params.lotSize > account.rules.max_lot_size) {
      return {
        success: false,
        error: `Lot size exceeds account maximum lot limit of ${account.rules.max_lot_size} lots.`,
      };
    }

    // Maximum open positions check
    const openPositions = db.positions.filter((p) => p.account_id === account.id && p.status === 'OPEN');
    if (account.rules.max_open_positions > 0 && openPositions.length >= account.rules.max_open_positions) {
      return {
        success: false,
        error: `Maximum open positions limit (${account.rules.max_open_positions}) reached.`,
      };
    }

    // Fetch live price quote
    const quote = marketDataService.getQuote(params.symbol);
    if (!quote) {
      return { success: false, error: 'Market quote unavailable at this time.' };
    }

    if (quote.isMarketOpen === false) {
      return {
        success: false,
        error: `Market for ${params.symbol} is currently CLOSED. Weekend trading is disabled for Forex, Metals & Indices.`,
      };
    }

    const entryPrice = params.type === 'BUY' ? quote.ask : quote.bid;

    // Calculate required margin
    const notionalValue = params.lotSize * symbolConfig.contractSize * entryPrice;
    const requiredMargin = notionalValue / (account.leverage || 100);

    // Calculate used margin across all open positions
    const currentUsedMargin = openPositions.reduce((sum, p) => sum + p.margin, 0);
    const availableMargin = account.current_equity - currentUsedMargin;

    if (requiredMargin > availableMargin) {
      return {
        success: false,
        error: `Insufficient margin. Required: $${requiredMargin.toFixed(2)}, Available: $${availableMargin.toFixed(2)}.`,
      };
    }

    const commission = Number((params.lotSize * 6.0).toFixed(2)); // $6 per lot round-turn

    const newPosition: PositionEntity = {
      id: `pos-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
      account_id: account.id,
      user_id: account.user_id,
      symbol: params.symbol,
      type: params.type,
      lot_size: params.lotSize,
      open_price: entryPrice,
      stop_loss: params.stopLoss,
      take_profit: params.takeProfit,
      margin: Number(requiredMargin.toFixed(2)),
      floating_pnl: -commission, // start with commission deduction
      swap: 0,
      commission,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
    };

    const tradeOrder: TradeOrderEntity = {
      id: `ord-trd-${Date.now()}`,
      account_id: account.id,
      user_id: account.user_id,
      symbol: params.symbol,
      type: params.type,
      lot_size: params.lotSize,
      price: entryPrice,
      stop_loss: params.stopLoss,
      take_profit: params.takeProfit,
      status: 'EXECUTED',
      executed_at: new Date().toISOString(),
    };

    db.positions.unshift(newPosition);
    db.trade_orders.unshift(tradeOrder);

    // Update trading days if first trade of the day
    if (account.trading_days === 0) {
      account.trading_days = 1;
    }

    DBEngine.saveDB();

    // Evaluate rules after trade execution
    RuleEngine.evaluateAccount(account.id);

    return { success: true, position: newPosition };
  }

  /**
   * Closes an existing open position
   */
  public async closePosition(params: {
    positionId: string;
    accountId: string;
    userId: string;
  }): Promise<{ success: boolean; closedPosition?: PositionEntity; error?: string }> {
    const db = DBEngine.getDB();
    const position = db.positions.find((p) => p.id === params.positionId && p.account_id === params.accountId && p.user_id === params.userId);

    if (!position || position.status !== 'OPEN') {
      return { success: false, error: 'Position not found or already closed.' };
    }

    const account = db.accounts.find((a) => a.id === params.accountId);
    if (!account) {
      return { success: false, error: 'Account not found.' };
    }

    const quote = marketDataService.getQuote(position.symbol);
    const symConfig = db.symbols.find((s) => s.symbol === position.symbol);

    if (!quote || !symConfig) {
      return { success: false, error: 'Market data error while closing position.' };
    }

    const pnlResult = calculateMT5PnL({
      symbol: position.symbol,
      type: position.type,
      lotSize: position.lot_size,
      openPrice: position.open_price,
      currentBid: quote.bid,
      currentAsk: quote.ask,
      commission: position.commission,
      swap: position.swap,
      quoteLookup: (sym) => marketDataService.getQuote(sym) || undefined,
    });

    const exitPrice = pnlResult.currentPrice;
    const finalPnL = pnlResult.netPnl;

    position.status = 'CLOSED';
    position.close_price = exitPrice;
    position.closed_at = new Date().toISOString();
    position.close_reason = 'MANUAL';
    position.realized_pnl = finalPnL;
    position.floating_pnl = 0;

    // Update account balance
    account.current_balance = Number((account.current_balance + finalPnL).toFixed(2));
    account.current_equity = account.current_balance;

    if (account.current_balance > account.highest_balance) {
      account.highest_balance = account.current_balance;
    }

    DBEngine.saveDB();

    // Re-evaluate prop firm rules after trade close
    RuleEngine.evaluateAccount(account.id);

    return { success: true, closedPosition: position };
  }

  /**
   * Live loss-limit enforcement driven by authoritative live quotes supplied
   * by the client (the same prices the chart/terminal show).
   *
   * Why: the background rule monitor can only auto-close a runaway position
   * when the server itself can fetch a fresh quote for the symbol. If that
   * server-side feed is stale/unreachable while the user's browser still shows
   * live prices, a losing position can far overshoot the account's daily / max
   * loss limit before anything stops it. This endpoint lets the client force a
   * re-evaluation using the live bid/ask it already holds, so the account is
   * breached and all open positions closed the moment the limit is actually hit.
   */
  public enforceRiskLimit(params: {
    accountId: string;
    userId: string;
    liveQuotes: Record<string, { bid: number; ask: number }>;
  }): { success: boolean; halted?: boolean; equity?: number; breach?: string; error?: string } {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === params.accountId && a.user_id === params.userId);
    if (!account) return { success: false, error: 'Trading account not found.' };
    if (account.status !== 'ACTIVE' && account.status !== 'FUNDED') {
      return { success: false, error: `Account is ${account.status}. Trading is disabled.` };
    }

    const openPositions = db.positions.filter((p) => p.account_id === account.id && p.status === 'OPEN');
    if (openPositions.length === 0) return { success: true, halted: false };

    let floating = 0;
    for (const pos of openPositions) {
      const lq = params.liveQuotes?.[pos.symbol];
      const quote = lq && lq.bid > 0 && lq.ask > lq.bid
        ? { bid: lq.bid, ask: lq.ask }
        : marketDataService.getQuote(pos.symbol);
      if (quote) {
        const pnl = calculateMT5PnL({
          symbol: pos.symbol,
          type: pos.type,
          lotSize: pos.lot_size,
          openPrice: pos.open_price,
          currentBid: quote.bid,
          currentAsk: quote.ask,
          commission: pos.commission,
          swap: pos.swap,
          quoteLookup: (sym) => {
            const q2 = params.liveQuotes?.[sym];
            return q2 ? { bid: q2.bid, ask: q2.ask } as any : marketDataService.getQuote(sym) || undefined;
          },
        });
        pos.floating_pnl = pnl.netPnl;
        floating += pnl.netPnl;
      } else {
        floating += pos.floating_pnl || 0;
      }
    }

    const equity = Number((account.current_balance + floating).toFixed(2));
    const rules = account.rules;

    // Daily loss (from start-of-day baseline)
    const startOfDay = Math.max(account.start_of_day_balance, account.start_of_day_equity);
    const dailyLimitAmt = ((rules.daily_loss_limit_percent || 0) / 100) * startOfDay;
    const dailyLoss = startOfDay - equity;

    // Max loss (static from starting_balance, or trailing from highest equity)
    const maxLimitAmt = ((rules.max_loss_limit_percent || 0) / 100) * account.starting_balance;
    let overallLoss = account.starting_balance - equity;
    if (rules.drawdown_model === 'TRAILING') overallLoss = account.highest_equity - equity;

    let breach: string | null = null;
    if (maxLimitAmt > 0 && overallLoss >= maxLimitAmt) breach = 'MAX_LOSS';
    else if (dailyLimitAmt > 0 && dailyLoss >= dailyLimitAmt) breach = 'DAILY_LOSS';

    if (!breach) return { success: true, halted: false, equity };

    // Halt: close everything, breach the account (mirrors RuleEngine auto-close)
    account.status = 'BREACHED';
    account.breached_at = new Date().toISOString();
    for (const pos of openPositions) {
      pos.status = 'CLOSED';
      pos.closed_at = new Date().toISOString();
      pos.close_reason = 'BREACH_AUTO_CLOSE';
      pos.realized_pnl = pos.floating_pnl;
      account.current_balance = Number((account.current_balance + (pos.realized_pnl || 0)).toFixed(2));
    }
    account.current_equity = account.current_balance;

    const thresh = breach === 'MAX_LOSS' ? maxLimitAmt : dailyLimitAmt;
    db.rule_violations.push({
      id: `viol-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
      account_id: account.id,
      user_id: account.user_id,
      rule_type: breach as any,
      threshold_value: thresh,
      actual_value: Math.abs(breach === 'MAX_LOSS' ? overallLoss : dailyLoss),
      balance_at_breach: account.current_balance,
      equity_at_breach: equity,
      drawdown_at_breach: (Math.abs(breach === 'MAX_LOSS' ? overallLoss : dailyLoss) / account.starting_balance) * 100,
      details: `${breach === 'MAX_LOSS' ? 'Maximum loss' : 'Daily loss'} limit of $${thresh.toFixed(2)} exceeded (${(breach === 'MAX_LOSS' ? overallLoss : dailyLoss).toFixed(2)}). Account halted.`,
      created_at: new Date().toISOString(),
    });
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: account.user_id,
      title: `Account #${account.account_number} Breached`,
      body: `${breach === 'MAX_LOSS' ? 'Maximum loss' : 'Daily loss'} limit exceeded — trading halted and positions closed.`,
      type: 'error',
      is_read: false,
      created_at: new Date().toISOString(),
    });
    DBEngine.saveDB();

    return { success: true, halted: true, equity, breach };
  }
}

export const tradeExecutionEngine = new TradeExecutionService();
