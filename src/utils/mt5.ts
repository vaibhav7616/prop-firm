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
