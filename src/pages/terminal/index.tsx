import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Layers, Zap, Shield, ArrowUpRight, ArrowDownRight, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import {
  fetchTerminalSessionApi,
  logoutTerminalApi,
  fetchTerminalAccountsApi,
} from '@/lib/api-client';
import type { MarketQuote } from '@/server/types';
import { TerminalHeader } from './terminal-header';
import { MarketWatch } from './market-watch';
import { TradingViewChart } from './tradingview-chart';
import { OrderPanel } from './order-panel';
import { PositionsTable } from './positions-table';
import { TerminalLogin } from './terminal-login';
import { TerminalNoAccounts } from './terminal-no-accounts';
import { TradingViewEconomicCalendar } from '@/components/trading/tradingview-economic-calendar';
import { cn } from '@/lib/utils';

type MobileTab = 'CHART' | 'WATCH' | 'TRADE' | 'POSITIONS';

export default function WebTerminalPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Terminal lifecycle state
  const [initLoading, setInitLoading] = useState(true);
  const [terminalAuthenticated, setTerminalAuthenticated] = useState(false);
  const [authScenario, setAuthScenario] = useState<'A' | 'B' | 'D'>('A');

  // Account and session data
  const [account, setAccount] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [breachedAccounts, setBreachedAccounts] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Market data & UI state (Forex default EURUSD)
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [sseConnected, setSseConnected] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('CHART');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // SSE event source ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize terminal session
  const checkSession = useCallback(async () => {
    try {
      const isExplicitLogout = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('terminal_logged_out') === 'true';
      const res = await fetchTerminalSessionApi(undefined, isExplicitLogout);

      if (res.authenticated && res.account && !isExplicitLogout) {
        setAccount(res.account);
        setPositions(res.active_positions || []);
        if (Array.isArray(res.accounts)) setAccounts(res.accounts);
        setTerminalAuthenticated(true);
        setAuthScenario('A');
      } else {
        setTerminalAuthenticated(false);
        if (Array.isArray(res.accounts)) setAccounts(res.accounts);
        if (res.reason === 'NO_ELIGIBLE_ACCOUNTS' || res.reason === 'NO_ACCOUNTS') {
          setAuthScenario('B');
          if (Array.isArray(res.pending_orders)) setPendingOrders(res.pending_orders);
          if (Array.isArray(res.accounts)) {
            setAccounts(res.accounts);
            setBreachedAccounts(
              res.accounts.filter(
                (a: any) =>
                  String(a.status).toUpperCase() === 'BREACHED' ||
                  String(a.status).toUpperCase() === 'FAILED'
              )
            );
          }
        } else {
          // CREDENTIALS_REQUIRED or explicitly logged out
          setAuthScenario('D');
          if (Array.isArray(res.accounts)) setAccounts(res.accounts);
        }
      }
    } catch (err) {
      console.error('Terminal session check error:', err);
      setTerminalAuthenticated(false);
      setAuthScenario('D');
    } finally {
      setInitLoading(false);
    }
  }, []);

  // Check auth and session on mount
  useEffect(() => {
    if (authLoading) return;

    // Scenario C: If not logged in on website, redirect to login with return path
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }

    checkSession();
  }, [user, authLoading, navigate, location.pathname, checkSession]);

  // Connect to Live SSE Market Stream
  useEffect(() => {
    if (!terminalAuthenticated) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/market/ticks/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setSseConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            setQuotes(data);
          }
        } catch (e) {
          console.warn('Failed to parse SSE market data:', e);
        }
      };

      es.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn('EventSource initialization error:', err);
    }

    return () => {
      if (es) {
        es.close();
      }
      setSseConnected(false);
    };
  }, [terminalAuthenticated]);

  // Find active quote for selected symbol (Forex & Metals defaults)
  const activeQuote = useMemo(() => {
    const found = quotes.find((q) => q.symbol === selectedSymbol);
    if (found) return found;

    const s = selectedSymbol.toUpperCase();
    const isGold = s === 'XAUUSD';
    const isSilver = s === 'XAGUSD';
    const isJpy = s.endsWith('JPY');
    const defaultPrice = isGold ? 2724.50 : isSilver ? 31.850 : isJpy ? 158.960 : 1.08500;
    const defaultSpread = isGold ? 0.30 : isSilver ? 0.030 : isJpy ? 0.03 : 0.0001;

    return {
      symbol: selectedSymbol,
      price: defaultPrice,
      bid: defaultPrice - defaultSpread / 2,
      ask: defaultPrice + defaultSpread / 2,
      high: defaultPrice * 1.005,
      low: defaultPrice * 0.995,
      change24h: 0.15,
      spread: isGold ? 0.3 : 0.1,
      isMarketOpen: true,
      timestamp: new Date().toISOString(),
    };
  }, [quotes, selectedSymbol]);

  // Quotes dictionary for O(1) calculation
  const quotesMap = useMemo(() => {
    const map = new Map<string, MarketQuote>();
    quotes.forEach((q) => map.set(q.symbol, q));
    return map;
  }, [quotes]);

  // Calculate live floating P&L across open positions
  const floatingPnL = useMemo(() => {
    if (!positions || positions.length === 0) return 0;
    let total = 0;
    for (const p of positions) {
      if (p.status !== 'OPEN') continue;
      const q = quotesMap.get(p.symbol);
      const currentPrice = q ? (p.type === 'BUY' ? q.bid : q.ask) : p.entry_price;
      const contractSize = p.contract_size || (p.symbol === 'XAUUSD' ? 100 : p.symbol === 'XAGUSD' ? 5000 : 100000);
      const diff = p.type === 'BUY' ? currentPrice - p.entry_price : p.entry_price - currentPrice;
      total += diff * p.lot_size * contractSize;
    }
    return total;
  }, [positions, quotesMap]);

  // Refresh active account & positions from backend
  const refreshTerminalState = useCallback(async (targetAccountId?: string) => {
    try {
      const res = await fetchTerminalSessionApi(targetAccountId);
      if (res.authenticated && res.account) {
        setAccount(res.account);
        setPositions(res.active_positions || []);
        if (Array.isArray(res.accounts)) setAccounts(res.accounts);
      }
    } catch (err) {
      console.warn('Failed to refresh terminal state:', err);
    }
  }, []);

  // Switch active account (Scenario A multiple accounts)
  const handleSelectAccount = async (accountId: string) => {
    try {
      const res = await fetchTerminalSessionApi(accountId);
      if (res.authenticated && res.account) {
        setAccount(res.account);
        setPositions(res.active_positions || []);
        if (Array.isArray(res.accounts)) setAccounts(res.accounts);
        toast.success(`Switched to account #${res.account.account_number || res.account.id}`);
      } else {
        toast.error('Failed to switch account.');
      }
    } catch (err) {
      toast.error('Failed to switch account.');
    }
  };

  // Handle Scenario D successful terminal authentication
  const handleLoginSuccess = (sessionData: {
    token: string;
    account: any;
    active_positions: any[];
  }) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('terminal_logged_out');
    }
    setAccount(sessionData.account);
    setPositions(sessionData.active_positions || []);
    setTerminalAuthenticated(true);
    setAuthScenario('A');
    toast.success(`Logged into account #${sessionData.account.account_number || sessionData.account.id}`);
  };

  // Handle Terminal Logout (Scenario 5)
  const handleTerminalLogout = async () => {
    try {
      await logoutTerminalApi();
    } catch (e) {
      // Continue client cleanup
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('terminal_token');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('terminal_logged_out', 'true');
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setTerminalAuthenticated(false);
      setAccount(null);
      setAuthScenario('D');
      toast.info('Logged out of Web Terminal session.');
      try {
        const res = await fetchTerminalSessionApi(undefined, true);
        if (res && Array.isArray(res.accounts)) {
          setAccounts(res.accounts);
        }
      } catch (_) {}
    }
  };

  const sUpper = selectedSymbol.toUpperCase();
  const isJpy = sUpper.endsWith('JPY');
  const isGold = sUpper === 'XAUUSD';
  const isSilver = sUpper === 'XAGUSD';
  const priceDecimals = isGold ? 2 : (isJpy || isSilver ? 3 : 5);
  const openCount = positions.filter((p) => p.status === 'OPEN').length;

  // Initial loading spinner
  if (authLoading || initLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        </div>
        <p className="text-xs text-slate-400 mt-4 font-mono tracking-wider uppercase">
          Initializing Institutional Gateway...
        </p>
      </div>
    );
  }

  // Scenario B: User is logged in to website but has no eligible trading account
  if (authScenario === 'B' || (!terminalAuthenticated && authScenario === 'B')) {
    return (
      <TerminalNoAccounts
        pendingOrders={pendingOrders}
        breachedAccounts={breachedAccounts}
        userEmail={user?.email}
      />
    );
  }

  // Scenario D: User must authenticate credentials or has logged out
  if (!terminalAuthenticated || !account || authScenario === 'D') {
    return (
      <TerminalLogin
        userAccounts={accounts}
        prefilledAccountId={account?.id}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Scenario A: User is authenticated with active trading account
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Institutional Top Navigation Bar */}
      <TerminalHeader
        account={account}
        accounts={accounts}
        onSelectAccount={handleSelectAccount}
        onTerminalLogout={handleTerminalLogout}
        onOpenLoginModal={() => setAuthScenario('D')}
        onOpenNewsCalendar={() => setCalendarOpen(true)}
        floatingPnL={floatingPnL}
      />

      {/* 2. Responsive Mobile Tab Navigation Strip (< 1024px) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 px-2 py-1.5 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setMobileTab('CHART')}
          className={cn(
            'flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'CHART'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <LineChart className="h-3.5 w-3.5" />
          <span>Chart</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('WATCH')}
          className={cn(
            'flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'WATCH'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Forex</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('TRADE')}
          className={cn(
            'flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'TRADE'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Trade</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('POSITIONS')}
          className={cn(
            'flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            mobileTab === 'POSITIONS'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Trades</span>
          {openCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[10px] text-slate-950 font-bold font-mono">
              {openCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-amber-400 hover:text-white"
          title="Open Economic News Calendar"
        >
          <Calendar className="h-3.5 w-3.5 text-amber-400" />
          <span>News</span>
        </button>
      </div>

      {/* 3. Mobile View Container (< 1024px) */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-950">
        {mobileTab === 'CHART' && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 min-h-0">
              <TradingViewChart
                symbol={selectedSymbol}
                activeQuote={activeQuote}
                timeframe={timeframe}
                onTimeframeChange={(tf) => setTimeframe(tf)}
                className="w-full h-full rounded-none border-none"
              />
            </div>
            {/* Quick Trading Floating Dock for Mobile Chart View */}
            <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-between gap-2 shrink-0">
              <div className="font-mono text-xs">
                <span className="font-bold text-white block">{selectedSymbol}</span>
                <span className="text-[10px] text-slate-400">
                  Spread: {activeQuote.spread || '0.2'} pips
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('TRADE')}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-xs flex items-center gap-1"
                >
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span>{activeQuote.bid ? activeQuote.bid.toFixed(priceDecimals) : '0.00000'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('TRADE')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs flex items-center gap-1"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{activeQuote.ask ? activeQuote.ask.toFixed(priceDecimals) : '0.00000'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {mobileTab === 'WATCH' && (
          <div className="flex-1 overflow-hidden p-2 bg-slate-900">
            <MarketWatch
              quotes={quotes}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                setMobileTab('CHART');
              }}
              className="h-full border-none rounded-xl"
            />
          </div>
        )}

        {mobileTab === 'TRADE' && (
          <div className="flex-1 overflow-y-auto p-3 bg-slate-950">
            <OrderPanel
              account={account}
              selectedSymbol={selectedSymbol}
              activeQuote={activeQuote}
              onOrderExecuted={refreshTerminalState}
              className="max-w-md mx-auto"
            />
          </div>
        )}

        {mobileTab === 'POSITIONS' && (
          <div className="flex-1 overflow-hidden p-2 bg-slate-950">
            <PositionsTable
              account={account}
              positions={positions}
              onRefresh={refreshTerminalState}
              className="h-full rounded-xl"
            />
          </div>
        )}
      </div>

      {/* 4. Desktop Main Terminal Workspace Body (>= 1024px) */}
      <div className="hidden lg:flex flex-1 overflow-hidden min-h-0">
        {/* Left Column: Market Watch / Forex Instruments List */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/90 overflow-hidden">
          <MarketWatch
            quotes={quotes}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
            className="flex-1 overflow-hidden"
          />
        </div>

        {/* Center Column: High-Performance Canvas Candlestick Chart & Bottom Positions Table */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-950">
          {/* Top Half: Official Real-Time TradingView Forex Chart */}
          <div className="flex-1 min-h-0 relative border-b border-slate-800/80">
            <TradingViewChart
              symbol={selectedSymbol}
              activeQuote={activeQuote}
              timeframe={timeframe}
              onTimeframeChange={(tf) => setTimeframe(tf)}
              className="w-full h-full"
            />
          </div>

          {/* Bottom Half: Positions, Orders, Trade History & Prop Rules Monitor */}
          <div className="h-64 flex-shrink-0 bg-slate-900/60 overflow-hidden">
            <PositionsTable
              account={account}
              positions={positions}
              onRefresh={refreshTerminalState}
              className="h-full border-none rounded-none"
            />
          </div>
        </div>

        {/* Right Column: Execution Order Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-slate-800 bg-slate-900/95 overflow-y-auto">
          <OrderPanel
            account={account}
            selectedSymbol={selectedSymbol}
            activeQuote={activeQuote}
            onOrderExecuted={refreshTerminalState}
            className="p-3"
          />
        </div>
      </div>

      {/* Economic News Calendar Modal Overlay */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-5xl max-h-[92vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden text-foreground">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                <span className="font-display font-bold text-base">Economic News Calendar &amp; Red-Folder Risk Monitor</span>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Close Calendar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-background">
              <TradingViewEconomicCalendar height={580} showNewsBufferNotice={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
