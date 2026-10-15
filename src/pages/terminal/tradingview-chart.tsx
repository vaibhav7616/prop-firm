import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketQuote } from '@/server/types';

interface TradingViewChartProps {
  symbol: string;
  activeQuote?: MarketQuote;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
  height?: number | string;
}

const TIMEFRAMES = [
  { label: '1m', value: '1', display: '1m' },
  { label: '5m', value: '5', display: '5m' },
  { label: '15m', value: '15', display: '15m' },
  { label: '1H', value: '60', display: '1H' },
  { label: '4H', value: '240', display: '4H' },
  { label: '1D', value: 'D', display: '1D' },
];

// Institutional OANDA Forex mappings for TradingView
const FOREX_TV_SYMBOLS: Record<string, string> = {
  EURUSD: 'OANDA:EURUSD',
  GBPUSD: 'OANDA:GBPUSD',
  USDJPY: 'OANDA:USDJPY',
  AUDUSD: 'OANDA:AUDUSD',
  USDCAD: 'OANDA:USDCAD',
  USDCHF: 'OANDA:USDCHF',
  NZDUSD: 'OANDA:NZDUSD',
  EURGBP: 'OANDA:EURGBP',
  EURJPY: 'OANDA:EURJPY',
  GBPJPY: 'OANDA:GBPJPY',
  EURAUD: 'OANDA:EURAUD',
  EURCAD: 'OANDA:EURCAD',
  EURCHF: 'OANDA:EURCHF',
  GBPAUD: 'OANDA:GBPAUD',
  GBPCAD: 'OANDA:GBPCAD',
  GBPCHF: 'OANDA:GBPCHF',
  AUDCAD: 'OANDA:AUDCAD',
  AUDJPY: 'OANDA:AUDJPY',
  CADJPY: 'OANDA:CADJPY',
  CHFJPY: 'OANDA:CHFJPY',
  NZDJPY: 'OANDA:NZDJPY',
};

const SYMBOL_NAMES: Record<string, string> = {
  EURUSD: 'Euro / US Dollar',
  GBPUSD: 'British Pound / US Dollar',
  USDJPY: 'US Dollar / Japanese Yen',
  AUDUSD: 'Australian Dollar / USD',
  USDCAD: 'US Dollar / Canadian Dollar',
  USDCHF: 'US Dollar / Swiss Franc',
  NZDUSD: 'New Zealand Dollar / USD',
  EURGBP: 'Euro / British Pound',
  EURJPY: 'Euro / Japanese Yen',
  GBPJPY: 'British Pound / Yen',
  EURAUD: 'Euro / Australian Dollar',
  EURCAD: 'Euro / Canadian Dollar',
  EURCHF: 'Euro / Swiss Franc',
  GBPAUD: 'British Pound / AUD',
  GBPCAD: 'British Pound / CAD',
  GBPCHF: 'British Pound / CHF',
  AUDCAD: 'Australian Dollar / CAD',
  AUDJPY: 'Australian Dollar / Yen',
  CADJPY: 'Canadian Dollar / Yen',
  CHFJPY: 'Swiss Franc / Yen',
  NZDJPY: 'New Zealand Dollar / Yen',
};

