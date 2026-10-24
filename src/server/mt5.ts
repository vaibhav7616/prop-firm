/**
 * MetaTrader 5 (MT5) Standard Calculation Engine (Server-Side)
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
  } else if (upperSymbol.endsWith('USD')) {
    // Direct Forex Pairs (XXX/USD) and Metals: 100,000 base currency (or contractSize). Profit in USD = priceDiff * contractSize * lots
    contractSize = params.contractSize || 100000;
    grossPnl = priceDiff * contractSize * lotSize;
  } else if (upperSymbol.startsWith('USD') && !['US30', 'USOIL'].includes(upperSymbol)) {
    // Indirect Forex Pair (USD/XXX): Quote in foreign currency. Profit in USD = (priceDiff * 100,000 * lots) / currentPrice
    contractSize = 100000;
    grossPnl = currentPrice > 0 ? (priceDiff * contractSize * lotSize) / currentPrice : 0;
  } else if (upperSymbol.endsWith('JPY')) {
    // Cross Forex Pairs (XXX/JPY): Quote in JPY. Profit converted to USD via USDJPY rate
    contractSize = 100000;
    const usdjpyRate = quoteLookup ? quoteLookup('USDJPY')?.bid || 158.86 : 158.86;
    grossPnl = usdjpyRate > 0 ? (priceDiff * contractSize * lotSize) / usdjpyRate : 0;
  } else if (upperSymbol.endsWith('GBP')) {
    // Cross Forex Pair (EUR/GBP): Quote in GBP. Profit converted to USD via GBPUSD rate
    contractSize = 100000;
    const gbpusdRate = quoteLookup ? quoteLookup('GBPUSD')?.bid || 1.3634 : 1.3634;
    grossPnl = priceDiff * contractSize * lotSize * gbpusdRate;
  } else if (upperSymbol.endsWith('AUD')) {
    // Cross Forex Pair (XXX/AUD): Quote in AUD. Profit converted to USD via AUDUSD rate
    contractSize = 100000;
    const audusdRate = quoteLookup ? quoteLookup('AUDUSD')?.bid || 0.7114 : 0.7114;
    grossPnl = priceDiff * contractSize * lotSize * audusdRate;
  } else if (upperSymbol.endsWith('NZD')) {
    // Cross Forex Pair (XXX/NZD): Quote in NZD. Profit converted to USD via NZDUSD rate
    contractSize = 100000;
    const nzdusdRate = quoteLookup ? quoteLookup('NZDUSD')?.bid || 0.5940 : 0.5940;
    grossPnl = priceDiff * contractSize * lotSize * nzdusdRate;
  } else if (upperSymbol.endsWith('CAD')) {
    // Cross Forex Pair (XXX/CAD): Quote in CAD. Profit converted to USD via USDCAD rate
    contractSize = 100000;
    const usdcadRate = quoteLookup ? quoteLookup('USDCAD')?.bid || 1.3789 : 1.3789;
    grossPnl = usdcadRate > 0 ? (priceDiff * contractSize * lotSize) / usdcadRate : 0;
  } else if (upperSymbol.endsWith('CHF')) {
    // Cross Forex Pair (XXX/CHF): Quote in CHF. Profit converted to USD via USDCHF rate
    contractSize = 100000;
    const usdchfRate = quoteLookup ? quoteLookup('USDCHF')?.bid || 0.8005 : 0.8005;
    grossPnl = usdchfRate > 0 ? (priceDiff * contractSize * lotSize) / usdchfRate : 0;
  } else {
    contractSize = params.contractSize || 100000;
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
 *
 * Forex Conventions:
 * - Direct pairs (EURUSD, GBPUSD, AUDUSD, NZDUSD): Base is foreign currency (EUR, GBP, etc.).
 *   Margin in USD = (lotSize * 100,000 * entryPrice) / leverage
 * - Indirect pairs with USD as Base currency (USDJPY, USDCAD, USDCHF, USDMXN, USDZAR, USDSGD, USDTRY):
 *   Base is USD, contract size is $100,000 USD.
 *   Margin in USD = (lotSize * 100,000) / leverage
 * - Cross pairs:
 *   Margin in USD = (lotSize * 100,000 * BaseToUSDRate) / leverage
 * - Commodities:
 *   XAUUSD: 100 oz per lot. Margin = (lotSize * 100 * entryPrice) / leverage
 *   XAGUSD: 5,000 oz per lot. Margin = (lotSize * 5,000 * entryPrice) / leverage
 *   USOIL: 1,000 bbl per lot. Margin = (lotSize * 1,000 * entryPrice) / leverage
 * - Indices & Crypto:
 *   NAS100, US30, SPX500, BTCUSD, ETHUSD, SOLUSD: contract size 1. Margin = (lotSize * 1 * entryPrice) / leverage
 *   GER40: contract size 1 EUR. Margin = (lotSize * 1 * entryPrice * EURUSD) / leverage
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

  if (upper.startsWith('USD') && !['US30', 'USOIL'].includes(upper)) {
    // USD is the base currency: 1 lot = $100,000 USD
    notionalUSD = lotSize * 100000;
  } else if (upper.startsWith('EUR')) {
    // Base is EUR
    const eurusd = quoteLookup ? quoteLookup('EURUSD')?.bid || 1.1678 : 1.1678;
    notionalUSD = lotSize * 100000 * eurusd;
  } else if (upper.startsWith('GBP')) {
    // Base is GBP
    const gbpusd = quoteLookup ? quoteLookup('GBPUSD')?.bid || 1.3634 : 1.3634;
    notionalUSD = lotSize * 100000 * gbpusd;
  } else if (upper.startsWith('AUD')) {
    // Base is AUD
    const audusd = quoteLookup ? quoteLookup('AUDUSD')?.bid || 0.7114 : 0.7114;
    notionalUSD = lotSize * 100000 * audusd;
  } else if (upper.startsWith('NZD')) {
    // Base is NZD
    const nzdusd = quoteLookup ? quoteLookup('NZDUSD')?.bid || 0.5940 : 0.5940;
    notionalUSD = lotSize * 100000 * nzdusd;
  } else if (upper.startsWith('CAD')) {
    // Base is CAD
    const usdcad = quoteLookup ? quoteLookup('USDCAD')?.bid || 1.3789 : 1.3789;
    notionalUSD = (lotSize * 100000) / (usdcad > 0 ? usdcad : 1);
  } else if (upper.startsWith('CHF')) {
    // Base is CHF
    const usdchf = quoteLookup ? quoteLookup('USDCHF')?.bid || 0.8005 : 0.8005;
    notionalUSD = (lotSize * 100000) / (usdchf > 0 ? usdchf : 1);
  } else if (upper === 'GER40') {
    // DAX index in EUR
    const eurusd = quoteLookup ? quoteLookup('EURUSD')?.bid || 1.1678 : 1.1678;
    notionalUSD = lotSize * entryPrice * eurusd;
  } else if (upper === 'XAUUSD') {
    // Gold Spot 100 oz
    notionalUSD = lotSize * 100 * entryPrice;
  } else if (upper === 'XAGUSD') {
    // Silver Spot 5,000 oz
    notionalUSD = lotSize * 5000 * entryPrice;
  } else if (upper === 'USOIL') {
    // WTI 1,000 bbl
    notionalUSD = lotSize * 1000 * entryPrice;
  } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(upper)) {
    // Crypto 1 unit
    notionalUSD = lotSize * 1 * entryPrice;
  } else if (['NAS100', 'US30', 'SPX500'].includes(upper)) {
    // US Indices 1 unit
    notionalUSD = lotSize * 1 * entryPrice;
  } else {
    // Fallback
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
