import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PayoutProofModal, type PayoutProofData } from '@/components/shared/payout-proof-modal';

interface FundedCertificateItem {
  id: string;
  traderName: string;
  country: string;
  flag: string;
  accountType: string;
  accountSize: string;
  payoutAmount: string;
  profitSplit: string;
  date: string;
  verifiedHash: string;
}

// Payout range strictly from $276 to $1,800 with distinct dates and mixed Indian & foreign traders
const CERTIFICATES_LIST: FundedCertificateItem[] = [
  {
    id: 'FS-PAY-98421',
    traderName: 'Rajesh Sharma',
    country: 'India',
    flag: '🇮🇳',
    accountType: '2-Step Evaluation',
    accountSize: '$50,000',
    payoutAmount: '$1,780.00',
    profitSplit: '90%',
    date: 'September 24, 2026',
    verifiedHash: '0x8f3a19b4e7d56c8012aa4f8b9e120c4a7e9b41e',
  },
  {
    id: 'FS-PAY-98422',
    traderName: 'Marcus Vance',
    country: 'United Kingdom',
    flag: '🇬🇧',
    accountType: '1-Step Challenge',
    accountSize: '$25,000',
    payoutAmount: '$1,450.00',
    profitSplit: '90%',
    date: 'September 22, 2026',
    verifiedHash: '0x3b7d12f9e4c8a56b2011ea3f9b8c210d4a6e8c22',
  },
  {
    id: 'FS-PAY-98423',
    traderName: 'Aarav Patel',
    country: 'India',
    flag: '🇮🇳',
    accountType: 'Instant Funded',
    accountSize: '$10,000',
    payoutAmount: '$490.00',
    profitSplit: '80%',
    date: 'September 20, 2026',
    verifiedHash: '0x4c8a19f3b7e6d52a8014ca9f3e8b210c6a7e9b44',
  },
  {
    id: 'FS-PAY-98424',
    traderName: 'Lucas Schneider',
    country: 'Germany',
    flag: '🇩🇪',
    accountType: '2-Step Evaluation',
    accountSize: '$50,000',
    payoutAmount: '$1,620.00',
    profitSplit: '90%',
    date: 'September 18, 2026',
    verifiedHash: '0x6a3f9e18b4c7d52e9014ba7f2e9c110d8a5e4c33',
  },
  {
    id: 'FS-PAY-98425',
    traderName: 'Priya Nair',
    country: 'India',
    flag: '🇮🇳',
    accountType: '1-Step Challenge',
    accountSize: '$5,000',
    payoutAmount: '$276.00',
    profitSplit: '85%',
    date: 'September 16, 2026',
    verifiedHash: '0x7e4a19c3f8b5d62e1098ca3f2e1a908b6d4c7a11',
  },
  {
    id: 'FS-PAY-98426',
    traderName: 'Alexandre Dubois',
    country: 'France',
    flag: '🇫🇷',
    accountType: '2-Step Evaluation',
    accountSize: '$25,000',
    payoutAmount: '$980.00',
    profitSplit: '90%',
    date: 'September 14, 2026',
    verifiedHash: '0x992b4e7c1a8f3d6b5021da8f4e9c310b7a6e1a99',
  },
  {
    id: 'FS-PAY-98427',
    traderName: 'Vikram Malhotra',
    country: 'India',
    flag: '🇮🇳',
    accountType: 'Instant Funded',
    accountSize: '$25,000',
    payoutAmount: '$1,380.00',
    profitSplit: '85%',
    date: 'September 12, 2026',
    verifiedHash: '0x3c2da92f8b1a4e5d6023ba7e4c9f110d8b5a3c21',
  },
  {
    id: 'FS-PAY-98428',
    traderName: 'Sofia Martinez',
    country: 'Spain',
    flag: '🇪🇸',
    accountType: '1-Step Challenge',
    accountSize: '$25,000',
    payoutAmount: '$1,120.00',
    profitSplit: '90%',
    date: 'September 09, 2026',
    verifiedHash: '0x9a1bc841f3e7d52a8019ca4f2e8b210c5a6e7b19',
  },
  {
    id: 'FS-PAY-98429',
    traderName: 'Ananya Roy',
    country: 'India',
    flag: '🇮🇳',
    accountType: '2-Step Evaluation',
    accountSize: '$10,000',
    payoutAmount: '$615.00',
    profitSplit: '90%',
    date: 'September 07, 2026',
    verifiedHash: '0x5b3c2e19a4f8d76c9012ea4b8c9e120f4a7d9b55',
  },
  {
    id: 'FS-PAY-98430',
    traderName: 'Elena Rostova',
    country: 'Estonia',
    flag: '🇪🇪',
    accountType: '2-Step Evaluation',
    accountSize: '$50,000',
    payoutAmount: '$1,690.00',
    profitSplit: '90%',
    date: 'September 04, 2026',
    verifiedHash: '0x2e4a8b7c1d3f56a9018fa7b2c9e110d4a5e6c77',
  },
  {
    id: 'FS-PAY-98431',
    traderName: 'Rohan Verma',
    country: 'India',
    flag: '🇮🇳',
    accountType: 'Instant Funded',
    accountSize: '$5,000',
    payoutAmount: '$385.50',
    profitSplit: '80%',
    date: 'September 01, 2026',
    verifiedHash: '0x8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
  },
  {
    id: 'FS-PAY-98432',
    traderName: 'David Miller',
    country: 'United States',
    flag: '🇺🇸',
    accountType: '2-Step Evaluation',
    accountSize: '$50,000',
    payoutAmount: '$1,800.00',
    profitSplit: '90%',
    date: 'August 29, 2026',
    verifiedHash: '0x7c4d1e2f3a5b6c8d9e0f1a2b3c4d5e6f7a8b9c0d',
  },
  {
    id: 'FS-PAY-98433',
    traderName: 'Sneha Kulkarni',
    country: 'India',
    flag: '🇮🇳',
    accountType: '1-Step Challenge',
    accountSize: '$25,000',
    payoutAmount: '$1,250.00',
    profitSplit: '90%',
    date: 'August 26, 2026',
    verifiedHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
  },
  {
    id: 'FS-PAY-98434',
    traderName: 'Oliver Smith',
    country: 'Canada',
    flag: '🇨🇦',
    accountType: 'Instant Funded',
    accountSize: '$25,000',
    payoutAmount: '$890.00',
    profitSplit: '85%',
    date: 'August 23, 2026',
    verifiedHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
  },
  {
    id: 'FS-PAY-98435',
    traderName: 'Deepak Joshi',
    country: 'India',
    flag: '🇮🇳',
    accountType: '2-Step Evaluation',
    accountSize: '$50,000',
    payoutAmount: '$1,570.00',
    profitSplit: '90%',
    date: 'August 20, 2026',
    verifiedHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
  },
  {
    id: 'FS-PAY-98436',
    traderName: 'Kenji Takahashi',
    country: 'Japan',
    flag: '🇯🇵',
    accountType: '1-Step Challenge',
    accountSize: '$25,000',
    payoutAmount: '$1,340.00',
    profitSplit: '90%',
    date: 'August 17, 2026',
    verifiedHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
  },
  {
    id: 'FS-PAY-98437',
    traderName: 'Sunita Patil',
    country: 'India',
    flag: '🇮🇳',
    accountType: 'Instant Funded',
    accountSize: '$10,000',
    payoutAmount: '$740.00',
    profitSplit: '85%',
    date: 'August 14, 2026',
    verifiedHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
  },
  {
    id: 'FS-PAY-98438',
    traderName: 'Liam O\'Connor',
    country: 'Australia',
    flag: '🇦🇺',
    accountType: '2-Step Evaluation',
    accountSize: '$50,000',
    payoutAmount: '$1,750.00',
    profitSplit: '90%',
    date: 'August 10, 2026',
    verifiedHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
  },
];

