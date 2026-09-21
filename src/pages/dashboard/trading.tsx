import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Search,
  Zap,
  Clock,
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Crosshair,
  Edit3,
  MousePointer,
  Compass,
  Type,
  Ruler,
  Magnet,
  Shield,
  Layers,
  Filter,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  fetchUserAccounts,
  executeOrderApi,
  closePositionApi,
  fetchAccountPositionsApi,
} from '@/lib/api-client';
import { calculateMT5PnL, calculateInstitutionalMargin } from '@/utils/mt5';
import type { TradingAccount } from '@/types';
import { toast } from 'sonner';

// FundedShift Symbol Meta Registry
interface SymbolMeta {
  symbol: string;
  name: string;
  category: 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES';
  digits: number;
  contractSize: number;
  baseSpread: number;
}

const SYMBOL_REGISTRY: SymbolMeta[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'CRYPTO', digits: 2, contractSize: 1, baseSpread: 8.58 },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'CRYPTO', digits: 2, contractSize: 1, baseSpread: 0.32 },
  { symbol: 'SOLUSD', name: 'Solana / US Dollar', category: 'CRYPTO', digits: 3, contractSize: 1, baseSpread: 0.018 },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00016 },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00019 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'FOREX', digits: 3, contractSize: 100000, baseSpread: 0.016 },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'COMMODITIES', digits: 2, contractSize: 100, baseSpread: 0.66 },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'COMMODITIES', digits: 3, contractSize: 5000, baseSpread: 0.021 },
  { symbol: 'US30', name: 'Wall Street 30', category: 'INDICES', digits: 2, contractSize: 10, baseSpread: 2.5 },
  { symbol: 'NAS100', name: 'US Tech 100', category: 'INDICES', digits: 2, contractSize: 20, baseSpread: 1.8 },
];

interface MarketQuote {
  symbol: string;
  price?: number;
  bid: number;
  ask: number;
  spread?: number;
  high: number;
  low: number;
  change24h: number;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Audio notification synthesized directly via Web Audio API
function playTerminalSound(type: 'order' | 'close' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'order') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'close') {
      osc.frequency.setValueAtTime(783.99, ctx.currentTime);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_) {}
}

