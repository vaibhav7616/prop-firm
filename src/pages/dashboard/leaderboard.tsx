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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PayoutProofModal } from '@/components/shared/payout-proof-modal';
import { TOP_20_PROFITABLE_TRADERS, TopTrader } from '@/data/top-traders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardLeaderboard() {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');

  const myRank = {
    rank: 14,
    percentile: 'Top 5%',
    consistencyScore: 92,
    profitFactor: 2.34,
    winRate: 66.8,
    totalProfit: 11450.00,
    activeStreak: '2 Months',
    badge: 'Pro Elite',
  };

  const filteredTraders = useMemo(() => {
    return TOP_20_PROFITABLE_TRADERS.filter((t) => {
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
  }, [searchQuery, selectedTier, selectedAsset]);

  const handleShareBadge = () => {
    const text = encodeURIComponent(
      `🏆 I'm currently ranked #${myRank.rank} (Top 5%) on @FundedShift!\n\n` +
      `📈 Win Rate: ${myRank.winRate}%\n` +
      `💰 Consistency Score: ${myRank.consistencyScore}/100\n` +
      `⚡ Trade funded institutional capital at https://fundedshift.com\n\n` +
      `#FundedShift #FundedTrader #Leaderboard #Top20`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
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
                  YOUR CURRENT STANDING
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
              <span className="text-[10px] font-bold text-brand-300 uppercase block">TOTAL GAIN</span>
              <span className="text-lg font-bold font-mono text-emerald-400">+${myRank.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border-2 border-amber-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-amber-500 fill-amber-400" /> Rank #1 Champion
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              Legend
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
              alt="Marcus Vance"
              className="h-12 w-12 rounded-full object-cover border-2 border-amber-300"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Marcus Vance 🇬🇧</h3>
              <p className="text-xs text-slate-500 font-mono">$200,000 Two-Step Account</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Net Profit</span>
              <span className="text-lg font-black font-mono text-emerald-600">$94,820.00</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Win Rate</span>
              <span className="text-sm font-bold font-mono text-slate-900">74.2% (3.42 PF)</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-slate-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-slate-400 fill-slate-300" /> Rank #2 Specialist
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              Gold Pro
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
              alt="Sneha Kulkarni"
              className="h-12 w-12 rounded-full object-cover border-2 border-slate-300"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Sneha Kulkarni 🇮🇳</h3>
              <p className="text-xs text-slate-500 font-mono">$200,000 Two-Step Account</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Net Profit</span>
              <span className="text-lg font-black font-mono text-emerald-600">$82,450.00</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Win Rate</span>
              <span className="text-sm font-bold font-mono text-purple-600">78.9% (3.89 PF)</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-amber-600/30 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-amber-700 fill-amber-600" /> Rank #3 Master
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              0.6% Drawdown
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Rajesh Sharma"
              className="h-12 w-12 rounded-full object-cover border-2 border-amber-600/30"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rajesh Sharma 🇮🇳</h3>
              <p className="text-xs text-slate-500 font-mono">$200,000 Two-Step Account</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Net Profit</span>
              <span className="text-lg font-black font-mono text-emerald-600">$71,320.00</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Win Rate</span>
              <span className="text-sm font-bold font-mono text-slate-900">72.4% (2.95 PF)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Account Tier Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <span className="text-slate-500 px-2">Account:</span>
              {['ALL', '200k', '100k', '50k', '25k'].map((tier) => (
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

            {/* Asset Filter */}
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

      {/* Top 20 Profitable Traders Table */}
      <div className="bg-card border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">Top 20 Most Profitable Traders</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                FundedShift Elite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live standings computed from verified MT5 & cTrader accounts across all funded tiers.
            </p>
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
                <th className="p-4">Net Profit Paid</th>
                <th className="p-4">Payouts</th>
                <th className="p-4">Win Rate</th>
                <th className="p-4">Profit Factor</th>
                <th className="p-4">Consistency</th>
                <th className="p-4">Top Instrument</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTraders.map((trader) => {
                const isMe = trader.rank === myRank.rank;

                return (
                  <tr
                    key={trader.rank}
                    className={cn(
                      'transition-colors',
                      isMe
                        ? 'bg-brand-50/80 hover:bg-brand-100/70 border-l-4 border-l-brand-600'
                        : 'hover:bg-slate-50/80'
                    )}
                  >
                    <td className="p-4 font-bold font-mono">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shadow-xs',
                          trader.rank === 1 && 'bg-amber-400 text-amber-950',
                          trader.rank === 2 && 'bg-slate-300 text-slate-800',
                          trader.rank === 3 && 'bg-amber-700 text-white',
                          trader.rank > 3 && isMe && 'bg-brand-600 text-white',
                          trader.rank > 3 && !isMe && 'bg-slate-100 text-slate-600'
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
                          className={cn(
                            'h-9 w-9 rounded-full object-cover border',
                            isMe ? 'border-brand-500 ring-2 ring-brand-300' : 'border-slate-200'
                          )}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{trader.traderName}</span>
                            <span>{trader.flag}</span>
                            {isMe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-600 text-white">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {trader.challengeType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-800">{trader.accountSize}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600 text-sm sm:text-base">
                      ${trader.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Public Payout Proof Link Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">Explore Public Proof of Payout Directory</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every payout is logged with cryptographic hashes, certificates, and broker audit stamps.
          </p>
        </div>
        <a
          href="/proof-of-payout"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 shadow-sm"
        >
          View Public Transparency Hub <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