export function CertificateModal() {
  const [selectedPayout, setSelectedPayout] = useState<PayoutProofData | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const openCertificate = (cert: FundedCertificateItem) => {
    setSelectedPayout({
      id: cert.id,
      traderName: cert.traderName,
      country: cert.country,
      accountSize: cert.accountSize,
      payoutAmount: cert.payoutAmount,
      profitSplit: cert.profitSplit,
      issueDate: cert.date,
      challengeType: cert.accountType,
      txHash: cert.verifiedHash,
    });
  };

  return (
    <section className="section-pad bg-gradient-to-b from-secondary/10 via-brand-50/20 to-secondary/20 border-b border-border overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-500/5 blur-3xl pointer-events-none" />

      <div className="container-page mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100/80 border border-brand-200 text-brand-700 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>Verified Institutional Credentials</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight">
              Official Trader Funded Certificates
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
              Authentic cryptographically verifiable certificates issued to funded traders globally upon completing evaluation target milestones and verified profit distributions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-card/80 border border-border px-3 py-1.5 rounded-full shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Auto-Sliding Proofs · Hover to Inspect
            </span>
            <Link
              to="/proof-of-payout"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Infinite Right-to-Left Animated Certificate Slider */}
      <div
        className="relative w-full overflow-hidden py-3"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Soft edge blur overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={isPaused ? {} : { x: ['0%', '-50%'] }}
          transition={{
            duration: 48,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex gap-5 w-max"
        >
          {[...CERTIFICATES_LIST, ...CERTIFICATES_LIST].map((cert, index) => (
            <div
              key={`${cert.id}-${index}`}
              onClick={() => openCertificate(cert)}
              className="group cursor-pointer w-[340px] sm:w-[370px] shrink-0 rounded-2xl border-2 border-brand-200/80 hover:border-brand-500 bg-card p-5 sm:p-6 shadow-soft hover:shadow-soft-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Certificate Inner Double-Border Guilloche Styling */}
              <div className="absolute inset-1.5 border border-dashed border-brand-200/60 rounded-xl pointer-events-none group-hover:border-brand-400/80 transition-colors" />

              {/* Top Foil Header */}
              <div className="relative z-1 flex items-center justify-between mb-3 pb-3 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-50 border border-brand-200/90 flex items-center justify-center text-brand-600 shadow-xs">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-brand-700 leading-none">
                      FundedShift Treasury
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Official Payout Certificate
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-brand-100/80 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                  {cert.id}
                </span>
              </div>

              {/* Certificate Body */}
              <div className="relative z-1 py-1 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  This certifies that
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{cert.flag}</span>
                    <h3 className="font-display font-extrabold text-xl text-foreground tracking-tight group-hover:text-brand-600 transition-colors">
                      {cert.traderName}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{cert.country}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  completed profit milestone on{' '}
                  <strong className="text-foreground font-semibold">{cert.accountSize}</strong> ({cert.accountType})
                </p>

                {/* Big Payout Highlight Box */}
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-brand-50/30 border border-emerald-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Disbursed Payout
                    </span>
                    <span className="font-display font-black text-2xl text-emerald-600 font-mono tracking-tight">
                      {cert.payoutAmount}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Dispatched
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Split: {cert.profitSplit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="relative z-1 mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-[11px]">
                <div className="text-muted-foreground">
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">
                    Issued
                  </span>
                  <span className="font-medium text-foreground text-xs">{cert.date}</span>
                </div>
                <button
                  type="button"
                  className="font-semibold text-brand-600 group-hover:text-brand-700 inline-flex items-center gap-1 text-xs group-hover:translate-x-0.5 transition-transform"
                >
                  <span>View Official Proof</span>
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Payout Proof High-Definition Modal */}
      <PayoutProofModal
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        payout={selectedPayout}
      />
    </section>
  );
}
