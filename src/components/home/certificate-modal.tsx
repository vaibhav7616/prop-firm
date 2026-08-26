import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Shield, X, Search, Trophy, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CertificateData {
  id: string;
  traderName: string;
  accountType: string;
  accountSize: number;
  payoutAmount: number;
  date: string;
  verifiedHash: string;
}

const SAMPLE_CERTIFICATES: CertificateData[] = [
  { id: 'SF-94821', traderName: 'Marcus Vance', accountType: '$200k Two-Step Evaluation', accountSize: 200000, payoutAmount: 18450, date: 'July 28, 2026', verifiedHash: '0x8f3a...b41e' },
  { id: 'SF-94822', traderName: 'Elena Rostova', accountType: '$100k One-Step Challenge', accountSize: 100000, payoutAmount: 12300, date: 'July 29, 2026', verifiedHash: '0x3c2d...a92f' },
  { id: 'SF-94823', traderName: 'Kenji Takahashi', accountType: '$400k Instant Funded', accountSize: 400000, payoutAmount: 34100, date: 'July 30, 2026', verifiedHash: '0x9a1b...c841' },
];

export function CertificateModal() {
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState<CertificateData | null | 'not_found'>(null);

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    const found = SAMPLE_CERTIFICATES.find(c => c.id.toLowerCase() === verifyId.trim().toLowerCase());
    if (found) {
      setVerifyResult(found);
    } else {
      setVerifyResult('not_found');
    }
  };

  return (
    <section className="section-pad bg-secondary/20 border-b border-border">
      <div className="container-page">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="badge-brand">Verified Credentials</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground">
            Official Trader Funded Certificates
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Every successful trader receives a cryptographic, verified certificate upon passing evaluation or completing payouts.
          </p>
        </div>

        {/* Certificate Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_CERTIFICATES.map((cert) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCert(cert)}
              className="group cursor-pointer rounded-2xl border border-brand-200/60 bg-gradient-to-b from-card via-card to-brand-50/30 p-6 shadow-soft hover:shadow-soft-lg hover:border-brand-500 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-brand-600" />
                <span className="text-[10px] font-mono font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded">
                  {cert.id}
                </span>
              </div>

              <p className="font-display font-bold text-xl text-foreground">{cert.traderName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cert.accountType}</p>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Payout Approved</p>
                  <p className="font-display font-bold text-lg text-emerald-600 font-mono">
                    {formatCurrency(cert.payoutAmount)}
                  </p>
                </div>
                <button className="text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View <Sparkles className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Certificate Verification Input Bar */}
        <div className="mt-10 max-w-xl mx-auto rounded-2xl border border-border bg-card p-4 shadow-soft">
          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. SF-94821)..."
                value={verifyId}
                onChange={(e) => { setVerifyId(e.target.value); setVerifyResult(null); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>
            <button type="submit" className="btn-primary text-xs py-2.5 px-5">
              Verify ID
            </button>
          </form>

          {verifyResult === 'not_found' && (
            <p className="text-xs text-destructive mt-3 text-center">
              No certificate found with ID "{verifyId}". Try SF-94821 or SF-94822.
            </p>
          )}

          {verifyResult && verifyResult !== 'not_found' && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Certificate Verified Authenticity
              </p>
              <p>Trader: <strong>{verifyResult.traderName}</strong></p>
              <p>Account: <strong>{verifyResult.accountType}</strong></p>
              <p>Payout: <strong>{formatCurrency(verifyResult.payoutAmount)}</strong> ({verifyResult.date})</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lightbox for Certificate View */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl border-2 border-brand-500 bg-card p-8 shadow-soft-2xl text-foreground overflow-hidden"
            >
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Certificate Design Frame */}
              <div className="border-4 border-double border-brand-300 rounded-2xl p-6 sm:p-8 text-center bg-gradient-to-b from-card via-brand-50/10 to-card relative">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center border border-brand-300">
                    <Trophy className="h-6 w-6 text-brand-600" />
                  </div>
                </div>

                <p className="text-xs uppercase font-bold tracking-widest text-brand-600">
                  Certificate of Achievement & Funding
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">FundedShift Proprietary Trading Firm</p>

                <div className="my-6 space-y-2">
                  <p className="text-xs text-muted-foreground">This is to officially certify that</p>
                  <p className="font-display font-extrabold text-3xl text-foreground">{selectedCert.traderName}</p>
                  <p className="text-xs text-muted-foreground">has successfully completed evaluation and received a payout of</p>
                  <p className="font-display font-bold text-3xl text-emerald-600 font-mono">
                    {formatCurrency(selectedCert.payoutAmount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-left pt-4 border-t border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Certificate ID</span>
                    <strong className="font-mono text-foreground">{selectedCert.id}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Date Issued</span>
                    <strong className="text-foreground">{selectedCert.date}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Shield className="h-3 w-3" /> Cryptographically Verified
                  </span>
                  <span className="font-mono">{selectedCert.verifiedHash}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
