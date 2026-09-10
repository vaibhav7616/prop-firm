/**
 * MetaTrader 5 (MT5) Standard Calculation Engine
 * Implements real-time institutional CFD & Forex profit/loss calculations.
 */

export interface MT5QuoteLookup {
  bid: number;
  ask: number;
  price?: number;
}

export interface MT5PnLResult {
  currentPrice: number;
  priceDiff: number;
  grossPnl: number;
  netPnl: number;
  contractSize: number;
}

/**
 * Calculates exact MT5 Real-Time Floating and Realized Profit / Loss
 *
 * MT5 Rule:
 * - BUY positions are opened at ASK, closed / valued at current BID.
 * - SELL positions are opened at BID, closed / valued at current ASK.
 */
export function calculateMT5PnL(params: {
  symbol: string;
  type: string;
  lotSize: number;
  openPrice: number;
  currentBid: number;
  currentAsk: number;
  commission?: number;
  swap?: number;
  quoteLookup?: (sym: string) => MT5QuoteLookup | undefined;
}): MT5PnLResult {
  const { symbol, type, lotSize, openPrice, currentBid, currentAsk, commission = 0, swap = 0, quoteLookup } = params;

  const isBuy = type.toUpperCase().includes('BUY');

  // MT5 Valuation Price: BUY valued at current BID; SELL valued at current ASK
  const currentPrice = isBuy ? currentBid : currentAsk;
  const priceDiff = isBuy ? (currentPrice - openPrice) : (openPrice - currentPrice);

  let contractSize = 100000;
  let grossPnl = 0;

  const upperSymbol = symbol.toUpperCase();

  if (upperSymbol === 'XAUUSD') {
    // Gold Spot CFD: 100 troy ounces per 1.00 standard lot. Quote currency: USD
    contractSize = 100;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (upperSymbol === 'XAGUSD') {
    // Silver Spot CFD: 5,000 troy ounces per 1.00 standard lot. Quote currency: USD
    contractSize = 5000;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (upperSymbol === 'USOIL') {
    // Crude Oil WTI: 1,000 barrels per 1.00 standard lot. Quote currency: USD
    contractSize = 1000;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(upperSymbol)) {
    // Crypto CFD: 1 coin per 1.00 lot. Quote currency: USD
    contractSize = 1;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (['NAS100', 'US30', 'SPX500'].includes(upperSymbol)) {
    // US Indices: 1 point = $1 USD per 1.00 lot
    contractSize = 1;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (upperSymbol === 'GER40') {
    // DAX 40: EUR denominated index. 1 point in EUR converted to USD via EURUSD rate
    contractSize = 1;
    const eurusdRate = quoteLookup ? quoteLookup('EURUSD')?.bid || 1.1678 : 1.1678;
    grossPnl = priceDiff * contractSize * lotSize * eurusdRate;
  } else if (['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD'].includes(upperSymbol)) {
    // Direct Forex Pairs (XXX/USD): 100,000 base currency. Profit in USD = priceDiff * 100,000 * lots
    contractSize = 100000;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (upperSymbol === 'USDJPY') {
    // Indirect Forex Pair (USD/JPY): Quote in JPY. Profit in USD = (priceDiff * 100,000 * lots) / currentPrice
    contractSize = 100000;
    grossPnl = currentPrice > 0 ? (priceDiff * contractSize * lotSize) / currentPrice : 0;
  } else if (['USDCAD', 'USDCHF'].includes(upperSymbol)) {
    // Indirect Forex Pairs (USD/XXX): Quote in CAD/CHF. Profit in USD = (priceDiff * 100,000 * lots) / currentPrice
    contractSize = 100000;
    grossPnl = currentPrice > 0 ? (priceDiff * contractSize * lotSize) / currentPrice : 0;
  } else if (['EURJPY', 'GBPJPY'].includes(upperSymbol)) {
    // Cross Forex Pairs (XXX/JPY): Quote in JPY. Profit converted to USD via USDJPY rate
    contractSize = 100000;
    const usdjpyRate = quoteLookup ? quoteLookup('USDJPY')?.bid || 158.86 : 158.86;
    grossPnl = usdjpyRate > 0 ? (priceDiff * contractSize * lotSize) / usdjpyRate : 0;
  } else if (upperSymbol === 'EURGBP') {
    // Cross Forex Pair (EUR/GBP): Quote in GBP. Profit converted to USD via GBPUSD rate
    contractSize = 100000;
    const gbpusdRate = quoteLookup ? quoteLookup('GBPUSD')?.bid || 1.3634 : 1.3634;
    grossPnl = priceDiff * contractSize * lotSize * gbpusdRate;
  } else {
    contractSize = 100000;
    grossPnl = priceDiff * contractSize * lotSize;
  }

  const netPnl = grossPnl - commission - swap;

  return {
    currentPrice: Number(currentPrice.toFixed(5)),
    priceDiff: Number(priceDiff.toFixed(5)),
    grossPnl: Number(grossPnl.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    contractSize,
  };
}

/**
 * Calculates exact institutional required margin for a position in USD
 */
export function calculateInstitutionalMargin(params: {
  symbol: string;
  lotSize: number;
  entryPrice: number;
  leverage?: number;
  contractSize?: number;
  quoteLookup?: (sym: string) => MT5QuoteLookup | undefined;
}): number {
  const { symbol, lotSize, entryPrice, leverage = 100, quoteLookup } = params;
  const upper = symbol.toUpperCase();
  const effLeverage = leverage > 0 ? leverage : 100;

  let notionalUSD = 0;

  if (['USDJPY', 'USDCAD', 'USDCHF'].includes(upper)) {
    notionalUSD = lotSize * 100000;
  } else if (['EURJPY', 'EURGBP'].includes(upper)) {
    const eurusd = quoteLookup ? quoteLookup('EURUSD')?.bid || 1.1678 : 1.1678;
    notionalUSD = lotSize * 100000 * eurusd;
  } else if (upper === 'GBPJPY') {
    const gbpusd = quoteLookup ? quoteLookup('GBPUSD')?.bid || 1.3634 : 1.3634;
    notionalUSD = lotSize * 100000 * gbpusd;
  } else if (upper === 'GER40') {
    const eurusd = quoteLookup ? quoteLookup('EURUSD')?.bid || 1.1678 : 1.1678;
    notionalUSD = lotSize * entryPrice * eurusd;
  } else if (upper === 'XAUUSD') {
    notionalUSD = lotSize * 100 * entryPrice;
  } else if (upper === 'XAGUSD') {
    notionalUSD = lotSize * 5000 * entryPrice;
  } else if (upper === 'USOIL') {
    notionalUSD = lotSize * 1000 * entryPrice;
  } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(upper)) {
    notionalUSD = lotSize * 1 * entryPrice;
  } else if (['NAS100', 'US30', 'SPX500'].includes(upper)) {
    notionalUSD = lotSize * 1 * entryPrice;
  } else {
    const contract = params.contractSize || 100000;
    notionalUSD = lotSize * contract * entryPrice;
  }

  return Number((notionalUSD / effLeverage).toFixed(2));
}

/**
 * Returns accurate pip / point multiplier for spread and pip calculation
 */
export function getPipMultiplier(symbol: string, precision?: number): number {
  const upper = symbol.toUpperCase();
  if (upper.endsWith('JPY')) return 0.01;
  if (upper === 'XAGUSD') return 0.001;
  if (upper === 'XAUUSD' || upper === 'USOIL') return 0.01;
  if (['NAS100', 'US30', 'SPX500', 'GER40', 'BTCUSD', 'ETHUSD', 'SOLUSD'].includes(upper)) return 1.0;
  if (precision === 5) return 0.0001;
  if (precision === 3) return 0.01;
  if (precision === 2) return 0.01;
  return 0.0001;
}
