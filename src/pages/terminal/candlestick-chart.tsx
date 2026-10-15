import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  BarChart2,
  TrendingUp,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchTerminalCandlesApi } from '@/lib/api-client';

export interface Candle {
  time: number; // unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  symbol: string;
  activeQuote?: {
    symbol: string;
    price: number;
    bid: number;
    ask: number;
    high: number;
    low: number;
    change24h: number;
    spread?: number;
    isMarketOpen?: boolean;
  };
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  className?: string;
  height?: number | string;
}

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
];

export function CandlestickChart({
  symbol,
  activeQuote,
  timeframe,
  onTimeframeChange,
  className,
  height = 520,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'CANDLE' | 'LINE'>('CANDLE');
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [crosshair, setCrosshair] = useState<{
    x: number;
    y: number;
    price: number;
    candle: Candle | null;
  } | null>(null);

  // Load authoritative candles from backend on symbol/timeframe change
  const loadCandles = useCallback(async () => {
    setLoading(true);
    const data = await fetchTerminalCandlesApi(symbol, timeframe, 70);
    if (data && Array.isArray(data.candles) && data.candles.length > 0) {
      setCandles(data.candles);
    }
    setLoading(false);
  }, [symbol, timeframe]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  // Synchronize latest candle in real-time on price ticks
  useEffect(() => {
    if (!activeQuote || !activeQuote.price || candles.length === 0) return;

    setCandles((prevCandles) => {
      if (prevCandles.length === 0) return prevCandles;
      const updated = [...prevCandles];
      const last = { ...updated[updated.length - 1] };
      const currentPrice = activeQuote.price;

      last.close = currentPrice;
      if (currentPrice > last.high) last.high = currentPrice;
      if (currentPrice < last.low) last.low = currentPrice;
      last.volume += 1;

      updated[updated.length - 1] = last;
      return updated;
    });
  }, [activeQuote?.price]);

  // Render Canvas Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const heightVal = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = heightVal * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${heightVal}px`;

    ctx.scale(dpr, dpr);

    // Styling constants
    const paddingRight = 68; // Price axis width
    const paddingBottom = 26; // Time axis height
    const paddingTop = 28;
    const paddingLeft = 10;
    const chartW = width - paddingRight - paddingLeft;
    const chartH = heightVal - paddingBottom - paddingTop;

    // Clear background
    ctx.clearRect(0, 0, width, heightVal);

    // Calculate Min & Max price bounds
    let minPrice = Math.min(...candles.map((c) => c.low));
    let maxPrice = Math.max(...candles.map((c) => c.high));

    if (activeQuote && activeQuote.ask > maxPrice) maxPrice = activeQuote.ask;
    if (activeQuote && activeQuote.bid < minPrice) minPrice = activeQuote.bid;

    const priceBuffer = (maxPrice - minPrice) * 0.08 || 0.01;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice;

    const priceToY = (price: number) => {
      return paddingTop + chartH - ((price - minPrice) / priceRange) * chartH;
    };

    const yToPrice = (y: number) => {
      return maxPrice - ((y - paddingTop) / chartH) * priceRange;
    };

    // 1. Draw Grid Lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal Price Grids (5 levels)
    const gridCount = 5;
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridCount; i++) {
      const p = minPrice + (priceRange / gridCount) * i;
      const y = priceToY(p);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Right margin price label
      ctx.fillText(p.toFixed(activeQuote?.price && activeQuote.price > 500 ? 2 : 5), width - paddingRight + 6, y + 3);
    }

    // 2. Candlestick Bars & Volume
    const candleCount = candles.length;
    const candleSlotW = chartW / candleCount;
    const candleBodyW = Math.max(2, Math.min(18, candleSlotW * 0.72));

    // Volume histogram maximum
    const maxVolume = Math.max(...candles.map((c) => c.volume)) || 100;
    const volumeHeightMax = chartH * 0.22;

    candles.forEach((c, idx) => {
      const x = paddingLeft + (idx + 0.5) * candleSlotW;
      const isBull = c.close >= c.open;
      const color = isBull ? '#10B981' : '#F43F5E';

      // Draw Volume Bar at bottom
      const vHeight = (c.volume / maxVolume) * volumeHeightMax;
      const vY = paddingTop + chartH - vHeight;
      ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.16)';
      ctx.fillRect(x - candleBodyW / 2, vY, candleBodyW, vHeight);

      if (chartType === 'CANDLE') {
        // High-Low Wick line
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, priceToY(c.high));
        ctx.lineTo(x, priceToY(c.low));
        ctx.stroke();

        // Open-Close Body
        const yOpen = priceToY(c.open);
        const yClose = priceToY(c.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

        ctx.fillStyle = color;
        ctx.fillRect(x - candleBodyW / 2, bodyTop, candleBodyW, bodyHeight);
      }
    });

    // 3. Line Chart Mode (If active)
    if (chartType === 'LINE') {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();

      candles.forEach((c, idx) => {
        const x = paddingLeft + (idx + 0.5) * candleSlotW;
        const y = priceToY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Subtle gradient fill under line
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartH);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.fillStyle = gradient;
      ctx.lineTo(paddingLeft + (candles.length - 0.5) * candleSlotW, paddingTop + chartH);
      ctx.lineTo(paddingLeft + 0.5 * candleSlotW, paddingTop + chartH);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Moving Average Overlays (SMA 20 & SMA 50)
    if (showIndicators && candles.length >= 20) {
      // SMA 20 (Amber)
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 19; i < candles.length; i++) {
        const slice = candles.slice(i - 19, i + 1);
        const sum = slice.reduce((acc, cur) => acc + cur.close, 0);
        const sma = sum / 20;
        const x = paddingLeft + (i + 0.5) * candleSlotW;
        const y = priceToY(sma);
        if (i === 19) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // SMA 50 (Purple)
      if (candles.length >= 50) {
        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 49; i < candles.length; i++) {
          const slice = candles.slice(i - 49, i + 1);
          const sum = slice.reduce((acc, cur) => acc + cur.close, 0);
          const sma = sum / 50;
          const x = paddingLeft + (i + 0.5) * candleSlotW;
          const y = priceToY(sma);
          if (i === 49) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // 5. Live Execution Horizontal Lines (Ask / Bid)
    if (activeQuote && activeQuote.bid > 0 && activeQuote.ask > 0) {
      // ASK line (Buy Execution - Emerald)
      const askY = priceToY(activeQuote.ask);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, askY);
      ctx.lineTo(width - paddingRight, askY);
      ctx.stroke();

      // ASK Tag Badge
      ctx.setLineDash([]);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(width - paddingRight + 2, askY - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activeQuote.ask.toFixed(activeQuote.price > 500 ? 2 : 5), width - paddingRight / 2, askY + 3);

      // BID line (Sell Execution - Rose)
      const bidY = priceToY(activeQuote.bid);
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, bidY);
      ctx.lineTo(width - paddingRight, bidY);
      ctx.stroke();

      // BID Tag Badge
      ctx.setLineDash([]);
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(width - paddingRight + 2, bidY - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activeQuote.bid.toFixed(activeQuote.price > 500 ? 2 : 5), width - paddingRight / 2, bidY + 3);
    }

    // 6. Interactive Crosshair Lines
    if (crosshair) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical
      ctx.beginPath();
      ctx.moveTo(crosshair.x, paddingTop);
      ctx.lineTo(crosshair.x, heightVal - paddingBottom);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(paddingLeft, crosshair.y);
      ctx.lineTo(width - paddingRight, crosshair.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Crosshair Price tag
      const crossPrice = yToPrice(crosshair.y);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(width - paddingRight + 2, crosshair.y - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(crossPrice.toFixed(activeQuote?.price && activeQuote.price > 500 ? 2 : 5), width - paddingRight / 2, crosshair.y + 4);
    }

    // Time Axis Labels (Bottom)
    ctx.fillStyle = '#64748B';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.max(1, Math.floor(candleCount / 6));

    for (let i = 0; i < candleCount; i += timeStep) {
      const c = candles[i];
      const x = paddingLeft + (i + 0.5) * candleSlotW;
      const d = new Date(c.time * 1000);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, x, heightVal - 8);
    }
  }, [candles, activeQuote, chartType, showIndicators, crosshair]);

  // Handle Mouse Move for Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || candles.length === 0) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingRight = 68;
    const paddingLeft = 10;
    const chartW = rect.width - paddingRight - paddingLeft;
    const candleSlotW = chartW / candles.length;

    const idx = Math.floor((x - paddingLeft) / candleSlotW);
    const validIdx = Math.max(0, Math.min(candles.length - 1, idx));
    const activeCandle = candles[validIdx] || null;

    setCrosshair({
      x,
      y,
      price: 0,
      candle: activeCandle,
    });
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full bg-card border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden relative shadow-sm flex flex-col select-none',
        isFullscreen && 'fixed inset-0 z-50 rounded-none h-screen bg-background',
        className
      )}
      style={{ height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Chart Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-secondary/40 dark:bg-slate-900/50 border-b border-border/80 text-xs shrink-0">
        {/* Left: Timeframe Switcher & Active Symbol Details */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-background/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-border/60">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => onTimeframeChange(tf.value)}
                className={cn(
                  'px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all',
                  timeframe === tf.value
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 font-mono text-[11px]">
            <span className="font-bold text-foreground">{symbol}</span>
            <span className="text-[10px] text-muted-foreground">· Institutional ECN</span>
          </div>

          {activeQuote && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono pl-2 border-l border-border/60">
              <span className="text-muted-foreground">Spread:</span>
              <span className="font-bold text-foreground">
                {activeQuote.spread ? `${activeQuote.spread} pips` : '0.2 pips'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Technical Toggles & Indicators */}
        <div className="flex items-center gap-1.5">
          {/* Candle vs Line Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-background/80 dark:bg-slate-800/80 border border-border/60 text-[11px]">
            <button
              type="button"
              onClick={() => setChartType('CANDLE')}
              className={cn(
                'px-2 py-0.5 rounded-md font-medium transition-all',
                chartType === 'CANDLE' ? 'bg-brand-500 text-white font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Candles
            </button>
            <button
              type="button"
              onClick={() => setChartType('LINE')}
              className={cn(
                'px-2 py-0.5 rounded-md font-medium transition-all',
                chartType === 'LINE' ? 'bg-brand-500 text-white font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Line
            </button>
          </div>

          {/* Indicator Toggle */}
          <button
            type="button"
            onClick={() => setShowIndicators(!showIndicators)}
            className={cn(
              'px-2 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1',
              showIndicators
                ? 'bg-brand-500/10 border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-border/60 bg-background/80 text-muted-foreground hover:text-foreground'
            )}
            title="Toggle Moving Average Indicators"
          >
            <Activity className="h-3 w-3" />
            <span className="hidden sm:inline">SMA 20/50</span>
          </button>

          {/* Reload Chart Feed */}
          <button
            type="button"
            onClick={loadCandles}
            className="p-1 rounded-lg border border-border/60 bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Refresh Historical Candles"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded-lg border border-border/60 bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Chart'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Crosshair / Active Bar Info Banner */}
      <div className="px-3 py-1 bg-background/90 border-b border-border/40 text-[10px] font-mono text-muted-foreground flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {crosshair?.candle ? (
            <>
              <span>
                Time: <strong className="text-foreground">{new Date(crosshair.candle.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
              </span>
              <span>
                O: <strong className="text-foreground">${crosshair.candle.open}</strong>
              </span>
              <span>
                H: <strong className="text-emerald-500">${crosshair.candle.high}</strong>
              </span>
              <span>
                L: <strong className="text-rose-500">${crosshair.candle.low}</strong>
              </span>
              <span>
                C: <strong className="text-foreground">${crosshair.candle.close}</strong>
              </span>
              <span>
                Vol: <strong className="text-foreground">{crosshair.candle.volume}</strong>
              </span>
            </>
          ) : (
            <>
              <span>
                Live Price: <strong className="text-foreground">${activeQuote?.price || 0}</strong>
              </span>
              <span>
                24h High: <strong className="text-emerald-500">${activeQuote?.high || 0}</strong>
              </span>
              <span>
                24h Low: <strong className="text-rose-500">${activeQuote?.low || 0}</strong>
              </span>
              <span className={cn('font-bold', (activeQuote?.change24h || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                {(activeQuote?.change24h || 0) >= 0 ? '+' : ''}{activeQuote?.change24h}%
              </span>
            </>
          )}
        </div>

        {showIndicators && (
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#F59E0B]">
              <span className="h-1.5 w-3 rounded-full bg-[#F59E0B]" />
              <span>SMA (20)</span>
            </span>
            <span className="flex items-center gap-1 text-[#A855F7]">
              <span className="h-1.5 w-3 rounded-full bg-[#A855F7]" />
              <span>SMA (50)</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Canvas Body */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-[#060910]">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* Loading Indicator */}
        {loading && candles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-2">
            <RefreshCw className="h-7 w-7 text-brand-500 animate-spin" />
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              Loading {symbol} Candlesticks...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
