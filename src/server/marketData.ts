import WebSocket from 'ws';
import type { MarketQuote, SymbolConfig } from './types';
import { DBEngine } from './db';

// Market Data Provider Interface
export interface MarketDataProvider {
  getQuote(symbol: string): MarketQuote | null;
  getAllQuotes(): MarketQuote[];
  subscribe(symbol: string, callback: (quote: MarketQuote) => void): () => void;
  subscribeAll(callback: (quotes: MarketQuote[]) => void): () => void;
  checkIsMarketOpen(symbol: string): boolean;
}

const TV_SYMBOL_MAP: Record<string, { symbol: string; precision: number; defaultSpreadPips: number }> = {
  'OANDA:XAUUSD': { symbol: 'XAUUSD', precision: 2, defaultSpreadPips: 2 },
  'TVC:SILVER': { symbol: 'XAGUSD', precision: 3, defaultSpreadPips: 2 },
  'NYMEX:CL1!': { symbol: 'USOIL', precision: 2, defaultSpreadPips: 2 },
  'OANDA:EURUSD': { symbol: 'EURUSD', precision: 5, defaultSpreadPips: 2 },
  'OANDA:GBPUSD': { symbol: 'GBPUSD', precision: 5, defaultSpreadPips: 4 },
  'OANDA:USDJPY': { symbol: 'USDJPY', precision: 3, defaultSpreadPips: 3 },
  'OANDA:AUDUSD': { symbol: 'AUDUSD', precision: 5, defaultSpreadPips: 5 },
  'OANDA:USDCAD': { symbol: 'USDCAD', precision: 5, defaultSpreadPips: 5 },
  'OANDA:USDCHF': { symbol: 'USDCHF', precision: 5, defaultSpreadPips: 5 },
  'OANDA:NZDUSD': { symbol: 'NZDUSD', precision: 5, defaultSpreadPips: 6 },
  'OANDA:EURGBP': { symbol: 'EURGBP', precision: 5, defaultSpreadPips: 6 },
  'OANDA:EURJPY': { symbol: 'EURJPY', precision: 3, defaultSpreadPips: 3 },
  'OANDA:GBPJPY': { symbol: 'GBPJPY', precision: 3, defaultSpreadPips: 3 },
  'OANDA:US30USD': { symbol: 'US30', precision: 2, defaultSpreadPips: 10 },
  'OANDA:DE30EUR': { symbol: 'GER40', precision: 2, defaultSpreadPips: 10 },
  'NASDAQ:NDX': { symbol: 'NAS100', precision: 2, defaultSpreadPips: 10 },
  'SP:SPX': { symbol: 'SPX500', precision: 2, defaultSpreadPips: 5 },
  'BINANCE:BTCUSDT': { symbol: 'BTCUSD', precision: 2, defaultSpreadPips: 20 },
  'BINANCE:ETHUSDT': { symbol: 'ETHUSD', precision: 2, defaultSpreadPips: 15 },
  'BINANCE:SOLUSDT': { symbol: 'SOLUSD', precision: 2, defaultSpreadPips: 5 },
};

class RealtimeLiveMarketDataProvider implements MarketDataProvider {
  private quotes: Map<string, MarketQuote> = new Map();
  private subscribers: Map<string, Set<(quote: MarketQuote) => void>> = new Map();
  private allSubscribers: Set<(quotes: MarketQuote[]) => void> = new Set();
  private ws: WebSocket | null = null;
  private wsSessionId: string = '';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private httpPollTimer: NodeJS.Timeout | null = null;
  private isDestroyed: boolean = false;

  constructor() {
    this.initBaseQuotes();
    this.initTradingViewWebSocket();
    this.startHttpFallbackPoller();
  }

  public checkIsMarketOpen(symbol: string): boolean {
    const upper = symbol.toUpperCase();

    // Crypto operates 24/7/365
    if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(upper)) {
      return true;
    }

    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const hour = now.getUTCHours();

    if (day === 6) {
      return false;
    }
    if (day === 0 && hour < 22) {
      return false;
    }
    if (day === 5 && hour >= 22) {
      return false;
    }

