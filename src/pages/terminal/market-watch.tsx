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

  // Detect price ticks to show micro-flashes
  useEffect(() => {
    const nextPrev = { ...prevPrices };
    const nextFlash: Record<string, 'up' | 'down'> = {};
    let hasChanges = false;

    quotes.forEach((q) => {
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
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
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
