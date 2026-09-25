import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Layers,
  Filter,
  CheckCircle,
  ExternalLink,
  Shield,
  ShieldCheck,
  Briefcase,
  History,
  Info,
  RefreshCw,
  X,
  BarChart3,
  Sliders,
  DollarSign,
  TrendingDown,
  PieChart,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  fetchUserAccounts,
  executeOrderApi,
  closePositionApi,
  fetchAccountPositionsApi,
} from '@/lib/api-client';
import { calculateMT5PnL, calculateInstitutionalMargin } from '@/utils/mt5';
import type { TradingAccount, OrderType } from '@/types';
import { toast } from 'sonner';
import { TerminalChart } from '@/components/trading/terminal-chart';

// FundedShift Symbol Meta Registry
interface SymbolMeta {
  symbol: string;
  name: string;
  category: 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES';
  digits: number;
  contractSize: number;
  baseSpread: number;
  tvSymbol: string;
}

const SYMBOL_REGISTRY: SymbolMeta[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'CRYPTO', digits: 2, contractSize: 1, baseSpread: 8.58, tvSymbol: 'BINANCE:BTCUSDT' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'CRYPTO', digits: 2, contractSize: 1, baseSpread: 0.32, tvSymbol: 'BINANCE:ETHUSDT' },
  { symbol: 'SOLUSD', name: 'Solana / US Dollar', category: 'CRYPTO', digits: 3, contractSize: 1, baseSpread: 0.018, tvSymbol: 'BINANCE:SOLUSDT' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00016, tvSymbol: 'OANDA:EURUSD' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00019, tvSymbol: 'OANDA:GBPUSD' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'FOREX', digits: 3, contractSize: 100000, baseSpread: 0.016, tvSymbol: 'OANDA:USDJPY' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / USD', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00018, tvSymbol: 'OANDA:AUDUSD' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00019, tvSymbol: 'OANDA:USDCAD' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00018, tvSymbol: 'OANDA:USDCHF' },
  { symbol: 'NZDUSD', name: 'NZ Dollar / US Dollar', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00018, tvSymbol: 'OANDA:NZDUSD' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'FOREX', digits: 5, contractSize: 100000, baseSpread: 0.00018, tvSymbol: 'OANDA:EURGBP' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'FOREX', digits: 3, contractSize: 100000, baseSpread: 0.018, tvSymbol: 'OANDA:EURJPY' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'FOREX', digits: 3, contractSize: 100000, baseSpread: 0.022, tvSymbol: 'OANDA:GBPJPY' },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'COMMODITIES', digits: 2, contractSize: 100, baseSpread: 0.66, tvSymbol: 'OANDA:XAUUSD' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'COMMODITIES', digits: 3, contractSize: 5000, baseSpread: 0.021, tvSymbol: 'TVC:SILVER' },
  { symbol: 'USOIL', name: 'Crude Oil WTI', category: 'COMMODITIES', digits: 2, contractSize: 1000, baseSpread: 0.03, tvSymbol: 'TVC:USOIL' },
  { symbol: 'US30', name: 'Wall Street 30', category: 'INDICES', digits: 2, contractSize: 10, baseSpread: 2.5, tvSymbol: 'OANDA:US30USD' },
  { symbol: 'NAS100', name: 'US Tech 100', category: 'INDICES', digits: 2, contractSize: 20, baseSpread: 1.8, tvSymbol: 'NASDAQ:NDX' },
  { symbol: 'SPX500', name: 'US SPX 500', category: 'INDICES', digits: 2, contractSize: 50, baseSpread: 0.8, tvSymbol: 'SP:SPX' },
  { symbol: 'GER40', name: 'Germany 40', category: 'INDICES', digits: 2, contractSize: 25, baseSpread: 2.0, tvSymbol: 'OANDA:DE30EUR' },
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