    return true;
  }

  private formatTvWsMessage(name: string, params: any[]): string {
    const str = JSON.stringify({ m: name, p: params });
    return `~m~${str.length}~m~${str}`;
  }

  /**
   * Official Real-Time TradingView WebSocket Streamer
   * Provides ultra-low-latency, millisecond real-time market ticks matching the chart widget.
   */
  private initTradingViewWebSocket() {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
        headers: {
          Origin: 'https://www.tradingview.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      this.ws.on('open', () => {
        this.wsSessionId = 'qs_' + Math.random().toString(36).substring(2, 11);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.formatTvWsMessage('set_auth_token', ['unauthorized_user_token']));
          this.ws.send(this.formatTvWsMessage('quote_create_session', [this.wsSessionId]));
          this.ws.send(
            this.formatTvWsMessage('quote_set_fields', [
              this.wsSessionId,
              'lp',
              'bid',
              'ask',
              'ch',
              'chp',
              'high_price',
              'low_price',
              'open_price',
              'volume',
            ])
          );
          this.ws.send(this.formatTvWsMessage('quote_add_symbols', [this.wsSessionId, ...Object.keys(TV_SYMBOL_MAP)]));
        }
      });

      this.ws.on('message', (raw: WebSocket.Data) => {
        const text = raw.toString();
        const parts = text.split(/~m~\d+~m~/).filter(Boolean);

        for (const part of parts) {
          if (part.startsWith('~h~')) {
            // Heartbeat Keep-Alive response
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(`~m~${part.length}~m~${part}`);
            }
            continue;
          }

          try {
            const json = JSON.parse(part);
            if (json.m === 'qsd' && Array.isArray(json.p) && json.p[1]) {
              const payload = json.p[1];
              const ticker = payload.n;
              const meta = TV_SYMBOL_MAP[ticker];
              if (meta && payload.v) {
                this.handleTvTick(meta.symbol, meta.precision, meta.defaultSpreadPips, payload.v);
              }
            }
          } catch {
            // Non-JSON protocol message
          }
        }
      });

      this.ws.on('error', (err) => {
        console.warn('TradingView WebSocket error:', err.message);
      });

      this.ws.on('close', () => {
        if (!this.isDestroyed) {
          this.scheduleWsReconnect();
        }
      });
    } catch (err) {
      console.warn('Failed to initialize TradingView WebSocket:', (err as Error).message);
      this.scheduleWsReconnect();
    }
  }

  private scheduleWsReconnect() {
    if (this.reconnectTimeout || this.isDestroyed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.initTradingViewWebSocket();
    }, 2500);
  }

  /**
   * Process Real-Time Incoming Tick
   */
  private handleTvTick(
    symbol: string,
    defaultPrecision: number,
    defaultSpreadPips: number,
    tick: {
      lp?: number;
      bid?: number | null;
      ask?: number | null;
      high_price?: number;
      low_price?: number;
      ch?: number;
      chp?: number;
    }
  ) {
    const existing = this.quotes.get(symbol);
    const symConfig = DBEngine.getDB().symbols.find((s) => s.symbol === symbol);
    const precision = symConfig?.decimalPrecision || defaultPrecision;
    const spreadPips = symConfig?.spreadPips || defaultSpreadPips;
    const pipsMultiplier = precision === 5 || precision === 3 ? 0.0001 : precision === 2 ? 0.01 : 0.1;
    const defaultSpreadVal = spreadPips * pipsMultiplier;

    let lp = typeof tick.lp === 'number' && tick.lp > 0 ? tick.lp : existing ? existing.price : 0;
    
    let bid: number;
    let ask: number;

    if (typeof tick.bid === 'number' && typeof tick.ask === 'number' && tick.bid > 0 && tick.ask > tick.bid) {
      bid = tick.bid;
      ask = tick.ask;
      if (!tick.lp) {
        lp = (bid + ask) / 2;
      }
    } else if (typeof tick.bid === 'number' && tick.bid > 0) {
      bid = tick.bid;
      ask = existing?.ask && existing.ask > bid ? existing.ask : bid + defaultSpreadVal;
      if (!tick.lp) lp = (bid + ask) / 2;
    } else if (typeof tick.ask === 'number' && tick.ask > 0) {
      ask = tick.ask;
      bid = existing?.bid && existing.bid < ask ? existing.bid : ask - defaultSpreadVal;
      if (!tick.lp) lp = (bid + ask) / 2;
    } else if (lp > 0) {
      bid = lp - defaultSpreadVal / 2;
      ask = lp + defaultSpreadVal / 2;
    } else {
      return;
    }

    if (bid >= ask) {
      ask = bid + defaultSpreadVal;
    }

    const price = Number(lp.toFixed(precision));
    bid = Number(bid.toFixed(precision));
    ask = Number(ask.toFixed(precision));
    const liveSpreadPips = Number(((ask - bid) / pipsMultiplier).toFixed(1));

    const high = Number((tick.high_price || existing?.high || lp * 1.002).toFixed(precision));
    const low = Number((tick.low_price || existing?.low || lp * 0.998).toFixed(precision));
    const change24h = typeof tick.chp === 'number' ? Number(tick.chp.toFixed(2)) : existing?.change24h || 0;
    const isOpen = this.checkIsMarketOpen(symbol);

    const updatedQuote: MarketQuote = {
      symbol,
      price,
      bid,
      ask,
      spread: liveSpreadPips > 0 ? liveSpreadPips : spreadPips,
      high,
      low,
      change24h,
      timestamp: new Date().toISOString(),
      isMarketOpen: isOpen,
    };

    this.quotes.set(symbol, updatedQuote);

    // Instant notification to symbol subscribers
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach((cb) => cb(updatedQuote));
    }

    // Notify bulk subscribers
    if (this.allSubscribers.size > 0) {
      const all = Array.from(this.quotes.values());
      this.allSubscribers.forEach((cb) => cb(all));
    }
  }

  /**
   * HTTP Fallback Poller to guarantee initial data & resilience
   */
  private startHttpFallbackPoller() {
    const poll = async () => {
      try {
        const tvRes = await fetch('https://scanner.tradingview.com/global/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          body: JSON.stringify({
            symbols: { tickers: Object.keys(TV_SYMBOL_MAP) },
            columns: ['close', 'bid', 'ask', 'high', 'low', 'change'],
          }),
        });

        if (tvRes.ok) {
          const scanData = (await tvRes.json()) as any;
          if (Array.isArray(scanData?.data)) {
            for (const item of scanData.data) {
              const ticker = item.s;
              const meta = TV_SYMBOL_MAP[ticker];
              if (!meta) continue;

              const [tvClose, tvBid, tvAsk, tvHigh, tvLow, tvChange] = item.d || [];
              this.handleTvTick(meta.symbol, meta.precision, meta.defaultSpreadPips, {
                lp: tvClose,
                bid: tvBid,
                ask: tvAsk,
                high_price: tvHigh,
                low_price: tvLow,
                chp: tvChange,
              });
            }
          }
        }
      } catch {
        // Fallback catch
      }
    };

    // Run immediately once
    poll();

    // Repeat every 3 seconds as a safety backup
    this.httpPollTimer = setInterval(poll, 3000);
  }

  private initBaseQuotes() {
    const basePrices: Record<string, { price: number; precision: number; spread: number }> = {
      EURUSD: { price: 1.1673, precision: 5, spread: 0.00002 },
      GBPUSD: { price: 1.3629, precision: 5, spread: 0.00004 },
      USDJPY: { price: 158.96, precision: 3, spread: 0.003 },
      AUDUSD: { price: 0.7114, precision: 5, spread: 0.00006 },
      USDCAD: { price: 1.3789, precision: 5, spread: 0.00005 },
      USDCHF: { price: 0.8005, precision: 5, spread: 0.00006 },
      NZDUSD: { price: 0.5940, precision: 5, spread: 0.00006 },
      EURGBP: { price: 0.8564, precision: 5, spread: 0.00006 },
      EURJPY: { price: 185.56, precision: 3, spread: 0.003 },
      GBPJPY: { price: 216.66, precision: 3, spread: 0.003 },
      XAUUSD: { price: 4518.80, precision: 2, spread: 0.10 },
      XAGUSD: { price: 68.24, precision: 3, spread: 0.02 },
      USOIL:  { price: 86.78, precision: 2, spread: 0.04 },
      NAS100: { price: 29195.00, precision: 2, spread: 1.0 },
      US30:   { price: 53028.00, precision: 2, spread: 1.5 },
      SPX500: { price: 7672.00, precision: 2, spread: 0.4 },
      GER40:  { price: 25997.00, precision: 2, spread: 1.0 },
      BTCUSD: { price: 72480.00, precision: 2, spread: 1.50 },
      ETHUSD: { price: 2333.00, precision: 2, spread: 0.20 },
      SOLUSD: { price: 87.32, precision: 2, spread: 0.02 },
    };

    const symbols = DBEngine.getDB().symbols;

    for (const sym of symbols) {
      const config = basePrices[sym.symbol] || { price: 100.0, precision: sym.decimalPrecision, spread: sym.tickSize };
      const basePrice = config.price;
      const spreadVal = config.spread;

      const ask = basePrice + spreadVal / 2;
      const bid = basePrice - spreadVal / 2;
      const isOpen = this.checkIsMarketOpen(sym.symbol);

      this.quotes.set(sym.symbol, {
        symbol: sym.symbol,
        price: Number(basePrice.toFixed(config.precision)),
        bid: Number(bid.toFixed(config.precision)),
        ask: Number(ask.toFixed(config.precision)),
        spread: sym.spreadPips || 2,
        high: Number((basePrice * 1.005).toFixed(config.precision)),
        low: Number((basePrice * 0.995).toFixed(config.precision)),
        change24h: 0.12,
        timestamp: new Date().toISOString(),
        isMarketOpen: isOpen,
      });
    }
  }

  public getQuote(symbol: string): MarketQuote | null {
    return this.quotes.get(symbol) || null;
  }

  public getAllQuotes(): MarketQuote[] {
    return Array.from(this.quotes.values());
  }

  public subscribe(symbol: string, callback: (quote: MarketQuote) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    return () => {
      const set = this.subscribers.get(symbol);
      if (set) set.delete(callback);
    };
  }

  public subscribeAll(callback: (quotes: MarketQuote[]) => void): () => void {
    this.allSubscribers.add(callback);
    return () => {
      this.allSubscribers.delete(callback);
    };
  }
}

export const marketDataService = new RealtimeLiveMarketDataProvider();
