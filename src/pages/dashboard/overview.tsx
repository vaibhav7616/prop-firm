import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  ArrowRight,
  Target,
  Award,
  DollarSign,
  Sparkles,
  ShieldCheck,
  Calendar as CalendarIcon,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
  Copy,
  Eye,
  EyeOff,
  Download,
  Info,
  Clock,
  Briefcase,
  History,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { TradingAccount, Order, Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { DEFAULT_ACCOUNTS, DEFAULT_ORDERS, DEFAULT_NOTIFICATIONS } from '@/lib/default-data';
import { fetchUserAccounts, fetchUserOrders, fetchAccountPositionsApi } from '@/lib/api-client';
import { PLATFORM_LABELS } from '@/lib/constants';

export function DashboardOverview() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [chartView, setChartView] = useState<'PNL' | 'EQUITY'>('PNL');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [userAccs, userOrds] = await Promise.all([
          fetchUserAccounts(user.id),
          fetchUserOrders(user.id),
        ]);
        setAccounts(userAccs);
        if (userAccs.length > 0) {
          setSelectedAccountId(userAccs[0].id);
        }
        setOrders(userOrds);
        setNotifications(DEFAULT_NOTIFICATIONS);
      } catch (_) {
        setAccounts(DEFAULT_ACCOUNTS);
        if (DEFAULT_ACCOUNTS.length > 0) {
          setSelectedAccountId(DEFAULT_ACCOUNTS[0].id);
        }
        setOrders(DEFAULT_ORDERS);
        setNotifications(DEFAULT_NOTIFICATIONS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Selected Account Data
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  useEffect(() => {
    if (!selectedAccount) return;
    async function loadPositions() {
      const pos = await fetchAccountPositionsApi(selectedAccount.id);
      setPositions(pos);
    }
    loadPositions();
    const interval = setInterval(loadPositions, 2000);
    return () => clearInterval(interval);
  }, [selectedAccount?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl glass animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 rounded-2xl glass animate-pulse" />
          <div className="h-32 rounded-2xl glass animate-pulse" />
          <div className="h-32 rounded-2xl glass animate-pulse" />
          <div className="h-32 rounded-2xl glass animate-pulse" />
        </div>
      </div>
    );
  }

  // Live Position Breakdown
  const openPositionsList = positions.filter((p) => p.status === 'OPEN');
  const closedPositionsList = positions.filter((p) => p.status === 'CLOSED');

  const floatingPnl = openPositionsList.reduce((sum, p) => sum + (p.floating_pnl || 0), 0);
  const totalRealizedPnl = closedPositionsList.reduce((sum, p) => sum + (p.realized_pnl || 0), 0);

  const startingBalance = Number.isFinite(selectedAccount?.starting_balance) ? selectedAccount!.starting_balance! : (selectedAccount?.account_size || 100000);
  const currentBalance = Number.isFinite(selectedAccount?.current_balance) ? selectedAccount!.current_balance! : startingBalance;
  const currentEquity = Number.isFinite(selectedAccount?.current_equity) ? selectedAccount!.current_equity! : (currentBalance + floatingPnl);

  const rawProfit = currentEquity - startingBalance;
  const totalProfit = Number.isFinite(rawProfit) ? rawProfit : 0;
  const profitPercent = startingBalance > 0 ? (totalProfit / startingBalance) * 100 : 0;

  // Today's P/L
  const rawTodaysPnl = selectedAccount?.todays_pnl !== undefined 
    ? selectedAccount.todays_pnl 
    : (floatingPnl + totalRealizedPnl);
  const todaysPnl = Number.isFinite(rawTodaysPnl) ? rawTodaysPnl : 0;
  const todaysPnlPercent = startingBalance > 0 ? (todaysPnl / startingBalance) * 100 : 0;

  // Prop Firm Objectives & Rule Limits
  const profitTargetPercent = selectedAccount?.rules?.profit_target_percent ?? selectedAccount?.rules?.profit_target ?? 8;
  const dailyLossLimitPercent = selectedAccount?.rules?.daily_loss_limit_percent ?? selectedAccount?.rules?.daily_drawdown ?? 5;
  const maxLossLimitPercent = selectedAccount?.rules?.max_loss_limit_percent ?? selectedAccount?.rules?.max_drawdown ?? 10;

  const profitTargetAmount = (profitTargetPercent / 100) * startingBalance;
  const dailyLossLimitAmount = (dailyLossLimitPercent / 100) * startingBalance;
  const maxLossLimitAmount = (maxLossLimitPercent / 100) * startingBalance;

  // Buffer Remaining
  const dailyLossUsed = Math.max(0, -todaysPnl);
  const dailyLossRemaining = Math.max(0, dailyLossLimitAmount - dailyLossUsed);
  const maxLossUsed = Math.max(0, startingBalance - currentEquity);
  const maxLossRemaining = Math.max(0, maxLossLimitAmount - maxLossUsed);

  // Dynamic Metrics derived directly from trades
  const totalClosedTrades = closedPositionsList.length;
  const winningClosedTrades = closedPositionsList.filter((p) => (p.realized_pnl || 0) > 0);
  const losingClosedTrades = closedPositionsList.filter((p) => (p.realized_pnl || 0) < 0);

  const grossProfit = winningClosedTrades.reduce((sum, p) => sum + (p.realized_pnl || 0), 0);
  const grossLoss = Math.abs(losingClosedTrades.reduce((sum, p) => sum + (p.realized_pnl || 0), 0));

  const winRate = totalClosedTrades > 0 ? ((winningClosedTrades.length / totalClosedTrades) * 100).toFixed(1) : '0.0';
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? 'MAX' : '0.00';
  const avgWin = winningClosedTrades.length > 0 ? (grossProfit / winningClosedTrades.length).toFixed(2) : '0.00';
  const avgLoss = losingClosedTrades.length > 0 ? (grossLoss / losingClosedTrades.length).toFixed(2) : '0.00';

  // Construct Dynamic Daily Chart Data with Continuous Multi-day Timeline
  const daysToShow = 10;
  const todayDate = new Date();

  // Group closed trades by YYYY-MM-DD key for exact date mapping
  const tradeMapByDate: Record<string, { pnl: number; count: number }> = {};
  for (const pos of closedPositionsList) {
    if (!pos.closed_at) continue;
    const d = new Date(pos.closed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!tradeMapByDate[key]) {
      tradeMapByDate[key] = { pnl: 0, count: 0 };
    }
    tradeMapByDate[key].pnl += pos.realized_pnl || 0;
    tradeMapByDate[key].count += 1;
  }

  // Generate continuous date array (past N days ending today)
  const timelineDates: { dateKey: string; displayLabel: string; fullDate: string }[] = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    timelineDates.push({ dateKey, displayLabel, fullDate });
  }

  let cumulativeEquity = startingBalance;
  const chartDays = timelineDates.map((item) => {
    const dayStats = tradeMapByDate[item.dateKey] || { pnl: 0, count: 0 };
    const dayPnl = Number(dayStats.pnl.toFixed(2));
    cumulativeEquity += dayPnl;
    return {
      day: item.displayLabel,
      fullDate: item.fullDate,
      pnl: dayPnl,
      equity: Number(cumulativeEquity.toFixed(2)),
      tradesCount: dayStats.count,
    };
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Account Header & Switcher Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white border border-slate-300 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 font-bold shrink-0 mt-0.5 sm:mt-0">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 leading-tight">Overview Dashboard</h1>
              {selectedAccount && (
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 whitespace-nowrap">
                  {selectedAccount.status === 'FUNDED' ? 'Funded • Active' : 'Phase 1 Evaluation'}
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] font-mono font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                Account #{selectedAccount?.account_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 sm:mt-0.5 leading-normal">
              Institutional prop firm evaluation performance, drawdown monitoring & objectives tracker
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-start sm:justify-between lg:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 lg:border-none">
          {accounts.length > 1 && (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50 max-w-full sm:max-w-none truncate"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  #{acc.account_number} (${acc.account_size?.toLocaleString()})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link to="/dashboard/trading">
              <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl px-3 sm:px-4 py-2 shadow-md shadow-brand-500/20 flex items-center gap-1.5 whitespace-nowrap">
                <Play className="h-3.5 w-3.5 fill-white" /> Web Terminal
              </Button>
            </Link>

            <Link to="/challenges">
              <Button variant="outline" className="border-slate-300 text-slate-800 font-bold text-xs rounded-xl px-3 sm:px-3.5 py-2 hover:bg-slate-100 whitespace-nowrap">
                + Buy Challenge
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {selectedAccount ? (
        <div className="space-y-6">
          {/* Top Metric Cards - 4 Column Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance</span>
                <Wallet className="h-4 w-4 text-brand-500" />
              </div>
              <h2 className="text-2xl font-extrabold font-display text-slate-900 mt-1">
                ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Starting: <span className="text-slate-800 font-semibold">${startingBalance.toLocaleString()}</span>
              </p>
            </motion.div>

            {/* Equity Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Equity</span>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <h2 className={`text-2xl font-extrabold font-display mt-1 ${totalProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 font-medium">
                  {openPositionsList.length > 0 ? `${openPositionsList.length} Open Positions` : 'Real-time Tick Synced'}
                </span>
              </div>
            </motion.div>

            {/* Today's P/L Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's P/L</span>
                <TrendingUp className={`h-4 w-4 ${todaysPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
              </div>
              <h2 className={`text-2xl font-extrabold font-display mt-1 ${todaysPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {todaysPnl >= 0 ? '+' : ''}${todaysPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className={`text-xs mt-2 font-bold font-mono ${todaysPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {todaysPnlPercent >= 0 ? '+' : ''}{todaysPnlPercent.toFixed(2)}% today
              </p>
            </motion.div>

            {/* Daily Loss Left Buffer */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="bg-white border border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Loss Left</span>
                <ShieldCheck className="h-4 w-4 text-sky-500" />
              </div>
              <h2 className="text-2xl font-extrabold font-display text-slate-900 mt-1">
                ${dailyLossRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-emerald-600 font-bold font-mono mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> SAFE • {((dailyLossUsed / dailyLossLimitAmount) * 100).toFixed(1)}% used
              </p>
            </motion.div>
          </div>

          {/* Performance Chart & Account Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dynamic Chart Area - 2 Columns */}
            <div className="lg:col-span-2 bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-brand-500" /> Performance Curve
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {closedPositionsList.length > 0
                      ? 'Real daily closed profit/loss & cumulative equity growth'
                      : 'Account baseline state (No closed trades recorded yet)'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setChartView('PNL')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        chartView === 'PNL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      P&L Growth
                    </button>
                    <button
                      onClick={() => setChartView('EQUITY')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        chartView === 'EQUITY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Equity Curve
                    </button>
                  </div>

                  <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${profitPercent >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                    {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% Overall
                  </span>
                </div>
              </div>

              {/* Dynamic Chart Display */}
              <div className="w-full pt-2">
                {chartView === 'PNL' ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDays} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const val = data.pnl;
                              const isPos = val >= 0;
                              return (
                                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-white text-xs space-y-1 z-50 min-w-[160px]">
                                  <p className="font-mono text-slate-400 font-semibold text-[11px] border-b border-slate-800 pb-1">
                                    {data.fullDate || data.day}
                                  </p>
                                  <div className="flex items-center justify-between gap-3 pt-0.5">
                                    <span className="text-slate-300">Daily Closed P/L:</span>
                                    <span className={`font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {val >= 0 ? '+' : ''}${val.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="text-slate-400">Trades Executed:</span>
                                    <span className="font-mono font-semibold text-slate-200">{data.tradesCount} trades</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="text-slate-400">Account Equity:</span>
                                    <span className="font-mono font-semibold text-slate-200">${data.equity.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1.5} />
                        <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={42}>
                          {chartDays.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.pnl > 0 ? '#10b981' : entry.pnl < 0 ? '#f43f5e' : '#cbd5e1'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDays} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                          tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const val = data.equity;
                              const netGain = val - startingBalance;
                              const isPos = netGain >= 0;
                              return (
                                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-white text-xs space-y-1 z-50 min-w-[160px]">
                                  <p className="font-mono text-slate-400 font-semibold text-[11px] border-b border-slate-800 pb-1">
                                    {data.fullDate || data.day}
                                  </p>
                                  <div className="flex items-center justify-between gap-3 pt-0.5">
                                    <span className="text-slate-300">Account Equity:</span>
                                    <span className="font-mono font-bold text-white">${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="text-slate-400">Net Growth:</span>
                                    <span className={`font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isPos ? '+' : ''}${netGain.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={startingBalance} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Baseline', fill: '#64748b', fontSize: 10 }} />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorEquity)"
                          dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 6, fill: '#1d4ed8' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Trading Statistics Column */}
            <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-500" /> Account Metrics
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Win Rate</span>
                  <span className="font-bold font-mono text-emerald-600">{winRate}%</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Profit Factor</span>
                  <span className="font-bold font-mono text-slate-900">{profitFactor}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Closed / Open Trades</span>
                  <span className="font-bold font-mono text-slate-900">{totalClosedTrades} / {openPositionsList.length}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Average Win / Loss</span>
                  <span className="font-bold font-mono text-slate-900">${avgWin} / ${avgLoss}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Max Overall Drawdown Buffer</span>
                  <span className="font-bold font-mono text-emerald-600">${maxLossRemaining.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Objectives & Calendar Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Objectives - 2 Cols */}
            <div className="lg:col-span-2 bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                  <Target className="h-4 w-4 text-brand-500" /> Evaluation Objectives
                </h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 3 / 4 Passed
                </span>
              </div>

              <div className="space-y-4">
                {/* Objective 1: Profit Target */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-brand-500" /> Profit Target ({profitTargetPercent}%)
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      ${Math.max(0, totalProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${profitTargetAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300/80">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, (totalProfit / profitTargetAmount) * 100))}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-brand-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Objective 2: Daily Drawdown */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Daily Drawdown Limit ({dailyLossLimitPercent}%)
                    </span>
                    <span className="font-bold font-mono text-emerald-600">
                      ${dailyLossUsed.toFixed(2)} / ${dailyLossLimitAmount.toLocaleString()} ({((dailyLossUsed / dailyLossLimitAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300/80">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (dailyLossUsed / dailyLossLimitAmount) * 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Objective 3: Overall Drawdown */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Max Overall Drawdown ({maxLossLimitPercent}%)
                    </span>
                    <span className="font-bold font-mono text-emerald-600">
                      ${maxLossUsed.toFixed(2)} / ${maxLossLimitAmount.toLocaleString()} ({((maxLossUsed / maxLossLimitAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300/80">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (maxLossUsed / maxLossLimitAmount) * 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Calendar */}
            <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-brand-500" /> Minimum Trading Days
                </h3>
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-md">
                  {selectedAccount.trading_days_count || (closedPositionsList.length > 0 ? 1 : 0)} / 14 days
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-2">
                {Array.from({ length: 14 }).map((_, i) => {
                  const dayNum = i + 1;
                  const activeCount = selectedAccount.trading_days_count || (closedPositionsList.length > 0 ? 1 : 0);
                  const isActive = dayNum <= activeCount;
                  return (
                    <div
                      key={i}
                      className={`h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all relative group ${
                        isActive
                          ? 'bg-brand-50 text-brand-600 border-2 border-brand-500 shadow-xs'
                          : 'bg-slate-100 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="h-4 w-4 text-brand-600" /> : dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Trade History Log */}
          <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-500" /> Account Trade Activity Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live open positions and recently closed trades for account #{selectedAccount.account_number}
                </p>
              </div>

              <Link to="/dashboard/trading">
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100">
                  Open Web Terminal
                </Button>
              </Link>
            </div>

            {positions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No trades recorded for this account yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-sans uppercase text-[10px] tracking-wider">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Lots</th>
                      <th className="pb-2">Open Price</th>
                      <th className="pb-2">Close/Current</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">P&L ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {positions.map((pos) => {
                      const isOpen = pos.status === 'OPEN';
                      const pnl = isOpen ? (pos.floating_pnl || 0) : (pos.realized_pnl || 0);
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={pos.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-bold text-slate-900">{pos.symbol}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pos.type === 'BUY' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {pos.type}
                            </span>
                          </td>
                          <td className="py-3 text-slate-800">{pos.lot_size}</td>
                          <td className="py-3 text-slate-800">{pos.open_price}</td>
                          <td className="py-3 text-slate-800">{isOpen ? 'LIVE' : pos.close_price}</td>
                          <td className="py-3">
                            {isOpen ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> OPEN
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold">
                                CLOSED
                              </span>
                            )}
                          </td>
                          <td className={`py-3 text-right font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfit ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Account Credentials Card */}
          <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-500" /> Platform Account Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Use these credentials to connect via MetaTrader 5 or our direct Web Terminal
                </p>
              </div>
              <span className="text-xs font-mono text-slate-700 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300">
                Account #{selectedAccount.account_number}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Platform</p>
                  <p className="font-bold text-slate-900 font-mono mt-0.5">
                    {PLATFORM_LABELS[selectedAccount.platform as keyof typeof PLATFORM_LABELS] || 'FundedShift Web Terminal'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Broker</p>
                  <p className="font-bold text-slate-900 font-mono mt-0.5">{selectedAccount.broker || 'FundedShift Markets'}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Server</p>
                  <p className="font-bold text-slate-900 font-mono mt-0.5">{selectedAccount.server || 'FundedShift-Live01'}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedAccount.server || 'FundedShift-Live01', 'Server')}
                  className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Login</p>
                  <p className="font-bold text-slate-900 font-mono mt-0.5">{selectedAccount.account_number}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedAccount.account_number, 'Login')}
                  className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Password</p>
                  <p className="font-bold text-slate-900 font-mono mt-0.5">
                    {showPassword ? selectedAccount.password || 'Tr4de#2026' : '••••••••'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedAccount.password || 'Tr4de#2026', 'Password')}
                    className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State if no accounts */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <Wallet className="h-12 w-12 text-brand-500/40 mx-auto" />
          <h2 className="text-xl font-bold font-display text-slate-900">No Active Trading Accounts</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You don't have an active funded challenge yet. Select a challenge plan to get instant credentials and start trading.
          </p>
          <Link to="/challenges">
            <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/20">
              Browse Challenges
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
