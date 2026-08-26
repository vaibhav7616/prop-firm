import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Award,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  Flame,
  Sparkles,
  Zap,
  Clock,
  Globe,
  Star,
  Users,
  ShieldCheck,
  ArrowRight,
  Medal,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  TOP_20_ALL_TIME_TRADERS,
  TOP_20_WEEKLY_TRADERS,
  TOP_20_MONTHLY_TRADERS,
  TopTrader,
  TimeframePeriod,
} from '@/data/top-traders';
import { cn } from '@/lib/utils';

export function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<TimeframePeriod>('allTime');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');

  // Select the appropriate dataset based on timeframe
  const currentDataset = useMemo(() => {
    switch (timeframe) {
      case 'weekly':
        return TOP_20_WEEKLY_TRADERS;
      case 'monthly':
        return TOP_20_MONTHLY_TRADERS;
      case 'allTime':
      default:
        return TOP_20_ALL_TIME_TRADERS;
    }
  }, [timeframe]);

  // Filtered Leaderboard for Top 20
  const filteredTraders = useMemo(() => {
    return currentDataset.filter((t) => {
      const matchSearch =
        t.traderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.topSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.accountSize.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTier =
        selectedTier === 'ALL' ||
        (selectedTier === '200k' && t.accountTier === 200000) ||
        (selectedTier === '100k' && t.accountTier === 100000) ||
        (selectedTier === '50k' && t.accountTier === 50000) ||
        (selectedTier === '25k' && t.accountTier <= 25000);

      const matchAsset =
        selectedAsset === 'ALL' ||
        (selectedAsset === 'GOLD' && t.topSymbol === 'XAUUSD') ||
        (selectedAsset === 'INDICES' && (t.topSymbol === 'US30' || t.topSymbol === 'NAS100' || t.topSymbol === 'GER40')) ||
        (selectedAsset === 'FX' && (t.topSymbol.includes('USD') || t.topSymbol.includes('EUR') || t.topSymbol.includes('GBP') || t.topSymbol.includes('JPY')) && t.topSymbol !== 'XAUUSD' && t.topSymbol !== 'BTCUSD') ||
        (selectedAsset === 'CRYPTO' && t.topSymbol === 'BTCUSD');

      return matchSearch && matchTier && matchAsset;
    });
  }, [currentDataset, searchQuery, selectedTier, selectedAsset]);

  // Dynamic metrics per timeframe
  const topTraderProfit = currentDataset[0]?.totalProfit || 0;
  const avgWinRate = (
    currentDataset.reduce((acc, t) => acc + t.winRate, 0) / currentDataset.length
  ).toFixed(1);
  const avgProfitFactor = (
    currentDataset.reduce((acc, t) => acc + t.profitFactor, 0) / currentDataset.length
  ).toFixed(2);

  const timeframeLabels = {
    allTime: {
      title: 'All-Time Hall of Fame',
      profitLabel: 'All-Time Profit',
      subtitle: 'Rankings calculated across lifetime verified trade history on our proprietary trading platform.',
      badgeText: '🏆 Top 20 All-Time Legends',
    },
    monthly: {
      title: 'This Month’s Leaderboard',
      profitLabel: 'Monthly Gain',
      subtitle: 'Rankings computed from trading activity during the current calendar month.',
      badgeText: '📅 Top 20 Monthly Leaders',
    },
    weekly: {
      title: 'This Week’s Leaderboard',
      profitLabel: 'Weekly Gain',
      subtitle: 'Rankings computed from trading activity during the active trading week (Mon - Fri).',
      badgeText: '⚡ Top 20 Weekly Sprint Leaders',
    },
  };

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-page relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-amber-500" />
              Global Funded Trader Standings & Top 20 Hall of Fame
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Top 20 Most Profitable <span className="text-amber-500">Traders</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Official rankings of the top 20 funded traders worldwide. Computed in real time directly from our proprietary FundedShift Web Trading Platform accounts and verified order execution logs.
            </p>

            {/* Timeframe Selector Pill Tabs (Weekly / Monthly / All-Time) */}
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/80 shadow-inner gap-1">
                <button
                  id="tab-timeframe-weekly"
                  onClick={() => setTimeframe('weekly')}
                  className={cn(
                    'flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
                    timeframe === 'weekly'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Zap className="h-4 w-4 text-amber-500" />
                  Weekly Top 20
                </button>
                <button
                  id="tab-timeframe-monthly"
                  onClick={() => setTimeframe('monthly')}
                  className={cn(
                    'flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
                    timeframe === 'monthly'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Calendar className="h-4 w-4 text-brand-500" />
                  Monthly Top 20
                </button>
                <button
                  id="tab-timeframe-alltime"
                  onClick={() => setTimeframe('allTime')}
                  className={cn(
                    'flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
                    timeframe === 'allTime'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Trophy className="h-4 w-4 text-amber-500" />
                  All-Time Top 20
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid (Dynamic based on selected timeframe) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
            <motion.div
              key={`metric-top-${timeframe}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 font-mono">
                ${topTraderProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">#1 Trader {timeframeLabels[timeframe].profitLabel}</p>
            </motion.div>

            <motion.div
              key={`metric-winrate-${timeframe}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 font-mono">{avgWinRate}%</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Top 20 Average Win Rate</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">2,480+</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Active Funded Traders</p>
            </motion.div>

            <motion.div
              key={`metric-pf-${timeframe}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-2">
                <Award className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 font-mono">{avgProfitFactor}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Top 20 Avg Profit Factor</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Leaderboard Content */}
      <div className="container-page space-y-10">
        {/* Top 3 Live Podium Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 flex items-center gap-2">
                <Flame className="h-6 w-6 text-amber-500" />
                {timeframe === 'weekly' && 'Weekly Top 3 Champions'}
                {timeframe === 'monthly' && 'Monthly Top 3 Champions'}
                {timeframe === 'allTime' && 'All-Time Top 3 Legends'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">{timeframeLabels[timeframe].subtitle}</p>
            </div>
            <Link
              to="/proof-of-payout"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200"
            >
              <ShieldCheck className="h-4 w-4" /> View Verified Payout Proofs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentDataset.slice(0, 3).map((trader, idx) => {
              const isGold = idx === 0;
              const isSilver = idx === 1;
              const isBronze = idx === 2;

              return (
                <motion.div
                  key={`${timeframe}-${trader.rank}-${trader.traderName}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -6 }}
                  className={cn(
                    'rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between border shadow-sm transition-all',
                    isGold && 'bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-white border-amber-300 md:-translate-y-4 shadow-amber-500/10 ring-2 ring-amber-400/30',
                    isSilver && 'bg-gradient-to-b from-slate-200/60 via-slate-100/20 to-white border-slate-300',
                    isBronze && 'bg-gradient-to-b from-amber-700/15 via-amber-700/5 to-white border-amber-600/30'
                  )}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center font-black font-mono text-sm shadow-sm',
                          isGold && 'bg-amber-400 text-amber-950',
                          isSilver && 'bg-slate-300 text-slate-800',
                          isBronze && 'bg-amber-700 text-white'
                        )}
                      >
                        #{trader.rank}
                      </span>
                      <Trophy
                        className={cn(
                          'h-5 w-5',
                          isGold && 'text-amber-500 fill-amber-400',
                          isSilver && 'text-slate-400 fill-slate-300',
                          isBronze && 'text-amber-700 fill-amber-600'
                        )}
                      />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
                      {trader.badge}
                    </span>
                  </div>

                  {/* Trader Info */}
                  <div className="text-center space-y-2 mb-5">
                    <img
                      src={trader.avatar}
                      alt={trader.traderName}
                      className="h-16 w-16 mx-auto rounded-full object-cover border-4 border-white shadow-md"
                    />
                    <div>
                      <div className="flex items-center justify-center gap-1.5">
                        <h3 className="font-bold text-base text-slate-900">{trader.traderName}</h3>
                        <span>{trader.flag}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">Funded Account: {trader.accountSize}</p>
                    </div>
                  </div>

                  {/* Big Profit Metric */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 text-center mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {timeframeLabels[timeframe].profitLabel.toUpperCase()}
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-600">
                      ${trader.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                      {trader.payoutCount} Successful Payout Cycles · Score: {trader.consistencyScore}/100
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">WIN RATE</span>
                      <span className="font-black text-emerald-600 text-sm">{trader.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">PROFIT FACTOR</span>
                      <span className="font-black text-brand-600 text-sm">{trader.profitFactor}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px] font-bold">TOP ASSET</span>
                      <span className="font-bold font-mono text-slate-800">{trader.topSymbol}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px] font-bold">STREAK</span>
                      <span className="font-bold text-purple-600">{trader.streakMonths} Months Active</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar for Full Top 20 Table */}
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trader, country, symbol..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto min-w-0">
              {/* Account Size filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold overflow-x-auto max-w-full scrollbar-none shrink-0">
                <span className="text-slate-500 dark:text-slate-400 px-2 shrink-0">Account:</span>
                <div className="flex items-center gap-1 shrink-0">
                  {['ALL', '200k', '100k', '50k', '25k'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap',
                        selectedTier === tier
                          ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {tier === 'ALL' ? 'All' : `$${tier.toUpperCase()}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold overflow-x-auto max-w-full scrollbar-none shrink-0">
                <span className="text-slate-500 dark:text-slate-400 px-2 shrink-0">Asset:</span>
                <div className="flex items-center gap-1 shrink-0">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'GOLD', label: 'Gold (XAU)' },
                    { id: 'INDICES', label: 'Indices' },
                    { id: 'FX', label: 'Forex' },
                    { id: 'CRYPTO', label: 'Crypto' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAsset(a.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap',
                        selectedAsset === a.id
                          ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Top 20 Table */}
        <div className="bg-card border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">FundedShift Top 20 Most Profitable Traders</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                  {timeframeLabels[timeframe].badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500">{timeframeLabels[timeframe].subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Engine Audited
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Trader</th>
                  <th className="p-4">Funded Capital</th>
                  <th className="p-4">{timeframeLabels[timeframe].profitLabel}</th>
                  <th className="p-4">Payouts</th>
                  <th className="p-4">Win Rate</th>
                  <th className="p-4">Profit Factor</th>
                  <th className="p-4">Consistency</th>
                  <th className="p-4">Favorite Symbol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTraders.map((trader) => (
                  <tr key={`${timeframe}-${trader.rank}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold font-mono">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shadow-xs',
                          trader.rank === 1 && 'bg-amber-400 text-amber-950',
                          trader.rank === 2 && 'bg-slate-300 text-slate-800',
                          trader.rank === 3 && 'bg-amber-700 text-white',
                          trader.rank > 3 && 'bg-slate-100 text-slate-600'
                        )}
                      >
                        #{trader.rank}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={trader.avatar}
                          alt={trader.traderName}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{trader.traderName}</span>
                            <span>{trader.flag}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-normal">{trader.challengeType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">{trader.accountSize}</td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        +${trader.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{trader.payoutCount} Payouts</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-xs">
                        {trader.winRate}%
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-600">{trader.profitFactor}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${trader.consistencyScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-600">{trader.consistencyScore}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs">
                        {trader.topSymbol}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ & Transparency Footer Callout */}
        <div className="bg-gradient-to-r from-slate-900 to-brand-950 rounded-3xl p-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              Ready to claim your spot on the Top 20 Leaderboard?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Choose an evaluation or instant funding tier, trade directly on our ultra-fast web trading platform, and withdraw up to 90% profit splits every 14 days.
            </p>
          </div>
          <Link
            to="/challenges"
            className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm shadow-lg whitespace-nowrap transition-all"
          >
            Start Trading Challenge
          </Link>
        </div>
      </div>
    </div>
  );
}
