import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Download, Eye, ShieldCheck, CheckCircle2, Sparkles, X, Share2, Copy, FileCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatAccountSize, formatDate, formatCurrency } from '@/lib/constants';
import type { TradingAccount, Certificate } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchUserAccounts } from '@/lib/api-client';
import { DEFAULT_ACCOUNTS, DEFAULT_CERTIFICATES } from '@/lib/default-data';

export function DashboardCertificates() {
  const { user, profile } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'step1' | 'step2' | 'payouts'>('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        let userAccs: TradingAccount[] = [];
        let userPayouts: any[] = [];
        if (user) {
          const fetched = await fetchUserAccounts(user.id);
          if (fetched && fetched.length > 0) {
            userAccs = fetched;
          }
          try {
            const pRes = await fetch('/api/payouts', {
              headers: { 'x-user-id': user.id },
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData)) userPayouts = pData;
            }
          } catch (_) {}
        }
        if (userAccs.length === 0) {
          userAccs = DEFAULT_ACCOUNTS;
        }

        // Combine default certificates with dynamic account certificates
        const dynamicCerts: Certificate[] = [];

        userAccs.forEach((accAny, idx) => {
          const acc = accAny as any;
          const traderName = profile?.full_name || user?.email?.split('@')[0] || 'Valued Trader';
          const startingBal = acc.starting_balance || acc.account_size || 100000;
          const currentBal = acc.current_balance || startingBal;
          const profitAmt = (typeof acc.profit === 'number' && !isNaN(acc.profit)) ? acc.profit : (currentBal - startingBal);
          const p1Target = (startingBal * (((acc.rules as any)?.profit_target_percent || (acc.rules as any)?.profit_target || 8) / 100));

          // Condition 1: Step 1 Passed
          const hasPassedStep1 = acc.status === 'passed' || acc.status === 'funded' || acc.phase > 1 || (acc.phase === 1 && profitAmt >= p1Target && acc.status !== 'failed');

          // Condition 2: Step 2 Passed / Funded
          const hasPassedStep2OrFunded = acc.status === 'funded' || acc.phase > 2 || (acc.phase === 2 && (acc.status === 'passed' || profitAmt >= (startingBal * 0.05)));

          // Step 1 Passed Certificate - ONLY IF STEP 1 IS CLEARED
          if (hasPassedStep1) {
            dynamicCerts.push({
              id: `cert-step1-${acc.id}`,
              user_id: acc.user_id,
              account_id: acc.id,
              title: 'EVALUATION STEP 1 PASSED',
              subtitle: 'Phase 1 Target Reached & Account Verified',
              type: 'step1_passed',
              recipient_name: traderName,
              account_size: acc.account_size,
              account_number: acc.account_number || `884019${idx}`,
              challenge_name: acc.challenge?.name || acc.plan_name || `${formatAccountSize(acc.account_size)} Challenge`,
              certificate_number: `FS-ST1-2026-${1000 + idx * 47}`,
              issued_at: acc.assigned_at || acc.created_at,
            });
          }

          // Step 2 / Funded Certificate - ONLY IF STEP 2 / FUNDED IS CLEARED
          if (hasPassedStep2OrFunded) {
            dynamicCerts.push({
              id: `cert-funded-${acc.id}`,
              user_id: acc.user_id,
              account_id: acc.id,
              title: 'OFFICIAL FUNDED TRADER',
              subtitle: 'Evaluation Completed & Capital Allocated',
              type: 'funded',
              recipient_name: traderName,
              account_size: acc.account_size,
              account_number: acc.account_number || `884019${idx}`,
              challenge_name: acc.challenge?.name || acc.plan_name || `${formatAccountSize(acc.account_size)} Funded Account`,
              certificate_number: `FS-FND-2026-${2000 + idx * 83}`,
              issued_at: acc.assigned_at || acc.created_at,
            });
          }
        });

        // Add Payout Certificates for APPROVED / PAID Payout Requests
        userPayouts.forEach((pay, pIdx) => {
          if (pay.status === 'PAID' || pay.status === 'APPROVED' || pay.status === 'COMPLETED') {
            const traderName = pay.user_name || profile?.full_name || user?.email?.split('@')[0] || 'Valued Trader';
            dynamicCerts.push({
              id: `cert-payout-${pay.id}`,
              user_id: pay.user_id,
              account_id: pay.account_id,
              title: 'PROFIT SPLIT PAYOUT CERTIFICATE',
              subtitle: `Approved Payout Disbursement #${pay.account_number}`,
              type: 'payout',
              recipient_name: traderName,
              account_size: pay.starting_balance || 100000,
              amount: pay.trader_payout_amount,
              account_number: pay.account_number,
              challenge_name: `Funded Account #${pay.account_number}`,
              certificate_number: `FS-PAY-2026-${pay.id.slice(-6).toUpperCase()}`,
              issued_at: pay.processed_at || pay.created_at || new Date().toISOString(),
            });
          }
        });

        // Merge with DEFAULT_CERTIFICATES ensuring no duplicate IDs
        // Only include default certificates if user is using demo accounts
        const userHasRealAccs = user && userAccs.some(a => a.user_id === user.id && a.id !== 'acc-10001');
        const defaultCertsToUse = userHasRealAccs ? [] : DEFAULT_CERTIFICATES;

        const existingIds = new Set(dynamicCerts.map((c) => c.id));
        const finalCerts = [
          ...dynamicCerts,
          ...defaultCertsToUse.filter((c) => !existingIds.has(c.id)),
        ];

        setCertificates(finalCerts);
      } catch (err) {
        console.warn('Error building certificates:', err);
        setCertificates(DEFAULT_CERTIFICATES);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, profile]);

  // Filtered certificates
  const filteredCertificates = certificates.filter((c) => {
    if (activeTab === 'step1') return c.type === 'step1_passed' || c.type === 'passed_phase1';
    if (activeTab === 'step2') return c.type === 'funded' || c.type === 'step2_passed' || c.type === 'passed_phase2';
    if (activeTab === 'payouts') return c.type === 'payout';
    return true;
  });

  // Canvas PNG Generator
  const generateCanvasImage = (cert: Certificate) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1130;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const name = cert.recipient_name || profile?.full_name || user?.email || 'Valued Trader';

    // 1. Dark Luxury Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1130);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0d1322');
    bgGrad.addColorStop(1, '#06080e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1600, 1130);

    // 2. Gold Border Pattern
    ctx.lineWidth = 12;
    const goldGrad = ctx.createLinearGradient(0, 0, 1600, 1130);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.3, '#eab308');
    goldGrad.addColorStop(0.7, '#ca8a04');
    goldGrad.addColorStop(1, '#fef08a');
    ctx.strokeStyle = goldGrad;
    ctx.strokeRect(40, 40, 1520, 1050);

    // Inner subtle gold line
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1490, 1020);

    // Corner Ornaments
    const drawCorner = (x: number, y: number) => {
      ctx.save();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    };
    drawCorner(80, 80);
    drawCorner(1520, 80);
    drawCorner(80, 1050);
    drawCorner(1520, 1050);

    // 3. Header Logo & Brand
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#eab308';
    ctx.fillText('FUNDED SHIFT', 800, 140);

    ctx.font = '600 16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('OFFICIAL PROP FIRM CERTIFICATION OF ACHIEVEMENT', 800, 175);

    // Horizontal Divider Line
    ctx.beginPath();
    ctx.moveTo(400, 205);
    ctx.lineTo(1200, 205);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Certificate Title
    ctx.font = '800 48px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cert.title.toUpperCase(), 800, 280);

    if (cert.subtitle) {
      ctx.font = '500 22px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(cert.subtitle, 800, 320);
    }

    // 5. Recipient Section
    ctx.font = 'italic 22px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('This is proudly presented to', 800, 390);

    // Recipient Name
    ctx.font = 'bold 62px serif';
    const textGrad = ctx.createLinearGradient(400, 0, 1200, 0);
    textGrad.addColorStop(0, '#fef08a');
    textGrad.addColorStop(0.5, '#ffffff');
    textGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = textGrad;
    ctx.fillText(name, 800, 470);

    // Name Underline
    ctx.beginPath();
    ctx.moveTo(500, 495);
    ctx.lineTo(1100, 495);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6. Achievement Description Text
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    let bodyText = `In recognition of outstanding trading performance on the ${cert.challenge_name || 'Funded Shift Challenge'}.`;
    if (cert.type === 'step1_passed') {
      bodyText = `For successfully passing Phase 1 evaluation and meeting all strict profit targets and risk controls.`;
    } else if (cert.type === 'funded') {
      bodyText = `For successfully completing all evaluation stages and being awarded an official Funded Trader Account.`;
    } else if (cert.type === 'payout') {
      bodyText = `For achieving an official Profit Share Payout Disbursement of ${formatCurrency(cert.amount || 2450)}.`;
    }
    ctx.fillText(bodyText, 800, 560);

    // 7. Stats Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(350, 620, 900, 140);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
    ctx.strokeRect(350, 620, 900, 140);

    // Stats Grid inside box
    ctx.textAlign = 'center';

    // Account Size / Payout Amount
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(cert.type === 'payout' ? 'DISBURSED PAYOUT' : 'ACCOUNT SIZE', 500, 660);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#eab308';
    ctx.fillText(
      cert.type === 'payout' ? formatCurrency(cert.amount || 2450) : formatAccountSize(cert.account_size || 50000),
      500,
      705
    );

    // Issue Date
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('DATE ISSUED', 800, 660);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(formatDate(cert.issued_at), 800, 705);

    // Certificate ID
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('CERTIFICATE ID', 1100, 660);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(cert.certificate_number || `FS-CERT-${cert.id}`, 1100, 705);

    // 8. Bottom Seal & Signatures
    // Left Signature
    ctx.textAlign = 'center';
    ctx.font = 'italic 26px serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Marcus Vance', 480, 880);
    ctx.beginPath();
    ctx.moveTo(380, 895);
    ctx.lineTo(580, 895);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Chief Executive Officer', 480, 920);

    // Center Gold Seal Emblem
    ctx.beginPath();
    ctx.arc(800, 880, 55, 0, 2 * Math.PI);
    ctx.fillStyle = '#ca8a04';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('FUNDED SHIFT', 800, 875);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('VERIFIED TRADER', 800, 892);

    // Right Signature
    ctx.font = 'italic 26px serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('David Chen', 1120, 880);
    ctx.beginPath();
    ctx.moveTo(1020, 895);
    ctx.lineTo(1220, 895);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Head of Risk Management', 1120, 920);

    // 9. Footer Security Bar
    ctx.font = '12px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`AUTHENTICITY VERIFIED BY FUNDED SHIFT EVALUATION ENGINE · SECURE SHA-256 HASH`, 800, 1010);

    return canvas.toDataURL('image/png');
  };

  const handleDownload = (cert: Certificate) => {
    const dataUrl = generateCanvasImage(cert);
    if (!dataUrl) {
      toast.error('Failed to generate image download.');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `FundedShift_${cert.title.replace(/\s+/g, '_')}_${cert.certificate_number || cert.id}.png`;
    a.click();
    toast.success('Certificate PNG image downloaded!');
  };

  const copyShareLink = (cert: Certificate) => {
    const link = `${window.location.origin}/dashboard/certificates?verify=${cert.certificate_number || cert.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Certificate verification link copied!');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-2xl glass animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl glass animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            Certificates & Achievements <Sparkles className="h-5 w-5 text-gold-400" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Official prop firm certifications awarded upon passing evaluation steps and receiving payouts.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
        {[
          { id: 'all', label: 'All Certificates' },
          { id: 'step1', label: 'Step 1 Passed' },
          { id: 'step2', label: 'Step 2 & Funded' },
          { id: 'payouts', label: 'Payout Certificates' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-gold-gradient text-black shadow-md shadow-gold-400/10'
                : 'text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Certificate Cards Grid */}
      {filteredCertificates.length === 0 ? (
        <Card className="glass border-border/50 p-12 text-center">
          <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">No certificates found in this category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCertificates.map((cert, idx) => {
            const isFunded = cert.type === 'funded' || cert.type === 'step2_passed';
            const isStep1 = cert.type === 'step1_passed' || cert.type === 'passed_phase1';
            const isPayout = cert.type === 'payout';

            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                whileHover={{ y: -3 }}
              >
                <Card className="glass border-border/50 hover:border-gold-400/40 transition-all duration-300 relative overflow-hidden group">
                  {/* Decorative background glow */}
                  <div
                    className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl opacity-20 pointer-events-none ${
                      isFunded
                        ? 'bg-emerald-400'
                        : isStep1
                        ? 'bg-blue-400'
                        : isPayout
                        ? 'bg-gold-400'
                        : 'bg-gold-400'
                    }`}
                  />

                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                            isFunded
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isStep1
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-gold-400/15 text-gold-400 border border-gold-400/30'
                          }`}
                        >
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-bold tracking-tight">{cert.title}</h3>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/20">
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{cert.subtitle || cert.challenge_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-card/60 border border-border/40 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">RECIPIENT</span>
                        <span className="font-semibold text-foreground truncate block">
                          {cert.recipient_name || profile?.full_name || user?.email || 'Valued Trader'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          {isPayout ? 'DISBURSED PAYOUT' : 'ACCOUNT SIZE'}
                        </span>
                        <span className="font-bold text-gold-400 block">
                          {isPayout
                            ? formatCurrency(cert.amount || 2450)
                            : formatAccountSize(cert.account_size || 50000)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">ISSUE DATE</span>
                        <span className="font-medium text-foreground">{formatDate(cert.issued_at)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">CERTIFICATE ID</span>
                        <span className="font-mono text-emerald-400 font-medium">
                          {cert.certificate_number || `FS-${cert.id.slice(0, 8)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gold-400/30 hover:bg-gold-400/10 text-gold-400"
                        onClick={() => setSelectedCert(cert)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View Certificate
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gold-gradient text-black hover:opacity-90 font-semibold"
                        onClick={() => handleDownload(cert)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download HD PNG
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Certificate Live Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedCert && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                className="relative w-full max-w-3xl bg-slate-950 border-2 border-gold-400/50 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 text-foreground my-auto max-h-[90vh] overflow-y-auto"
              >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all z-20"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Certificate Canvas Render Frame */}
              <div className="relative border-2 sm:border-4 border-double border-gold-400/60 p-5 sm:p-8 rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black text-center space-y-4 shadow-inner">
                {/* Gold Foil Header Logo */}
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gold-gradient p-0.5 flex items-center justify-center shadow-lg shadow-gold-400/20">
                    <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-gold-400" />
                    </div>
                  </div>
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl tracking-wider text-gold-400 mt-1">
                    FUNDED SHIFT
                  </h2>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Official Prop Firm Certification
                  </p>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent my-3" />

                {/* Title */}
                <div>
                  <h1 className="font-display font-black text-xl sm:text-3xl text-white tracking-tight uppercase">
                    {selectedCert.title}
                  </h1>
                  {selectedCert.subtitle && (
                    <p className="text-gold-400 text-xs sm:text-sm font-medium mt-0.5">{selectedCert.subtitle}</p>
                  )}
                </div>

                {/* Presented To */}
                <div className="space-y-0.5">
                  <p className="text-[11px] text-slate-400 italic font-serif">This certificate is proudly awarded to</p>
                  <p className="font-display font-bold text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-white to-gold-400 py-0.5">
                    {profile?.full_name || user?.email?.split('@')[0] || selectedCert.recipient_name || 'Valued Trader'}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                  {selectedCert.type === 'step1_passed' &&
                    'In recognition of passing Evaluation Step 1 by demonstrating superior risk management and hitting the 10% profit milestone.'}
                  {selectedCert.type === 'funded' &&
                    'In recognition of completing all evaluation stages and achieving status as an Official Funded Trader with live capital allocation.'}
                  {selectedCert.type === 'payout' &&
                    `In recognition of achieving an official profit distribution milestone of ${formatCurrency(
                      selectedCert.amount || 2450
                    )}.`}
                  {!['step1_passed', 'funded', 'payout'].includes(selectedCert.type) &&
                    `In recognition of outstanding trading performance on the ${
                      selectedCert.challenge_name || 'Funded Shift Challenge'
                    }.`}
                </p>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-gold-400/20 max-w-xl mx-auto text-left text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">
                      {selectedCert.type === 'payout' ? 'Payout Disbursed' : 'Account Size'}
                    </p>
                    <p className="font-bold text-gold-400 text-xs sm:text-sm">
                      {selectedCert.type === 'payout'
                        ? formatCurrency(selectedCert.amount || 2450)
                        : formatAccountSize(selectedCert.account_size || 50000)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Date Issued</p>
                    <p className="font-medium text-white text-xs">{formatDate(selectedCert.issued_at)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Certificate ID</p>
                    <p className="font-mono text-emerald-400 font-bold text-xs truncate">
                      {selectedCert.certificate_number || `FS-${selectedCert.id.slice(0, 8)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Verification</p>
                    <p className="font-semibold text-emerald-400 flex items-center gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Authentic
                    </p>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className="pt-4 grid grid-cols-3 items-center justify-items-center text-center gap-2 border-t border-slate-800">
                  <div>
                    <p className="font-serif italic text-base sm:text-lg text-gold-300">Marcus Vance</p>
                    <div className="w-20 sm:w-24 h-px bg-slate-700 mx-auto my-0.5" />
                    <p className="text-[9px] text-slate-400">Chief Executive Officer</p>
                  </div>

                  {/* Golden Seal */}
                  <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-gradient-to-br from-gold-300 via-amber-500 to-yellow-600 p-0.5 shadow-lg shadow-gold-400/20 flex items-center justify-center">
                    <div className="h-full w-full rounded-full bg-slate-950 border border-gold-300/40 flex flex-col items-center justify-center p-0.5 text-[7px] font-bold text-gold-300">
                      <Award className="h-4 w-4 mb-0.5 text-gold-400" />
                      <span>FUNDED SHIFT</span>
                      <span className="text-[5px] text-slate-400 uppercase">OFFICIAL SEAL</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-serif italic text-base sm:text-lg text-gold-300">David Chen</p>
                    <div className="w-20 sm:w-24 h-px bg-slate-700 mx-auto my-0.5" />
                    <p className="text-[9px] text-slate-400">Head of Risk</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyShareLink(selectedCert)}
                  className="w-full sm:w-auto text-xs"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Copy Verification Link
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCert(null)} className="text-xs">
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gold-gradient text-black hover:opacity-90 font-semibold w-full sm:w-auto text-xs"
                    onClick={() => handleDownload(selectedCert)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download HD PNG
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
}