// Audio synthesizer for institutional order feedback
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
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08);
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
  const navigate = useNavigate();

  // Accounts state
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Market & Quotes state
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<Record<string, 'UP' | 'DOWN' | 'SAME'>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSD');
  const [marketCategory, setMarketCategory] = useState<'ALL' | 'CRYPTO' | 'FOREX' | 'INDICES' | 'COMMODITIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // TradingView Chart state
  const [timeframe, setTimeframe] = useState<'1' | '5' | '15' | '60' | '240' | 'D'>('15');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Order Ticket state
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [quickTradeCollapsed, setQuickTradeCollapsed] = useState(false);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [closingAll, setClosingAll] = useState(false);

  // Bottom Desk Tabs
  const [activeBottomTab, setActiveBottomTab] = useState<'POSITIONS' | 'HISTORY' | 'RULES' | 'LOGS'>('POSITIONS');
  const [executionLogs, setExecutionLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'danger' }[]>([
    { id: '1', time: new Date().toLocaleTimeString(), msg: 'Connected to FundedShift Institutional ECN Matching Node [NY4]', type: 'info' },
    { id: '2', time: new Date().toLocaleTimeString(), msg: 'TradingView Real-Time Exchange Data Feed Synchronized', type: 'success' },
  ]);

  // Positions state
  const [positions, setPositions] = useState<any[]>([]);

  // Open position counts for active symbol
  const openSellCount = useMemo(() => {
    return positions.filter((p) => p.symbol === selectedSymbol && p.side === 'SELL').length;
  }, [positions, selectedSymbol]);

  const openBuyCount = useMemo(() => {
    return positions.filter((p) => p.symbol === selectedSymbol && p.side === 'BUY').length;
  }, [positions, selectedSymbol]);

  // Current Symbol Meta
  const activeMeta = useMemo(() => {
    return SYMBOL_REGISTRY.find((s) => s.symbol === selectedSymbol) || SYMBOL_REGISTRY[0];
  }, [selectedSymbol]);

  // Load Accounts
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoadingAccounts(true);
      try {
        const accs = await fetchUserAccounts(user.id);
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccount(accs[0]);
        }
      } catch (err) {
        console.error('Failed to load accounts', err);
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadData();
  }, [user]);

  // Load Positions periodically
  useEffect(() => {
    if (!selectedAccount) return;
    let isMounted = true;
    async function loadPositions() {
      if (!selectedAccount) return;
      try {
        const pos = await fetchAccountPositionsApi(selectedAccount.id);
        if (isMounted) setPositions(pos);
      } catch (err) {
        console.error('Error fetching positions', err);
      }
    }
    loadPositions();
    const interval = setInterval(loadPositions, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedAccount]);

  // Quotes REST initial fetch & Live EventSource stream
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
          setQuotes((prevQuotes) => {
            const historyUpdate: Record<string, 'UP' | 'DOWN' | 'SAME'> = {};
            data.forEach((newQ) => {
              const oldQ = prevQuotes.find((p) => p.symbol === newQ.symbol);
              if (oldQ) {
                if (newQ.bid > oldQ.bid) historyUpdate[newQ.symbol] = 'UP';
                else if (newQ.bid < oldQ.bid) historyUpdate[newQ.symbol] = 'DOWN';
                else historyUpdate[newQ.symbol] = 'SAME';
              }
            });
            setQuoteHistory((prev) => ({ ...prev, ...historyUpdate }));
            return data;
          });
        }
      } catch (err) {
        console.error('Error parsing quote stream:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Active Quote
  const activeQuote = useMemo(() => {
    const found = quotes.find((q) => q.symbol === selectedSymbol);
    if (found) return found;
    return {
      symbol: selectedSymbol,
      bid: 85894.81,
      ask: 85903.39,
      high: 86450.0,
      low: 85200.0,
      change24h: 1.25,
      spread: activeMeta.baseSpread,
    };
  }, [quotes, selectedSymbol, activeMeta]);

  // Real-time market price direction & trend
  const priceTrend = quoteHistory[selectedSymbol] || 'DOWN';

  // Filtered Quotes for Watchlist
  const filteredQuotes = useMemo(() => {
    return SYMBOL_REGISTRY.filter((item) => {
      const matchCategory = marketCategory === 'ALL' || item.category === marketCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [marketCategory, searchQuery]);

  // Quote lookup map for real-time MT5 PnL
  const quoteMap = useMemo(() => {
    const map = new Map<string, { bid: number; ask: number; price?: number }>();
    for (const q of quotes) {
      map.set(q.symbol, { bid: q.bid, ask: q.ask, price: q.price });
    }
    return map;
  }, [quotes]);

  // Live positions calculation
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

  const openPositions = useMemo(() => livePositions.filter((p) => p.status === 'OPEN'), [livePositions]);
  const closedPositions = useMemo(() => livePositions.filter((p) => p.status === 'CLOSED'), [livePositions]);
  const floatingPnl = useMemo(() => openPositions.reduce((sum, p) => sum + (p.floating_pnl || 0), 0), [openPositions]);

  // Account financial calculations
  const accountSize = selectedAccount?.account_size || 100000;
  const startBalance = Number.isFinite(selectedAccount?.starting_balance) ? selectedAccount!.starting_balance! : accountSize;
  const currentBalance = Number.isFinite(selectedAccount?.current_balance) ? selectedAccount!.current_balance! : startBalance;
  const currentEquity = currentBalance + floatingPnl;

  const rules = selectedAccount?.rules || {};
  const isBreached =
    (selectedAccount?.status || '').toLowerCase() === 'failed' ||
    (selectedAccount?.status || '').toLowerCase() === 'breached';
  const isPassed = (selectedAccount?.status || '').toLowerCase() === 'passed';
  const isFunded = (selectedAccount?.status || '').toLowerCase() === 'funded' || selectedAccount?.is_funded;

  // Evaluation target
  const profitTargetPct = rules.profit_target_percent ?? (isFunded ? 0 : selectedAccount?.phase === 2 ? 5 : 8);
  const targetAmount = profitTargetPct > 0 ? (accountSize * profitTargetPct) / 100 : 0;
  const netProfit = Math.max(0, currentEquity - startBalance);
  const targetProgress = targetAmount > 0 ? Math.min(100, Math.max(0, (netProfit / targetAmount) * 100)) : 100;

  // Drawdowns
  const dailyDDPct = rules.daily_loss_limit_percent ?? 5;
  const maxDDPct = rules.max_loss_limit_percent ?? 10;
  const startOfDayEquity = selectedAccount?.start_of_day_equity || accountSize;
  const dailyLossUsed = Math.max(0, startOfDayEquity - currentEquity);
  const dailyLimit = (startOfDayEquity * dailyDDPct) / 100;
  const dailyDDLeft = Math.max(0, dailyLimit - dailyLossUsed);

  const maxLossLimit = (accountSize * maxDDPct) / 100;
  const overallLossUsed = Math.max(0, startBalance - currentEquity);
  const overallDDLeft = Math.max(0, maxLossLimit - overallLossUsed);

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

  // Calculate estimated Risk in USD
  const estimatedRiskAmount = useMemo(() => {
    if (!stopLoss || isNaN(parseFloat(stopLoss))) return null;
    const sl = parseFloat(stopLoss);
    const entry = activeQuote.ask;
    const diff = Math.abs(entry - sl);
    return diff * activeMeta.contractSize * lotSize;
  }, [stopLoss, activeQuote.ask, activeMeta.contractSize, lotSize]);

  // Format price helper
  const formatPrice = useCallback((val: number | undefined, digits: number = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return val.toFixed(digits);
  }, []);

  // Quick Risk % Sizing Handler
  const handleApplyRiskPercent = (percent: number) => {
    const riskDollar = (currentBalance * percent) / 100;
    // Default estimated 50 pips stop loss for lot sizing
    const pipMultiplier = activeMeta.digits === 5 || activeMeta.digits === 3 ? 0.0001 : activeMeta.digits === 2 ? 0.01 : 0.1;
    const assumedDiff = 50 * pipMultiplier;
    const computedLots = Math.max(0.01, Math.min(20, parseFloat((riskDollar / (assumedDiff * activeMeta.contractSize)).toFixed(2))));
    setLotSize(computedLots);
    toast.info(`Calculated ${computedLots} lots based on ${percent}% Risk ($${riskDollar.toFixed(2)})`);
  };

  // Execute Order
  const handleExecuteOrder = async (side: 'BUY' | 'SELL', overrideLot?: number) => {
    if (!selectedAccount || !user) {
      toast.error('Please select an active account.');
      return;
    }
    if (isBreached) {
      toast.error('Account breached: trading is disabled.');
      return;
    }
    const currentLot = overrideLot || lotSize;
    if (currentLot <= 0) {
      toast.error('Please enter a valid lot size.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await executeOrderApi({
        userId: user.id,
        accountId: selectedAccount.id,
        symbol: selectedSymbol,
        type: side,
        lotSize: currentLot,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });

      if (res.success) {
        if (soundEnabled) playTerminalSound('order');
        toast.success(`Market ${side} Executed: ${lotSize} Lots on ${selectedSymbol}`);
        setExecutionLogs((prev) => [
          {
            id: String(Date.now()),
            time: new Date().toLocaleTimeString(),
            msg: `Order #${res.position?.id?.slice(-6) || 'N/A'}: ${side} ${lotSize}L ${selectedSymbol} filled @ ${formatPrice(res.position?.open_price, activeMeta.digits)}`,
            type: 'success',
          },
          ...prev.slice(0, 49),
        ]);

        const updatedPos = await fetchAccountPositionsApi(selectedAccount.id);
        setPositions(updatedPos);
        const updatedAccs = await fetchUserAccounts(user.id);
        setAccounts(updatedAccs);
        const cur = updatedAccs.find((a) => a.id === selectedAccount.id);
        if (cur) setSelectedAccount(cur);
      } else {
        if (soundEnabled) playTerminalSound('error');
        toast.error(res.error || 'Failed to execute order.');
      }
    } catch (err: any) {
      if (soundEnabled) playTerminalSound('error');
      toast.error(err.message || 'Execution failed.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Close Position
  const handleClosePosition = async (posId: string) => {
    if (!selectedAccount || !user) return;
    try {
      const res = await closePositionApi({
        userId: user.id,
        accountId: selectedAccount.id,
        positionId: posId,
      });
      if (res.success) {
        if (soundEnabled) playTerminalSound('close');
        toast.success('Position closed successfully.');
        setExecutionLogs((prev) => [
          {
            id: String(Date.now()),
            time: new Date().toLocaleTimeString(),
            msg: `Position #${posId.slice(-6)} closed with realized PnL: $${(res.closedPosition?.realized_pnl || 0).toFixed(2)}`,
            type: (res.closedPosition?.realized_pnl || 0) >= 0 ? 'success' : 'danger',
          },
          ...prev.slice(0, 49),
        ]);

        const updatedPos = await fetchAccountPositionsApi(selectedAccount.id);
        setPositions(updatedPos);
        const updatedAccs = await fetchUserAccounts(user.id);
        setAccounts(updatedAccs);
        const cur = updatedAccs.find((a) => a.id === selectedAccount.id);
        if (cur) setSelectedAccount(cur);
      } else {
        toast.error(res.error || 'Failed to close position.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error closing position.');
    }
  };

  // Close All Positions
  const handleCloseAll = async () => {
    if (openPositions.length === 0 || !selectedAccount || !user) return;
    setClosingAll(true);
    let count = 0;
    try {
      for (const pos of openPositions) {
        const res = await closePositionApi({
          userId: user.id,
          accountId: selectedAccount.id,
          positionId: pos.id,
        });
        if (res.success) count++;
      }
      if (soundEnabled) playTerminalSound('close');
      toast.success(`Closed all ${count} active positions.`);
      const updatedPos = await fetchAccountPositionsApi(selectedAccount.id);
      setPositions(updatedPos);
      const updatedAccs = await fetchUserAccounts(user.id);
      setAccounts(updatedAccs);
      const cur = updatedAccs.find((a) => a.id === selectedAccount.id);
      if (cur) setSelectedAccount(cur);
    } catch (err: any) {
      toast.error('Failed to close some positions.');
    } finally {
      setClosingAll(false);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loadingAccounts) {
    return (
      <div className="h-screen w-screen bg-[#070b13] flex flex-col items-center justify-center gap-3 text-slate-300">
        <RefreshCw className="h-8 w-8 text-brand-400 animate-spin" />
        <p className="text-sm font-medium tracking-wide">Connecting to FundedShift Institutional ECN...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b14] text-slate-100 overflow-hidden font-sans select-none">
      {/* ========================================================================================= */}
      {/* 1. TOP INSTITUTIONAL COMMAND BAR                                                          */}
      {/* ========================================================================================= */}
      <header className="h-13 bg-[#0a0f1d] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-40 shadow-sm">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  Funded<span className="text-brand-400">Shift</span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 bg-brand-500/15 text-brand-400 border border-brand-500/30 rounded">
                  WEB TERMINAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">FundedShift High-Precision ECN Web Terminal</p>
            </div>
          </Link>

          <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

          {/* Account Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#10172b] hover:bg-[#16213d] border border-slate-700/70 rounded-lg text-xs font-semibold transition-all shadow-inner"
            >
              <Briefcase className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-slate-400">Account:</span>
              <span className="font-mono text-white font-bold">#{selectedAccount?.account_number || '112236'}</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  isBreached
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : isPassed
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                    : isFunded
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {selectedAccount?.status || 'ACTIVE'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Account Switcher Dropdown */}
            <AnimatePresence>
              {accountDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 top-full mt-2 w-72 bg-[#0d1424] border border-slate-700/80 rounded-xl shadow-2xl z-50 p-2 space-y-1.5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Select Trading Account ({accounts.length})
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccount(acc);
                          setAccountDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                          selectedAccount?.id === acc.id
                            ? 'bg-brand-500/20 border border-brand-500/40 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold flex items-center gap-1.5 font-mono">
                            #{acc.account_number}
                            <span className="text-[9px] font-sans px-1 rounded bg-slate-800 text-slate-400">
                              ${(acc.account_size || 100000).toLocaleString()}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{acc.plan_name || 'Evaluation'}</p>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            acc.status === 'FUNDED'
                              ? 'bg-amber-500/20 text-amber-400'
                              : acc.status === 'PASSED'
                              ? 'bg-brand-500/20 text-brand-400'
                              : acc.status === 'BREACHED' || acc.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Global Trading Sessions & Low Latency */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-2 bg-[#10172b] px-3 py-1 rounded-md border border-slate-800">
            <span className="text-slate-500">SESSIONS:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LONDON
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> NEW YORK
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-500">TOKYO</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>11ms Direct ECN</span>
          </div>
        </div>

        {/* Right: Quick Tools & Exit */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.info(soundEnabled ? 'Audio alerts muted' : 'Audio alerts enabled');
            }}
            className="p-2 rounded-lg bg-[#10172b] hover:bg-[#17223b] text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-brand-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#10172b] hover:bg-[#17223b] text-slate-400 hover:text-white border border-slate-800 transition-colors hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Exit Terminal */}
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* ========================================================================================= */}
      {/* 2. PROP FIRM OBJECTIVES & RISK METRICS HUD RIBBON                                         */}
      {/* ========================================================================================= */}
      <section className="bg-[#0b1222] border-b border-slate-800/70 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Metric 1: Live Equity & Balance */}
        <div className="flex items-center gap-5">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">BALANCE</span>
            <span className="text-sm font-bold font-mono text-white">
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">LIVE EQUITY</span>
            <span className={`text-sm font-bold font-mono ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">FLOATING P/L</span>
            <span className={`text-sm font-bold font-mono ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {floatingPnl >= 0 ? `+$${floatingPnl.toFixed(2)}` : `-$${Math.abs(floatingPnl).toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Metric 2: Target & Drawdown Buffers */}
        <div className="flex items-center gap-6 flex-wrap">
          {/* Target Progress */}
          {targetAmount > 0 && (
            <div className="flex items-center gap-2 min-w-[170px]">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                  <span className="flex items-center gap-1 text-brand-300">
                    <Award className="h-3 w-3" /> Profit Target
                  </span>
                  <span className="font-mono text-white font-bold">{targetProgress.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Daily Drawdown Safe Buffer */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">DAILY LOSS BUFFER</span>
              <span className="font-mono text-amber-400 font-bold text-xs">
                ${dailyDDLeft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Max Overall Drawdown Safe Buffer */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">MAX LOSS BUFFER</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                ${overallDDLeft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Free Margin */}
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 block font-semibold">FREE MARGIN</span>
            <span className="font-mono text-slate-200 font-bold text-xs">
              ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 3. MAIN TERMINAL WORKSPACE                                                                */}
      {/* ========================================================================================= */}
      <main className="flex-1 flex overflow-hidden">
        {/* --------------------------------------------------------------------------------------- */}
        {/* 3A. LEFT PANEL: MARKET WATCH & INSTRUMENT SCREENER (310px)                              */}
        {/* --------------------------------------------------------------------------------------- */}
        <aside className="w-[300px] bg-[#090e1c] border-r border-slate-800/80 flex flex-col shrink-0">
          {/* Category Tabs */}
          <div className="p-2 border-b border-slate-800/80 grid grid-cols-5 gap-1 bg-[#0c1326]">
            {(['ALL', 'FOREX', 'COMMODITIES', 'CRYPTO', 'INDICES'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setMarketCategory(cat)}
                className={`py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all text-center ${
                  marketCategory === cat
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat === 'COMMODITIES' ? 'METALS' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="p-2.5 border-b border-slate-800/80">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol (e.g. BTC, XAU)..."
                className="w-full bg-[#121b33] border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Watchlist Table Headers */}
          <div className="px-3 py-1.5 bg-[#0a0f1f] border-b border-slate-800/80 grid grid-cols-12 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
            <span className="col-span-5">SYMBOL</span>
            <span className="col-span-4 text-right">BID</span>
            <span className="col-span-3 text-right">24H</span>
          </div>

          {/* Watchlist Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar">
            {filteredQuotes.map((item) => {
              const liveQuote = quotes.find((q) => q.symbol === item.symbol);
              const bid = liveQuote?.bid ?? (item.symbol === 'BTCUSD' ? 85894.81 : 1.1472);
              const change = liveQuote?.change24h ?? 0.85;
              const isSelected = item.symbol === selectedSymbol;
              const trend = quoteHistory[item.symbol] || 'SAME';

              return (
                <button
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`w-full px-3 py-2 text-left grid grid-cols-12 items-center transition-all ${
                    isSelected
                      ? 'bg-brand-500/15 border-l-2 border-brand-400 text-white'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {/* Symbol & Name */}
                  <div className="col-span-5">
                    <p className="font-bold text-xs text-white flex items-center gap-1 font-mono">
                      {item.symbol}
                      {item.symbol === 'BTCUSD' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                      {item.symbol === 'XAUUSD' && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.name}</p>
                  </div>

                  {/* Bid Price with tick animation */}
                  <div className="col-span-4 text-right">
                    <span
                      className={`font-mono text-xs font-semibold px-1 rounded transition-colors ${
                        trend === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : trend === 'DOWN'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {formatPrice(bid, item.digits)}
                    </span>
                    <p className="text-[9px] text-slate-500 font-mono">Spr: {item.baseSpread}</p>
                  </div>

                  {/* 24h Change */}
                  <div className="col-span-3 text-right">
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Market Sentiment Bar */}
          <div className="p-3 bg-[#0a0f1f] border-t border-slate-800/80 text-[10px]">
            <div className="flex justify-between text-slate-400 font-semibold mb-1">
              <span className="text-emerald-400">BUYERS 62%</span>
              <span className="text-slate-500 font-bold uppercase">{selectedSymbol} Sentiment</span>
              <span className="text-rose-400">SELLERS 38%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: '62%' }} />
              <div className="h-full bg-rose-500" style={{ width: '38%' }} />
            </div>
          </div>
        </aside>

        {/* --------------------------------------------------------------------------------------- */}
        {/* 3B. CENTER: BESPOKE FUNDEDSHIFT HIGH-PRECISION CHART WITH LIVE ASK & BID LINES          */}
        {/* --------------------------------------------------------------------------------------- */}
        <section className="flex-1 flex flex-col bg-[#070b14] overflow-hidden p-2">
          <TerminalChart
            symbol={activeMeta.symbol}
            name={activeMeta.name}
            digits={activeMeta.digits}
            category={activeMeta.category}
            quote={activeQuote}
            positions={positions}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf as any)}
            onQuickOrder={(type, lots) => {
              setLotSize(lots);
              handleExecuteOrder(type, lots);
            }}
            submittingOrder={submittingOrder}
          />
        </section>

        {/* --------------------------------------------------------------------------------------- */}
        {/* 3C. RIGHT PANEL: INSTITUTIONAL ORDER TICKET & RISK DESK (320px)                         */}
        {/* --------------------------------------------------------------------------------------- */}
        <aside className="w-[320px] bg-[#0a0f1e] border-l border-slate-800/80 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          {/* Panel Header */}
          <div className="p-3.5 border-b border-slate-800/80 bg-[#0c1326] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-400" />
              <h3 className="font-bold text-xs tracking-wider uppercase text-white">Order Execution</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Lev 1:{leverage}
            </span>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* Order Type Selector */}
            <div className="grid grid-cols-2 gap-1.5 bg-[#10172c] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setOrderType('MARKET')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orderType === 'MARKET' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Market Order
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orderType === 'LIMIT' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Limit
              </button>
            </div>

            {/* Selected Symbol Display Card */}
            <div className="bg-[#11182d] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-sm text-white">{activeMeta.symbol}</p>
                <p className="text-[10px] text-slate-400">{activeMeta.name}</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs font-bold text-emerald-400 block">{formatPrice(activeQuote.ask, activeMeta.digits)}</span>
                <span className="text-[10px] text-slate-500">Spread: {activeMeta.baseSpread} pips</span>
              </div>
            </div>

            {/* Lot Size Stepper */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-semibold">Volume (Lots)</label>
                <span className="text-[10px] font-mono text-slate-400">1 Lot = {activeMeta.contractSize.toLocaleString()} units</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLotSize((prev) => Math.max(0.01, parseFloat((prev - 0.1).toFixed(2))))}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors border border-slate-700"
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
                  className="flex-1 bg-[#121a30] border border-slate-700/80 rounded-lg py-2 text-center text-white font-bold font-mono text-sm focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setLotSize((prev) => parseFloat((prev + 0.1).toFixed(2)))}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors border border-slate-700"
                >
                  +
                </button>
              </div>

              {/* Quick Lot Presets */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[0.01, 0.1, 0.5, 1.0, 5.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLotSize(val)}
                    className={`py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                      lotSize === val ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {val}L
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Risk % Preset Calculator */}
            <div className="bg-[#10172c] border border-slate-800/80 p-2.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Shield className="h-3 w-3 text-brand-400" /> Account Risk Presets
                </span>
                <span className="text-[10px] text-slate-500">Auto-sizing</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0.5, 1.0, 2.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyRiskPercent(pct)}
                    className="py-1 rounded-lg bg-[#16203a] hover:bg-brand-500/20 text-brand-300 hover:text-white border border-slate-700/60 text-[10px] font-bold font-mono transition-all"
                  >
                    Risk {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* If Limit Order: Limit Entry Price */}
            {orderType === 'LIMIT' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Limit Entry Price</label>
                <input
                  type="number"
                  step="any"
                  placeholder={activeQuote.bid.toString()}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-[#121a30] border border-slate-700/80 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Stop Loss</span>
                  <span className="text-[9px] text-rose-400">SL</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Optional price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-[#121a30] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Take Profit</span>
                  <span className="text-[9px] text-emerald-400">TP</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Optional price"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-[#121a30] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Risk Projection Display */}
            {estimatedRiskAmount !== null && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-[10px] text-rose-400 flex items-center justify-between font-mono">
                <span>Estimated Risk at SL:</span>
                <span className="font-bold">-${estimatedRiskAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Margin Required & Financial Specs */}
            <div className="bg-[#0f1629] p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Required Margin</span>
                <span className="font-mono text-white font-bold">${marginRequired.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Free Margin Available</span>
                <span className="font-mono text-emerald-400 font-bold">${freeMargin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Contract Size</span>
                <span className="font-mono text-slate-300">{activeMeta.contractSize.toLocaleString()} units</span>
              </div>
            </div>

            {/* Primary Order Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* SELL BUTTON */}
              <button
                disabled={submittingOrder || isBreached}
                onClick={() => handleExecuteOrder('SELL')}
                className="py-3 px-3 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
              >
                <div className="flex items-center gap-1 text-xs">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span>SELL / SHORT</span>
                </div>
                <span className="font-mono text-sm font-black tracking-tight">
                  {formatPrice(activeQuote.bid, activeMeta.digits)}
                </span>
              </button>

              {/* BUY BUTTON */}
              <button
                disabled={submittingOrder || isBreached}
                onClick={() => handleExecuteOrder('BUY')}
                className="py-3 px-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
              >
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>BUY / LONG</span>
                </div>
                <span className="font-mono text-sm font-black tracking-tight">
                  {formatPrice(activeQuote.ask, activeMeta.digits)}
                </span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* ========================================================================================= */}
      {/* 4. BOTTOM DOCKABLE INSTITUTIONAL TRADING DESK (240px)                                     */}
      {/* ========================================================================================= */}
      <footer className="h-60 bg-[#090e1c] border-t border-slate-800/80 flex flex-col shrink-0">
        {/* Tab Headers */}
        <div className="h-9 bg-[#0b1224] border-b border-slate-800/80 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { id: 'POSITIONS', label: `Open Positions (${openPositions.length})` },
              { id: 'HISTORY', label: `Closed Trades (${closedPositions.length})` },
              { id: 'RULES', label: 'Evaluation Rules Compliance' },
              { id: 'LOGS', label: `Execution Journal (${executionLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBottomTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 ${
                  activeBottomTab === tab.id
                    ? 'border-brand-400 text-white bg-slate-800/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bulk Close All Button */}
          {openPositions.length > 0 && (
            <button
              disabled={closingAll}
              onClick={handleCloseAll}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              <span>{closingAll ? 'Closing All...' : 'Close All Positions'}</span>
            </button>
          )}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* TAB 1: POSITIONS */}
          {activeBottomTab === 'POSITIONS' && (
            <div className="min-w-full">
              {openPositions.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Activity className="h-6 w-6 text-slate-600 mb-2" />
                  <p>No active positions on Account #{selectedAccount?.account_number || 'N/A'}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Execute an order from the desk or chart to begin</p>
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0b1224] text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">TICKET</th>
                      <th className="px-3 py-2">SYMBOL</th>
                      <th className="px-3 py-2">TYPE</th>
                      <th className="px-3 py-2">LOTS</th>
                      <th className="px-3 py-2">ENTRY</th>
                      <th className="px-3 py-2">CURRENT</th>
                      <th className="px-3 py-2">SL</th>
                      <th className="px-3 py-2">TP</th>
                      <th className="px-3 py-2">MARGIN</th>
                      <th className="px-3 py-2 text-right">FLOATING P/L</th>
                      <th className="px-3 py-2 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {openPositions.map((pos) => {
                      const isProfit = (pos.floating_pnl || 0) >= 0;
                      const posMeta = SYMBOL_REGISTRY.find((s) => s.symbol === pos.symbol);
                      const digits = posMeta?.digits ?? 2;

                      return (
                        <tr key={pos.id} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-slate-400">#{pos.id.slice(-6)}</td>
                          <td className="px-3 py-2 font-bold text-white font-sans">{pos.symbol}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                pos.type === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {pos.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-200 font-semibold">{pos.lot_size}</td>
                          <td className="px-3 py-2 text-slate-300">{formatPrice(pos.open_price, digits)}</td>
                          <td className="px-3 py-2 text-white font-bold">{formatPrice(pos.current_price, digits)}</td>
                          <td className="px-3 py-2 text-slate-400">{pos.stop_loss ? formatPrice(pos.stop_loss, digits) : '-'}</td>
                          <td className="px-3 py-2 text-slate-400">{pos.take_profit ? formatPrice(pos.take_profit, digits) : '-'}</td>
                          <td className="px-3 py-2 text-slate-400">${(pos.margin || 0).toFixed(2)}</td>
                          <td className={`px-3 py-2 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? `+$${(pos.floating_pnl || 0).toFixed(2)}` : `-$${Math.abs(pos.floating_pnl || 0).toFixed(2)}`}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => handleClosePosition(pos.id)}
                              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-bold transition-all"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {activeBottomTab === 'HISTORY' && (
            <div className="min-w-full">
              {closedPositions.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <History className="h-6 w-6 text-slate-600 mb-2" />
                  <p>No closed trade history on this account yet</p>
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0b1224] text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">TICKET</th>
                      <th className="px-3 py-2">SYMBOL</th>
                      <th className="px-3 py-2">TYPE</th>
                      <th className="px-3 py-2">LOTS</th>
                      <th className="px-3 py-2">ENTRY</th>
                      <th className="px-3 py-2">CLOSE</th>
                      <th className="px-3 py-2">REASON</th>
                      <th className="px-3 py-2 text-right">REALIZED P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {closedPositions.map((pos) => {
                      const isProfit = (pos.realized_pnl || 0) >= 0;
                      const posMeta = SYMBOL_REGISTRY.find((s) => s.symbol === pos.symbol);
                      const digits = posMeta?.digits ?? 2;

                      return (
                        <tr key={pos.id} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-slate-400">#{pos.id.slice(-6)}</td>
                          <td className="px-3 py-2 font-bold text-white font-sans">{pos.symbol}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {pos.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-200">{pos.lot_size}</td>
                          <td className="px-3 py-2 text-slate-300">{formatPrice(pos.open_price, digits)}</td>
                          <td className="px-3 py-2 text-slate-300">{formatPrice(pos.close_price, digits)}</td>
                          <td className="px-3 py-2 text-slate-400 text-[10px]">{pos.close_reason || 'MANUAL'}</td>
                          <td className={`px-3 py-2 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? `+$${(pos.realized_pnl || 0).toFixed(2)}` : `-$${Math.abs(pos.realized_pnl || 0).toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: RULES COMPLIANCE */}
          {activeBottomTab === 'RULES' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#0e162b] border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Daily Loss Limit</span>
                  <span className="text-amber-400 font-bold">{dailyDDPct}%</span>
                </div>
                <p className="text-white font-bold font-mono text-sm">
                  ${dailyLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })} Max
                </p>
                <p className="text-[10px] text-emerald-400">Safe: ${dailyDDLeft.toFixed(2)} remaining</p>
              </div>

              <div className="bg-[#0e162b] border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Max Overall Loss</span>
                  <span className="text-rose-400 font-bold">{maxDDPct}%</span>
                </div>
                <p className="text-white font-bold font-mono text-sm">
                  ${maxLossLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })} Max
                </p>
                <p className="text-[10px] text-emerald-400">Safe: ${overallDDLeft.toFixed(2)} remaining</p>
              </div>

              <div className="bg-[#0e162b] border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Profit Target</span>
                  <span className="text-brand-400 font-bold">{profitTargetPct}%</span>
                </div>
                <p className="text-white font-bold font-mono text-sm">
                  ${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Target
                </p>
                <p className="text-[10px] text-brand-300 font-semibold">{targetProgress.toFixed(1)}% Achieved</p>
              </div>

              <div className="bg-[#0e162b] border border-slate-800 p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Account Rules Status</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-bold uppercase text-sm">Fully Compliant</p>
                <p className="text-[10px] text-slate-400">
                  {rules.news_trading === false || (rules as any).news_trading_allowed === false || selectedAccount?.challenge_id?.includes('inst')
                    ? 'Weekend Holding Permitted · News Trading Restricted'
                    : 'Weekend Holding & News Trading Permitted'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: EXECUTION LOGS */}
          {activeBottomTab === 'LOGS' && (
            <div className="p-3 font-mono text-xs space-y-1">
              {executionLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-0.5 text-[11px]">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'danger'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }
                  >
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
