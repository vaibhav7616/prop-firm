import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Shield,
  ShieldCheck,
  X,
  Search,
  Trophy,
  Sparkles,
  ArrowRight,
  Share2,
  Download,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CertificateItem {
  id: string;
  traderName: string;
  country: string;
  countryCode: string;
  accountSize: string;
  challengeType: string;
  payoutAmount: number;
  payoutFormatted: string;
  profitSplit: string;
  issueDate: string;
  verifiedHash: string;
}

export const OFFICIAL_CERTIFICATES: CertificateItem[] = [
  {
    id: 'FS-PAY-98434',
    traderName: 'Oliver Smith',
    country: 'Canada',
    countryCode: 'CA',
    accountSize: '$25,000',
    challengeType: 'Instant Funded',
    payoutAmount: 890.0,
    payoutFormatted: '$890.00',
    profitSplit: '85%',
    issueDate: 'August 23, 2026',
    verifiedHash: '0x3c2da92fb7e4198c0b561e72a819ef3b90a421bc',
  },
  {
    id: 'FS-PAY-98435',
    traderName: 'Deepak Joshi',
    country: 'India',
    countryCode: 'IN',
    accountSize: '$50,000',
    challengeType: '2-Step Evaluation',
    payoutAmount: 1570.0,
    payoutFormatted: '$1,570.00',
    profitSplit: '90%',
    issueDate: 'August 20, 2026',
    verifiedHash: '0x9a1bc841f3e5872a4b8109d763ef441829e0ca11',
  },
  {
    id: 'FS-PAY-98436',
    traderName: 'Kenji Takahashi',
    country: 'Japan',
    countryCode: 'JP',
    accountSize: '$25,000',
    challengeType: '1-Step Challenge',
    payoutAmount: 1340.0,
    payoutFormatted: '$1,340.00',
    profitSplit: '90%',
    issueDate: 'August 17, 2026',
    verifiedHash: '0x7b2f689e4c110da35b7194f208ce819349b1028e',
  },
  {
    id: 'FS-PAY-98433',
    traderName: 'Sneha Kulkarni',
    country: 'India',
    countryCode: 'IN',
    accountSize: '$25,000',
    challengeType: '1-Step Challenge',
    payoutAmount: 2150.0,
    payoutFormatted: '$2,150.00',
    profitSplit: '90%',
    issueDate: 'August 25, 2026',
    verifiedHash: '0x8f3a9e14c7d2e09b11ac297b48e351829f041b3a',
  },
  {
    id: 'FS-PAY-98437',
    traderName: 'Elena Rostova',
    country: 'Germany',
    countryCode: 'DE',
    accountSize: '$100,000',
    challengeType: '2-Step Evaluation',
    payoutAmount: 3420.0,
    payoutFormatted: '$3,420.00',
    profitSplit: '90%',
    issueDate: 'August 15, 2026',
    verifiedHash: '0x4e8c110d9a5e4b1890cf231a48b9195029db8147',
  },
  {
    id: 'FS-PAY-98438',
    traderName: 'Marcus Vance',
    country: 'United States',
    countryCode: 'US',
    accountSize: '$200,000',
    challengeType: '2-Step Evaluation',
    payoutAmount: 6850.0,
    payoutFormatted: '$6,850.00',
    profitSplit: '90%',
    issueDate: 'August 12, 2026',
    verifiedHash: '0x5d9a2c88f1b34e7021e89b41a7c39058b420f18a',
  },
  {
    id: 'FS-PAY-98439',
    traderName: 'Alexandre Dubois',
    country: 'France',
    countryCode: 'FR',
    accountSize: '$100,000',
    challengeType: '1-Step Evaluation',
    payoutAmount: 4890.0,
    payoutFormatted: '$4,890.00',
    profitSplit: '90%',
    issueDate: 'August 10, 2026',
    verifiedHash: '0x6a2b8e90c4d1f23789b14e3058a91bc7401ef982',
  },
  {
    id: 'FS-PAY-98440',
    traderName: 'Lucas Silva',
    country: 'Brazil',
    countryCode: 'BR',
    accountSize: '$50,000',
    challengeType: 'Instant Funded',
    payoutAmount: 1820.0,
    payoutFormatted: '$1,820.00',
    profitSplit: '85%',
    issueDate: 'August 8, 2026',
    verifiedHash: '0x1f3c9e88b2a75d40a91e523b784f10cd832049b1',
  },
];

const LEGACY_ID_MAP: Record<string, string> = {
  'sf-94821': 'FS-PAY-98438',
  'sf-94822': 'FS-PAY-98437',
  'sf-94823': 'FS-PAY-98436',
};

