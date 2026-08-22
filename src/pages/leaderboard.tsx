import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  ShieldCheck,
  Award,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Share2,
  Download,
  Flame,
  Sparkles,
  Zap,
  Clock,
  Globe,
  ArrowUpRight,
  ChevronRight,
  Eye,
  BarChart3,
  Calendar,
  Layers,
  Star,
  Users,
} from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { PayoutProofModal } from '@/components/shared/payout-proof-modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface PayoutRecord {
  id: string;
  txHash: string;
  traderName: string;
  country: string;
  countryCode: string;
  flag: string;
  avatar: string;
  amount: number;
  accountSize: string;
  accountTier: number;
  challengeType: '1-Step Evaluation' | '2-Step Evaluation' | 'Instant Funding';
  payoutMethod: 'Crypto (USDT)' | 'Crypto (USDC)' | 'Bank Transfer' | 'UPI' | 'Razorpay';
  payoutDate: string;
  timeAgo: string;
  profitSplit: string;
  tradingDays: number;
  favoriteSymbol: string;
  winRate: number;
  verified: boolean;
}

export interface LeaderboardTrader {
  rank: number;
  traderName: string;
  country: string;
  flag: string;
  avatar: string;
  accountSize: string;
  totalPayouts: number;
  payoutCount: number;
  winRate: number;
  profitFactor: number;
  topSymbol: string;
  streakMonths: number;
  badge?: string;
}

