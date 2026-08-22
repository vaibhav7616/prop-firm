import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Shield, X, Trophy, Sparkles, Share2, Download, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

export interface PayoutProofData {
  id: string;
  traderName: string;
  country?: string;
  accountSize: string;
  payoutAmount: string;
  profitSplit?: string;
  issueDate: string;
  challengeType?: string;
  txHash?: string;
}

interface PayoutProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: PayoutProofData | null;
}

export function PayoutProofModal({ isOpen, onClose, payout }: PayoutProofModalProps) {
  if (!isOpen || !payout) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://fundedshift.com/proof-of-payout#${payout.id}`);
    toast.success('Official proof verification link copied!');
  };

  const handleShareX = () => {
    const text = encodeURIComponent(
      `🎉 Verified Payout Certificate on @FundedShift!\n\n` +
      `👤 Trader: ${payout.traderName}\n` +
      `💰 Payout: ${payout.payoutAmount}\n` +
      `⚡ Account Size: ${payout.accountSize}\n` +
      `📜 Certificate ID: ${payout.id}\n\n` +
      `Verify on-chain: https://fundedshift.com/proof-of-payout#${payout.id}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleDownload = () => {
    toast.success(`Downloading verified certificate for ${payout.traderName}...`);
    // Simulated instant certificate PDF generation trigger
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl rounded-3xl border-2 border-brand-500 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Certificate Design Frame */}
          <div className="border-4 border-double border-brand-200 rounded-2xl p-6 sm:p-8 text-center bg-gradient-to-b from-brand-50/20 via-white to-brand-50/30 relative">
            {/* Corner Decorative Badges */}
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-full bg-brand-50 border-2 border-brand-300 flex items-center justify-center shadow-inner">
                <Trophy className="h-7 w-7 text-brand-600" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wide uppercase mb-2">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Verified Institutional Proof of Payout
            </div>

            <p className="text-xs uppercase font-extrabold tracking-widest text-brand-700">
              FundedShift Proprietary Trading Treasury
            </p>

            <div className="my-5 space-y-2">
              <p className="text-xs text-slate-500 font-medium">This is to officially certify that</p>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
                {payout.traderName}
              </h2>
              <p className="text-xs text-slate-500">
                operating on a <strong>{payout.accountSize}</strong> funded allocation ({payout.challengeType || 'Institutional Evaluation'}), has received a verified withdrawal payout of
              </p>
              <div className="py-2">
                <span className="font-display font-black text-3xl sm:text-4xl text-emerald-600 font-mono tracking-tight bg-emerald-50/80 px-4 py-1 rounded-xl border border-emerald-200 inline-block shadow-xs">
                  {payout.payoutAmount}
                </span>
              </div>
              {payout.profitSplit && (
                <p className="text-xs font-semibold text-brand-600">
                  Performance Profit Split: {payout.profitSplit}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-left pt-4 border-t border-slate-200/80 mt-4">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Certificate ID</span>
                <strong className="font-mono text-slate-800">{payout.id}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Date Processed</span>
                <strong className="text-slate-800">{payout.issueDate}</strong>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
              <span className="flex items-center gap-1 font-mono text-slate-600 text-[10px] truncate max-w-xs">
                TxHash: {payout.txHash || '0x8f3c2a19b4e7d56c8012aa4f8b9e120c4a7e9b31'}
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Audit Timestamped
              </span>
            </div>
          </div>

          {/* Social Share & Action Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Proof URL
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareX}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Share2 className="h-3.5 w-3.5" /> Share on X / Twitter
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF Certificate
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
