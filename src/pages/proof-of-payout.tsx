import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  DollarSign,
  Search,
  CheckCircle2,
  Share2,
  Clock,
  Users,
  Eye,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Wallet,
  Building,
  CreditCard,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

export const VERIFIED_PAYOUTS_DATA: PayoutRecord[] = [
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

export function ProofOfPayoutPage() {
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
        p.favoriteSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.txHash.toLowerCase().includes(searchQuery.toLowerCase());

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
      `🔗 Verification: https://fundedshift.com/proof-of-payout#${payout.id}\n\n` +
      `#FundedShift #PropFirm #ForexTrader #PayoutProof`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-page relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              100% Institutional Transparency & Verified Payout Receipts
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Live Social <span className="text-emerald-600">Proof of Payout</span> Feed
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Every payout at FundedShift is publicly registered with transaction hashes, broker statements, and certificates. Inspect real receipts from funded traders globally.
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

      {/* Main Feed Container */}
      <div className="container-page space-y-8">
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
                <span className="text-slate-500 px-2">Account Tier:</span>
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
                <span className="text-slate-500 px-2">Payout Method:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'CRYPTO', label: 'Crypto (USDT/USDC)' },
                  { id: 'BANK', label: 'Bank Wire' },
                  { id: 'UPI', label: 'UPI / Cards' },
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

                {/* Blockchain & Verification Hash */}
                <div className="bg-slate-100/70 rounded-lg p-2 font-mono text-[11px] text-slate-500 flex items-center justify-between overflow-hidden">
                  <span className="truncate max-w-[200px]">Tx: {payout.txHash}</span>
                  <span className="text-emerald-600 font-bold uppercase text-[10px] shrink-0">On-Chain</span>
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
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payout Assurance Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden border border-slate-800">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              Guaranteed Bi-Weekly & On-Demand Payouts
            </span>
            <h3 className="text-2xl sm:text-4xl font-black font-display text-white">
              Ready to claim your share of trading profits?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join thousands of funded traders withdrawing institutional payouts every single week with up to 90% profit split, raw spreads, and zero hidden delays.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/challenges"
                className="btn-primary px-6 py-3 text-sm font-bold shadow-lg"
              >
                Start Evaluation Challenge
              </Link>
              <Link
                to="/leaderboard"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/15 transition-all"
              >
                Explore Top Trader Leaderboard
              </Link>
            </div>
          </div>
        </div>
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
