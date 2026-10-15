import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { CandlestickChart } from './candlestick-chart';
import { OrderPanel } from './order-panel';
import { PositionsTable } from './positions-table';
import { TerminalLogin } from './terminal-login';
import { TerminalNoAccounts } from './terminal-no-accounts';

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

  // Market data & UI state
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [sseConnected, setSseConnected] = useState(false);

  // SSE event source ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize terminal session
  const checkSession = useCallback(async () => {
    try {
      const res = await fetchTerminalSessionApi();

      if (res.authenticated && res.account) {
        setAccount(res.account);
        setPositions(res.active_positions || []);
        if (Array.isArray(res.accounts)) setAccounts(res.accounts);
        setTerminalAuthenticated(true);
        setAuthScenario('A');
      } else {
        setTerminalAuthenticated(false);
        if (res.reason === 'NO_ELIGIBLE_ACCOUNTS') {
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
          // CREDENTIALS_REQUIRED or invalid session
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

  // Find active quote for selected symbol
  const activeQuote = useMemo(() => {
    const found = quotes.find((q) => q.symbol === selectedSymbol);
    if (found) return found;
    return {
      symbol: selectedSymbol,
      price: 2650.5,
      bid: 2650.4,
      ask: 2650.6,
      high: 2665.0,
      low: 2640.0,
      change24h: 0.45,
      spread: 0.2,
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
      const contractSize = p.contract_size || 100;
      const diff = p.type === 'BUY' ? currentPrice - p.entry_price : p.entry_price - currentPrice;
      total += diff * p.lot_size * contractSize;
    }
    return total;
  }, [positions, quotesMap]);

  // Refresh active account & positions from backend
  const refreshTerminalState = useCallback(async () => {
    try {
      const res = await fetchTerminalSessionApi();
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
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      // In auto-mode, switch account
      setAccount(target);
      toast.success(`Switched to account #${target.account_number || target.id}`);
      refreshTerminalState();
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
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setTerminalAuthenticated(false);
      setAuthScenario('D');
      toast.info('Logged out of Web Terminal session.');
    }
  };

  // Initial loading spinner
  if (authLoading || initLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        </div>
        <p className="text-xs text-slate-400 mt-4 font-mono tracking-wider uppercase">
          Initializing Institutional Gateway...
        </p>
      </div>
    );
  }

  // Scenario B: User is logged in to website but has no eligible trading account
  if (authScenario === 'B' && !terminalAuthenticated) {
    return (
      <TerminalNoAccounts
        pendingOrders={pendingOrders}
        breachedAccounts={breachedAccounts}
        userEmail={user?.email}
      />
    );
  }

  // Scenario D: User has account but must authenticate credentials
  if (authScenario === 'D' && !terminalAuthenticated) {
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
        floatingPnL={floatingPnL}
      />

      {/* 2. Main Terminal Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Market Watch / Instruments List */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/90 overflow-hidden">
          <MarketWatch
            quotes={quotes}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
            className="flex-1 overflow-hidden"
          />
        </div>

        {/* Center Column: High-Performance Canvas Candlestick Chart & Bottom Orders / Positions Table */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-950">
          {/* Top Half: Candlestick Chart */}
          <div className="flex-1 min-h-0 relative border-b border-slate-800/80">
            <CandlestickChart
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
    </div>
  );
}