export function TradingViewChart({
  symbol,
  activeQuote,
  timeframe = '15',
  onTimeframeChange,
  className,
  height = '100%',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize interval for TradingView
  const currentInterval = useMemo(() => {
    const tf = (timeframe || '15').toLowerCase().trim();
    if (tf === '1m' || tf === '1') return '1';
    if (tf === '5m' || tf === '5') return '5';
    if (tf === '15m' || tf === '15') return '15';
    if (tf === '1h' || tf === '60') return '60';
    if (tf === '4h' || tf === '240') return '240';
    if (tf === '1d' || tf === 'd') return 'D';
    return '15';
  }, [timeframe]);

  // Clean symbol and resolve OANDA TradingView feed
  const cleanSymbol = useMemo(() => {
    return symbol.replace(/[^A-Z]/gi, '').toUpperCase() || 'EURUSD';
  }, [symbol]);

  const tvSymbol = useMemo(() => {
    return FOREX_TV_SYMBOLS[cleanSymbol] || `OANDA:${cleanSymbol}`;
  }, [cleanSymbol]);

  const symbolName = SYMBOL_NAMES[cleanSymbol] || `${cleanSymbol} Forex Pair`;

  // Construct official TradingView iframe embed URL
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      frameElementId: 'tradingview_widget',
      symbol: tvSymbol,
      interval: currentInterval,
      hidesidetoolbar: '0',
      symboledit: '1',
      saveimage: '1',
      toolbarbg: '070d18',
      theme: 'dark',
      style: '1', // Candlesticks
      timezone: 'Etc/UTC',
      studies: '[]',
      hideideas: '1',
      locale: 'en',
    });

    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [tvSymbol, currentInterval, chartKey]);

  // Handle iframe reload
  const handleReload = () => {
    setIsLoading(true);
    setChartKey((prev) => prev + 1);
  };

  // Reset loading state on symbol or interval switch
  useEffect(() => {
    setIsLoading(true);
  }, [tvSymbol, currentInterval]);

  const isJpy = cleanSymbol.endsWith('JPY');
  const pricePrecision = isJpy ? 3 : 5;

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full h-full flex flex-col bg-slate-950 overflow-hidden relative select-none',
        isFullscreen && 'fixed inset-0 z-50 rounded-none h-screen w-screen bg-slate-950',
        className
      )}
      style={{ height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height }}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs shrink-0 z-10">
        {/* Left: Active Forex Pair + Live Institutional Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 font-mono">
            <span className="font-bold text-white tracking-wide">{cleanSymbol}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">· {symbolName}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>TradingView Live Forex Feed</span>
          </div>

          {/* Timeframe Switcher Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => onTimeframeChange?.(tf.value)}
                className={cn(
                  'px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer',
                  currentInterval === tf.value
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
                title={`Switch timeframe to ${tf.display}`}
              >
                {tf.display}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Quote HUD, Reload, and Fullscreen */}
        <div className="flex items-center gap-2">
          {activeQuote && activeQuote.bid > 0 && (
            <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">BID</span>
                <span className="text-rose-400 font-bold">
                  {Number(activeQuote.bid).toFixed(pricePrecision)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">ASK</span>
                <span className="text-emerald-400 font-bold">
                  {Number(activeQuote.ask).toFixed(pricePrecision)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 border-l border-slate-800 pl-2">
                <span>Spread: </span>
                <span className="text-brand-400 font-bold">
                  {activeQuote.spread || '0.2'} pips
                </span>
              </div>
            </div>
          )}

          {/* Refresh iframe feed button */}
          <button
            type="button"
            onClick={handleReload}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-700/70 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Live Chart Stream"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-brand-400')} />
          </button>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-700/70 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen TradingView Chart'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Main TradingView Chart Container */}
      <div className="flex-1 w-full h-full relative bg-slate-950 min-h-0">
        {/* Subtle loading overlay until iframe renders */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 z-20 pointer-events-none transition-opacity duration-300">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-200">
                Loading TradingView Real-Time Chart
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Connecting to {tvSymbol} feed ({currentInterval}m interval)...
              </p>
            </div>
          </div>
        )}

        <iframe
          key={`${tvSymbol}-${currentInterval}-${chartKey}`}
          title={`TradingView Chart - ${tvSymbol}`}
          src={iframeSrc}
          className="w-full h-full border-0 absolute inset-0 bg-slate-950"
          allow="clipboard-write; fullscreen"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* 3. Subtle Bottom Status Strip */}
      <div className="px-3 py-1 bg-slate-900/90 border-t border-slate-800/70 text-[10px] font-mono text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            LIVE MARKET
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-slate-400">Timezone: UTC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Forex ECN Feed</span>
          <span className="text-brand-400 font-semibold">{cleanSymbol}</span>
        </div>
      </div>
    </div>
  );
}
