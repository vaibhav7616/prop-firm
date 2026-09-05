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

    // Pre-trade rule evaluation
    const preCheck = RuleEngine.evaluateAccount(account.id);
    if (preCheck.hasBreached) {
      return { success: false, error: 'Cannot trade: Account has breached risk rules and is locked.' };
    }

    // Daily & Overall Drawdown Buffer Verification
    const startOfDayBaseline = Math.max(account.start_of_day_balance || account.starting_balance, account.start_of_day_equity || account.starting_balance);
    const maxDailyAllowedLoss = ((account.rules?.daily_loss_limit_percent ?? 5) / 100) * startOfDayBaseline;
    const currentDailyLoss = Math.max(0, startOfDayBaseline - account.current_equity);
    if (currentDailyLoss >= maxDailyAllowedLoss) {
      return { success: false, error: 'Cannot open trade: Daily loss limit has been reached.' };
    }

    const maxOverallAllowedLoss = ((account.rules?.max_loss_limit_percent ?? 10) / 100) * account.starting_balance;
    const currentOverallLoss = Math.max(0, account.starting_balance - account.current_equity);
    if (currentOverallLoss >= maxOverallAllowedLoss) {
      return { success: false, error: 'Cannot open trade: Maximum overall drawdown limit has been reached.' };
    }

    const symbolConfig = db.symbols.find((s) => s.symbol === params.symbol && s.tradingEnabled);
    if (!symbolConfig) {
      return { success: false, error: `Symbol ${params.symbol} is not available for trading.` };
    }

    // Lot size checks with tier scaling
    const maxAccountLot = account.rules?.max_lot_size || (account.account_size <= 5000 ? 5 : account.account_size <= 10000 ? 10 : account.account_size <= 25000 ? 20 : 50);
    if (params.lotSize < symbolConfig.minLot || params.lotSize > symbolConfig.maxLot) {
      return {
        success: false,
        error: `Lot size must be between ${symbolConfig.minLot} and ${symbolConfig.maxLot} lots for ${params.symbol}.`,
      };
    }

    if (params.lotSize > maxAccountLot) {
      return {
        success: false,
        error: `Lot size (${params.lotSize}) exceeds account maximum lot limit of ${maxAccountLot} lots for $${account.account_size.toLocaleString()} account.`,
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
}

export const tradeExecutionEngine = new TradeExecutionService();
