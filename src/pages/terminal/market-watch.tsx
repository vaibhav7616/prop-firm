import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Clock, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketQuote } from '@/server/types';

export interface MarketWatchProps {
  quotes: MarketQuote[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  className?: string;
}

const SYMBOL_METADATA: Record<string, { name: string; category: 'MAJORS' | 'CROSSES' | 'MINORS'; pipDivisor: number }> = {
  EURUSD: { name: 'Euro / US Dollar', category: 'MAJORS', pipDivisor: 0.0001 },
  GBPUSD: { name: 'British Pound / US Dollar', category: 'MAJORS', pipDivisor: 0.0001 },
  USDJPY: { name: 'US Dollar / Japanese Yen', category: 'MAJORS', pipDivisor: 0.01 },
  AUDUSD: { name: 'Australian Dollar / USD', category: 'MAJORS', pipDivisor: 0.0001 },
  USDCAD: { name: 'US Dollar / Canadian Dollar', category: 'MAJORS', pipDivisor: 0.0001 },
  USDCHF: { name: 'US Dollar / Swiss Franc', category: 'MAJORS', pipDivisor: 0.0001 },
  NZDUSD: { name: 'New Zealand Dollar / USD', category: 'MAJORS', pipDivisor: 0.0001 },
  EURGBP: { name: 'Euro / British Pound', category: 'CROSSES', pipDivisor: 0.0001 },
  EURJPY: { name: 'Euro / Japanese Yen', category: 'CROSSES', pipDivisor: 0.01 },
  GBPJPY: { name: 'British Pound / Yen', category: 'CROSSES', pipDivisor: 0.01 },
  EURAUD: { name: 'Euro / Australian Dollar', category: 'CROSSES', pipDivisor: 0.0001 },
  EURCAD: { name: 'Euro / Canadian Dollar', category: 'CROSSES', pipDivisor: 0.0001 },
  EURCHF: { name: 'Euro / Swiss Franc', category: 'CROSSES', pipDivisor: 0.0001 },
  GBPAUD: { name: 'British Pound / AUD', category: 'CROSSES', pipDivisor: 0.0001 },
  GBPCAD: { name: 'British Pound / CAD', category: 'CROSSES', pipDivisor: 0.0001 },
  GBPCHF: { name: 'British Pound / CHF', category: 'CROSSES', pipDivisor: 0.0001 },
  AUDCAD: { name: 'Australian Dollar / CAD', category: 'MINORS', pipDivisor: 0.0001 },
  AUDJPY: { name: 'Australian Dollar / Yen', category: 'MINORS', pipDivisor: 0.01 },
  CADJPY: { name: 'Canadian Dollar / Yen', category: 'MINORS', pipDivisor: 0.01 },
  CHFJPY: { name: 'Swiss Franc / Yen', category: 'MINORS', pipDivisor: 0.01 },
  NZDJPY: { name: 'New Zealand Dollar / Yen', category: 'MINORS', pipDivisor: 0.01 },
};

type CategoryFilter = 'ALL' | 'MAJORS' | 'CROSSES' | 'MINORS';

const DEFAULT_FOREX_QUOTES: MarketQuote[] = [
  { symbol: 'EURUSD', price: 1.16730, bid: 1.16720, ask: 1.16740, high: 1.1710, low: 1.1640, change24h: 0.18, spread: 0.2, isMarketOpen: true, timestamp: '' },
  { symbol: 'GBPUSD', price: 1.36290, bid: 1.36270, ask: 1.36310, high: 1.3680, low: 1.3590, change24h: 0.25, spread: 0.4, isMarketOpen: true, timestamp: '' },
  { symbol: 'USDJPY', price: 158.960, bid: 158.945, ask: 158.975, high: 159.40, low: 158.50, change24h: -0.12, spread: 0.3, isMarketOpen: true, timestamp: '' },
  { symbol: 'AUDUSD', price: 0.71140, bid: 0.71120, ask: 0.71160, high: 0.7150, low: 0.7080, change24h: 0.32, spread: 0.4, isMarketOpen: true, timestamp: '' },
  { symbol: 'USDCAD', price: 1.37890, bid: 1.37870, ask: 1.37910, high: 1.3820, low: 1.3750, change24h: -0.08, spread: 0.4, isMarketOpen: true, timestamp: '' },
  { symbol: 'USDCHF', price: 0.80050, bid: 0.80030, ask: 0.80070, high: 0.8040, low: 0.7980, change24h: -0.15, spread: 0.4, isMarketOpen: true, timestamp: '' },
  { symbol: 'NZDUSD', price: 0.59400, bid: 0.59375, ask: 0.59425, high: 0.5980, low: 0.5910, change24h: 0.22, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'EURGBP', price: 0.85640, bid: 0.85615, ask: 0.85665, high: 0.8590, low: 0.8540, change24h: -0.06, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'EURJPY', price: 185.560, bid: 185.540, ask: 185.580, high: 186.10, low: 185.10, change24h: 0.15, spread: 0.4, isMarketOpen: true, timestamp: '' },
  { symbol: 'GBPJPY', price: 216.660, bid: 216.635, ask: 216.685, high: 217.30, low: 216.00, change24h: 0.28, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'EURAUD', price: 1.64050, bid: 1.64020, ask: 1.64080, high: 1.6460, low: 1.6370, change24h: -0.14, spread: 0.6, isMarketOpen: true, timestamp: '' },
  { symbol: 'EURCAD', price: 1.60950, bid: 1.60925, ask: 1.60975, high: 1.6140, low: 1.6050, change24h: 0.09, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'EURCHF', price: 0.93450, bid: 0.93425, ask: 0.93475, high: 0.9380, low: 0.9310, change24h: 0.04, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'GBPAUD', price: 1.91550, bid: 1.91515, ask: 1.91585, high: 1.9220, low: 1.9100, change24h: 0.11, spread: 0.7, isMarketOpen: true, timestamp: '' },
  { symbol: 'GBPCAD', price: 1.87900, bid: 1.87870, ask: 1.87930, high: 1.8840, low: 1.8740, change24h: 0.18, spread: 0.6, isMarketOpen: true, timestamp: '' },
  { symbol: 'GBPCHF', price: 1.09100, bid: 1.09070, ask: 1.09130, high: 1.0960, low: 1.0870, change24h: 0.10, spread: 0.6, isMarketOpen: true, timestamp: '' },
  { symbol: 'AUDCAD', price: 0.98100, bid: 0.98075, ask: 0.98125, high: 0.9850, low: 0.9780, change24h: 0.05, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'AUDJPY', price: 113.100, bid: 113.075, ask: 113.125, high: 113.60, low: 112.70, change24h: 0.19, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'CADJPY', price: 115.280, bid: 115.255, ask: 115.305, high: 115.80, low: 114.90, change24h: 0.21, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'CHFJPY', price: 198.580, bid: 198.555, ask: 198.605, high: 199.20, low: 198.10, change24h: 0.26, spread: 0.5, isMarketOpen: true, timestamp: '' },
  { symbol: 'NZDJPY', price: 94.420, bid: 94.390, ask: 94.450, high: 94.90, low: 94.00, change24h: 0.12, spread: 0.6, isMarketOpen: true, timestamp: '' },
];

export function MarketWatch({
  quotes,
  selectedSymbol,
  onSelectSymbol,
  className,
}: MarketWatchProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [tickFlash, setTickFlash] = useState<Record<string, 'up' | 'down'>>({});

  // Merge incoming quotes with base quotes
  const mergedQuotes = useMemo(() => {
    const map = new Map<string, MarketQuote>();
    DEFAULT_FOREX_QUOTES.forEach((q) => map.set(q.symbol, q));
    quotes.forEach((q) => {
      if (SYMBOL_METADATA[q.symbol]) {
        map.set(q.symbol, q);
      }
    });
    return Array.from(map.values());
  }, [quotes]);

  // Detect price ticks to show micro-flashes
  useEffect(() => {
    const nextPrev = { ...prevPrices };
    const nextFlash: Record<string, 'up' | 'down'> = {};
    let hasChanges = false;

    mergedQuotes.forEach((q) => {
      const old = prevPrices[q.symbol];
      if (old !== undefined && old !== q.bid) {
        nextFlash[q.symbol] = q.bid > old ? 'up' : 'down';
        hasChanges = true;
      }
      nextPrev[q.symbol] = q.bid;
    });

    if (hasChanges) {
      setTickFlash(nextFlash);
      setPrevPrices(nextPrev);
      const timer = setTimeout(() => {
        setTickFlash({});
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mergedQuotes]);

  const filteredQuotes = useMemo(() => {
    return mergedQuotes.filter((q) => {
      const meta = SYMBOL_METADATA[q.symbol];
      if (!meta) return false; // Exclude commodities/crypto/indices - Pure Forex prop firm pairs only

      if (category !== 'ALL' && meta.category !== category) {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const symbolMatch = q.symbol.toLowerCase().includes(query);
        const nameMatch = meta.name.toLowerCase().includes(query);
        return symbolMatch || nameMatch;
      }

      return true;
    });
  }, [quotes, category, search]);

  const formatPrice = (symbol: string, price: number) => {
    if (symbol.toUpperCase().endsWith('JPY')) {
      return Number(price || 0).toFixed(3);
    }
    return Number(price || 0).toFixed(5);
  };

  const calculateSpreadPips = (symbol: string, bid: number, ask: number) => {
    const meta = SYMBOL_METADATA[symbol];
    const divisor = meta ? meta.pipDivisor : 0.0001;
    const diff = ask - bid;
    return (diff / divisor).toFixed(1);
  };

  return (
    <div className={cn('flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 select-none', className)}>
      {/* Header & Title */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Market Watch</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
          {filteredQuotes.length} Feeds
        </span>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search forex pairs (e.g. EUR, JPY)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500/70 focus:outline-none rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Forex Asset Class Filter Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/30 overflow-x-auto scrollbar-none px-1.5 py-1.5 gap-1">
        {(['ALL', 'MAJORS', 'CROSSES', 'MINORS'] as CategoryFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setCategory(tab)}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap',
              category === tab
                ? 'bg-brand-500/20 text-brand-400 font-bold border border-brand-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            {tab === 'ALL' ? 'ALL FOREX' : tab}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800/70 bg-slate-950/60 tracking-wider">
        <span className="col-span-5">Pair</span>
        <span className="col-span-3 text-right">Bid</span>
        <span className="col-span-4 text-right">Ask / Chg</span>
      </div>

      {/* Instrument List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 text-xs">
        {filteredQuotes.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No forex pairs found matching <span className="text-slate-300 font-mono">"{search}"</span>
          </div>
        ) : (
          filteredQuotes.map((q) => {
            const isSelected = q.symbol === selectedSymbol;
            const meta = SYMBOL_METADATA[q.symbol] || { name: q.symbol, category: 'MAJORS', pipDivisor: 0.0001 };
            const flash = tickFlash[q.symbol];
            const spreadPips = calculateSpreadPips(q.symbol, q.bid, q.ask);
            const isPositive = (q.change24h || 0) >= 0;

            return (
              <div
                key={q.symbol}
                onClick={() => onSelectSymbol(q.symbol)}
                className={cn(
                  'grid grid-cols-12 px-3 py-2 cursor-pointer transition-colors items-center select-none group',
                  isSelected
                    ? 'bg-brand-500/15 border-l-2 border-brand-500 text-white'
                    : 'hover:bg-slate-800/60 text-slate-200',
                  flash === 'up' && 'bg-emerald-950/40',
                  flash === 'down' && 'bg-rose-950/40'
                )}
              >
                {/* Symbol and Name */}
                <div className="col-span-5 pr-1 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('font-bold tracking-tight', isSelected ? 'text-brand-400' : 'text-slate-100')}>
                      {q.symbol}
                    </span>
                    {q.isMarketOpen === false && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900/60 text-rose-300 font-mono" title="Market Closed">
                        CLOSED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[110px]" title={meta.name}>
                    {meta.name}
                  </span>
                </div>

                {/* Bid Price */}
                <div className="col-span-3 text-right font-mono font-medium">
                  <span
                    className={cn(
                      'transition-colors duration-200',
                      flash === 'up' && 'text-emerald-400 font-bold',
                      flash === 'down' && 'text-rose-400 font-bold',
                      !flash && 'text-slate-200'
                    )}
                  >
                    {formatPrice(q.symbol, q.bid)}
                  </span>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Sprd: <span className="font-mono text-slate-300">{spreadPips}p</span>
                  </div>
                </div>

                {/* Ask Price and 24h Change */}
                <div className="col-span-4 text-right font-mono font-medium flex flex-col items-end">
                  <span
                    className={cn(
                      'transition-colors duration-200',
                      flash === 'up' && 'text-emerald-400 font-bold',
                      flash === 'down' && 'text-rose-400 font-bold',
                      !flash && 'text-slate-200'
                    )}
                  >
                    {formatPrice(q.symbol, q.ask)}
                  </span>
                  <div className="flex items-center gap-0.5 text-[10px]">
                    {isPositive ? (
                      <span className="text-emerald-400 flex items-center">
                        +{q.change24h?.toFixed(2) || '0.00'}%
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center">
                        {q.change24h?.toFixed(2) || '0.00'}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
          <span>FundedShift Raw ECN Spread</span>
        </div>
        <span className="font-mono text-[9px] text-slate-400">0.0 Pips Min</span>
      </div>
    </div>
  );
}
