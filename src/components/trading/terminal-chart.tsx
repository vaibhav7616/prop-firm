import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
} from 'lightweight-charts';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { PositionEntity } from '@/server/types';

export interface MarketQuote {
  symbol: string;
  price?: number;
  bid: number;
  ask: number;
  spread?: number;
  high: number;
  low: number;
  change24h: number;
}

export interface TerminalChartProps {
  symbol: string;
  name: string;
  digits: number;
  category: string;
  quote: MarketQuote;
  positions: any[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onQuickOrder?: (type: 'BUY' | 'SELL', lotSize: number) => void;
  submittingOrder?: boolean;
}

export function TerminalChart({
  symbol,
  name,
  digits,
  category,
  quote,
  positions,
  timeframe,
  onTimeframeChange,
  onQuickOrder,
  submittingOrder,
}: TerminalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const askLineRef = useRef<IPriceLine | null>(null);
  const bidLineRef = useRef<IPriceLine | null>(null);
  const positionLinesRef = useRef<IPriceLine[]>([]);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [ohlc, setOhlc] = useState<{ open: number; high: number; low: number; close: number; volume?: number } | null>(null);
  const [quickLots, setQuickLots] = useState(0.01);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Symbol open positions
  const symbolPositions = positions.filter((p) => p.symbol === symbol && p.status === 'OPEN');

  // Load and initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create lightweight-charts instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#080d19' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: '#11192b' },
        horzLines: { color: '#11192b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.12, bottom: 0.18 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
      },
    });

    chartRef.current = chart;

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: digits,
        minMove: 1 / Math.pow(10, digits),
      },
    });
    candleSeriesRef.current = candleSeries;

    // Add Volume Series at bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#38bdf8',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Crosshair hover OHLC readout
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        if (lastCandleRef.current) {
          setOhlc({
            open: lastCandleRef.current.open,
            high: lastCandleRef.current.high,
            low: lastCandleRef.current.low,
            close: lastCandleRef.current.close,
          });
        }
      } else {
        const data = param.seriesData.get(candleSeries) as any;
        if (data) {
          setOhlc({
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: (param.seriesData.get(volumeSeries) as any)?.value,
          });
        }
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    // Initial Candles Fetch
    let isMounted = true;
    setLoading(true);

    fetch(`/api/market/candles?symbol=${symbol}&interval=${timeframe}&limit=120`)
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData && Array.isArray(resData.candles) && resData.candles.length > 0) {
          const rawCandles = resData.candles;
          const formattedCandles = rawCandles.map((c: any) => ({
            time: c.time as any,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));

          const formattedVolumes = rawCandles.map((c: any) => ({
            time: c.time as any,
            value: c.volume || 100,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
          }));

          candleSeries.setData(formattedCandles);
          volumeSeries.setData(formattedVolumes);

          const last = formattedCandles[formattedCandles.length - 1];
          lastCandleRef.current = last;
          setOhlc(last);

          chart.timeScale().fitContent();
        }
      })
      .catch((err) => {
        console.error('Error loading candles:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (askLineRef.current && candleSeriesRef.current) {
        try {
          candleSeriesRef.current.removePriceLine(askLineRef.current);
        } catch (_) {}
      }
      if (bidLineRef.current && candleSeriesRef.current) {
        try {
          candleSeriesRef.current.removePriceLine(bidLineRef.current);
        } catch (_) {}
      }
      askLineRef.current = null;
      bidLineRef.current = null;
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [symbol, timeframe, digits]);

  // Real-Time Live Update: update current candle and Ask/Bid lines when quote changes
  useEffect(() => {
    if (!candleSeriesRef.current || !quote || quote.bid <= 0 || quote.ask <= 0) return;

    // Update ASK line
    if (askLineRef.current) {
      askLineRef.current.applyOptions({
        price: quote.ask,
        title: 'ASK',
      });
    } else {
      askLineRef.current = candleSeriesRef.current.createPriceLine({
        price: quote.ask,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'ASK',
      });
    }

    // Update BID line
    if (bidLineRef.current) {
      bidLineRef.current.applyOptions({
        price: quote.bid,
        title: 'BID',
      });
    } else {
      bidLineRef.current = candleSeriesRef.current.createPriceLine({
        price: quote.bid,
        color: '#f43f5e',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'BID',
      });
    }

    // Update the live candle on screen
    const last = lastCandleRef.current;
    if (last) {
      const currentPrice = quote.price || (quote.bid + quote.ask) / 2;
      const updatedCandle = {
        time: last.time as any,
        open: last.open,
        high: Math.max(last.high, currentPrice),
        low: Math.min(last.low, currentPrice),
        close: currentPrice,
      };
      candleSeriesRef.current.update(updatedCandle);
      lastCandleRef.current = updatedCandle;
      setOhlc(updatedCandle);
    }
  }, [quote, digits]);

  // Synchronize Open Position Lines on Chart
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove old position lines
    positionLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch (_) {}
    });
    positionLinesRef.current = [];

    // Render each open position on this symbol
    symbolPositions.forEach((pos) => {
      if (!candleSeriesRef.current) return;
      const openPrice = typeof pos.open_price === 'number' ? pos.open_price : typeof pos.entry_price === 'number' ? pos.entry_price : null;
      if (openPrice === null || isNaN(openPrice)) return;

      const side = pos.type || pos.side || 'BUY';
      const isBuy = side === 'BUY';
      const color = isBuy ? '#38bdf8' : '#f59e0b';
      const lotSize = typeof pos.lot_size === 'number' ? pos.lot_size : typeof pos.lots === 'number' ? pos.lots : 0.01;

      const entryLine = candleSeriesRef.current.createPriceLine({
        price: openPrice,
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${side} ${lotSize}L @ ${openPrice.toFixed(digits)}`,
      });
      positionLinesRef.current.push(entryLine);

      // Stop Loss line
      if (typeof pos.stop_loss === 'number' && pos.stop_loss > 0) {
        const slLine = candleSeriesRef.current.createPriceLine({
          price: pos.stop_loss,
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `SL #${pos.ticket || (pos.id ? pos.id.slice(-4) : '')}`,
        });
        positionLinesRef.current.push(slLine);
      }

      // Take Profit line
      if (typeof pos.take_profit === 'number' && pos.take_profit > 0) {
        const tpLine = candleSeriesRef.current.createPriceLine({
          price: pos.take_profit,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP #${pos.ticket || (pos.id ? pos.id.slice(-4) : '')}`,
        });
        positionLinesRef.current.push(tpLine);
      }
    });
  }, [symbolPositions, digits]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const safeFormat = useCallback(
    (val: number | undefined | null, d: number = digits) => {
      if (typeof val !== 'number' || isNaN(val)) return '---';
      return val.toFixed(d);
    },
    [digits]
  );

  const TIMEFRAMES = [
    { label: '1m', val: '1m' },
    { label: '5m', val: '5m' },
    { label: '15m', val: '15m' },
    { label: '1H', val: '1h' },
    { label: '4H', val: '4h' },
    { label: '1D', val: '1d' },
  ];

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#080d19] border border-slate-800/80 rounded-2xl overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Chart Ribbon Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0b1222] border-b border-slate-800 text-xs select-none gap-2">
        {/* Symbol Details & Real-Time Bid/Ask Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base font-display">{symbol}</span>
            <span className="text-slate-400 text-xs hidden sm:inline">{name}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {category}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Real-time Bid & Ask Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
              <span className="text-[10px] font-bold text-rose-400">BID</span>
              <span className="font-mono font-bold text-rose-300">
                {safeFormat(quote?.bid)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <span className="text-[10px] font-bold text-emerald-400">ASK</span>
              <span className="font-mono font-bold text-emerald-300">
                {safeFormat(quote?.ask)}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
              <span>Spread:</span>
              <span className="font-mono font-semibold text-amber-400">
                {typeof quote?.spread === 'number' ? quote.spread.toFixed(1) : (quote?.spread || '0.0')} pips
              </span>
            </div>
          </div>
        </div>

        {/* OHLC Readout */}
        {ohlc && (
          <div className="hidden xl:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>
              O: <strong className="text-white">{safeFormat(ohlc.open)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">{safeFormat(ohlc.high)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">{safeFormat(ohlc.low)}</strong>
            </span>
            <span>
              C:{' '}
              <strong className={ohlc.close >= ohlc.open ? 'text-emerald-400' : 'text-rose-400'}>
                {safeFormat(ohlc.close)}
              </strong>
            </span>
          </div>
        )}

        {/* Timeframes & One-Click Desk Controls */}
        <div className="flex items-center gap-2">
          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.val}
                onClick={() => onTimeframeChange(tf.val)}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                  timeframe === tf.val
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Quick One-Click Buttons in Ribbon */}
          {onQuickOrder && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              <button
                disabled={submittingOrder}
                onClick={() => onQuickOrder('SELL', quickLots)}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono transition-transform active:scale-95 flex items-center gap-1"
              >
                <span>SELL</span>
                <span className="text-[10px] opacity-80">{safeFormat(quote?.bid)}</span>
              </button>

              <div className="flex items-center px-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={quickLots}
                  onChange={(e) => setQuickLots(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-12 bg-slate-950 border border-slate-700 text-center text-xs font-mono font-bold text-white rounded py-0.5 focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                disabled={submittingOrder}
                onClick={() => onQuickOrder('BUY', quickLots)}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono transition-transform active:scale-95 flex items-center gap-1"
              >
                <span>BUY</span>
                <span className="text-[10px] opacity-80">{safeFormat(quote?.ask)}</span>
              </button>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 w-full min-h-[360px] overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#080d19]/90 backdrop-blur-xs">
            <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mb-2" />
            <span className="text-xs text-slate-400">Loading {symbol} Live Exchange Stream...</span>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Real-Time Live Feed Legend Overlay */}
        <div className="absolute bottom-2 left-3 z-10 flex flex-wrap items-center gap-3 bg-slate-950/85 backdrop-blur-xs border border-slate-800/90 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 pointer-events-none shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50" />
            <span className="font-bold text-slate-200">
              {symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL')
                ? 'Binance Real-Time Exchange Stream (Sec-by-Sec)'
                : 'TradingView Real-Time ECN Exchange Stream'}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-emerald-400 rounded-full" />
            <span className="text-emerald-400 font-semibold">ASK Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-rose-500 rounded-full" />
            <span className="text-rose-400 font-semibold">BID Line</span>
          </div>
          {symbolPositions.length > 0 && (
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="inline-block w-3 h-0.5 bg-cyan-400 rounded-full" />
              <span>{symbolPositions.length} Active Position{symbolPositions.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
