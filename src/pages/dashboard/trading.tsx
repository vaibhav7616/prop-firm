import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Briefcase,
  History,
  ShieldAlert,
  CandlestickChart,
  CircleDot,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFsAccount } from '@/context/account-context';
import {
  executeOrderApi,
  closePositionApi,
  fetchAccountPositionsApi,
} from '@/lib/api-client';
import type { TradingAccount } from '@/types';
import { fsMetrics, fsRisk, fsTradingDays } from '@/lib/fs-risk';
import { formatCurrency, ACCOUNT_STATUS_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { calculateMT5PnL } from '@/utils/mt5';
import { FsPanel, FsLabel, StatusPill, FsProgress } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

interface MarketQuote {
  symbol: string;
  price?: number;
  bid: number;
  ask: number;
  spread?: number;
  high: number;
  low: number;
  change24h: number;
  prevBid?: number;
  isMarketOpen?: boolean;
  timestamp?: string;
  /** 'tv' = direct TradingView/chart feed (authoritative for display);
      undefined = platform backend feed (trading-engine source, may be stale). */
  source?: 'tv';
}

const CATS = ['ALL', 'FOREX', 'COMMODITIES', 'INDICES', 'CRYPTO'] as const;
const FOREX = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
const METALS = ['XAUUSD', 'XAGUSD', 'USOIL'];
const INDICES = ['NAS100', 'US30', 'SPX500', 'GER40'];
const CRYPTO = ['BTCUSD', 'ETHUSD', 'SOLUSD'];
const SUPPORTED_SYMBOLS = [...FOREX, ...METALS, ...INDICES, ...CRYPTO];

/* Internal symbol <-> TradingView ticker (same feed the chart widget draws from). */
const SYMBOL_TO_TV: Record<string, string> = {
  XAUUSD: 'OANDA:XAUUSD', XAGUSD: 'TVC:SILVER', USOIL: 'NYMEX:CL1!',
  EURUSD: 'OANDA:EURUSD', GBPUSD: 'OANDA:GBPUSD', USDJPY: 'OANDA:USDJPY',
  AUDUSD: 'OANDA:AUDUSD', USDCAD: 'OANDA:USDCAD', USDCHF: 'OANDA:USDCHF',
  NZDUSD: 'OANDA:NZDUSD', EURGBP: 'OANDA:EURGBP', EURJPY: 'OANDA:EURJPY', GBPJPY: 'OANDA:GBPJPY',
  US30: 'OANDA:US30USD', GER40: 'OANDA:DE30EUR', NAS100: 'NASDAQ:NDX', SPX500: 'SP:SPX',
  BTCUSD: 'BINANCE:BTCUSDT', ETHUSD: 'BINANCE:ETHUSDT', SOLUSD: 'BINANCE:SOLUSDT',
};
const TV_TO_SYMBOL: Record<string, string> = Object.fromEntries(Object.entries(SYMBOL_TO_TV).map(([s, t]) => [t, s]));
const symbolToTv = (s: string) => SYMBOL_TO_TV[s] || s;
const tvToSymbol = (t: string) => TV_TO_SYMBOL[t] || t;

/* Quote precision by market convention (must match how prices are displayed). */
const P5 = ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP'];
const P3 = ['USDJPY', 'EURJPY', 'GBPJPY', 'XAGUSD'];
function symbolPrecision(symbol: string): number {
  if (P5.includes(symbol)) return 5;
  if (P3.includes(symbol)) return 3;
  return 2;
}
function roundP(v: number, p: number): number {
  if (!Number.isFinite(v)) return 0;
  const f = Math.pow(10, p);
  return Math.round(v * f) / f;
}
function marketIsOpen(symbol: string): boolean {
  const s = symbol.toUpperCase();
  if (['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(s)) return true; // crypto 24/7
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (day === 6) return false;
  if (day === 0 && hour < 22) return false;
  if (day === 5 && hour >= 22) return false;
  return true;
}

/* Build a MarketQuote from a raw TradingView scanner row:
   row = { s: ticker, d: [close, bid, ask, high, low, change%] } */
function buildQuoteFromTv(ticker: string, row: (number | null | undefined)[]): MarketQuote | null {
  const symbol = tvToSymbol(ticker);
  const [close, bid, ask, high, low, chg] = row || [];
  const p = symbolPrecision(symbol);
  const isOpen = marketIsOpen(symbol);
  let b = typeof bid === 'number' && Number.isFinite(bid) ? roundP(bid, p) : null;
  let a = typeof ask === 'number' && Number.isFinite(ask) ? roundP(ask, p) : null;
  const c = typeof close === 'number' && Number.isFinite(close) ? roundP(close, p) : null;
  if (b === null && c !== null) b = c;
  if (a === null && c !== null) a = c;
  if (b === null && a !== null) b = a;
  if (a === null && b !== null) a = b;
  if (b === null || a === null) return null;
  if (a <= b) a = roundP(b + 1 / Math.pow(10, p), p);
  const mid = roundP((b + a) / 2, p);
  const hi = typeof high === 'number' && Number.isFinite(high) ? roundP(high, p) : mid;
  const lo = typeof low === 'number' && Number.isFinite(low) ? roundP(low, p) : mid;
  return {
    symbol,
    price: c ?? mid,
    bid: b,
    ask: a,
    spread: Number((a - b).toFixed(Math.max(1, p))),
    high: hi,
    low: lo,
    change24h: typeof chg === 'number' && Number.isFinite(chg) ? Number(chg.toFixed(2)) : 0,
    isMarketOpen: isOpen,
    timestamp: new Date().toISOString(),
    source: 'tv',
  };
}


export function DashboardTrading() {
  const { user } = useAuth();
  const { selected, accounts, selectAccount, loading: accLoading } = useFsAccount();

  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<Record<string, 'UP' | 'DOWN' | 'SAME'>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [cat, setCat] = useState<(typeof CATS)[number]>('ALL');
  const [search, setSearch] = useState('');

  const [lotSize, setLotSize] = useState<number>(1.0);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  const [positions, setPositions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'HISTORY' | 'RULES'>('POSITIONS');
  const [submitting, setSubmitting] = useState(false);
  const [closingAll, setClosingAll] = useState(false);

  // positions poll for the selected account
  useEffect(() => {
    if (!selected) return;
    let stop = false;
    const load = async () => {
      const p = await fetchAccountPositionsApi(selected.id);
      if (!stop && Array.isArray(p)) setPositions(p);
    };
    load();
    const id = setInterval(load, 1500);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [selected?.id]);

  // Market data — bid/ask always reflect the chart.
  // Sources, in priority order:
  //  1) the platform backend stream (/api/market/ticks/stream) when present, and
  //  2) a direct poll of the SAME TradingView feed the chart widget renders from,
  //     so bid/ask are guaranteed to be live and match the chart in every
  //     environment (full stack, frontend-only, or a blocked container feed).
  useEffect(() => {
    let disposed = false;
    let es: EventSource | null = null;
    let timer: number | undefined;

    const apply = (incoming: MarketQuote[]) => {
      if (disposed || incoming.length === 0) return;
      setQuotes((prev) => {
        const map = new Map<string, MarketQuote>();
        prev.forEach((p) => map.set(p.symbol, p));
        const hist: Record<string, 'UP' | 'DOWN' | 'SAME'> = {};
        incoming.forEach((q) => {
          const old = map.get(q.symbol);
          // TradingView (chart) feed is authoritative for display. A backend
          // quote must NOT overwrite a chart-consistent quote for the same
          // symbol, otherwise a stale/high backend value would override the
          // real chart price.
          if (old?.source === 'tv' && q.source !== 'tv') return;
          if (old) hist[q.symbol] = q.bid > old.bid ? 'UP' : q.bid < old.bid ? 'DOWN' : 'SAME';
          map.set(q.symbol, q);
        });
        if (Object.keys(hist).length) {
          requestAnimationFrame(() => {
            if (!disposed) setQuoteHistory((h) => ({ ...h, ...hist }));
          });
        }
        return [...map.values()];
      });
    };

    // 1) Platform backend feed (streaming, used by the trading engine).
    fetch('/api/market/quotes')
      .then((r) => r.json())
      .then((d) => {
        if (disposed || !Array.isArray(d) || d.length === 0) return;
        apply(d as MarketQuote[]);
        try {
          es = new EventSource('/api/market/ticks/stream');
          es.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (Array.isArray(data)) apply(data as MarketQuote[]);
            } catch {
              /* ignore bad frame */
            }
          };
        } catch {
          /* no backend stream available */
        }
      })
      .catch(() => {});

    // 2) TradingView scanner poll — authoritative chart-consistent bid/ask.
    const loadTv = async () => {
      try {
        const res = await fetch('https://scanner.tradingview.com/global/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbols: { tickers: SUPPORTED_SYMBOLS.map(symbolToTv) },
            columns: ['close', 'bid', 'ask', 'high', 'low', 'change'],
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (disposed || !Array.isArray(data?.data)) return;
        const qs = (data.data as any[])
          .map((it) => buildQuoteFromTv(it.s, it.d))
          .filter((q): q is MarketQuote => q !== null && q.bid > 0 && q.ask > 0);
        if (qs.length) apply(qs);
      } catch {
        /* TV unreachable — keep whatever we already have */
      }
    };
    loadTv();
    timer = window.setInterval(loadTv, 4000);

    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      if (es) es.close();
    };
  }, []);

  const fmt = (val: number | undefined, sym: string) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    if (['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP'].includes(sym)) return val.toFixed(5);
    if (['USDJPY', 'EURJPY', 'GBPJPY', 'XAGUSD'].includes(sym)) return val.toFixed(3);
    return val.toFixed(2);
  };

  const activeQuote: any =
    quotes.find((q) => q.symbol === selectedSymbol) || { symbol: selectedSymbol, bid: 0, ask: 0, high: 0, low: 0, change24h: 0, isMarketOpen: true };

  const filtered = quotes.filter((q) => {
    if (search.trim()) return q.symbol.toLowerCase().includes(search.toLowerCase());
    if (cat === 'ALL') return true;
    if (cat === 'FOREX') return FOREX.includes(q.symbol);
    if (cat === 'COMMODITIES') return METALS.includes(q.symbol);
    if (cat === 'INDICES') return INDICES.includes(q.symbol);
    if (cat === 'CRYPTO') return CRYPTO.includes(q.symbol);
    return true;
  });

  const exec = async (side: 'BUY' | 'SELL') => {
    if (!selected || !user) return toast.error('Select a trading account first.');
    if (lotSize <= 0) return toast.error('Lot size must be greater than 0.');
    if (activeQuote?.isMarketOpen === false) return toast.error('Market closed (weekend).');
    setSubmitting(true);
    const res = await executeOrderApi({
      userId: user.id,
      accountId: selected.id,
      symbol: selectedSymbol,
      type: side,
      lotSize,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success(`${side} executed · ${lotSize} lots ${selectedSymbol}`);
      const p = await fetchAccountPositionsApi(selected.id);
      if (Array.isArray(p)) setPositions(p);
      selectAccount(selected.id);
    } else {
      toast.error(res.error || 'Order failed');
    }
  };

  const closePos = async (posId: string) => {
    if (!selected || !user) return;
    const res = await closePositionApi({ userId: user.id, accountId: selected.id, positionId: posId });
    if (res.success) {
      toast.success('Position closed');
      const p = await fetchAccountPositionsApi(selected.id);
      if (Array.isArray(p)) setPositions(p);
    } else toast.error(res.error || 'Close failed');
  };

  const closeAll = async () => {
    const open = positions.filter((p) => p.status === 'OPEN');
    if (!open.length || !selected || !user) return;
    setClosingAll(true);
    let c = 0;
    for (const p of open) {
      const r = await closePositionApi({ userId: user.id, accountId: selected.id, positionId: p.id });
      if (r.success) c++;
    }
    setClosingAll(false);
    toast.success(`Closed ${c} position(s)`);
    const p = await fetchAccountPositionsApi(selected.id);
    if (Array.isArray(p)) setPositions(p);
  };

  if (accLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" /> Loading terminal…
      </div>
    );
  }

  // live mark-to-market
  const quoteMap = new Map<string, { bid: number; ask: number }>();
  quotes.forEach((q) => quoteMap.set(q.symbol, { bid: q.bid, ask: q.ask }));
  const livePositions = positions.map((pos) => {
    if (pos.status !== 'OPEN') return pos;
    const q = quotes.find((x) => x.symbol === pos.symbol);
    if (!q) return pos;
    const pnl = calculateMT5PnL({
      symbol: pos.symbol,
      type: pos.type as 'BUY' | 'SELL',
      lotSize: pos.lot_size,
      openPrice: pos.open_price,
      currentBid: q.bid,
      currentAsk: q.ask,
      commission: pos.commission || 0,
      swap: pos.swap || 0,
      quoteLookup: (sym) => quoteMap.get(sym),
    });
    return { ...pos, current_price: pnl.currentPrice, floating_pnl: pnl.netPnl };
  });
  const openPositions = livePositions.filter((p) => p.status === 'OPEN');
  const closedPositions = livePositions.filter((p) => p.status === 'CLOSED');
  const floating = openPositions.reduce((s, p) => s + (p.floating_pnl || 0), 0);

  const balance = selected?.current_balance ?? selected?.starting_balance ?? 0;
  const equity = balance + floating;
  const metrics = selected ? fsMetrics(selected, equity) : null;
  const risk = selected ? fsRisk(selected, equity) : null;

  // Feed freshness: a quote is "live" only if it carries a recent timestamp.
  // Static backend base quotes carry the server-start timestamp and never move,
  // so they are treated as NOT live and must not be presented as real prices.
  const feedFresh = quotes.some((q) => q.timestamp && Date.now() - new Date(q.timestamp).getTime() < 15000);
  const feedState: 'live' | 'waiting' | 'none' = quotes.length === 0 ? 'none' : feedFresh ? 'live' : 'waiting';

  return (
    <div className="space-y-4">
      {/* Terminal top bar */}
      <FsPanel className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30">
            <CandlestickChart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold text-slate-50">Funded Shift Web Terminal</h2>
              {feedState === 'live' ? (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 px-2 py-px text-[10px] font-semibold text-emerald-300">
                  <span className="fs-live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-amber-500/30 px-2 py-px text-[10px] font-semibold text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> WAITING FOR FEED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Streaming quotes · live rule monitoring · MT5-grade execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Account</span>
          <select
            value={selected?.id ?? ''}
            onChange={(e) => selectAccount(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {accounts.map((a: TradingAccount) => (
              <option key={a.id} value={a.id}>
                #{a.account_number ?? a.id} · {ACCOUNT_STATUS_LABELS[a.status] ?? a.status} · ${(a.account_size / 1000).toFixed(0)}K
              </option>
            ))}
          </select>
        </div>
      </FsPanel>

      {/* metrics ribbon */}
      {selected && metrics && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Metric label="Balance" value={formatCurrency(balance)} />
          <Metric label="Equity" value={formatCurrency(equity)} tone={equity >= balance ? 'up' : 'down'} />
          <Metric label="Floating P/L" value={`${floating >= 0 ? '+' : ''}${formatCurrency(floating)}`} tone={floating >= 0 ? 'up' : 'down'} />
          <Metric label="Margin" value="—" />
          <Metric
            label={`Daily Loss (${metrics.dailyPct}%)`}
            value={formatCurrency(risk?.dailyRemaining ?? 0)}
            tone={risk && risk.dailyUsedPct > 0.75 ? 'down' : 'neutral'}
          />
          <Metric
            label={`Max DD (${metrics.maxPct}%)`}
            value={formatCurrency(risk?.maxRemaining ?? 0)}
            tone={risk && risk.maxUsedPct > 0.75 ? 'down' : 'neutral'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Watchlist */}
        <div className="space-y-3 lg:col-span-3">
          <FsPanel className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="fs-label flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Watchlist</p>
              {feedState === 'none' ? (
                <StatusPill tone="amber"><Clock className="h-3 w-3" /> Waiting</StatusPill>
              ) : feedState === 'waiting' ? (
                <StatusPill tone="amber"><Clock className="h-3 w-3" /> Static</StatusPill>
              ) : activeQuote.isMarketOpen === false ? (
                <StatusPill tone="amber"><Clock className="h-3 w-3" /> Market closed</StatusPill>
              ) : (
                <StatusPill tone="emerald"><CircleDot className="h-3 w-3" /> Live</StatusPill>
              )}
            </div>
            <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    'shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition-colors',
                    cat === c ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {c === 'COMMODITIES' ? 'METALS' : c}
                </button>
              ))}
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol…"
                className="w-full rounded-md border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="fs-scroll max-h-[440px] space-y-1 overflow-y-auto pr-1">
              {filtered.map((q) => {
                const sel = q.symbol === selectedSymbol;
                const trend = quoteHistory[q.symbol];
                const closed = q.isMarketOpen === false;
                return (
                  <button
                    key={q.symbol}
                    onClick={() => setSelectedSymbol(q.symbol)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all',
                      sel ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="fs-num text-xs font-bold text-slate-100">{q.symbol}</span>
                        {closed && <span className="rounded bg-slate-800 px-1 text-[9px] font-semibold text-slate-500">closed</span>}
                      </div>
                      <span className="text-[10px] text-slate-500">spread {((q.ask - q.bid) || 0).toFixed(4)}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'fs-num text-xs font-semibold',
                          trend === 'UP' ? 'text-emerald-400' : trend === 'DOWN' ? 'text-rose-400' : 'text-slate-200'
                        )}
                      >
                        {fmt(q.bid, q.symbol)}
                      </span>
                      <div className={cn('text-[10px] font-medium', (q.change24h || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                        {q.change24h >= 0 ? '+' : ''}
                        {q.change24h}%
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No symbols. (Market feed offline in this build.)</p>}
            </div>
          </FsPanel>
        </div>

        {/* Chart + trade */}
        <div className="space-y-4 lg:col-span-9">
          {/* quote header + chart */}
          <FsPanel className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-slate-50">
                  {selectedSymbol}
                  <span className="rounded border border-slate-800 bg-slate-900 px-1.5 py-px text-[10px] font-medium text-slate-400">1:{metrics?.leverage ?? 100} ECN</span>
                </h3>
                <p className="text-xs text-slate-500">Interactive chart · interval 15m</p>
              </div>
              <div className="fs-num flex items-center gap-6 text-sm">
                <div>
                  <p className="text-[10px] font-sans uppercase tracking-wider text-rose-400">Bid</p>
                  <p className="font-bold text-slate-100">{fmt(activeQuote.bid, selectedSymbol)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-sans uppercase tracking-wider text-emerald-400">Ask</p>
                  <p className="font-bold text-slate-100">{fmt(activeQuote.ask, selectedSymbol)}</p>
                </div>
              </div>
            </div>

            {/* Live active executions inline chips */}
            {openPositions.filter((p) => p.symbol === selectedSymbol).length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active {selectedSymbol} ({openPositions.filter((p) => p.symbol === selectedSymbol).length})
                </span>
                {openPositions
                  .filter((p) => p.symbol === selectedSymbol)
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 fs-num text-[11px]">
                      <span className={cn('rounded px-1 font-black', p.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
                        {p.type} {p.lot_size}L
                      </span>
                      <span className="text-slate-400">@{fmt(p.open_price, p.symbol)}</span>
                      <span className={cn('font-bold', (p.floating_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        {(p.floating_pnl || 0) >= 0 ? '+' : ''}
                        {formatCurrency(p.floating_pnl || 0)}
                      </span>
                      <button onClick={() => closePos(p.id)} className="rounded bg-rose-500/80 px-1.5 py-px text-[10px] font-bold text-white hover:bg-rose-500">
                        Close
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="relative h-[380px] overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
              <iframe
                key={selectedSymbol}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${
                  tvSymbol(selectedSymbol)
                }&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=0b0e15&theme=dark&style=1&timezone=Etc%2FUTC&studies=%5B%5D&locale=en`}
                className="h-full w-full border-0"
                title={`${selectedSymbol} Live Chart`}
              />
            </div>
            {feedState === 'none' && (
              <p className="mt-2 text-center text-[11px] text-slate-600">
                Waiting for live prices — they stream from TradingView and should appear in a few seconds.
              </p>
            )}
            {feedState === 'waiting' && (
              <p className="mt-2 text-center text-[11px] text-amber-400/80">
                Showing static fallback prices — the live TradingView feed is not connected in this environment.
              </p>
            )}
          </FsPanel>

          {/* Order entry */}
          <FsPanel className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <FsLabel>Order Ticket</FsLabel>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-500">Quick lots:</span>
                {[0.01, 0.1, 0.5, 1.0, 5.0].map((v) => (
                  <button
                    key={v}
                    onClick={() => setLotSize(v)}
                    className={cn(
                      'fs-num rounded border px-2 py-0.5 font-bold transition-colors',
                      lotSize === v ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="Volume (lots)" value={lotSize} onChange={(v) => setLotSize(v)} mono />
              <Field label="Stop Loss (price)" value={stopLoss} onChange={(s) => setStopLoss(s)} />
              <Field label="Take Profit (price)" value={takeProfit} onChange={(s) => setTakeProfit(s)} />
              <div className="flex items-end gap-2">
                {activeQuote.isMarketOpen === false ? (
                  <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-400">
                    <Clock className="h-4 w-4" /> Market closed
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => exec('BUY')}
                      disabled={submitting || (selected?.status !== 'active' && selected?.status !== 'funded')}
                      className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-400 disabled:opacity-40"
                    >
                      <span className="flex items-center justify-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> BUY</span>
                      <span className="fs-num text-[10px] font-medium opacity-90">{fmt(activeQuote.ask, selectedSymbol)}</span>
                    </button>
                    <button
                      onClick={() => exec('SELL')}
                      disabled={submitting || (selected?.status !== 'active' && selected?.status !== 'funded')}
                      className="flex-1 rounded-lg bg-rose-500 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-400 disabled:opacity-40"
                    >
                      <span className="flex items-center justify-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> SELL</span>
                      <span className="fs-num text-[10px] font-medium opacity-90">{fmt(activeQuote.bid, selectedSymbol)}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            {selected && metrics && (
              <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                <div>
                  <div className="flex justify-between text-slate-400"><span>Profit target</span><span className="fs-num text-slate-200">{metrics.targetProgress * 100 > 0 ? (metrics.targetProgress * 100).toFixed(0) : 0}%</span></div>
                  <FsProgress value={metrics.targetProgress} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400"><span>Daily loss used</span><span className="fs-num text-rose-300">{((risk?.dailyUsedPct ?? 0) * 100).toFixed(0)}%</span></div>
                  <FsProgress value={risk?.dailyUsedPct ?? 0} tone="rose" className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400"><span>Max DD used</span><span className="fs-num text-amber-300">{((risk?.maxUsedPct ?? 0) * 100).toFixed(0)}%</span></div>
                  <FsProgress value={risk?.maxUsedPct ?? 0} tone="amber" className="mt-1" />
                </div>
              </div>
            )}
          </FsPanel>

          {/* Positions / history / rules */}
          <FsPanel className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    ['POSITIONS', `Open Positions (${openPositions.length})`, Briefcase],
                    ['HISTORY', `History (${closedPositions.length})`, History],
                    ['RULES', 'Account Rules', ShieldAlert],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors',
                      activeTab === key ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
              {activeTab === 'POSITIONS' && openPositions.length > 0 && (
                <button onClick={closeAll} disabled={closingAll} className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20">
                  {closingAll ? 'Closing…' : 'Close All'}
                </button>
              )}
            </div>

            {activeTab === 'POSITIONS' &&
              (openPositions.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-slate-500">No open positions for this account.</div>
              ) : (
                <PositionsTable rows={openPositions} fmt={fmt} onClose={closePos} />
              ))}
            {activeTab === 'HISTORY' &&
              (closedPositions.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-slate-500">No closed trades recorded.</div>
              ) : (
                <HistoryTable rows={closedPositions} fmt={fmt} />
              ))}
            {activeTab === 'RULES' && selected && metrics && <RulesView account={selected} />}
          </FsPanel>
        </div>
      </div>
    </div>
  );
}

function tvSymbol(s: string) {
  const map: Record<string, string> = {
    XAUUSD: 'OANDA%3AXAUUSD', XAGUSD: 'TVC%3ASILVER', EURUSD: 'OANDA%3AEURUSD', GBPUSD: 'OANDA%3AGBPUSD',
    USDJPY: 'OANDA%3AUSDJPY', AUDUSD: 'OANDA%3AAUDUSD', USDCAD: 'OANDA%3AUSDCAD', USDCHF: 'OANDA%3AUSDCHF',
    NZDUSD: 'OANDA%3ANZDUSD', EURGBP: 'OANDA%3AEURGBP', EURJPY: 'OANDA%3AEURJPY', GBPJPY: 'OANDA%3AGBPJPY',
    NAS100: 'NASDAQ%3ANDX', US30: 'OANDA%3AUS30USD', SPX500: 'SP%3ASPX', GER40: 'OANDA%3ADE30EUR',
    BTCUSD: 'BINANCE%3ABTCUSDT', ETHUSD: 'BINANCE%3AETHUSDT', SOLUSD: 'BINANCE%3ASOLUSDT',
  };
  return map[s] || s;
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' }) {
  return (
    <FsPanel className="p-3">
      <FsLabel>{label}</FsLabel>
      <p className={cn('fs-num mt-1.5 text-lg font-semibold', tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-slate-100')}>
        {value}
      </p>
    </FsPanel>
  );
}

function Field({ label, value, onChange, mono }: { label: string; value: string | number; onChange: (v: any) => void; mono?: boolean }) {
  return (
    <label className="block">
      <span className="fs-label">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(mono ? parseFloat(e.target.value) || 0 : e.target.value)}
        className={cn(
          'mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none',
          mono && 'fs-num'
        )}
      />
    </label>
  );
}

function th(cls?: string) {
  return `px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${cls ?? ''}`;
}
function td(cls?: string) {
  return `px-3 py-2.5 text-sm ${cls ?? ''}`;
}

function PositionsTable({ rows, fmt, onClose }: { rows: any[]; fmt: (v: any, s: string) => string; onClose: (id: string) => void }) {
  return (
    <div className="fs-scroll overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-800">
          <tr>
            <th className={th()}>Symbol</th><th className={th()}>Side</th><th className={th()}>Lots</th><th className={th()}>Open</th>
            <th className={th()}>Now</th><th className={th()}>SL</th><th className={th()}>TP</th><th className={th()}>Floating</th><th className={th('text-right')}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {rows.map((p) => (
            <tr key={p.id} className="fs-row-hover">
              <td className={cn(td(), 'fs-num font-semibold text-slate-100')}>{p.symbol}</td>
              <td className={td()}>
                <span className={cn('rounded px-1.5 py-px text-[10px] font-bold', p.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>{p.type}</span>
              </td>
              <td className={cn(td(), 'fs-num text-slate-300')}>{p.lot_size}</td>
              <td className={cn(td(), 'fs-num text-slate-400')}>{fmt(p.open_price, p.symbol)}</td>
              <td className={cn(td(), 'fs-num text-slate-200')}>{fmt(p.current_price, p.symbol)}</td>
              <td className={cn(td(), 'fs-num text-slate-500')}>{p.stop_loss ? fmt(p.stop_loss, p.symbol) : '—'}</td>
              <td className={cn(td(), 'fs-num text-slate-500')}>{p.take_profit ? fmt(p.take_profit, p.symbol) : '—'}</td>
              <td className={cn(td(), 'fs-num font-semibold', (p.floating_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {(p.floating_pnl || 0) >= 0 ? '+' : ''}
                {formatCurrency(p.floating_pnl || 0)}
              </td>
              <td className={cn(td(), 'text-right')}>
                <button onClick={() => onClose(p.id)} className="rounded bg-rose-500/15 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25">
                  Close
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({ rows, fmt }: { rows: any[]; fmt: (v: any, s: string) => string }) {
  return (
    <div className="fs-scroll overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-800">
          <tr>
            <th className={th()}>Symbol</th><th className={th()}>Side</th><th className={th()}>Lots</th><th className={th()}>Open</th>
            <th className={th()}>Close</th><th className={th()}>Realized</th><th className={th('text-right')}>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {rows.map((p) => (
            <tr key={p.id} className="fs-row-hover">
              <td className={cn(td(), 'fs-num font-semibold text-slate-100')}>{p.symbol}</td>
              <td className={td()}>
                <span className={cn('rounded px-1.5 py-px text-[10px] font-bold', p.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>{p.type}</span>
              </td>
              <td className={cn(td(), 'fs-num text-slate-300')}>{p.lot_size}</td>
              <td className={cn(td(), 'fs-num text-slate-400')}>{fmt(p.open_price, p.symbol)}</td>
              <td className={cn(td(), 'fs-num text-slate-400')}>{p.close_price ? fmt(p.close_price, p.symbol) : '—'}</td>
              <td className={cn(td(), 'fs-num font-semibold', (p.realized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {(p.realized_pnl || 0) >= 0 ? '+' : ''}
                {formatCurrency(p.realized_pnl || 0)}
              </td>
              <td className={cn(td(), 'fs-num text-right text-xs text-slate-500')}>
                {p.closed_at ? new Date(p.closed_at).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RulesView({ account }: { account: TradingAccount }) {
  const m = fsMetrics(account);
  const r = fsRisk(account);
  const rules = [
    { label: 'Profit target', value: `${m.profitTargetPct}% (${formatCurrency(m.targetAmt)})`, tone: 'emerald' },
    { label: 'Daily drawdown', value: `${m.dailyPct}% (${formatCurrency(m.dailyLimitAmt)})`, tone: 'amber' },
    { label: 'Max drawdown', value: `${m.maxPct}% (${formatCurrency(m.maxLossAmt)})`, tone: 'rose' },
    { label: 'Min trading days', value: `${fsTradingDays(account)} / ${m.minDays || '—'}`, tone: 'indigo' },
    { label: 'Leverage', value: `1:${m.leverage}`, tone: 'slate' },
    { label: 'Profit split', value: `${m.profitSplit}%`, tone: 'slate' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
      {rules.map((rule) => (
        <div key={rule.label} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
          <p className="fs-label">{rule.label}</p>
          <p className={cn('fs-num mt-1 text-sm font-semibold', rule.tone === 'emerald' && 'text-emerald-300', rule.tone === 'amber' && 'text-amber-300', rule.tone === 'rose' && 'text-rose-300', rule.tone === 'indigo' && 'text-indigo-300', rule.tone === 'slate' && 'text-slate-200')}>
            {rule.value}
          </p>
        </div>
      ))}
    </div>
  );
}