export function CertificateModal() {
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState<CertificateItem | null | 'not_found'>(null);

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    const query = verifyId.trim().toLowerCase();
    const mappedId = LEGACY_ID_MAP[query] || query;
    const found = OFFICIAL_CERTIFICATES.find(
      (c) => c.id.toLowerCase() === mappedId || c.id.toLowerCase() === query
    );
    if (found) {
      setVerifyResult(found);
    } else {
      setVerifyResult('not_found');
    }
  };

  const handleCopyLink = (cert: CertificateItem) => {
    navigator.clipboard.writeText(`https://fundedshift.com/proof-of-payout#${cert.id}`);
    toast.success('Official proof verification link copied!');
  };

  const handleShareX = (cert: CertificateItem) => {
    const text = encodeURIComponent(
      `🎉 Verified Official Trader Certificate on @FundedShift!\n\n` +
      `👤 Trader: ${cert.traderName} (${cert.country})\n` +
      `💰 Disbursed Payout: ${cert.payoutFormatted}\n` +
      `⚡ Account: ${cert.accountSize} (${cert.challengeType})\n` +
      `📜 Certificate ID: ${cert.id}\n\n` +
      `Verify: https://fundedshift.com/proof-of-payout#${cert.id}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleDownload = (cert: CertificateItem) => {
    toast.success(`Preparing certificate download for ${cert.traderName}...`);
    window.print();
  };

  return (
    <section className="section-pad bg-[#f4f7fb] dark:bg-card/30 border-b border-border overflow-hidden relative">
      <div className="container-page">
        {/* Header matching Screenshot 2026-10-03 165602 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/90 text-brand-700 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              Verified Institutional Credentials
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-foreground tracking-tight mt-3">
              Official Trader Funded Certificates
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Authentic cryptographically verifiable certificates issued to funded traders globally upon completing
              evaluation target milestones and verified profit distributions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-card border border-slate-200/90 dark:border-border shadow-xs text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Auto-Sliding Proofs · Hover to Inspect
            </div>
            <Link
              to="/proof-of-payout"
              className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 group transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Auto-sliding continuous carousel with soft fade edges */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Gradient edge overlays */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#f4f7fb] dark:from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#f4f7fb] dark:from-background to-transparent z-10" />

        <div className="animate-marquee-continuous flex gap-6 px-4">
          {[...OFFICIAL_CERTIFICATES, ...OFFICIAL_CERTIFICATES].map((cert, idx) => (
            <div
              key={`${cert.id}-${idx}`}
              className="w-[350px] sm:w-[370px] shrink-0 rounded-3xl border-2 border-brand-200/80 bg-white dark:bg-card p-5 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Row: Ribbon + Treasury + ID */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                    <Award className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold tracking-wider text-brand-800 dark:text-brand-400 uppercase leading-none">
                      FUNDEDSHIFT TREASURY
                    </p>
                    <p className="text-[9px] font-semibold tracking-wide text-slate-400 dark:text-muted-foreground uppercase mt-1 leading-none">
                      OFFICIAL PAYOUT CERTIFICATE
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 border border-brand-200/80 dark:border-brand-800 px-2.5 py-1 rounded-lg">
                  {cert.id}
                </span>
              </div>

              {/* Middle Section: This Certifies That + Name + Milestone */}
              <div className="pt-3.5 pb-2">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-muted-foreground uppercase">
                  THIS CERTIFIES THAT
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-slate-800 dark:text-foreground">
                      {cert.countryCode}
                    </span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                      {cert.traderName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium">
                    {cert.country}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                  completed profit milestone on{' '}
                  <strong className="font-bold text-slate-900 dark:text-foreground">
                    {cert.accountSize}
                  </strong>{' '}
                  ({cert.challengeType})
                </p>
              </div>

              {/* Disbursed Payout Green Box */}
              <div className="mt-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider text-emerald-800 dark:text-emerald-400 uppercase leading-none">
                    DISBURSED PAYOUT
                  </p>
                  <p className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400 mt-1 leading-none">
                    {cert.payoutFormatted}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-card border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Dispatched
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Split: {cert.profitSplit}
                  </p>
                </div>
              </div>

              {/* Card Bottom Row: Issued Date + View Official Proof */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-muted-foreground uppercase">
                    ISSUED
                  </p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {cert.issueDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCert(cert)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 inline-flex items-center gap-1 group/btn transition-colors cursor-pointer"
                >
                  <span>View Official Proof</span>
                  <Sparkles className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Verification Input Bar */}
      <div className="container-page mt-10">
        <div className="max-w-xl mx-auto rounded-2xl border border-border bg-white dark:bg-card p-4 shadow-soft">
          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. FS-PAY-98434 or SF-94821)..."
                value={verifyId}
                onChange={(e) => {
                  setVerifyId(e.target.value);
                  setVerifyResult(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <button type="submit" className="btn-primary text-xs py-2.5 px-5">
              Verify ID
            </button>
          </form>

          {verifyResult === 'not_found' && (
            <p className="text-xs text-destructive mt-3 text-center">
              No certificate found with ID "{verifyId}". Try FS-PAY-98434, FS-PAY-98435, or SF-94821.
            </p>
          )}

          {verifyResult && verifyResult !== 'not_found' && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Certificate Verified Authenticity
                </p>
                <p>
                  Trader: <strong>{verifyResult.traderName}</strong> ({verifyResult.country})
                </p>
                <p>
                  Account: <strong>{verifyResult.accountSize}</strong> ({verifyResult.challengeType})
                </p>
                <p>
                  Disbursed Payout: <strong>{verifyResult.payoutFormatted}</strong> ({verifyResult.issueDate})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(verifyResult)}
                className="btn-primary text-xs py-2 px-3 self-start sm:self-auto shrink-0 flex items-center gap-1"
              >
                <span>View Full Certificate</span>
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Original High-Fidelity Certificate Modal Lightbox */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="relative w-full max-w-2xl rounded-3xl border-2 border-brand-500 bg-white dark:bg-card p-6 sm:p-8 shadow-soft-2xl text-slate-900 dark:text-foreground overflow-hidden max-h-[95vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-secondary text-slate-400 hover:text-slate-700 dark:hover:text-foreground transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Official Certificate Design Frame */}
              <div className="border-4 border-double border-brand-300 dark:border-brand-700 rounded-2xl p-6 sm:p-8 text-center bg-gradient-to-b from-brand-50/30 via-white dark:via-card to-brand-50/20 relative">
                {/* Official Crest */}
                <div className="flex justify-center mb-3">
                  <div className="h-14 w-14 rounded-full bg-brand-50 dark:bg-brand-950/60 border-2 border-brand-300 dark:border-brand-600 flex items-center justify-center shadow-inner">
                    <Trophy className="h-7 w-7 text-brand-600 dark:text-brand-400" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tracking-wide uppercase mb-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Verified Institutional Proof of Payout
                </div>

                <p className="text-xs uppercase font-extrabold tracking-widest text-brand-700 dark:text-brand-400">
                  FundedShift Proprietary Trading Treasury
                </p>

                <div className="my-5 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-muted-foreground font-medium">
                    This is to officially certify that
                  </p>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-foreground tracking-tight">
                    {selectedCert.traderName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    operating on a <strong>{selectedCert.accountSize}</strong> funded allocation ({selectedCert.challengeType}), has received a verified withdrawal payout of
                  </p>
                  <div className="py-2">
                    <span className="font-display font-black text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400 font-mono tracking-tight bg-emerald-50/80 dark:bg-emerald-950/60 px-5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-block shadow-xs">
                      {selectedCert.payoutFormatted}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    Performance Profit Split: {selectedCert.profitSplit} · Location: {selectedCert.country}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-left pt-4 border-t border-slate-200/80 dark:border-border mt-4">
                  <div>
                    <span className="text-slate-400 dark:text-muted-foreground block text-[10px] font-bold uppercase">
                      Certificate ID
                    </span>
                    <strong className="font-mono text-slate-800 dark:text-foreground">
                      {selectedCert.id}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-muted-foreground block text-[10px] font-bold uppercase">
                      Date Issued
                    </span>
                    <strong className="text-slate-800 dark:text-foreground">
                      {selectedCert.issueDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-muted-foreground block text-[10px] font-bold uppercase">
                      Challenge Tier
                    </span>
                    <strong className="text-slate-800 dark:text-foreground">
                      {selectedCert.challengeType}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-muted-foreground block text-[10px] font-bold uppercase">
                      Verification
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Authentic
                    </span>
                  </div>
                </div>

                {/* Cryptographic Hash */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-border/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-muted-foreground gap-2">
                  <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300 text-[10px] truncate max-w-xs">
                    SHA-256 Hash: {selectedCert.verifiedHash}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Audit Timestamped
                  </span>
                </div>

                {/* Signatures & Treasury Seal */}
                <div className="pt-5 mt-4 grid grid-cols-3 items-center justify-items-center text-center gap-2 border-t border-slate-200 dark:border-border">
                  <div>
                    <p className="font-serif italic text-base sm:text-lg text-slate-800 dark:text-slate-200">
                      Marcus Vance
                    </p>
                    <div className="w-20 sm:w-24 h-px bg-slate-300 dark:bg-slate-700 mx-auto my-0.5" />
                    <p className="text-[9px] text-slate-500 uppercase">Chief Executive Officer</p>
                  </div>

                  {/* Golden Treasury Seal */}
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-0.5 shadow-md flex items-center justify-center">
                    <div className="h-full w-full rounded-full bg-white dark:bg-slate-950 border border-amber-300 flex flex-col items-center justify-center p-0.5 text-[7px] font-bold text-amber-700 dark:text-amber-400">
                      <Award className="h-4 w-4 mb-0.5 text-amber-600 dark:text-amber-400" />
                      <span>FUNDED SHIFT</span>
                      <span className="text-[5px] text-slate-400 uppercase">OFFICIAL SEAL</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-serif italic text-base sm:text-lg text-slate-800 dark:text-slate-200">
                      David Chen
                    </p>
                    <div className="w-20 sm:w-24 h-px bg-slate-300 dark:bg-slate-700 mx-auto my-0.5" />
                    <p className="text-[9px] text-slate-500 uppercase">Head of Risk</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedCert)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-secondary dark:hover:bg-secondary/80 text-slate-700 dark:text-foreground font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Verification Link
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareX(selectedCert)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share on X
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedCert)}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Download HD PDF / Print
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