export function DashboardTrading() {
  const { user } = useAuth();

  // Accounts state
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Market & Quotes state
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<Record<string, 'UP' | 'DOWN' | 'SAME'>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSD');
  const [marketCategory, setMarketCategory] = useState<'ALL' | 'CRYPTO' | 'FOREX' | 'INDICES' | 'COMMODITIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Chart state
  const [timeframe, setTimeframe] = useState<'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1'>('H1');
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<{ sma: boolean; ema: boolean; volume: boolean; bollinger: boolean }>({
    sma: true,
    ema: false,
    volume: true,
    bollinger: false,
  });
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('crosshair');
  const [oneClickCollapsed, setOneClickCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Order Placement state
  const [executionTab, setExecutionTab] = useState<'MARKET' | 'PENDING'>('MARKET');
  const [pendingType, setPendingType] = useState<'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP'>('BUY_LIMIT');
  const [pendingPrice, setPendingPrice] = useState<string>('');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Positions & Bottom Desk state
  const [positions, setPositions] = useState<any[]>([]);
  const [bottomTab, setBottomTab] = useState<'POSITIONS' | 'PENDING' | 'HISTORY'>('POSITIONS');
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [candleData, setCandleData] = useState<Candle[]>([]);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; candle?: Candle; price?: number } | null>(null);

  // Daily DD Reset countdown
  const [dailyResetCountdown, setDailyResetCountdown] = useState<string>('07:51:45');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
      setDailyResetCountdown(`${hours}:${minutes}:${seconds}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Accounts
  useEffect(() => {
    async function loadAccs() {
      if (!user) return;
      try {
        const accs = await fetchUserAccounts(user.id);
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccount(accs[0]);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    }
    loadAccs();
  }, [user]);

  // Load positions for selected account
  const refreshPositions = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      const pos = await fetchAccountPositionsApi(selectedAccount.id);
      setPositions(pos);
    } catch (_) {}
  }, [selectedAccount?.id]);

  useEffect(() => {
    refreshPositions();
    const interval = setInterval(refreshPositions, 1500);
    return () => clearInterval(interval);
  }, [refreshPositions]);

  // Market Quotes Stream & Polling Fallback
  useEffect(() => {
    fetch('/api/market/quotes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuotes(data);
        }
      })
      .catch(() => {});

    const eventSource = new EventSource('/api/market/ticks/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setQuotes((prev) => {
            const historyUpdate: Record<string, 'UP' | 'DOWN' | 'SAME'> = {};
            data.forEach((newQ) => {
              const oldQ = prev.find((p) => p.symbol === newQ.symbol);
              if (oldQ) {
                if (newQ.bid > oldQ.bid) historyUpdate[newQ.symbol] = 'UP';
                else if (newQ.bid < oldQ.bid) historyUpdate[newQ.symbol] = 'DOWN';
                else historyUpdate[newQ.symbol] = 'SAME';
              }
            });
            setQuoteHistory((h) => ({ ...h, ...historyUpdate }));
            return data;
          });
        }
      } catch (_) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Active Symbol Meta & Quote
  const activeMeta = useMemo(() => {
    return SYMBOL_REGISTRY.find((s) => s.symbol === selectedSymbol) || SYMBOL_REGISTRY[0];
  }, [selectedSymbol]);

  const activeQuote = useMemo(() => {
    const found = quotes.find((q) => q.symbol === selectedSymbol);
    if (found) return found;

    if (selectedSymbol === 'BTCUSD') {
      return { symbol: 'BTCUSD', bid: 85695.73, ask: 85704.31, spread: 8.58, high: 86420.0, low: 83210.0, change24h: 3.42 };
    }
    if (selectedSymbol === 'ETHUSD') {
      return { symbol: 'ETHUSD', bid: 2743.59, ask: 2743.91, spread: 0.32, high: 2810.0, low: 2690.0, change24h: 1.85 };
    }
    if (selectedSymbol === 'SOLUSD') {
      return { symbol: 'SOLUSD', bid: 117.501, ask: 117.519, spread: 0.018, high: 122.4, low: 114.1, change24h: -0.92 };
    }
    if (selectedSymbol === 'EURUSD') {
      return { symbol: 'EURUSD', bid: 1.14685, ask: 1.14701, spread: 1.6, high: 1.1495, low: 1.144, change24h: -0.14 };
    }
    return { symbol: selectedSymbol, bid: 100, ask: 100.1, spread: 0.1, high: 105, low: 95, change24h: 0.5 };
  }, [quotes, selectedSymbol]);

  // Generate Synthetic Historical Candlesticks anchored to active price
  useEffect(() => {
    const basePrice = activeQuote.bid || 85695.73;
    const count = 75;
    const candles: Candle[] = [];
    const now = Date.now();
    const intervalMs =
      timeframe === 'M1' ? 60000 :
      timeframe === 'M5' ? 300000 :
      timeframe === 'M15' ? 900000 :
      timeframe === 'M30' ? 1800000 :
      timeframe === 'H1' ? 3600000 :
      timeframe === 'H4' ? 14400000 :
      timeframe === 'D1' ? 86400000 : 604800000;

    let current = basePrice * 0.95;
    for (let i = count; i >= 1; i--) {
      const time = now - i * intervalMs;
      const drift = (basePrice - current) * 0.045 + (Math.random() - 0.48) * (basePrice * 0.0035);
      const open = current;
      const close = i === 1 ? basePrice : open + drift;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.003);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.003);
      const volume = Math.floor(15 + Math.random() * 85);
      candles.push({ time, open, high, low, close, volume });
      current = close;
    }
    candles.push({
      time: now,
      open: current,
      high: Math.max(current, basePrice),
      low: Math.min(current, basePrice),
      close: basePrice,
      volume: 45,
    });
    setCandleData(candles);
  }, [selectedSymbol, timeframe]);

  // Update latest candle in real-time on live tick
  useEffect(() => {
    if (candleData.length === 0) return;
    const latestPrice = activeQuote.bid;
    setCandleData((prev) => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const last = prev[lastIndex];
      const updated: Candle = {
        ...last,
        high: Math.max(last.high, latestPrice),
        low: Math.min(last.low, latestPrice),
        close: latestPrice,
      };
      return [...prev.slice(0, lastIndex), updated];
    });
  }, [activeQuote.bid]);

  // Draw Candlestick Chart with FundedShift brand accents
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candleData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const priceScaleWidth = 96;
    const timeScaleHeight = 26;
    const chartWidth = width - priceScaleWidth;
    const chartHeight = height - timeScaleHeight;

    // Dark Navy background matching FundedShift theme
    ctx.fillStyle = '#070b13';
    ctx.fillRect(0, 0, width, height);

    // Subtle gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, 'rgba(12, 145, 234, 0.03)');
    bgGrad.addColorStop(1, 'rgba(7, 11, 19, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Min and Max Prices
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candleData) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }
    minPrice = Math.min(minPrice, activeQuote.bid * 0.999);
    maxPrice = Math.max(maxPrice, activeQuote.ask * 1.001);
    const padding = (maxPrice - minPrice) * 0.08;
    minPrice -= padding;
    maxPrice += padding;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    const getPrice = (y: number) => maxPrice - (y / chartHeight) * priceRange;

    // Grid lines (Horizontal Price Grid)
    const gridLines = 7;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridLines; i++) {
      const y = (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      const priceVal = getPrice(y);
      ctx.fillText(priceVal.toFixed(activeMeta.digits), chartWidth + 6, y + 3);
    }

    // Grid lines (Vertical Time Grid)
    const timeGridCount = 8;
    for (let i = 1; i <= timeGridCount; i++) {
      const x = (chartWidth / timeGridCount) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }

    // Volume Bars
    if (activeIndicators.volume) {
      const maxVol = Math.max(...candleData.map((c) => c.volume), 1);
      const volAreaHeight = chartHeight * 0.15;
      const candleWidth = chartWidth / candleData.length;
      candleData.forEach((c, idx) => {
        const x = idx * candleWidth;
        const vHeight = (c.volume / maxVol) * volAreaHeight;
        const isBull = c.close >= c.open;
        ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(x + candleWidth * 0.15, chartHeight - vHeight, candleWidth * 0.7, vHeight);
      });
    }

    // Candlesticks
    const candleWidth = chartWidth / candleData.length;
    const barW = Math.max(2, candleWidth * 0.72);

    candleData.forEach((c, idx) => {
      const x = idx * candleWidth + candleWidth / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? '#10b981' : '#ef4444';

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);
      ctx.fillRect(x - barW / 2, bodyTop, barW, bodyHeight);
    });

    // Technical Indicator: SMA 20 (Using FundedShift brand blue: #0c91ea)
    if (activeIndicators.sma && candleData.length > 20) {
      ctx.strokeStyle = '#0c91ea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 19; i < candleData.length; i++) {
        let sum = 0;
        for (let j = 0; j < 20; j++) sum += candleData[i - j].close;
        const sma = sum / 20;
        const x = i * candleWidth + candleWidth / 2;
        const y = getY(sma);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Horizontal Dotted Ask Line (Green) & Bid Line (Slate)
    const bidY = getY(activeQuote.bid);
    const askY = getY(activeQuote.ask);

    // Dotted Ask Line (Green) extending across the chart
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, askY);
    ctx.lineTo(chartWidth, askY);
    ctx.stroke();
    ctx.restore();

    // Dotted Bid Line (Slate/Grey) extending across the chart
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, bidY);
    ctx.lineTo(chartWidth, bidY);
    ctx.stroke();
    ctx.restore();

    // Helper: Draw 2-part pill badge exactly matching user screenshot (image.png)
    const drawPriceBadge = (
      x: number,
      y: number,
      w: number,
      h: number,
      label: 'ask' | 'bid',
      priceStr: string,
      labelBg: string,
      labelColor: string,
      valBg: string,
      valColor: string,
      borderColor?: string
    ) => {
      const labelW = 28;
      const valW = w - labelW;
      const r = 3;

      // 1. Label container (rounded left corners)
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + labelW, y);
      ctx.lineTo(x + labelW, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fillStyle = labelBg;
      ctx.fill();

      // 2. Price container (rounded right corners)
      const vx = x + labelW;
      ctx.beginPath();
      ctx.moveTo(vx, y);
      ctx.lineTo(vx + valW - r, y);
      ctx.quadraticCurveTo(vx + valW, y, vx + valW, y + r);
      ctx.lineTo(vx + valW, y + h - r);
      ctx.quadraticCurveTo(vx + valW, y + h, vx + valW - r, y + h);
      ctx.lineTo(vx, y + h);
      ctx.closePath();
      ctx.fillStyle = valBg;
      ctx.fill();

      if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Vertical separator between label and value
      ctx.beginPath();
      ctx.moveTo(vx, y);
      ctx.lineTo(vx, y + h);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Label Text (e.g. "ask" or "bid" in lowercase)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = labelColor;
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(label, x + labelW / 2, y + h / 2 + 0.5);

      // 4. Value Text (Exact formatted price)
      ctx.textAlign = 'center';
      ctx.fillStyle = valColor;
      ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText(priceStr, vx + valW / 2, y + h / 2 + 0.5);
    };

    // Right-Axis Tags for Bid & Ask
    const badgeH = 18;
    const badgeW = priceScaleWidth - 4;
    const badgeX = chartWidth + 2;

    let askBadgeY = askY - badgeH / 2;
    let bidBadgeY = bidY - badgeH / 2;

    // In tight spreads (or as shown in image.png where ask is neatly stacked on top of bid):
    if (Math.abs(askBadgeY - bidBadgeY) < badgeH) {
      const topY = Math.min(askY, bidY);
      askBadgeY = topY - badgeH;
      bidBadgeY = topY;
    }

    // Ask Badge: Dark Teal label + Emerald Green price (exact match with user image.png)
    drawPriceBadge(
      badgeX,
      askBadgeY,
      badgeW,
      badgeH,
      'ask',
      activeQuote.ask.toFixed(activeMeta.digits),
      '#0f3f38',  // dark greenish teal label
      '#5eead4',  // light mint text
      '#059669',  // vibrant emerald green price
      '#ffffff'   // bold white price text
    );

    // Bid Badge: Dark Slate label + Charcoal Dark price (exact match with user image.png)
    drawPriceBadge(
      badgeX,
      bidBadgeY,
      badgeW,
      badgeH,
      'bid',
      activeQuote.bid.toFixed(activeMeta.digits),
      '#1e293b',  // dark slate label
      '#94a3b8',  // light slate text
      '#0f172a',  // charcoal dark price
      '#e2e8f0',  // light grey bold text
      'rgba(51, 65, 85, 0.8)' // subtle border
    );

    // Time Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    const dayInterval = Math.max(1, Math.floor(candleData.length / 8));
    for (let i = 0; i < candleData.length; i += dayInterval) {
      const c = candleData[i];
      const d = new Date(c.time);
      const label = timeframe.startsWith('M') ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : `${d.getDate()}`;
      const x = i * candleWidth + candleWidth / 2;
      ctx.fillText(label, x, height - 8);
    }
    const lastDate = new Date(candleData[candleData.length - 1].time);
    ctx.fillText(`${lastDate.getHours()}:${String(lastDate.getMinutes()).padStart(2, '0')}`, chartWidth - 20, height - 8);

    // Crosshair & Tooltip
    if (hoverInfo && hoverInfo.x >= 0 && hoverInfo.x <= chartWidth && hoverInfo.y >= 0 && hoverInfo.y <= chartHeight) {
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(hoverInfo.x, 0);
      ctx.lineTo(hoverInfo.x, chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, hoverInfo.y);
      ctx.lineTo(chartWidth, hoverInfo.y);
      ctx.stroke();
      ctx.restore();

      const hoveredPrice = getPrice(hoverInfo.y);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(chartWidth + 1, hoverInfo.y - 9, priceScaleWidth - 3, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.fillText(hoveredPrice.toFixed(activeMeta.digits), chartWidth + 5, hoverInfo.y + 3);
    }
  }, [candleData, activeQuote, activeMeta, activeIndicators, timeframe, hoverInfo]);

  // Track Canvas Mouse Move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candleData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const candleWidth = (rect.width - 72) / candleData.length;
    const index = Math.min(candleData.length - 1, Math.max(0, Math.floor(x / candleWidth)));
    setHoverInfo({ x, y, candle: candleData[index] });
  };

  const handleCanvasMouseLeave = () => {
    setHoverInfo(null);
  };

  // Execute Order Handler
  const handleExecuteOrder = async (side: 'BUY' | 'SELL') => {
    if (!selectedAccount || !user) {
      toast.error('Please select an active trading account.');
      if (soundEnabled) playTerminalSound('error');
      return;
    }

    const isBreached = (selectedAccount.status || '').toLowerCase() === 'failed' || (selectedAccount.status || '').toLowerCase() === 'breached';
    if (isBreached) {
      toast.error('Trading is locked. This account has breached risk limits.');
      if (soundEnabled) playTerminalSound('error');
      return;
    }

    const isPassed = (selectedAccount.status || '').toLowerCase() === 'passed';
    if (isPassed) {
      toast.error('Trading is locked. Evaluation stage passed! Next stage is provisioning.');
      if (soundEnabled) playTerminalSound('error');
      return;
    }

    if (lotSize <= 0) {
      toast.error('Lot size must be greater than 0.');
      if (soundEnabled) playTerminalSound('error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await executeOrderApi({
        userId: user.id,
        accountId: selectedAccount.id,
        symbol: selectedSymbol,
        type: side,
        lotSize,
        stopLoss: slEnabled && stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: tpEnabled && takeProfit ? parseFloat(takeProfit) : undefined,
      });

      if (res.success) {
        if (soundEnabled) playTerminalSound('order');
        toast.success(`${side} ${lotSize} lots ${selectedSymbol} executed at ${side === 'BUY' ? activeQuote.ask : activeQuote.bid}`);
        await refreshPositions();
        const updatedAccs = await fetchUserAccounts(user.id);
        setAccounts(updatedAccs);
        const current = updatedAccs.find((a) => a.id === selectedAccount.id);
        if (current) setSelectedAccount(current);
      } else {
        if (soundEnabled) playTerminalSound('error');
        toast.error(res.error || 'Failed to execute order.');
      }
    } catch (err: any) {
      if (soundEnabled) playTerminalSound('error');
      toast.error(err.message || 'Execution error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close Position Handler
  const handleClosePosition = async (posId: string) => {
    if (!selectedAccount || !user) return;
    setClosingPositionId(posId);
    try {
      const res = await closePositionApi({
        userId: user.id,
        accountId: selectedAccount.id,
        positionId: posId,
      });
      if (res.success) {
        if (soundEnabled) playTerminalSound('close');
        toast.success('Position closed successfully.');
        await refreshPositions();
        const updatedAccs = await fetchUserAccounts(user.id);
        setAccounts(updatedAccs);
        const current = updatedAccs.find((a) => a.id === selectedAccount.id);
        if (current) setSelectedAccount(current);
      } else {
        toast.error(res.error || 'Failed to close position.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Close failed.');
    } finally {
      setClosingPositionId(null);
    }
  };

  // Close All Positions
  const handleCloseAll = async () => {
    const openPos = positions.filter((p) => p.status === 'OPEN');
    if (openPos.length === 0) return;
    for (const p of openPos) {
      await handleClosePosition(p.id);
    }
  };

  // Toggle Browser Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filtered Market Watch
  const filteredQuotes = useMemo(() => {
    return SYMBOL_REGISTRY.filter((s) => {
      if (marketCategory !== 'ALL' && s.category !== marketCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });
  }, [marketCategory, searchQuery]);

  // Account Objectives Metrics
  const accountSize = selectedAccount?.account_size || 5000;
  const startBalance = Number.isFinite(selectedAccount?.starting_balance) ? selectedAccount!.starting_balance! : accountSize;
  const currentBalance = Number.isFinite(selectedAccount?.current_balance) ? selectedAccount!.current_balance! : startBalance;

  // Quote lookup map for real-time MT5 PnL and margin calculations
  const quoteMap = useMemo(() => {
    const map = new Map<string, { bid: number; ask: number; price?: number }>();
    for (const q of quotes) {
      map.set(q.symbol, { bid: q.bid, ask: q.ask, price: q.price });
    }
    return map;
  }, [quotes]);

  // Real-time MT5 calculated positions with streaming market ticks
  const livePositions = useMemo(() => {
    return positions.map((pos) => {
      if (pos.status !== 'OPEN') return pos;
      const q = quotes.find((quote) => quote.symbol === pos.symbol);
      if (!q) return pos;
      const pnlResult = calculateMT5PnL({
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
      return {
        ...pos,
        current_price: pnlResult.currentPrice,
        floating_pnl: pnlResult.netPnl,
      };
    });
  }, [positions, quotes, quoteMap]);

  // Open & Floating PnL
  const openPositions = livePositions.filter((p) => p.status === 'OPEN');
  const closedPositions = livePositions.filter((p) => p.status === 'CLOSED');
  const floatingPnl = openPositions.reduce((sum, p) => sum + (p.floating_pnl || 0), 0);
  const currentEquity = currentBalance + floatingPnl;

  const rules = selectedAccount?.rules || {};
  const isBreached =
    (selectedAccount?.status || '').toLowerCase() === 'failed' ||
    (selectedAccount?.status || '').toLowerCase() === 'breached';
  const isPassed = (selectedAccount?.status || '').toLowerCase() === 'passed';
  const isFunded = (selectedAccount?.status || '').toLowerCase() === 'funded' || selectedAccount?.is_funded;

  // Evaluation target
  const profitTargetPct = rules.profit_target_percent ?? (isFunded ? 0 : selectedAccount?.phase === 2 ? 5 : 8);
  const targetAmount = profitTargetPct > 0 ? (accountSize * profitTargetPct) / 100 : 400;
  const netProfit = Math.max(0, currentEquity - startBalance);
  const targetProgress = targetAmount > 0 ? Math.min(100, Math.max(0, (netProfit / targetAmount) * 100)) : 100;
  const needAmount = Math.max(0, targetAmount - netProfit);

  // Drawdowns
  const dailyDDPct = rules.daily_loss_limit_percent ?? 3;
  const maxDDPct = rules.max_loss_limit_percent ?? 6;

  const startOfDayEquity = selectedAccount?.start_of_day_equity || accountSize;
  const dailyLossUsed = Math.max(0, startOfDayEquity - currentEquity);
  const dailyLimit = (startOfDayEquity * dailyDDPct) / 100;
  const dailyDDLeft = Math.max(0, dailyLimit - dailyLossUsed);
  const dailyBreachEquity = startOfDayEquity - dailyLimit;

  const maxLossLimit = (accountSize * maxDDPct) / 100;
  const overallLossUsed = Math.max(0, startBalance - currentEquity);
  const overallDDLeft = Math.max(0, maxLossLimit - overallLossUsed);
  const overallBreachEquity = startBalance - maxLossLimit;

  // Margin Calculation
  const leverage = rules.leverage || selectedAccount?.leverage || 100;
  const liveUsedMargin = openPositions.reduce((sum, p) => sum + (p.margin || 0), 0);
  const freeMargin = Math.max(0, currentEquity - liveUsedMargin);
  const marginRequired = calculateInstitutionalMargin({
    symbol: selectedSymbol,
    lotSize: lotSize || 0,
    entryPrice: activeQuote.ask > 0 ? activeQuote.ask : (activeQuote.bid || 1),
    leverage,
    quoteLookup: (sym) => quoteMap.get(sym),
  });
  const per1PctMove = ((lotSize * activeMeta.contractSize * (activeQuote.bid || 1)) * 0.01);

  // Lot Stepper Helpers
  const stepLot = (delta: number) => {
    setLotSize((prev) => Math.max(0.01, Math.min(50, parseFloat((prev + delta).toFixed(2)))));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. TOP STATUS & ACCOUNT BAR (FundedShift Brand Theme) */}
      <header className="h-12 border-b border-slate-800/80 bg-[#090e1a] px-3.5 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Left Side: FundedShift Branding & Account Selector */}
        <div className="flex items-center gap-3">
          {/* Logo & Platform Name */}
          <Link to="/dashboard" className="flex items-center gap-2 group mr-1">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight text-white">
                Funded<span className="text-brand-400">Shift</span>
              </span>
              <span className="text-[10px] font-mono font-semibold text-brand-400/90 ml-1.5 px-1 py-0.2 bg-brand-500/10 border border-brand-500/20 rounded">
                TERMINAL
              </span>
            </div>
          </Link>

          {/* Connection Status */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-400 text-[11px] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </div>

          {/* Account Selector Pill with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 bg-[#101726] hover:bg-[#162035] border border-slate-700/80 rounded-lg text-xs font-semibold transition-all shadow-sm"
            >
              <span className="text-slate-400 text-[11px]">Account</span>
              <span className="font-mono text-brand-300 font-bold">
                #{selectedAccount?.account_number || '112236'}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                  isBreached
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : isPassed
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                    : isFunded
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {selectedAccount?.status || 'BREACHED'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Account Switcher Dropdown */}
            <AnimatePresence>
              {accountDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 top-11 w-72 bg-[#0d1424] border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-md"
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Switch Trading Account
                  </div>
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccount(acc);
                        setAccountDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                        selectedAccount?.id === acc.id
                          ? 'bg-brand-500/15 text-white border border-brand-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-mono font-bold text-slate-100">#{acc.account_number}</p>
                        <p className="text-[10px] text-slate-400">
                          {acc.plan_name || 'Standard'} • ${(acc.account_size || 5000).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          (acc.status || '').toLowerCase() === 'failed' || (acc.status || '').toLowerCase() === 'breached'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Equity */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">EQUITY</span>
            <span className="font-mono font-bold text-slate-100">
              ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

          {/* Floating P&L */}
          <div className="flex items-center gap-1.5 text-xs hidden md:flex">
            <span className="text-[10px] uppercase font-bold text-slate-400">P&L</span>
            <span className={`font-mono font-bold ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {floatingPnl >= 0 ? `+$${floatingPnl.toFixed(2)}` : `-$${Math.abs(floatingPnl).toFixed(2)}`}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden lg:block" />

          {/* Daily Drawdown Left */}
          <div className="flex items-center gap-2 text-xs hidden lg:flex">
            <span className="text-[10px] uppercase font-bold text-slate-400">DAILY BUFFER</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, (dailyDDLeft / dailyLimit) * 100))}%` }}
              />
            </div>
            <span className="font-mono text-brand-300 font-semibold">${dailyDDLeft.toFixed(2)} left</span>
          </div>
        </div>

        {/* Right Side: Quick Toggles & Exit Dashboard Button */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-brand-300 rounded-lg hover:bg-slate-800 transition-all"
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-brand-300 rounded-lg hover:bg-slate-800 transition-all hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Return to Dashboard */}
          <Link to="/dashboard">
            <button className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/40 text-brand-300 rounded-lg text-xs font-semibold transition-all shadow-sm">
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Exit Terminal</span>
            </button>
          </Link>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ============================================================ */}
        {/* LEFT COLUMN: MARKET WATCH & CHALLENGE OBJECTIVES             */}
        {/* ============================================================ */}
        <aside className="w-[285px] border-r border-slate-800/80 bg-[#090e1a] flex flex-col shrink-0 overflow-hidden">
          {/* TOP HALF: MARKET WATCH WITH CATEGORY FILTER */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800/80">
            {/* Header & Search */}
            <div className="p-2.5 pb-2 space-y-2 border-b border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-brand-400" />
                  MARKET WATCH
                </span>
                <span className="text-[10px] font-mono text-slate-400">{filteredQuotes.length} Assets</span>
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="h-3 w-3 text-slate-500 absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search symbols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d1424] border border-slate-800 rounded-md pl-7 pr-2 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              {/* Category Filter Pills (Brand Cyan) */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                {(['ALL', 'CRYPTO', 'FOREX', 'INDICES', 'COMMODITIES'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMarketCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all shrink-0 ${
                      marketCategory === cat
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-[#101726] text-slate-400 hover:text-slate-200 hover:bg-[#162035]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Headers */}
            <div className="grid grid-cols-12 px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 bg-[#0d1424]">
              <span className="col-span-6">ASSET</span>
              <span className="col-span-3 text-right">BID</span>
              <span className="col-span-3 text-right">ASK</span>
            </div>

            {/* Quotes List with tick flashing */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredQuotes.map((item) => {
                const q = quotes.find((x) => x.symbol === item.symbol) || {
                  bid: item.symbol === 'BTCUSD' ? 85695.73 : item.symbol === 'ETHUSD' ? 2743.59 : item.symbol === 'SOLUSD' ? 117.501 : 1.14685,
                  ask: item.symbol === 'BTCUSD' ? 85704.31 : item.symbol === 'ETHUSD' ? 2743.91 : item.symbol === 'SOLUSD' ? 117.519 : 1.14701,
                };
                const tickState = quoteHistory[item.symbol] || 'SAME';
                const isSelected = selectedSymbol === item.symbol;

                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`w-full grid grid-cols-12 px-3 py-2 text-xs transition-colors items-center text-left ${
                      isSelected
                        ? 'bg-brand-500/10 border-l-2 border-brand-500'
                        : 'hover:bg-[#0f172a]'
                    }`}
                  >
                    <div className="col-span-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 font-mono">{item.symbol}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{item.name}</p>
                    </div>
                    <div className="col-span-3 text-right font-mono">
                      <span
                        className={`text-[11px] transition-colors ${
                          tickState === 'UP'
                            ? 'text-emerald-400 font-bold'
                            : tickState === 'DOWN'
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {q.bid.toFixed(item.digits)}
                      </span>
                    </div>
                    <div className="col-span-3 text-right font-mono">
                      <span className="text-[11px] text-emerald-400">{q.ask.toFixed(item.digits)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTTOM HALF: ACCOUNT OBJECTIVES (FundedShift Brand Theme) */}
          <div className="h-[340px] flex flex-col p-3 space-y-2.5 overflow-y-auto bg-[#0b101d] text-xs shrink-0">
            {/* Title & Badge */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 text-brand-400 font-bold text-[11px] uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5 text-brand-400" />
                EVALUATION METRICS
              </div>
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isBreached
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                    : isPassed
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                }`}
              >
                {selectedAccount?.status || 'BREACHED'}
              </span>
            </div>

            {/* Account Name & Details */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-100 text-sm">{selectedAccount?.plan_name || 'FundedShift Challenge'}</p>
                <p className="text-[10px] text-slate-400">
                  Phase: Phase {selectedAccount?.phase || 1} • #{selectedAccount?.account_number || '112236'}
                </p>
              </div>
            </div>

            {/* Status Banner */}
            {isBreached ? (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-2 flex items-center justify-center gap-1.5 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>ACCOUNT BREACHED - LOCKED</span>
              </div>
            ) : isPassed ? (
              <div className="bg-brand-950/40 border border-brand-800/60 rounded-lg p-2 flex items-center justify-center gap-1.5 text-brand-400 font-bold text-xs uppercase tracking-wider">
                <Award className="h-4 w-4 text-brand-400" />
                <span>PHASE PASSED - PROVISIONING</span>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2 flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>ACTIVE EVALUATION TRADING</span>
              </div>
            )}

            {/* Profit Target Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Evaluation Target</span>
                <span className="font-mono font-bold text-slate-100">
                  ${netProfit.toFixed(2)} / ${targetAmount.toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-sky-400 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-brand-300 font-semibold">{targetProgress.toFixed(0)}% Achieved</span>
                <span>Need ${needAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Min Trading Days */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">MIN TRADING DAYS</span>
              <span className="font-mono font-bold text-slate-200">
                {selectedAccount?.trading_days || 2} / {rules.min_trading_days || 7}
              </span>
            </div>

            {/* Daily Drawdown Box */}
            <div className="bg-[#101726] border border-slate-800 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">DAILY DRAWDOWN</span>
                <span className="font-mono font-bold text-brand-300">${dailyDDLeft.toFixed(2)} left</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{dailyDDPct}% static limit</span>
                <span className="font-mono text-sky-400">Reset {dailyResetCountdown}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-800/80">
                <span className="font-bold text-amber-500 text-[9px] uppercase tracking-wider">BREACH EQUITY</span>
                <span className="font-mono font-bold text-amber-400">${dailyBreachEquity.toFixed(2)}</span>
              </div>
            </div>

            {/* Overall Drawdown Box */}
            <div className="bg-[#101726] border border-slate-800 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">MAX DRAWDOWN</span>
                <span className="font-mono font-bold text-slate-200">${overallDDLeft.toFixed(2)} left</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{maxDDPct}% static limit</span>
                <span className="font-mono">Initial ${accountSize.toLocaleString()}.00</span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-800/80">
                <span className="font-bold text-amber-500 text-[9px] uppercase tracking-wider">BREACH EQUITY</span>
                <span className="font-mono font-bold text-amber-400">${overallBreachEquity.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN: CHART & POSITIONS DESK                        */}
        {/* ============================================================ */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#070b13] overflow-hidden">
          {/* Chart Sub-Header Toolbar */}
          <div className="h-10 border-b border-slate-800/80 px-3.5 flex items-center justify-between bg-[#090e1a] shrink-0 text-xs">
            {/* Left: Symbol, Timeframes, Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white font-mono text-sm tracking-wide">{selectedSymbol}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">({activeMeta.name})</span>
              </div>

              {/* Timeframes */}
              <div className="flex items-center gap-0.5 bg-[#101726] border border-slate-800 rounded-md p-0.5">
                {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                      timeframe === tf
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Indicators */}
              <div className="relative">
                <button
                  onClick={() => setIndicatorsOpen(!indicatorsOpen)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-[#101726] hover:bg-[#162035] border border-slate-800 rounded text-[11px] text-slate-300 font-semibold"
                >
                  <span className="text-brand-400 font-mono">f(x)</span>
                  <span>Indicators</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {indicatorsOpen && (
                  <div className="absolute left-0 top-8 w-44 bg-[#0d1424] border border-slate-700 rounded-lg shadow-xl p-2 z-40 space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={activeIndicators.sma}
                        onChange={(e) => setActiveIndicators({ ...activeIndicators, sma: e.target.checked })}
                      />
                      <span>SMA 20 (Brand Blue)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={activeIndicators.volume}
                        onChange={(e) => setActiveIndicators({ ...activeIndicators, volume: e.target.checked })}
                      />
                      <span>Volume Histogram</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Spread Badge */}
              <div className="px-2 py-0.5 bg-brand-500/10 border border-brand-500/30 rounded text-brand-300 font-mono text-[10px] font-bold">
                SPREAD ${activeMeta.baseSpread.toFixed(activeMeta.digits === 5 ? 4 : 2)}
              </div>
            </div>

            {/* Right: Live BID & ASK rates */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div>
                <span className="text-slate-500 mr-1 text-[10px] uppercase font-sans">BID</span>
                <span className="text-rose-400 font-bold">{activeQuote.bid.toFixed(activeMeta.digits)}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1 text-[10px] uppercase font-sans">ASK</span>
                <span className="text-emerald-400 font-bold">{activeQuote.ask.toFixed(activeMeta.digits)}</span>
              </div>
            </div>
          </div>

          {/* Chart Canvas Area & Left Drawing Toolbar */}
          <div className="flex-1 relative flex overflow-hidden min-h-0">
            {/* Left Drawing Tools */}
            <div className="w-10 border-r border-slate-800/80 bg-[#090e1a] flex flex-col items-center py-2 space-y-2 shrink-0 z-10 text-slate-400">
              {[
                { id: 'crosshair', icon: Crosshair, label: 'Crosshair' },
                { id: 'trendline', icon: Edit3, label: 'Trendline' },
                { id: 'pitchfork', icon: Compass, label: 'Pitchfork' },
                { id: 'brush', icon: MousePointer, label: 'Brush' },
                { id: 'text', icon: Type, label: 'Text' },
                { id: 'ruler', icon: Ruler, label: 'Measure' },
                { id: 'magnet', icon: Magnet, label: 'Magnet' },
              ].map((tool) => {
                const Icon = tool.icon;
                const isActive = activeDrawingTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveDrawingTool(tool.id)}
                    className={`p-1.5 rounded-lg transition-all ${
                      isActive ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50' : 'hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title={tool.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            {/* Candlestick Canvas & Overlays */}
            <div className="flex-1 relative overflow-hidden h-full">
              {/* Floating One-Click Order Overlay */}
              <div className="absolute left-3 top-3 z-20 flex items-center shadow-2xl rounded-lg overflow-hidden border border-slate-700/80 bg-[#0b111e]/95 backdrop-blur-md">
                {!oneClickCollapsed ? (
                  <>
                    {/* Sell Button */}
                    <button
                      onClick={() => handleExecuteOrder('SELL')}
                      disabled={submitting || isBreached}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex flex-col items-center justify-center transition-all disabled:opacity-50"
                    >
                      <span className="text-[9px] uppercase font-sans tracking-wider opacity-90">SELL</span>
                      <span>{activeQuote.bid.toFixed(activeMeta.digits)}</span>
                      <span className="text-[8px] opacity-75 font-sans">SELL •••• 0/4</span>
                    </button>

                    {/* Lot Stepper */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#101726] border-x border-slate-700/60 font-mono text-xs">
                      <button
                        onClick={() => stepLot(-0.01)}
                        className="text-slate-400 hover:text-white px-1"
                      >
                        ▼
                      </button>
                      <span className="font-bold text-slate-100 min-w-[36px] text-center">{lotSize.toFixed(2)}</span>
                      <button
                        onClick={() => stepLot(0.01)}
                        className="text-slate-400 hover:text-white px-1"
                      >
                        ▲
                      </button>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => handleExecuteOrder('BUY')}
                      disabled={submitting || isBreached}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex flex-col items-center justify-center transition-all disabled:opacity-50"
                    >
                      <span className="text-[9px] uppercase font-sans tracking-wider opacity-90">BUY</span>
                      <span>{activeQuote.ask.toFixed(activeMeta.digits)}</span>
                      <span className="text-[8px] opacity-75 font-sans">BUY •••• 0/4</span>
                    </button>

                    {/* Collapse Button */}
                    <button
                      onClick={() => setOneClickCollapsed(true)}
                      className="px-1 py-3 hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setOneClickCollapsed(false)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Expand One-Click Trading"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Watermark */}
              <div className="absolute left-4 bottom-4 z-10 opacity-15 pointer-events-none font-bold text-2xl font-mono text-slate-400 flex items-center gap-1">
                <span>FUNDEDSHIFT</span>
              </div>

              {/* Live Status Tag */}
              <div className="absolute right-20 bottom-3 z-10 px-2 py-0.5 rounded bg-brand-950/60 border border-brand-700/50 text-brand-300 text-[10px] font-bold flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span>REALTIME FEED</span>
              </div>

              {/* HTML5 Canvas */}
              <canvas
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                className="w-full h-full block cursor-crosshair"
              />
            </div>
          </div>

          {/* Bottom Panel: POSITIONS, PENDING, HISTORY */}
          <div className="h-[200px] border-t border-slate-800/80 bg-[#090e1a] flex flex-col shrink-0">
            {/* Tabs */}
            <div className="flex items-center justify-between px-3 border-b border-slate-800 bg-[#0d1424] h-8">
              <div className="flex items-center gap-4 text-xs font-bold font-mono">
                <button
                  onClick={() => setBottomTab('POSITIONS')}
                  className={`py-1.5 border-b-2 transition-all ${
                    bottomTab === 'POSITIONS'
                      ? 'border-brand-500 text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  POSITIONS ({openPositions.length})
                </button>
                <button
                  onClick={() => setBottomTab('PENDING')}
                  className={`py-1.5 border-b-2 transition-all ${
                    bottomTab === 'PENDING'
                      ? 'border-brand-500 text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PENDING (0)
                </button>
                <button
                  onClick={() => setBottomTab('HISTORY')}
                  className={`py-1.5 border-b-2 transition-all ${
                    bottomTab === 'HISTORY'
                      ? 'border-brand-500 text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  HISTORY ({closedPositions.length})
                </button>
              </div>

              {openPositions.length > 0 && (
                <button
                  onClick={handleCloseAll}
                  className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded text-[10px] font-bold uppercase transition-all"
                >
                  Close All Positions
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {bottomTab === 'POSITIONS' ? (
                openPositions.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                    No open positions
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[10px] text-slate-500 bg-[#0a0f1d]">
                        <th className="px-3 py-1.5">Ticket</th>
                        <th className="px-3 py-1.5">Time</th>
                        <th className="px-3 py-1.5">Symbol</th>
                        <th className="px-3 py-1.5">Type</th>
                        <th className="px-3 py-1.5">Volume</th>
                        <th className="px-3 py-1.5">Open Price</th>
                        <th className="px-3 py-1.5">Current Price</th>
                        <th className="px-3 py-1.5">S / L</th>
                        <th className="px-3 py-1.5">T / P</th>
                        <th className="px-3 py-1.5 text-right">Profit ($)</th>
                        <th className="px-3 py-1.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {openPositions.map((pos) => {
                        const isBuy = pos.type === 'BUY';
                        const posMeta = SYMBOL_REGISTRY.find((s) => s.symbol === pos.symbol);
                        const digits = posMeta?.digits ?? 2;
                        const posQuote = quotes.find((q) => q.symbol === pos.symbol);
                        const currentP = pos.current_price || (posQuote ? (isBuy ? posQuote.bid : posQuote.ask) : pos.open_price);
                        const pnl = pos.floating_pnl ?? 0;
                        return (
                          <tr key={pos.id} className="hover:bg-slate-800/30 text-[11px]">
                            <td className="px-3 py-1.5 text-slate-400">#{pos.id.slice(-6)}</td>
                            <td className="px-3 py-1.5 text-slate-400">
                              {pos.opened_at ? new Date(pos.opened_at).toLocaleTimeString() : 'Live'}
                            </td>
                            <td className="px-3 py-1.5 font-bold text-slate-200">{pos.symbol}</td>
                            <td className="px-3 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {pos.type}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-slate-200">{pos.lot_size}</td>
                            <td className="px-3 py-1.5 text-slate-300">{Number(pos.open_price).toFixed(digits)}</td>
                            <td className="px-3 py-1.5 text-slate-300 font-bold">{currentP.toFixed(digits)}</td>
                            <td className="px-3 py-1.5 text-slate-400">{pos.stop_loss || '-'}</td>
                            <td className="px-3 py-1.5 text-slate-400">{pos.take_profit || '-'}</td>
                            <td className={`px-3 py-1.5 text-right font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <button
                                onClick={() => handleClosePosition(pos.id)}
                                disabled={closingPositionId === pos.id}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded border border-slate-700 text-[10px] transition-all"
                              >
                                {closingPositionId === pos.id ? '...' : 'Close'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : bottomTab === 'PENDING' ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  No pending orders
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] text-slate-500 bg-[#0a0f1d]">
                      <th className="px-3 py-1.5">Ticket</th>
                      <th className="px-3 py-1.5">Symbol</th>
                      <th className="px-3 py-1.5">Type</th>
                      <th className="px-3 py-1.5">Lots</th>
                      <th className="px-3 py-1.5">Close Price</th>
                      <th className="px-3 py-1.5 text-right">Realized PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {closedPositions.map((pos) => {
                      const posMeta = SYMBOL_REGISTRY.find((s) => s.symbol === pos.symbol);
                      const digits = posMeta?.digits ?? 2;
                      return (
                        <tr key={pos.id} className="hover:bg-slate-800/30 text-[11px]">
                          <td className="px-3 py-1.5 text-slate-400">#{pos.id.slice(-6)}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-200">{pos.symbol}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {pos.type}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-200">{pos.lot_size}</td>
                          <td className="px-3 py-1.5 text-slate-300">{Number(pos.close_price || pos.open_price).toFixed(digits)}</td>
                          <td className={`px-3 py-1.5 text-right font-bold ${(pos.realized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(pos.realized_pnl || 0) >= 0 ? `+$${(pos.realized_pnl || 0).toFixed(2)}` : `-$${Math.abs(pos.realized_pnl || 0).toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ORDER EXECUTION & RISK CONTROLS                */}
        {/* ============================================================ */}
        <aside className="w-[305px] border-l border-slate-800/80 bg-[#090e1a] flex flex-col p-3.5 space-y-3 shrink-0 overflow-y-auto">
          {/* Symbol Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div>
              <p className="font-mono font-bold text-base text-white">{selectedSymbol}</p>
              <p className="text-[10px] text-slate-400">{activeMeta.name}</p>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-brand-500/10 border border-brand-500/30 text-brand-300 rounded">
              SPREAD ${activeMeta.baseSpread.toFixed(activeMeta.digits === 5 ? 4 : 2)}
            </span>
          </div>

          {/* Execution Type Selector */}
          <div className="grid grid-cols-2 p-0.5 bg-[#101726] border border-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setExecutionTab('MARKET')}
              className={`py-1.5 rounded-md transition-all ${
                executionTab === 'MARKET' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Market Order
            </button>
            <button
              onClick={() => setExecutionTab('PENDING')}
              className={`py-1.5 rounded-md transition-all ${
                executionTab === 'PENDING' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Order
            </button>
          </div>

          {/* Dual Quote Action Boxes */}
          <div className="grid grid-cols-2 gap-2">
            {/* SELL BID */}
            <button
              onClick={() => {
                setOrderSide('SELL');
                handleExecuteOrder('SELL');
              }}
              disabled={submitting || isBreached}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                orderSide === 'SELL'
                  ? 'bg-rose-500/15 border-rose-500/60 shadow-lg shadow-rose-500/10'
                  : 'bg-[#101726] border-slate-800 hover:border-rose-500/40'
              }`}
            >
              <span className="block text-[10px] uppercase font-bold text-rose-400">SELL BID</span>
              <span className="block text-sm font-mono font-bold text-slate-100 mt-0.5">
                {activeQuote.bid.toFixed(activeMeta.digits)}
              </span>
            </button>

            {/* BUY ASK */}
            <button
              onClick={() => {
                setOrderSide('BUY');
                handleExecuteOrder('BUY');
              }}
              disabled={submitting || isBreached}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                orderSide === 'BUY'
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#101726] border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <span className="block text-[10px] uppercase font-bold text-emerald-400">BUY ASK</span>
              <span className="block text-sm font-mono font-bold text-slate-100 mt-0.5">
                {activeQuote.ask.toFixed(activeMeta.digits)}
              </span>
            </button>
          </div>

          {/* Pending Order Inputs */}
          {executionTab === 'PENDING' && (
            <div className="space-y-2 p-2.5 bg-[#101726] border border-slate-800 rounded-lg text-xs">
              <select
                value={pendingType}
                onChange={(e) => setPendingType(e.target.value as any)}
                className="w-full bg-[#090e1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              >
                <option value="BUY_LIMIT">Buy Limit</option>
                <option value="SELL_LIMIT">Sell Limit</option>
                <option value="BUY_STOP">Buy Stop</option>
                <option value="SELL_STOP">Sell Stop</option>
              </select>
              <input
                type="number"
                placeholder="Entry Price"
                value={pendingPrice}
                onChange={(e) => setPendingPrice(e.target.value)}
                className="w-full bg-[#090e1a] border border-slate-700 rounded p-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
          )}

          {/* Volume Stepper & Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold uppercase text-[10px]">VOLUME (LOTS)</span>
            </div>

            <div className="flex items-center bg-[#101726] border border-slate-800 rounded-lg overflow-hidden font-mono">
              <button
                onClick={() => stepLot(-0.01)}
                className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-bold"
              >
                -
              </button>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="50"
                value={lotSize}
                onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
                className="flex-1 bg-transparent text-center text-sm font-bold text-slate-100 focus:outline-none"
              />
              <button
                onClick={() => stepLot(0.01)}
                className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-bold"
              >
                +
              </button>
            </div>

            {/* Quick Preset Buttons (Brand styled) */}
            <div className="grid grid-cols-5 gap-1 pt-1 font-mono text-[10px]">
              {[0.01, 0.1, 1, 5, 10].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setLotSize(preset)}
                  className={`py-1 rounded border text-center transition-all ${
                    lotSize === preset
                      ? 'bg-brand-500 text-white border-brand-400 font-bold'
                      : 'bg-[#101726] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Controls */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>RISK CONTROLS</span>
              <span>SL / TP</span>
            </div>

            {/* Take Profit */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold text-[11px]">TP (Take Profit)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tpEnabled}
                    onChange={(e) => setTpEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              {tpEnabled && (
                <input
                  type="number"
                  placeholder="Enter Target Price"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-[#101726] border border-slate-800 rounded-md p-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              )}
            </div>

            {/* Stop Loss */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold text-[11px]">SL (Stop Loss)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slEnabled}
                    onChange={(e) => setSlEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
              {slEnabled && (
                <input
                  type="number"
                  placeholder="Enter Exit Price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-[#101726] border border-slate-800 rounded-md p-1.5 text-xs text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Margin Calculations */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans text-[10px]">Margin Required</span>
              <span className="font-bold text-slate-200">${marginRequired.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans text-[10px]">Per 1% Move</span>
              <span className="font-bold text-slate-200">${per1PctMove.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans text-[10px]">Free Margin</span>
              <span className="font-bold text-brand-300">${freeMargin.toFixed(2)}</span>
            </div>
          </div>

          {/* Execution Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleExecuteOrder('SELL')}
              disabled={submitting || isBreached}
              className="py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs font-mono flex flex-col items-center justify-center transition-all shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <span className="text-[11px] font-sans font-bold">🔻 SELL</span>
              <span>{lotSize} lots</span>
            </button>

            <button
              onClick={() => handleExecuteOrder('BUY')}
              disabled={submitting || isBreached}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs font-mono flex flex-col items-center justify-center transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <span className="text-[11px] font-sans font-bold">🔼 BUY</span>
              <span>{lotSize} lots</span>
            </button>
          </div>

          {isBreached && (
            <div className="text-center text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded p-1.5">
              Trading disabled. Account breached risk limits.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
