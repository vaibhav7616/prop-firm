import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Award,
  ShieldCheck,
  TrendingUp,
  Star,
  Users,
  Share2,
  DollarSign,
  Zap,
  Target,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PayoutProofModal } from '@/components/shared/payout-proof-modal';
import {
  TOP_20_ALL_TIME_TRADERS,
  TOP_20_WEEKLY_TRADERS,
  TOP_20_MONTHLY_TRADERS,
  TopTrader,
  TimeframePeriod,
} from '@/data/top-traders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardLeaderboard() {
  const { user, profile } = useAuth();
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

  // Current logged in user ranking stats according to active timeframe
  const myRank = useMemo(() => {
    if (timeframe === 'weekly') {
      return {
        rank: 14,
        percentile: 'Top 5%',
        consistencyScore: 92,
        profitFactor: 2.42,
        winRate: 68.0,
        totalProfit: 1750.00,
        activeStreak: 'This Week',
        badge: 'Pro Elite',
        periodLabel: 'Weekly Gain',
      };
    }
    if (timeframe === 'monthly') {
      return {
        rank: 14,
        percentile: 'Top 5%',
        consistencyScore: 92,
        profitFactor: 2.38,
        winRate: 67.2,
        totalProfit: 4650.00,
        activeStreak: 'This Month',
        badge: 'Pro Elite',
        periodLabel: 'Monthly Gain',
      };
    }
    return {
      rank: 14,
      percentile: 'Top 5%',
      consistencyScore: 92,
      profitFactor: 2.34,
      winRate: 66.8,
      totalProfit: 11450.00,
      activeStreak: '2 Months',
      badge: 'Pro Elite',
      periodLabel: 'All-Time Profit',
    };
  }, [timeframe]);

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

  const handleShareBadge = () => {
    const text = encodeURIComponent(
      `🏆 I'm currently ranked #${myRank.rank} (${myRank.periodLabel}: $${myRank.totalProfit.toLocaleString()}) on @FundedShift!\n\n` +
      `📈 Win Rate: ${myRank.winRate}%\n` +
      `💰 Consistency Score: ${myRank.consistencyScore}/100\n` +
      `⚡ Trade funded capital directly on https://fundedshift.com\n\n` +
      `#FundedShift #FundedTrader #Leaderboard #Top20`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const timeframeLabels = {
    allTime: {
      title: 'All-Time Standings',
      profitLabel: 'All-Time Profit',
      subtitle: 'Standings computed across lifetime verified trade history on our proprietary trading platform.',
      badgeText: 'TOP 20 ALL-TIME',
    },
    monthly: {
      title: 'Current Month Standings',
      profitLabel: 'Monthly Net Gain',
      subtitle: 'Standings computed from trades executed during the current active calendar month.',
      badgeText: 'TOP 20 MONTHLY',
    },
    weekly: {
      title: 'Current Week Standings',
      profitLabel: 'Weekly Net Gain',
      subtitle: 'Standings computed from trading activity during the active trading week (Mon - Fri).',
      badgeText: 'TOP 20 WEEKLY',
    },
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Welcome & Standings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Prop Firm Community Standings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
            Top 20 Profitable Traders Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official standings of the top 20 most profitable funded traders across all FundedShift capital programs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Public View
          </a>
          <button
            onClick={handleShareBadge}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm w-fit"
          >
            <Share2 className="h-4 w-4" /> Share My Ranking Badge
          </button>
        </div>
      </div>

      {/* Timeframe Selector Pill Bar (Weekly / Monthly / All-Time) */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-card border border-slate-200 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase px-2">Leaderboard Period:</span>
          <button
            id="dash-tab-weekly"
            onClick={() => setTimeframe('weekly')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              timeframe === 'weekly'
                ? 'bg-amber-400 text-amber-950 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Weekly Top 20
          </button>
          <button
            id="dash-tab-monthly"
            onClick={() => setTimeframe('monthly')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              timeframe === 'monthly'
                ? 'bg-brand-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Monthly Top 20
          </button>
          <button
            id="dash-tab-alltime"
            onClick={() => setTimeframe('allTime')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              timeframe === 'allTime'
                ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            All-Time Top 20
          </button>
        </div>

        <span className="text-xs font-mono font-bold text-slate-500 px-2 hidden md:inline-block">
          {timeframeLabels[timeframe].title}
        </span>
      </div>

      {/* User's Personal Performance Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-brand-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-inner">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  YOUR {timeframe.toUpperCase()} STANDING
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {myRank.percentile}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
                Global Rank #{myRank.rank}
              </h2>
              <p className="text-xs text-brand-200 mt-0.5">
                Alex Vance ({profile?.full_name || 'Funded Trader'}) · $100,000 Two-Step Account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">CONSISTENCY</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{myRank.consistencyScore}/100</span>
            </div>
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">WIN RATE</span>
              <span className="text-lg font-bold font-mono text-white">{myRank.winRate}%</span>
            </div>
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">PROFIT FACTOR</span>
              <span className="text-lg font-bold font-mono text-amber-300">{myRank.profitFactor}</span>
            </div>
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">{myRank.periodLabel}</span>
              <span className="text-lg font-bold font-mono text-emerald-400">+${myRank.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentDataset.slice(0, 3).map((trader, idx) => {
          const isGold = idx === 0;
          const isSilver = idx === 1;
          const isBronze = idx === 2;

          return (
            <motion.div
              key={`podium-${timeframe}-${trader.rank}-${trader.traderName}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between border bg-card transition-all',
                isGold && 'border-2 border-amber-300 ring-2 ring-amber-400/20',
                isSilver && 'border border-slate-300',
                isBronze && 'border border-amber-700/30'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <Trophy
                    className={cn(
                      'h-4 w-4',
                      isGold && 'text-amber-500 fill-amber-400',
                      isSilver && 'text-slate-400 fill-slate-300',
                      isBronze && 'text-amber-700 fill-amber-600'
                    )}
                  />
                  Rank #{trader.rank} {isGold ? 'Champion' : isSilver ? 'Runner Up' : '3rd Place'}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {trader.badge}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={trader.avatar}
                  alt={trader.traderName}
                  className="h-12 w-12 rounded-full object-cover border-2 border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{trader.traderName} {trader.flag}</h3>
                  <p className="text-xs text-slate-500 font-mono">{trader.accountSize} Account · {trader.topSymbol}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    {timeframeLabels[timeframe].profitLabel}
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-600">
                    +${trader.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Win Rate</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{trader.winRate}% ({trader.profitFactor} PF)</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto min-w-0">
            {/* Account Tier Filter */}
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

            {/* Asset Filter */}
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

      {/* Main Full Top 20 Table */}
      <div className="bg-card border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">
                Top 20 Traders Leaderboard ({timeframe === 'weekly' ? 'Weekly' : timeframe === 'monthly' ? 'Monthly' : 'All-Time'})
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                {timeframeLabels[timeframe].badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live standings computed directly from our proprietary FundedShift Web Trading Platform accounts across all funded tiers.
            </p>
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
                <th className="p-4">Account Size</th>
                <th className="p-4">{timeframeLabels[timeframe].profitLabel}</th>
                <th className="p-4">Payouts</th>
                <th className="p-4">Win Rate</th>
                <th className="p-4">Profit Factor</th>
                <th className="p-4">Consistency</th>
                <th className="p-4">Top Instrument</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTraders.map((trader) => (
                <tr
                  key={`${timeframe}-${trader.rank}`}
                  className={cn(
                    'hover:bg-slate-50/80 transition-colors',
                    trader.rank === 14 && 'bg-amber-50/40 font-semibold'
                  )}
                >
                  <td className="p-4 font-bold font-mono">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shadow-xs',
                        trader.rank === 1 && 'bg-amber-400 text-amber-950',
                        trader.rank === 2 && 'bg-slate-300 text-slate-800',
                        trader.rank === 3 && 'bg-amber-700 text-white',
                        trader.rank === 14 && 'bg-brand-600 text-white ring-2 ring-brand-400',
                        trader.rank > 3 && trader.rank !== 14 && 'bg-slate-100 text-slate-600'
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
                          {trader.rank === 14 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">{trader.challengeType}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">{trader.accountSize}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600 text-sm">
                    +${trader.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
    </div>
  );
}
