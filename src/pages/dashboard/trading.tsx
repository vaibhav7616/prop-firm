import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Search,
  ShieldAlert,
  History,
  Briefcase,
  Crosshair,
  Zap,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  fetchUserAccounts,
  executeOrderApi,
  closePositionApi,
  fetchAccountPositionsApi,
} from '@/lib/api-client';
import type { TradingAccount, OrderType } from '@/types';
import { toast } from 'sonner';
import { calculateMT5PnL } from '@/utils/mt5';

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
}

export function DashboardTrading() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<Record<string, 'UP' | 'DOWN' | 'SAME'>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [assetCategory, setAssetCategory] = useState<'ALL' | 'FOREX' | 'COMMODITIES' | 'INDICES' | 'CRYPTO'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  
  const [positions, setPositions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'HISTORY' | 'RULES'>('POSITIONS');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [closingAll, setClosingAll] = useState<boolean>(false);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);

  // Load Accounts
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoadingAccounts(true);
      const accs = await fetchUserAccounts(user.id);
      setAccounts(accs);
      if (accs.length > 0) {
        setSelectedAccount(accs[0]);
      }
      setLoadingAccounts(false);
    }
    loadData();
  }, [user]);

  // Load Positions when account changes
  useEffect(() => {
    async function loadPositions() {
      if (!selectedAccount) return;
      const pos = await fetchAccountPositionsApi(selectedAccount.id);
      setPositions(pos);
    }
    loadPositions();
    const interval = setInterval(loadPositions, 1000);
    return () => clearInterval(interval);
  }, [selectedAccount]);

  // Initial Market Quotes Load & Live Stream
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

  const formatPrice = (val: number, symbol: string) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    if (['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP'].includes(symbol)) {
      return val.toFixed(5);
    }
    if (['USDJPY', 'EURJPY', 'GBPJPY', 'XAGUSD'].includes(symbol)) {
      return val.toFixed(3);
    }
    if (['NAS100', 'US30', 'SPX500', 'GER40'].includes(symbol)) {
      return val.toFixed(2);
    }
    return val.toFixed(2);
  };

  const activeQuote = quotes.find((q) => q.symbol === selectedSymbol) || {
    symbol: selectedSymbol,
    bid: 0,
    ask: 0,
    high: 0,
    low: 0,
    change24h: 0,
    isMarketOpen: true,
  };

  const filteredQuotes = quotes.filter((q) => {
    if (searchQuery.trim()) {
      return q.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (assetCategory === 'ALL') return true;
    if (assetCategory === 'FOREX') {
      return ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'].includes(q.symbol);
    }
    if (assetCategory === 'COMMODITIES') {
      return ['XAUUSD', 'XAGUSD', 'USOIL'].includes(q.symbol);
    }
    if (assetCategory === 'INDICES') {
      return ['NAS100', 'US30', 'SPX500', 'GER40'].includes(q.symbol);
    }
    if (assetCategory === 'CRYPTO') {
      return ['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(q.symbol);
    }
    return true;
  });

  const handleExecuteOrder = async (sideOverride?: OrderType) => {
    if (!selectedAccount || !user) {
      toast.error('Please select an active trading account.');
      return;
    }

    if (lotSize <= 0) {
      toast.error('Lot size must be greater than 0.');
      return;
    }

    if (activeQuote?.isMarketOpen === false) {
      toast.error(`Market for ${selectedSymbol} is currently CLOSED (Weekend). Trading resumes Sunday 22:00 UTC.`);
      return;
    }

    const sideToExecute = sideOverride || orderType;

    setSubmitting(true);
    const res = await executeOrderApi({
      userId: user.id,
      accountId: selectedAccount.id,
      symbol: selectedSymbol,
      type: sideToExecute,
      lotSize,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    });

    setSubmitting(false);

    if (res.success) {
      toast.success(`${sideToExecute} order executed for ${lotSize} lots on ${selectedSymbol}`);
      const updatedPos = await fetchAccountPositionsApi(selectedAccount.id);
      setPositions(updatedPos);
      const updatedAccs = await fetchUserAccounts(user.id);
      setAccounts(updatedAccs);
      const current = updatedAccs.find((a) => a.id === selectedAccount.id);
      if (current) setSelectedAccount(current);
    } else {
      toast.error(res.error || 'Failed to execute order.');
    }
  };

  const handleClosePosition = async (positionId: string) => {
    if (!selectedAccount || !user) return;
    const res = await closePositionApi({
      userId: user.id,
      accountId: selectedAccount.id,
      positionId,
    });

    if (res.success) {
      toast.success('Position closed successfully.');
      const updatedPos = await fetchAccountPositionsApi(selectedAccount.id);
      setPositions(updatedPos);
      const updatedAccs = await fetchUserAccounts(user.id);
      setAccounts(updatedAccs);
      const current = updatedAccs.find((a) => a.id === selectedAccount.id);
      if (current) setSelectedAccount(current);
    } else {
      toast.error(res.error || 'Failed to close position.');
    }
  };

  const handleCloseAllPositions = async () => {
    const openPos = positions.filter((p) => p.status === 'OPEN');
    if (openPos.length === 0 || !selectedAccount || !user) return;

    setClosingAll(true);
    let count = 0;
    for (const pos of openPos) {
      const res = await closePositionApi({
        userId: user.id,
        accountId: selectedAccount.id,
        positionId: pos.id,
      });
      if (res.success) count++;
    }
    setClosingAll(false);
    toast.success(`Closed ${count} active positions.`);

    const updatedPos = await fetchAccountPositionsApi(selectedAccount.id);
    setPositions(updatedPos);
    const updatedAccs = await fetchUserAccounts(user.id);
    setAccounts(updatedAccs);
    const current = updatedAccs.find((a) => a.id === selectedAccount.id);
    if (current) setSelectedAccount(current);
  };

  if (loadingAccounts) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Connecting to ECN Market Data & Matching Engine...</p>
      </div>
    );
  }

  // Live position floating PnL calculation based on real-time streaming quotes using official MT5 formula
  const quoteMap = new Map<string, { bid: number; ask: number; price?: number }>();
  for (const q of quotes) {
    quoteMap.set(q.symbol, { bid: q.bid, ask: q.ask, price: q.price });
  }

  const livePositions = positions.map((pos) => {
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

  const openPositions = livePositions.filter((p) => p.status === 'OPEN');
  const closedPositions = livePositions.filter((p) => p.status === 'CLOSED');
  const totalFloatingPnl = openPositions.reduce((sum, p) => sum + (p.floating_pnl || 0), 0);

  // Live Account Financial Metrics
  const startingBalance = selectedAccount?.starting_balance || selectedAccount?.account_size || 100000;
  const currentBalance = selectedAccount?.current_balance ?? startingBalance;
  const liveEquity = currentBalance + totalFloatingPnl;

  const startOfDayBaseline = Math.max(
    selectedAccount?.start_of_day_balance || startingBalance,
    selectedAccount?.start_of_day_equity || startingBalance
  );

  const dailyLimitPercent = selectedAccount?.rules?.daily_loss_limit_percent ?? selectedAccount?.rules?.daily_drawdown ?? 5;
  const maxDailyAllowedLoss = (dailyLimitPercent / 100) * startOfDayBaseline;
  const currentDailyLoss = Math.max(0, startOfDayBaseline - liveEquity);
  const dailyLossLeft = Math.max(0, maxDailyAllowedLoss - currentDailyLoss);

  const openPositionsForSymbol = openPositions.filter((p) => p.symbol === selectedSymbol);

  return (
    <div className="space-y-6">
      {/* Top Header & Account Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-slate-300 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 font-bold shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              Funded Shift Terminal
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                ECN Matcher Active
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Institutional execution with sub-millisecond price ticks & instant rule monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground shrink-0">Account:</label>
          <select
            value={selectedAccount?.id || ''}
            onChange={(e) => {
              const acc = accounts.find((a) => a.id === e.target.value);
              if (acc) setSelectedAccount(acc);
            }}
            className="w-full sm:w-72 bg-background border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                #{acc.account_number} ({acc.plan_name || `$${acc.account_size.toLocaleString()}`}) - {acc.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Account Metrics Ribbon */}
      {selectedAccount && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-slate-300 p-3.5 rounded-2xl shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Balance</p>
            <p className="text-lg font-bold font-display text-foreground mt-0.5">
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-card border border-slate-300 p-3.5 rounded-2xl shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Equity</p>
            <p className={`text-lg font-bold font-display mt-0.5 ${totalFloatingPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${liveEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-card border border-slate-300 p-3.5 rounded-2xl shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Floating P/L</p>
            <p className={`text-lg font-bold font-display mt-0.5 ${totalFloatingPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalFloatingPnl >= 0 ? '+' : ''}${totalFloatingPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-card border border-slate-300 p-3.5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Daily Loss Left</p>
              <span className="text-[10px] font-mono text-muted-foreground">({dailyLimitPercent}%)</span>
            </div>
            <p className="text-lg font-bold font-display text-amber-500 mt-0.5">
              ${dailyLossLeft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Loss: ${currentDailyLoss.toFixed(2)} / ${maxDailyAllowedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-card border border-slate-300 p-3.5 rounded-2xl shadow-sm col-span-2 md:col-span-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${
                  selectedAccount.status === 'ACTIVE' || selectedAccount.status === 'FUNDED'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}
              >
                {selectedAccount.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Terminal Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Watchlist Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-slate-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-500" /> ECN Market Quotes
              </h3>
              {activeQuote?.isMarketOpen === false ? (
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold">
                  <Clock className="h-3 w-3" /> Market Closed (Weekend)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Live 200ms
                </span>
              )}
            </div>

            {/* Asset Category Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'FOREX', 'COMMODITIES', 'INDICES', 'CRYPTO'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAssetCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors border ${
                    assetCategory === cat
                      ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground border-slate-300 hover:text-foreground'
                  }`}
                >
                  {cat === 'COMMODITIES' ? 'METALS' : cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol (e.g. XAUUSD, EURUSD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            {/* Symbols Watchlist List */}
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredQuotes.map((q) => {
                const isSelected = q.symbol === selectedSymbol;
                const priceTrend = quoteHistory[q.symbol];
                return (
                  <button
                    key={q.symbol}
                    onClick={() => setSelectedSymbol(q.symbol)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/50 text-foreground font-bold shadow-sm'
                        : 'bg-background/50 border-border/50 hover:bg-secondary/60 text-muted-foreground'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground font-display">{q.symbol}</span>
                        {q.symbol === 'XAUUSD' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                            Gold
                          </span>
                        )}
                        {q.isMarketOpen === false && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-bold">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Spr: {['NAS100', 'US30', 'SPX500', 'GER40'].includes(q.symbol)
                          ? `${(q.ask - q.bid).toFixed(1)} pts`
                          : ['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(q.symbol)
                          ? `$${(q.ask - q.bid).toFixed(1)}`
                          : `${((q.ask - q.bid) * (q.symbol.includes('JPY') ? 100 : q.symbol.includes('XAU') ? 10 : 10000)).toFixed(1)} pips`}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 font-mono text-xs font-bold">
                        <span
                          className={`transition-colors duration-150 ${
                            priceTrend === 'UP'
                              ? 'text-emerald-500 bg-emerald-500/10 px-1 rounded'
                              : priceTrend === 'DOWN'
                              ? 'text-rose-500 bg-rose-500/10 px-1 rounded'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatPrice(q.bid, q.symbol)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          q.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {q.change24h >= 0 ? '+' : ''}
                        {q.change24h}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Chart & Quick Trade Bar */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-slate-300 rounded-2xl p-5 space-y-5">
            {/* Symbol Title & Live BID / ASK Prices */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
              <div className="min-w-0 w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 leading-tight">
                    {selectedSymbol} Interactive Chart
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-slate-300 whitespace-nowrap">
                      1:100 ECN
                    </span>
                    {activeQuote.isMarketOpen === false ? (
                      <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" /> MARKET CLOSED
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold flex items-center gap-1 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> LIVE MARKET
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-0.5">Real-time TradingView technical candles & indicators</p>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs sm:text-sm pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80 w-full sm:w-auto justify-between sm:justify-end">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">BID PRICE</span>
                  <span className="font-bold text-rose-500 text-sm sm:text-base">{formatPrice(activeQuote.bid, selectedSymbol)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">ASK PRICE</span>
                  <span className="font-bold text-emerald-500 text-sm sm:text-base">{formatPrice(activeQuote.ask, selectedSymbol)}</span>
                </div>
              </div>
            </div>

            {/* Compact Active Executions Banner for Selected Symbol */}
            {openPositionsForSymbol.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-white">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Active Executions ({openPositionsForSymbol.length})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {openPositionsForSymbol.map((pos) => {
                    const isProfit = (pos.floating_pnl || 0) >= 0;
                    return (
                      <div
                        key={pos.id}
                        className="bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-lg flex items-center gap-2.5 text-xs font-mono"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {pos.type} {pos.lot_size}L
                        </span>
                        <span className="text-slate-300">
                          Entry: <span className="font-bold text-white">${pos.open_price}</span>
                        </span>
                        <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${pos.floating_pnl?.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleClosePosition(pos.id)}
                          className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold transition-all ml-1"
                        >
                          Close
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TradingView Widget Chart Container */}
            <div className="w-full h-[450px] bg-background border border-slate-300 rounded-xl overflow-hidden relative shadow-sm">
              <iframe
                key={selectedSymbol}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${
                  selectedSymbol === 'XAUUSD'
                    ? 'OANDA%3AXAUUSD'
                    : selectedSymbol === 'XAGUSD'
                    ? 'TVC%3ASILVER'
                    : selectedSymbol === 'EURUSD'
                    ? 'OANDA%3AEURUSD'
                    : selectedSymbol === 'GBPUSD'
                    ? 'OANDA%3AGBPUSD'
                    : selectedSymbol === 'USDJPY'
                    ? 'OANDA%3AUSDJPY'
                    : selectedSymbol === 'AUDUSD'
                    ? 'OANDA%3AAUDUSD'
                    : selectedSymbol === 'USDCAD'
                    ? 'OANDA%3AUSDCAD'
                    : selectedSymbol === 'USDCHF'
                    ? 'OANDA%3AUSDCHF'
                    : selectedSymbol === 'NZDUSD'
                    ? 'OANDA%3ANZDUSD'
                    : selectedSymbol === 'EURGBP'
                    ? 'OANDA%3AEURGBP'
                    : selectedSymbol === 'EURJPY'
                    ? 'OANDA%3AEURJPY'
                    : selectedSymbol === 'GBPJPY'
                    ? 'OANDA%3AGBPJPY'
                    : selectedSymbol === 'NAS100'
                    ? 'NASDAQ%3ANDX'
                    : selectedSymbol === 'US30'
                    ? 'OANDA%3AUS30USD'
                    : selectedSymbol === 'SPX500'
                    ? 'SP%3ASPX'
                    : selectedSymbol === 'GER40'
                    ? 'OANDA%3ADE30EUR'
                    : selectedSymbol === 'BTCUSD'
                    ? 'BINANCE%3ABTCUSDT'
                    : selectedSymbol === 'ETHUSD'
                    ? 'BINANCE%3AETHUSDT'
                    : selectedSymbol === 'SOLUSD'
                    ? 'BINANCE%3ASOLUSDT'
                    : selectedSymbol
                }&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost`}
                className="w-full h-full border-0"
                title={`${selectedSymbol} Live Chart`}
              />
            </div>

            {/* Quick Order Control Bar */}
            <div className="bg-background/80 border border-slate-300 p-4 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Configuration</span>
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="text-muted-foreground font-semibold text-[11px] mr-1">Quick Lots:</span>
                  {[0.01, 0.1, 0.5, 1.0, 5.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLotSize(val)}
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] transition-colors border ${
                        lotSize === val ? 'bg-brand-500 text-white border-brand-600' : 'bg-secondary text-muted-foreground border-slate-300 hover:text-foreground'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="50"
                    value={lotSize}
                    onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
                    className="w-full bg-card border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Stop Loss Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Optional SL"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-card border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Take Profit Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Optional TP"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-card border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                {activeQuote.isMarketOpen === false ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-500 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Clock className="h-4 w-4" /> Market Closed (Weekend) — Opens Sunday 22:00 UTC
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('BUY');
                        handleExecuteOrder('BUY');
                      }}
                      disabled={submitting || (selectedAccount?.status !== 'ACTIVE' && selectedAccount?.status !== 'FUNDED')}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center transition-all disabled:opacity-50 active:scale-95"
                    >
                      <span>BUY {selectedSymbol}</span>
                      <span className="text-[10px] font-mono opacity-90">{formatPrice(activeQuote.ask, selectedSymbol)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('SELL');
                        handleExecuteOrder('SELL');
                      }}
                      disabled={submitting || (selectedAccount?.status !== 'ACTIVE' && selectedAccount?.status !== 'FUNDED')}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex flex-col items-center justify-center transition-all disabled:opacity-50 active:scale-95"
                    >
                      <span>SELL {selectedSymbol}</span>
                      <span className="text-[10px] font-mono opacity-90">{formatPrice(activeQuote.bid, selectedSymbol)}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Tabs: Open Positions, History, Account Rules */}
          <div className="bg-card border border-slate-300 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('POSITIONS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'POSITIONS'
                      ? 'bg-brand-500 text-white'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" /> Open Positions ({openPositions.length})
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'HISTORY'
                      ? 'bg-brand-500 text-white'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <History className="h-3.5 w-3.5" /> Closed History ({closedPositions.length})
                </button>
                <button
                  onClick={() => setActiveTab('RULES')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'RULES'
                      ? 'bg-brand-500 text-white'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Account Rules
                </button>
              </div>

              {activeTab === 'POSITIONS' && openPositions.length > 0 && (
                <button
                  onClick={handleCloseAllPositions}
                  disabled={closingAll}
                  className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  {closingAll ? <RefreshCw className="h-3 w-3 animate-spin" /> : null} Close All Positions
                </button>
              )}
            </div>

            {/* TAB CONTENT: OPEN POSITIONS */}
            {activeTab === 'POSITIONS' && (
              openPositions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs border border-dashed border-border/60 rounded-xl">
                  No open market positions for account #{selectedAccount?.account_number}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/50 text-muted-foreground font-semibold uppercase">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Symbol</th>
                        <th className="p-2.5">Side</th>
                        <th className="p-2.5">Lots</th>
                        <th className="p-2.5">Open Price</th>
                        <th className="p-2.5">Current Price</th>
                        <th className="p-2.5">Stop Loss</th>
                        <th className="p-2.5">Take Profit</th>
                        <th className="p-2.5">Floating P/L</th>
                        <th className="p-2.5 rounded-r-lg text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {openPositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="p-2.5 font-bold text-foreground">{pos.symbol}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pos.type === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}
                            >
                              {pos.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-semibold">{pos.lot_size}</td>
                          <td className="p-2.5 font-mono">{formatPrice(pos.open_price, pos.symbol)}</td>
                          <td className="p-2.5 font-mono font-semibold text-slate-700">
                            {formatPrice(pos.current_price || (pos.type === 'BUY' ? activeQuote.bid : activeQuote.ask), pos.symbol)}
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">{pos.stop_loss ? formatPrice(pos.stop_loss, pos.symbol) : '—'}</td>
                          <td className="p-2.5 font-mono text-muted-foreground">{pos.take_profit ? formatPrice(pos.take_profit, pos.symbol) : '—'}</td>
                          <td className="p-2.5 font-mono font-bold">
                            <span className={pos.floating_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                              {pos.floating_pnl >= 0 ? '+' : ''}${pos.floating_pnl?.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleClosePosition(pos.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs transition-colors"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TAB CONTENT: CLOSED HISTORY */}
            {activeTab === 'HISTORY' && (
              closedPositions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs border border-dashed border-border/60 rounded-xl">
                  No closed trade history recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/50 text-muted-foreground font-semibold uppercase">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Symbol</th>
                        <th className="p-2.5">Side</th>
                        <th className="p-2.5">Lots</th>
                        <th className="p-2.5">Open Price</th>
                        <th className="p-2.5">Close Price</th>
                        <th className="p-2.5">Realized P/L</th>
                        <th className="p-2.5 rounded-r-lg text-right">Close Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {closedPositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="p-2.5 font-bold text-foreground">{pos.symbol}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pos.type === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              {pos.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-semibold">{pos.lot_size}</td>
                          <td className="p-2.5 font-mono">{formatPrice(pos.open_price, pos.symbol)}</td>
                          <td className="p-2.5 font-mono">{pos.close_price ? formatPrice(pos.close_price, pos.symbol) : '—'}</td>
                          <td className="p-2.5 font-mono font-bold">
                            <span className={(pos.realized_pnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                              {(pos.realized_pnl || 0) >= 0 ? '+' : ''}${(pos.realized_pnl || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-[11px] text-muted-foreground">
                            {new Date(pos.closed_at || pos.updated_at || Date.now()).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TAB CONTENT: ACCOUNT RULES & RISK MONITOR */}
            {activeTab === 'RULES' && selectedAccount && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {(() => {
                  const dailyPct = selectedAccount.rules?.daily_loss_limit_percent ?? selectedAccount.rules?.daily_drawdown ?? 5;
                  const maxPct = selectedAccount.rules?.max_loss_limit_percent ?? selectedAccount.rules?.max_drawdown ?? 10;
                  const targetPct = selectedAccount.rules?.profit_target_percent ?? selectedAccount.rules?.profit_target ?? 8;
                  const startBal = selectedAccount.starting_balance || selectedAccount.account_size || 100000;
                  return (
                    <>
                      <div className="p-4 rounded-xl bg-background border border-border/60 space-y-2">
                        <p className="font-bold text-foreground text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Drawdown Model
                        </p>
                        <p className="text-muted-foreground">
                          Model: <strong className="text-foreground">{selectedAccount.rules?.drawdown_model || 'STATIC'}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          Max Daily Loss: <strong className="text-foreground">{dailyPct}%</strong> (${((dailyPct / 100) * startBal).toLocaleString()})
                        </p>
                        <p className="text-muted-foreground">
                          Max Overall Loss: <strong className="text-foreground">{maxPct}%</strong> (${((maxPct / 100) * startBal).toLocaleString()})
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-background border border-border/60 space-y-2">
                        <p className="font-bold text-foreground text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4 text-brand-500" /> Evaluation Target & Days
                        </p>
                        <p className="text-muted-foreground">
                          Profit Target: <strong className="text-emerald-500">{targetPct}%</strong> (${((targetPct / 100) * startBal).toLocaleString()})
                        </p>
                        <p className="text-muted-foreground">
                          Min Trading Days: <strong className="text-foreground">{selectedAccount.rules?.min_trading_days ?? 3} days</strong> (Current: {selectedAccount.trading_days_count || selectedAccount.trading_days || 0})
                        </p>
                        <p className="text-muted-foreground">
                          Account Leverage: <strong className="text-foreground">1:{selectedAccount.rules?.leverage || 100}</strong>
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
