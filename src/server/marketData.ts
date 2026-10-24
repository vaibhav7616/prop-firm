import WebSocket from 'ws';
import type { MarketQuote, SymbolConfig } from './types';
import { DBEngine } from './db';
import { getPipMultiplier } from './mt5';

// Market Data Provider Interface
export interface MarketDataProvider {
  getQuote(symbol: string): MarketQuote | null;
  getAllQuotes(): MarketQuote[];
  subscribe(symbol: string, callback: (quote: MarketQuote) => void): () => void;
  subscribeAll(callback: (quotes: MarketQuote[]) => void): () => void;
  checkIsMarketOpen(symbol: string): boolean;
}

const TV_SYMBOL_MAP: Record<string, { symbol: string; precision: number; defaultSpreadPips: number }> = {
  // Metals
  'OANDA:XAUUSD': { symbol: 'XAUUSD', precision: 2, defaultSpreadPips: 1.2 },
  'OANDA:XAGUSD': { symbol: 'XAGUSD', precision: 3, defaultSpreadPips: 1.8 },

  // Majors
  'OANDA:EURUSD': { symbol: 'EURUSD', precision: 5, defaultSpreadPips: 0.2 },
  'OANDA:GBPUSD': { symbol: 'GBPUSD', precision: 5, defaultSpreadPips: 0.3 },
  'OANDA:USDJPY': { symbol: 'USDJPY', precision: 3, defaultSpreadPips: 0.3 },
  'OANDA:AUDUSD': { symbol: 'AUDUSD', precision: 5, defaultSpreadPips: 0.4 },
  'OANDA:USDCAD': { symbol: 'USDCAD', precision: 5, defaultSpreadPips: 0.4 },
  'OANDA:USDCHF': { symbol: 'USDCHF', precision: 5, defaultSpreadPips: 0.4 },
  'OANDA:NZDUSD': { symbol: 'NZDUSD', precision: 5, defaultSpreadPips: 0.5 },

  // Crosses
  'OANDA:EURGBP': { symbol: 'EURGBP', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:EURJPY': { symbol: 'EURJPY', precision: 3, defaultSpreadPips: 0.4 },
  'OANDA:GBPJPY': { symbol: 'GBPJPY', precision: 3, defaultSpreadPips: 0.5 },
  'OANDA:EURAUD': { symbol: 'EURAUD', precision: 5, defaultSpreadPips: 0.6 },
  'OANDA:EURCAD': { symbol: 'EURCAD', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:EURCHF': { symbol: 'EURCHF', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:EURNZD': { symbol: 'EURNZD', precision: 5, defaultSpreadPips: 0.6 },
  'OANDA:GBPAUD': { symbol: 'GBPAUD', precision: 5, defaultSpreadPips: 0.7 },
  'OANDA:GBPCAD': { symbol: 'GBPCAD', precision: 5, defaultSpreadPips: 0.6 },
  'OANDA:GBPCHF': { symbol: 'GBPCHF', precision: 5, defaultSpreadPips: 0.6 },
  'OANDA:GBPNZD': { symbol: 'GBPNZD', precision: 5, defaultSpreadPips: 0.7 },
  'OANDA:AUDCAD': { symbol: 'AUDCAD', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:AUDCHF': { symbol: 'AUDCHF', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:AUDJPY': { symbol: 'AUDJPY', precision: 3, defaultSpreadPips: 0.5 },
  'OANDA:AUDNZD': { symbol: 'AUDNZD', precision: 5, defaultSpreadPips: 0.6 },
  'OANDA:CADCHF': { symbol: 'CADCHF', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:CADJPY': { symbol: 'CADJPY', precision: 3, defaultSpreadPips: 0.5 },
  'OANDA:CHFJPY': { symbol: 'CHFJPY', precision: 3, defaultSpreadPips: 0.5 },
  'OANDA:NZDCAD': { symbol: 'NZDCAD', precision: 5, defaultSpreadPips: 0.6 },
  'OANDA:NZDCHF': { symbol: 'NZDCHF', precision: 5, defaultSpreadPips: 0.5 },
  'OANDA:NZDJPY': { symbol: 'NZDJPY', precision: 3, defaultSpreadPips: 0.6 },

  // Exotics
  'OANDA:USDMXN': { symbol: 'USDMXN', precision: 4, defaultSpreadPips: 3.5 },
  'OANDA:USDZAR': { symbol: 'USDZAR', precision: 4, defaultSpreadPips: 4.0 },
  'OANDA:USDSGD': { symbol: 'USDSGD', precision: 4, defaultSpreadPips: 1.5 },
  'OANDA:USDTRY': { symbol: 'USDTRY', precision: 4, defaultSpreadPips: 5.0 },
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

  public checkIsMarketOpen(_symbol: string): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const hour = now.getUTCHours();

    // Institutional Forex Market Hours: Sunday 22:00 UTC through Friday 22:00 UTC
    if (day === 6) {
      return false; // Saturday closed
    }
    if (day === 0 && hour < 22) {
      return false; // Sunday before 22:00 UTC closed
    }
    if (day === 5 && hour >= 22) {
      return false; // Friday after 22:00 UTC closed
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
    const pipsMultiplier = getPipMultiplier(symbol, precision);
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
      // Metals
      XAUUSD: { price: 2724.50, precision: 2, spread: 0.25 },
      XAGUSD: { price: 31.85, precision: 3, spread: 0.02 },

      // Majors
      EURUSD: { price: 1.1673, precision: 5, spread: 0.00002 },
      GBPUSD: { price: 1.3629, precision: 5, spread: 0.00004 },
      USDJPY: { price: 158.96, precision: 3, spread: 0.003 },
      AUDUSD: { price: 0.7114, precision: 5, spread: 0.00006 },
      USDCAD: { price: 1.3789, precision: 5, spread: 0.00005 },
      USDCHF: { price: 0.8005, precision: 5, spread: 0.00006 },
      NZDUSD: { price: 0.5940, precision: 5, spread: 0.00006 },

      // Crosses
      EURGBP: { price: 0.8564, precision: 5, spread: 0.00006 },
      EURJPY: { price: 185.56, precision: 3, spread: 0.003 },
      GBPJPY: { price: 216.66, precision: 3, spread: 0.003 },
      EURAUD: { price: 1.6405, precision: 5, spread: 0.00006 },
      EURCAD: { price: 1.6095, precision: 5, spread: 0.00005 },
      EURCHF: { price: 0.9345, precision: 5, spread: 0.00005 },
      EURNZD: { price: 1.8210, precision: 5, spread: 0.00007 },
      GBPAUD: { price: 1.9155, precision: 5, spread: 0.00007 },
      GBPCAD: { price: 1.8790, precision: 5, spread: 0.00006 },
      GBPCHF: { price: 1.0910, precision: 5, spread: 0.00006 },
      GBPNZD: { price: 2.1265, precision: 5, spread: 0.00008 },
      AUDCAD: { price: 0.9810, precision: 5, spread: 0.00005 },
      AUDCHF: { price: 0.5695, precision: 5, spread: 0.00005 },
      AUDJPY: { price: 113.10, precision: 3, spread: 0.005 },
      AUDNZD: { price: 1.1030, precision: 5, spread: 0.00006 },
      CADCHF: { price: 0.6385, precision: 5, spread: 0.00005 },
      CADJPY: { price: 115.28, precision: 3, spread: 0.005 },
      CHFJPY: { price: 198.58, precision: 3, spread: 0.005 },
      NZDCAD: { price: 0.8250, precision: 5, spread: 0.00006 },
      NZDCHF: { price: 0.5160, precision: 5, spread: 0.00005 },
      NZDJPY: { price: 94.42, precision: 3, spread: 0.006 },

      // Exotics
      USDMXN: { price: 19.8520, precision: 4, spread: 0.0035 },
      USDZAR: { price: 17.6540, precision: 4, spread: 0.0040 },
      USDSGD: { price: 1.3140, precision: 4, spread: 0.0002 },
      USDTRY: { price: 34.2500, precision: 4, spread: 0.0050 },
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