const VERIFIED_PAYOUTS_DATA: PayoutRecord[] = [
  {
    id: 'FS-PAY-9941',
    txHash: '0x8f3c2a19b4e7d56c8012aa4f8b9e120c4a7e9b31',
    traderName: 'Rajesh Sharma',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    amount: 14250.00,
    accountSize: '$200,000',
    accountTier: 200000,
    challengeType: '2-Step Evaluation',
    payoutMethod: 'Bank Transfer',
    payoutDate: 'August 22, 2026',
    timeAgo: '4 mins ago',
    profitSplit: '90%',
    tradingDays: 19,
    favoriteSymbol: 'XAUUSD',
    winRate: 72.4,
    verified: true,
  },
  {
    id: 'FS-PAY-9940',
    txHash: '0x3b7d12f9e4c8a56b2011ea3f9b8c210d4a6e8c22',
    traderName: 'Alexandre Dubois',
    country: 'France',
    countryCode: 'FR',
    flag: '🇫🇷',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    amount: 8940.50,
    accountSize: '$100,000',
    accountTier: 100000,
    challengeType: '1-Step Evaluation',
    payoutMethod: 'Crypto (USDT)',
    payoutDate: 'August 22, 2026',
    timeAgo: '12 mins ago',
    profitSplit: '90%',
    tradingDays: 14,
    favoriteSymbol: 'EURUSD',
    winRate: 68.1,
    verified: true,
  },
  {
    id: 'FS-PAY-9939',
    txHash: '0x12a9f4c3b8e7d26a5019fa7b4e8c110d9a5e4b18',
    traderName: 'Vikram Mehta',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    amount: 5420.00,
    accountSize: '$50,000',
    accountTier: 50000,
    challengeType: 'Instant Funding',
    payoutMethod: 'UPI',
    payoutDate: 'August 22, 2026',
    timeAgo: '28 mins ago',
    profitSplit: '80%',
    tradingDays: 22,
    favoriteSymbol: 'XAUUSD',
    winRate: 64.8,
    verified: true,
  },
  {
    id: 'FS-PAY-9938',
    txHash: '0x7e4a19c3f8b5d62e1098ca3f2e1a908b6d4c7a11',
    traderName: 'Marcus Vance',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    amount: 18790.00,
    accountSize: '$200,000',
    accountTier: 200000,
    challengeType: '2-Step Evaluation',
    payoutMethod: 'Crypto (USDC)',
    payoutDate: 'August 22, 2026',
    timeAgo: '45 mins ago',
    profitSplit: '90%',
    tradingDays: 26,
    favoriteSymbol: 'US30',
    winRate: 74.2,
    verified: true,
  },
  {
    id: 'FS-PAY-9937',
    txHash: '0x992b4e7c1a8f3d6b5021da8f4e9c310b7a6e1a99',
    traderName: 'Ananya Roy',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    amount: 3890.00,
    accountSize: '$50,000',
    accountTier: 50000,
    challengeType: '1-Step Evaluation',
    payoutMethod: 'Razorpay',
    payoutDate: 'August 22, 2026',
    timeAgo: '1 hour ago',
    profitSplit: '90%',
    tradingDays: 12,
    favoriteSymbol: 'GBPUSD',
    winRate: 69.5,
    verified: true,
  },
  {
    id: 'FS-PAY-9936',
    txHash: '0x4c8a19f3b7e6d52a8014ca9f3e8b210c6a7e9b44',
    traderName: 'Lucas Schneider',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    amount: 9350.00,
    accountSize: '$100,000',
    accountTier: 100000,
    challengeType: '2-Step Evaluation',
    payoutMethod: 'Bank Transfer',
    payoutDate: 'August 22, 2026',
    timeAgo: '2 hours ago',
    profitSplit: '90%',
    tradingDays: 18,
    favoriteSymbol: 'GER40',
    winRate: 71.0,
    verified: true,
  },
  {
    id: 'FS-PAY-9935',
    txHash: '0x2d9e4a18b7c3f56a9012ea8f1b4c910d5a6e8b77',
    traderName: 'Aarav Patel',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    amount: 850.00,
    accountSize: '$10,000',
    accountTier: 10000,
    challengeType: '1-Step Evaluation',
    payoutMethod: 'UPI',
    payoutDate: 'August 22, 2026',
    timeAgo: '3 hours ago',
    profitSplit: '90%',
    tradingDays: 8,
    favoriteSymbol: 'BTCUSD',
    winRate: 65.0,
    verified: true,
  },
  {
    id: 'FS-PAY-9934',
    txHash: '0x6a3f9e18b4c7d52e9014ba7f2e9c110d8a5e4c33',
    traderName: 'Sofia Martinez',
    country: 'Spain',
    countryCode: 'ES',
    flag: '🇪🇸',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    amount: 11200.00,
    accountSize: '$100,000',
    accountTier: 100000,
    challengeType: 'Instant Funding',
    payoutMethod: 'Crypto (USDT)',
    payoutDate: 'August 22, 2026',
    timeAgo: '3 hours ago',
    profitSplit: '85%',
    tradingDays: 21,
    favoriteSymbol: 'XAUUSD',
    winRate: 76.3,
    verified: true,
  },
  {
    id: 'FS-PAY-9933',
    txHash: '0x5e1a9c3f8b7d42a9018ea4f9b2c310d6a7e9b88',
    traderName: 'Rohan Verma',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    amount: 6780.00,
    accountSize: '$100,000',
    accountTier: 100000,
    challengeType: '2-Step Evaluation',
    payoutMethod: 'Bank Transfer',
    payoutDate: 'August 21, 2026',
    timeAgo: '5 hours ago',
    profitSplit: '90%',
    tradingDays: 16,
    favoriteSymbol: 'NAS100',
    winRate: 67.8,
    verified: true,
  },
  {
    id: 'FS-PAY-9932',
    txHash: '0x7b4c19e3f8a5d62a9012da7f3e1b910c4a6e8b55',
    traderName: 'Sneha Kulkarni',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    amount: 15640.00,
    accountSize: '$200,000',
    accountTier: 200000,
    challengeType: '2-Step Evaluation',
    payoutMethod: 'Crypto (USDC)',
    payoutDate: 'August 21, 2026',
    timeAgo: '6 hours ago',
    profitSplit: '90%',
    tradingDays: 24,
    favoriteSymbol: 'XAUUSD',
    winRate: 78.9,
    verified: true,
  },
];

