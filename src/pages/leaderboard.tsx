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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface LeaderboardTrader {
  rank: number;
  traderName: string;
  country: string;
  flag: string;
  avatar: string;
  accountSize: string;
  accountTier: number;
  totalPayouts: number;
  payoutCount: number;
  winRate: number;
  profitFactor: number;
  topSymbol: string;
  streakMonths: number;
  consistencyScore: number;
  badge?: string;
  period: 'all-time' | 'monthly' | 'weekly';
}

export const LEADERBOARD_TOP_TRADERS: LeaderboardTrader[] = [
  {
    rank: 1,
    traderName: 'Marcus Vance',
    country: 'United Kingdom',
    flag: '🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    accountSize: '$200,000',
    accountTier: 200000,
    totalPayouts: 94820.00,
    payoutCount: 8,
    winRate: 74.2,
    profitFactor: 3.42,
    topSymbol: 'US30',
    streakMonths: 8,
    consistencyScore: 98,
    badge: '🏆 #1 All-Time Legend',
    period: 'all-time',
  },
  {
    rank: 2,
    traderName: 'Sneha Kulkarni',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    accountSize: '$200,000',
    accountTier: 200000,
    totalPayouts: 82450.00,
    payoutCount: 7,
    winRate: 78.9,
    profitFactor: 3.89,
    topSymbol: 'XAUUSD',
    streakMonths: 7,
    consistencyScore: 97,
    badge: '👑 Gold Specialist',
    period: 'all-time',
  },
  {
    rank: 3,
    traderName: 'Rajesh Sharma',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    accountSize: '$200,000',
    accountTier: 200000,
    totalPayouts: 71320.00,
    payoutCount: 6,
    winRate: 72.4,
    profitFactor: 2.95,
    topSymbol: 'XAUUSD',
    streakMonths: 6,
    consistencyScore: 95,
    badge: '⭐ Consistent Master',
    period: 'all-time',
  },
  {
    rank: 4,
    traderName: 'Sofia Martinez',
    country: 'Spain',
    flag: '🇪🇸',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    accountTier: 100000,
    totalPayouts: 58900.00,
    payoutCount: 5,
    winRate: 76.3,
    profitFactor: 3.12,
    topSymbol: 'XAUUSD',
    streakMonths: 5,
    consistencyScore: 94,
    badge: '💎 Scalping Queen',
    period: 'all-time',
  },
  {
    rank: 5,
    traderName: 'Lucas Schneider',
    country: 'Germany',
    flag: '🇩🇪',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    accountTier: 100000,
    totalPayouts: 49200.00,
    payoutCount: 5,
    winRate: 71.0,
    profitFactor: 2.84,
    topSymbol: 'GER40',
    streakMonths: 5,
    consistencyScore: 92,
    badge: '🎯 DAX Specialist',
    period: 'all-time',
  },
  {
    rank: 6,
    traderName: 'Alexandre Dubois',
    country: 'France',
    flag: '🇫🇷',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    accountTier: 100000,
    totalPayouts: 42150.00,
    payoutCount: 4,
    winRate: 68.1,
    profitFactor: 2.65,
    topSymbol: 'EURUSD',
    streakMonths: 4,
    consistencyScore: 91,
    period: 'all-time',
  },
  {
    rank: 7,
    traderName: 'Rohan Verma',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    accountTier: 100000,
    totalPayouts: 36700.00,
    payoutCount: 4,
    winRate: 67.8,
    profitFactor: 2.51,
    topSymbol: 'NAS100',
    streakMonths: 4,
    consistencyScore: 90,
    period: 'all-time',
  },
  {
    rank: 8,
    traderName: 'Vikram Mehta',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    accountSize: '$50,000',
    accountTier: 50000,
    totalPayouts: 28400.00,
    payoutCount: 4,
    winRate: 64.8,
    profitFactor: 2.38,
    topSymbol: 'XAUUSD',
    streakMonths: 3,
    consistencyScore: 89,
    period: 'all-time',
  },
  {
    rank: 9,
    traderName: 'Ananya Roy',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accountSize: '$50,000',
    accountTier: 50000,
    totalPayouts: 23150.00,
    payoutCount: 3,
    winRate: 69.5,
    profitFactor: 2.45,
    topSymbol: 'GBPUSD',
    streakMonths: 3,
    consistencyScore: 88,
    period: 'all-time',
  },
  {
    rank: 10,
    traderName: 'Aarav Patel',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    accountSize: '$10,000',
    accountTier: 10000,
    totalPayouts: 9400.00,
    payoutCount: 3,
    winRate: 65.0,
    profitFactor: 2.18,
    topSymbol: 'BTCUSD',
    streakMonths: 2,
    consistencyScore: 87,
    period: 'all-time',
  },
];

