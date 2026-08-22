import { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PayoutProofModal } from '@/components/shared/payout-proof-modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardLeaderboard() {
  const { user, profile } = useAuth();
  const [selectedProof, setSelectedProof] = useState<any>(null);

  const myRank = {
    rank: 14,
    percentile: 'Top 5%',
    consistencyScore: 92,
    profitFactor: 2.34,
    winRate: 66.8,
    totalProfit: 11450.00,
    activeStreak: '3 Weeks',
    badge: 'Pro Elite',
  };

  const handleShareBadge = () => {
    const text = encodeURIComponent(
      `🏆 I'm currently ranked in the Top 5% on @FundedShift!\n\n` +
      `📈 Win Rate: ${myRank.winRate}%\n` +
      `💰 Consistency Score: ${myRank.consistencyScore}/100\n` +
      `⚡ Trade funded capital at https://fundedshift.com\n\n` +
      `#FundedShift #FundedTrader #Leaderboard`
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
            Prop Firm Community Leaderboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
            Trader Rankings & Proof of Payout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare your consistency score, track top performing funded peers, and verify public payout receipts.
          </p>
        </div>

        <button
          onClick={handleShareBadge}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm w-fit"
        >
          <Share2 className="h-4 w-4" /> Share My Ranking Badge
        </button>
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
                  Your Current Standing
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {myRank.percentile}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
                Global Rank #{myRank.rank}
              </h2>
              <p className="text-xs text-brand-200 mt-0.5">
                {profile?.full_name || 'FundedShift Trader'} · Active Challenge Phase
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">Consistency</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{myRank.consistencyScore}/100</span>
            </div>
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">Win Rate</span>
              <span className="text-lg font-bold font-mono text-white">{myRank.winRate}%</span>
            </div>
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">Profit Factor</span>
              <span className="text-lg font-bold font-mono text-amber-300">{myRank.profitFactor}</span>
            </div>
            <div className="bg-brand-800/50 backdrop-blur-sm border border-brand-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-brand-300 uppercase block">Total Gain</span>
              <span className="text-lg font-bold font-mono text-emerald-400">+${myRank.totalProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Traders Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-3 uppercase tracking-wider">
            <Trophy className="h-4 w-4" /> Top Payout Champion
          </div>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
              alt="Marcus Vance"
              className="h-12 w-12 rounded-full object-cover border-2 border-amber-300"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Marcus Vance 🇬🇧</h3>
              <p className="text-xs text-slate-500 font-mono">$200,000 Account</p>
              <p className="text-sm font-black font-mono text-emerald-600 mt-0.5">$94,820 Total Payouts</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-3 uppercase tracking-wider">
            <Star className="h-4 w-4" /> Highest Win Rate (82%)
          </div>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
              alt="Sneha Kulkarni"
              className="h-12 w-12 rounded-full object-cover border-2 border-purple-300"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Sneha Kulkarni 🇮🇳</h3>
              <p className="text-xs text-slate-500 font-mono">Specialist in XAUUSD</p>
              <p className="text-sm font-black font-mono text-purple-600 mt-0.5">78.9% Win Rate (3.89 PF)</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-3 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> 0% Drawdown Discipline
          </div>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Rajesh Sharma"
              className="h-12 w-12 rounded-full object-cover border-2 border-emerald-300"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rajesh Sharma 🇮🇳</h3>
              <p className="text-xs text-slate-500 font-mono">Max Drawdown: 0.62%</p>
              <p className="text-sm font-black font-mono text-emerald-600 mt-0.5">$71,320 Paid Out (6 Cycles)</p>
            </div>
          </div>
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

      {/* Payout Proof Modal */}
      {selectedProof && (
        <PayoutProofModal
          isOpen={!!selectedProof}
          onClose={() => setSelectedProof(null)}
          payout={selectedProof}
        />
      )}
    </div>
  );
}