const LEADERBOARD_TOP_TRADERS: LeaderboardTrader[] = [
  {
    rank: 1,
    traderName: 'Marcus Vance',
    country: 'United Kingdom',
    flag: '🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    accountSize: '$200,000',
    totalPayouts: 94820.00,
    payoutCount: 8,
    winRate: 74.2,
    profitFactor: 3.42,
    topSymbol: 'US30',
    streakMonths: 8,
    badge: '🏆 #1 All-Time Legend',
  },
  {
    rank: 2,
    traderName: 'Sneha Kulkarni',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    accountSize: '$200,000',
    totalPayouts: 82450.00,
    payoutCount: 7,
    winRate: 78.9,
    profitFactor: 3.89,
    topSymbol: 'XAUUSD',
    streakMonths: 7,
    badge: '👑 Gold Specialist',
  },
  {
    rank: 3,
    traderName: 'Rajesh Sharma',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    accountSize: '$200,000',
    totalPayouts: 71320.00,
    payoutCount: 6,
    winRate: 72.4,
    profitFactor: 2.95,
    topSymbol: 'XAUUSD',
    streakMonths: 6,
    badge: '⭐ Consistent Master',
  },
  {
    rank: 4,
    traderName: 'Sofia Martinez',
    country: 'Spain',
    flag: '🇪🇸',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    totalPayouts: 58900.00,
    payoutCount: 5,
    winRate: 76.3,
    profitFactor: 3.12,
    topSymbol: 'XAUUSD',
    streakMonths: 5,
  },
  {
    rank: 5,
    traderName: 'Lucas Schneider',
    country: 'Germany',
    flag: '🇩🇪',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    totalPayouts: 49200.00,
    payoutCount: 5,
    winRate: 71.0,
    profitFactor: 2.84,
    topSymbol: 'GER40',
    streakMonths: 5,
  },
  {
    rank: 6,
    traderName: 'Alexandre Dubois',
    country: 'France',
    flag: '🇫🇷',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    totalPayouts: 42150.00,
    payoutCount: 4,
    winRate: 68.1,
    profitFactor: 2.65,
    topSymbol: 'EURUSD',
    streakMonths: 4,
  },
  {
    rank: 7,
    traderName: 'Rohan Verma',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    accountSize: '$100,000',
    totalPayouts: 36700.00,
    payoutCount: 4,
    winRate: 67.8,
    profitFactor: 2.51,
    topSymbol: 'NAS100',
    streakMonths: 4,
  },
  {
    rank: 8,
    traderName: 'Vikram Mehta',
    country: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    accountSize: '$50,000',
    totalPayouts: 28400.00,
    payoutCount: 4,
    winRate: 64.8,
    profitFactor: 2.38,
    topSymbol: 'XAUUSD',
    streakMonths: 3,
  },
];

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'proofs' | 'leaderboard' | 'hallOfFame'>('proofs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedCertificateTrader, setSelectedCertificateTrader] = useState<PayoutRecord | null>(null);

  // Filtered Proofs
  const filteredPayouts = useMemo(() => {
    return VERIFIED_PAYOUTS_DATA.filter((p) => {
      const matchSearch =
        p.traderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.favoriteSymbol.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTier =
        selectedTier === 'ALL' ||
        (selectedTier === '200k' && p.accountTier === 200000) ||
        (selectedTier === '100k' && p.accountTier === 100000) ||
        (selectedTier === '50k' && p.accountTier === 50000) ||
        (selectedTier === '25k' && p.accountTier === 25000) ||
        (selectedTier === '10k' && p.accountTier === 10000);

      const matchMethod =
        selectedMethod === 'ALL' ||
        (selectedMethod === 'CRYPTO' && p.payoutMethod.includes('Crypto')) ||
        (selectedMethod === 'BANK' && p.payoutMethod.includes('Bank')) ||
        (selectedMethod === 'UPI' && (p.payoutMethod.includes('UPI') || p.payoutMethod.includes('Razorpay')));

      return matchSearch && matchTier && matchMethod;
    });
  }, [searchQuery, selectedTier, selectedMethod]);

  const handleShareOnX = (payout: PayoutRecord) => {
    const text = encodeURIComponent(
      `🎉 Verified Payout Proof on @FundedShift!\n\n` +
      `👤 Trader: ${payout.traderName} (${payout.flag})\n` +
      `💰 Payout: $${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
      `⚡ Account: ${payout.accountSize} | ${payout.profitSplit} Profit Split\n` +
      `🔗 Verification: https://fundedshift.com/proof-of-payout\n\n` +
      `#FundedShift #PropFirm #ForexTrader #PayoutProof`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleCopyLink = (payout: PayoutRecord) => {
    navigator.clipboard.writeText(`https://fundedshift.com/proof-of-payout#${payout.id}`);
    toast.success(`Verification link for ${payout.id} copied to clipboard!`);
  };

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-page relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              100% Institutional Transparency & Payout Proof
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Community Leaderboard & <span className="text-brand-600">Proof of Payout</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Every payout at FundedShift is publicly registered and cryptographically verified. Explore live proof receipts, certificates, and top funded trader rankings.
            </p>
          </div>

          {/* Key Metrics Trust Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">$4,892,400+</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Total Paid to Funded Traders</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 mb-2">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">18 Minutes</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Average Payout Dispatch Time</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">99.4%</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Payout Approval Rate</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm text-center"
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900">2,480+</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Funded & Profiting Traders</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Tab Controller */}
      <div className="container-page">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('proofs')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                activeTab === 'proofs'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Live Proof of Payout Feed
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                activeTab === 'leaderboard'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Trader Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('hallOfFame')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                activeTab === 'hallOfFame'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Star className="h-4 w-4 text-purple-500" />
              Hall of Fame Milestones
            </button>
          </div>
        </div>

        {/* TAB 1: PROOF OF PAYOUT FEED */}
        {activeTab === 'proofs' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-card border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search trader, country, ID, symbol..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Tier filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                    <span className="text-slate-500 px-2">Tier:</span>
                    {['ALL', '200k', '100k', '50k', '25k', '10k'].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg transition-all',
                          selectedTier === tier
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        {tier === 'ALL' ? 'All' : `$${tier.toUpperCase()}`}
                      </button>
                    ))}
                  </div>

                  {/* Method filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                    <span className="text-slate-500 px-2">Method:</span>
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'CRYPTO', label: 'Crypto' },
                      { id: 'BANK', label: 'Bank' },
                      { id: 'UPI', label: 'UPI / Card' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg transition-all',
                          selectedMethod === m.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPayouts.map((payout) => (
                <motion.div
                  key={payout.id}
                  whileHover={{ y: -4 }}
                  className="bg-card border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Trader & Country */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={payout.avatar}
                          alt={payout.traderName}
                          className="h-11 w-11 rounded-full object-cover border-2 border-brand-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-900">{payout.traderName}</h4>
                            <span className="text-base" title={payout.country}>{payout.flag}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{payout.id}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> VERIFIED
                      </span>
                    </div>

                    {/* Amount & Account Size */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          PAYOUT AMOUNT
                        </span>
                        <span className="text-xl font-black font-mono text-emerald-600">
                          ${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          ACCOUNT SIZE
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {payout.accountSize}
                        </span>
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 pt-1">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-bold text-slate-800">{payout.payoutMethod}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Split:</span>
                        <span className="font-bold text-brand-600">{payout.profitSplit}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500">Top Asset:</span>
                        <span className="font-bold font-mono text-slate-800">{payout.favoriteSymbol}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500">Win Rate:</span>
                        <span className="font-bold text-emerald-600">{payout.winRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">{payout.timeAgo}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShareOnX(payout)}
                        title="Share on X (Twitter)"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedCertificateTrader(payout)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Proof
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8">
            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {LEADERBOARD_TOP_TRADERS.slice(0, 3).map((trader, idx) => {
                const isGold = idx === 0;
                const isSilver = idx === 1;
                const isBronze = idx === 2;

                return (
                  <motion.div
                    key={trader.rank}
                    whileHover={{ y: -6 }}
                    className={cn(
                      'rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border shadow-sm transition-all',
                      isGold && 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white border-amber-300 md:-translate-y-4 shadow-amber-500/10',
                      isSilver && 'bg-gradient-to-b from-slate-200/50 via-slate-100/20 to-white border-slate-300',
                      isBronze && 'bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-white border-amber-600/30'
                    )}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center font-black font-mono text-sm shadow-sm',
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
                        <p className="text-xs text-slate-500 font-mono">Account: {trader.accountSize}</p>
                      </div>
                    </div>

                    {/* Big Payout Metric */}
                    <div className="bg-white/80 rounded-xl p-3.5 border border-slate-200/80 text-center mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        TOTAL DISTRIBUTED PAYOUTS
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-600">
                        ${trader.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                        {trader.payoutCount} Verified Payouts Received
                      </span>
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
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

            {/* Leaderboard Table (Ranks 4-20) */}
            <div className="bg-card border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Rankings & Trader Standings</h3>
                  <p className="text-xs text-slate-500">Updated hourly based on audited broker statements and processed payouts</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                  Global Hall
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">Trader</th>
                      <th className="p-3.5">Funded Account</th>
                      <th className="p-3.5">Total Paid Out</th>
                      <th className="p-3.5">Payouts</th>
                      <th className="p-3.5">Win Rate</th>
                      <th className="p-3.5">Profit Factor</th>
                      <th className="p-3.5">Favorite Asset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {LEADERBOARD_TOP_TRADERS.map((trader) => (
                      <tr key={trader.rank} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold font-mono">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold',
                              trader.rank === 1 && 'bg-amber-400 text-amber-950',
                              trader.rank === 2 && 'bg-slate-300 text-slate-800',
                              trader.rank === 3 && 'bg-amber-700 text-white',
                              trader.rank > 3 && 'text-slate-500'
                            )}
                          >
                            #{trader.rank}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={trader.avatar}
                              alt={trader.traderName}
                              className="h-8 w-8 rounded-full object-cover border border-slate-200"
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
                        <td className="p-3.5 font-mono font-semibold text-slate-800">{trader.accountSize}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">
                          ${trader.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">{trader.payoutCount} withdrawals</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">{trader.winRate}%</td>
                        <td className="p-3.5 font-mono font-bold text-brand-600">{trader.profitFactor}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{trader.topSymbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HALL OF FAME MILESTONES */}
        {activeTab === 'hallOfFame' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white mb-4 shadow-md shadow-amber-500/30">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">$100,000+ Club</h3>
                <p className="text-xs text-slate-600 mt-1 mb-4">
                  Traders who have surpassed $100,000 in accumulated verified payouts from FundedShift.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200/60 text-xs">
                    <span className="font-bold text-slate-800">Marcus Vance 🇬🇧</span>
                    <span className="font-mono font-bold text-amber-600">$94,820 (95% to $100k)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200/60 text-xs">
                    <span className="font-bold text-slate-800">Sneha Kulkarni 🇮🇳</span>
                    <span className="font-mono font-bold text-amber-600">$82,450 (82% to $100k)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white border border-purple-200 rounded-2xl p-6 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white mb-4 shadow-md shadow-purple-600/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Zero Drawdown Masters</h3>
                <p className="text-xs text-slate-600 mt-1 mb-4">
                  Elite traders who passed their evaluation without exceeding 1.0% maximum historical drawdown.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-200/60 text-xs">
                    <span className="font-bold text-slate-800">Rajesh Sharma 🇮🇳</span>
                    <span className="font-mono font-bold text-purple-600">Max DD: 0.62%</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-200/60 text-xs">
                    <span className="font-bold text-slate-800">Lucas Schneider 🇩🇪</span>
                    <span className="font-mono font-bold text-purple-600">Max DD: 0.81%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-md shadow-emerald-600/30">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Speed Demon Payouts</h3>
                <p className="text-xs text-slate-600 mt-1 mb-4">
                  Evaluation accounts passed in under 7 trading days while maintaining full risk compliance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200/60 text-xs">
                    <span className="font-bold text-slate-800">Aarav Patel 🇮🇳</span>
                    <span className="font-mono font-bold text-emerald-600">Passed in 5 Days</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200/60 text-xs">
                    <span className="font-bold text-slate-800">Alexandre Dubois 🇫🇷</span>
                    <span className="font-mono font-bold text-emerald-600">Passed in 6 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Certificate Modal */}
      {selectedCertificateTrader && (
        <PayoutProofModal
          isOpen={!!selectedCertificateTrader}
          onClose={() => setSelectedCertificateTrader(null)}
          payout={{
            id: selectedCertificateTrader.id,
            traderName: selectedCertificateTrader.traderName,
            accountSize: selectedCertificateTrader.accountSize,
            payoutAmount: `$${selectedCertificateTrader.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            profitSplit: selectedCertificateTrader.profitSplit,
            issueDate: selectedCertificateTrader.payoutDate,
            challengeType: selectedCertificateTrader.challengeType,
            country: selectedCertificateTrader.country,
            txHash: selectedCertificateTrader.txHash,
          }}
        />
      )}
    </div>
  );
}