export function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');

  // Filtered Leaderboard
  const filteredTraders = useMemo(() => {
    return LEADERBOARD_TOP_TRADERS.filter((t) => {
      const matchSearch =
        t.traderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.topSymbol.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTier =
        selectedTier === 'ALL' ||
        (selectedTier === '200k' && t.accountTier === 200000) ||
        (selectedTier === '100k' && t.accountTier === 100000) ||
        (selectedTier === '50k' && t.accountTier === 50000) ||
        (selectedTier === '25k' && t.accountTier === 25000) ||
        (selectedTier === '10k' && t.accountTier === 10000);

      const matchAsset =
        selectedAsset === 'ALL' ||
        (selectedAsset === 'GOLD' && t.topSymbol === 'XAUUSD') ||
        (selectedAsset === 'INDICES' && (t.topSymbol === 'US30' || t.topSymbol === 'NAS100' || t.topSymbol === 'GER40')) ||
        (selectedAsset === 'FX' && (t.topSymbol === 'EURUSD' || t.topSymbol === 'GBPUSD')) ||
        (selectedAsset === 'CRYPTO' && t.topSymbol === 'BTCUSD');

      return matchSearch && matchTier && matchAsset;
    });
  }, [searchQuery, selectedTier, selectedAsset]);

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-page relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-amber-500" />
              Global Funded Trader Standings & Hall of Fame
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Top Trader <span className="text-amber-500">Leaderboard</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Recognizing our most disciplined, consistent, and profitable funded traders worldwide. Rankings are automatically audited from verified MT5 & cTrader account records.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">$94,820</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Top Single Trader Total Gain</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">71.8%</p>
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
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-2">
                <Award className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">3.14</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Average Top Profit Factor</p>
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
                <Flame className="h-6 w-6 text-amber-500" /> All-Time Hall of Fame Podium
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">The highest ranked institutional funded traders on the platform.</p>
            </div>
            <Link
              to="/proof-of-payout"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200"
            >
              <ShieldCheck className="h-4 w-4" /> View Verified Payout Proofs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LEADERBOARD_TOP_TRADERS.slice(0, 3).map((trader, idx) => {
              const isGold = idx === 0;
              const isSilver = idx === 1;
              const isBronze = idx === 2;

              return (
                <motion.div
                  key={trader.rank}
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

                  {/* Big Payout Metric */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 text-center mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      TOTAL VERIFIED WITHDRAWALS
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-600">
                      ${trader.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                      {trader.payoutCount} Successful Payouts · Consistency: {trader.consistencyScore}/100
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

        {/* Filter & Search Bar for Full Table */}
        <div className="bg-card border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trader, country, symbol..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Account Size filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <span className="text-slate-500 px-2">Account:</span>
                {['ALL', '200k', '100k', '50k', '25k', '10k'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all',
                      selectedTier === tier
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {tier === 'ALL' ? 'All' : `$${tier.toUpperCase()}`}
                  </button>
                ))}
              </div>

              {/* Asset filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <span className="text-slate-500 px-2">Asset:</span>
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
                      'px-2.5 py-1 rounded-lg transition-all',
                      selectedAsset === a.id
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Leaderboard Table */}
        <div className="bg-card border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Official Prop Firm Trader Rankings</h3>
              <p className="text-xs text-slate-500">Live rankings computed from audited broker statements and verified trade logs.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Broker Audited
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
                  <th className="p-4">Total Paid Out</th>
                  <th className="p-4">Payouts</th>
                  <th className="p-4">Win Rate</th>
                  <th className="p-4">Profit Factor</th>
                  <th className="p-4">Consistency</th>
                  <th className="p-4">Favorite Symbol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTraders.map((trader) => (
                  <tr key={trader.rank} className="hover:bg-slate-50/80 transition-colors">
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
                          <span className="text-[11px] text-slate-400 font-normal">{trader.country}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-800">{trader.accountSize}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600 text-sm sm:text-base">
                      ${trader.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 font-mono text-slate-600">{trader.payoutCount} cycles</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{trader.winRate}%</td>
                    <td className="p-4 font-mono font-bold text-brand-600">{trader.profitFactor}</td>
                    <td className="p-4">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs">
                        {trader.consistencyScore}/100
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">{trader.topSymbol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hall of Fame Milestones */}
        <div className="space-y-6 pt-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 flex items-center gap-2">
              <Star className="h-6 w-6 text-purple-600" /> Milestone Achievements & Badges
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Hall of fame badges earned by elite traders across evaluation and funded phases.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-200 rounded-3xl p-6 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white mb-4 shadow-md shadow-amber-500/30">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">$100,000+ Payout Legend</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Traders with near or over $100,000 in accumulated verified payouts from FundedShift.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/60 text-xs shadow-xs">
                  <span className="font-bold text-slate-800">Marcus Vance 🇬🇧</span>
                  <span className="font-mono font-bold text-amber-600">$94,820 (95% to $100k)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/60 text-xs shadow-xs">
                  <span className="font-bold text-slate-800">Sneha Kulkarni 🇮🇳</span>
                  <span className="font-mono font-bold text-amber-600">$82,450 (82% to $100k)</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white border border-purple-200 rounded-3xl p-6 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white mb-4 shadow-md shadow-purple-600/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero Drawdown Master</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Passed evaluations without ever exceeding 1.0% maximum peak-to-valley drawdown.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-purple-200/60 text-xs shadow-xs">
                  <span className="font-bold text-slate-800">Rajesh Sharma 🇮🇳</span>
                  <span className="font-mono font-bold text-purple-600">Max DD: 0.62%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-purple-200/60 text-xs shadow-xs">
                  <span className="font-bold text-slate-800">Lucas Schneider 🇩🇪</span>
                  <span className="font-mono font-bold text-purple-600">Max DD: 0.81%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200 rounded-3xl p-6 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-md shadow-emerald-600/30">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fast-Track Funded Pro</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Completed challenges in under 7 trading days while maintaining flawless risk compliance.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200/60 text-xs shadow-xs">
                  <span className="font-bold text-slate-800">Aarav Patel 🇮🇳</span>
                  <span className="font-mono font-bold text-emerald-600">Passed in 5 Days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200/60 text-xs shadow-xs">
                  <span className="font-bold text-slate-800">Alexandre Dubois 🇫🇷</span>
                  <span className="font-mono font-bold text-emerald-600">Passed in 6 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden border border-slate-800">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              Join the Elite Leaderboard
            </span>
            <h3 className="text-2xl sm:text-4xl font-black font-display text-white">
              Want your name at the top of the global standings?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Start your evaluation challenge today, get funded with up to $200,000 capital, and build your track record alongside the world's best traders.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/challenges"
                className="btn-primary px-6 py-3 text-sm font-bold shadow-lg"
              >
                Start Evaluation Challenge
              </Link>
              <Link
                to="/proof-of-payout"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/15 transition-all"
              >
                Inspect Public Proof of Payout Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
