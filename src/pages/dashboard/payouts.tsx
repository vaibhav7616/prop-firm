import { useEffect, useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  Wallet,
  AlertCircle,
  RefreshCw,
  QrCode,
  X,
  Send,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/constants';
import { fetchUserAccounts } from '@/lib/api-client';
import { DEFAULT_ACCOUNTS } from '@/lib/default-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function DashboardPayouts() {
  const { user, profile } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Payout Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Crypto' | 'Bank Transfer' | 'PayPal'>('Crypto');
  const [submitting, setSubmitting] = useState(false);

  // Payment details form state
  const [upiId, setUpiId] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT (TRC20)');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  const loadData = async () => {
    setLoading(true);
    const userId = user?.id || 'demo-trader-id-12345';
    try {
      const [accData, payRes] = await Promise.all([
        fetchUserAccounts(userId),
        fetch('/api/payouts', {
          headers: { 'x-user-id': userId },
        }).catch(() => null),
      ]);

      if (accData && accData.length > 0) {
        setAccounts(accData);
      } else {
        setAccounts(DEFAULT_ACCOUNTS);
      }

      if (payRes && payRes.ok) {
        const data = await payRes.json();
        setPayouts(Array.isArray(data) ? data : []);
      } else {
        setPayouts([]);
      }
    } catch (err) {
      console.warn('Payout page load warning:', err);
      setAccounts(DEFAULT_ACCOUNTS);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const fundedAccounts = accounts.filter((a) => a.status === 'FUNDED' || a.status === 'PAYOUT_PENDING');

  const handleOpenPayoutModal = (acc: any) => {
    const profit = acc.current_balance - acc.starting_balance;
    if (acc.status !== 'FUNDED' && acc.status !== 'PAYOUT_PENDING') {
      toast.error('Only active Funded accounts are eligible for profit payouts.');
      return;
    }
    if (profit <= 0) {
      toast.error('Account has no realized profit. Earn profits above initial balance to request a payout.');
      return;
    }
    setSelectedAccount(acc);
    setIsModalOpen(true);
  };

  const handleSubmitPayout = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    let payment_details: any = {};
    let payoutAddress = '';

    if (selectedMethod === 'UPI') {
      if (!upiId.trim()) {
        toast.error('Please enter a valid UPI ID / Phone number');
        return;
      }
      payoutAddress = upiId.trim();
      payment_details = { upi_id: upiId.trim() };
    } else if (selectedMethod === 'Crypto') {
      if (!cryptoAddress.trim()) {
        toast.error('Please enter your Crypto Wallet address');
        return;
      }
      payoutAddress = `${cryptoNetwork}: ${cryptoAddress.trim()}`;
      payment_details = { crypto_network: cryptoNetwork, wallet_address: cryptoAddress.trim() };
    } else if (selectedMethod === 'Bank Transfer') {
      if (!bankAccountHolder.trim() || !bankName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim()) {
        toast.error('Please complete all bank transfer details');
        return;
      }
      payoutAddress = `Bank: ${bankName.trim()} | A/C: ${bankAccountNumber.trim()}`;
      payment_details = {
        account_holder: bankAccountHolder.trim(),
        bank_name: bankName.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfsc.trim(),
      };
    } else if (selectedMethod === 'PayPal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        toast.error('Please enter a valid PayPal email address');
        return;
      }
      payoutAddress = paypalEmail.trim();
      payment_details = { paypal_email: paypalEmail.trim() };
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-trader-id-12345',
        },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          payoutMethod: selectedMethod,
          payoutAddress,
          paymentDetails: payment_details,
          userEmail: profile?.email || user?.email || 'trader@propfirm.com',
          userName: profile?.full_name || 'Valued Trader',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Payout request submitted successfully! Pending Admin Review.`);
        setIsModalOpen(false);
        await loadData();
      } else {
        toast.error(data.error || 'Failed to submit payout request.');
      }
    } catch (_) {
      toast.error('Error submitting payout request.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.trader_payout_amount || 0), 0);

  const totalPending = payouts
    .filter((p) => p.status === 'REQUESTED' || p.status === 'UNDER_REVIEW' || p.status === 'PROCESSING')
    .reduce((sum, p) => sum + (p.trader_payout_amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <DollarSign className="h-3.5 w-3.5" /> Prop Firm Trader Payouts
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Profit Split & Payout Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Request profit payouts from your Funded Accounts. Profit split is 80/20 for Step 1 & Step 2 Evaluation Accounts, and 70/30 for Instant Funding Accounts.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="border-border/60 hover:border-gold-400/50 text-xs gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Status
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Paid Out</p>
              <p className="font-display text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pending Payouts</p>
              <p className="font-display text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Eligible Funded Accounts</p>
              <p className="font-display text-2xl font-bold text-gold-400 mt-1">{fundedAccounts.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-gold-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule-Based Payout Eligibility Banner */}
      <Card className="glass border-gold-400/30 bg-card/70 relative overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-gold-400" /> Prop Firm Payout Rules & Eligibility
          </CardTitle>
          <CardDescription>
            Our rule-based payout engine verifies compliance before enabling payout requests. No minimum profit payout threshold required!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-muted-foreground font-medium">Account Status</p>
              <p className="font-bold text-foreground mt-0.5">FUNDED Account</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-muted-foreground font-medium">Min. Payout Profit</p>
              <p className="font-bold text-emerald-400 mt-0.5">No Minimum ($0+ Profit)</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-muted-foreground font-medium">Trader Profit Split</p>
              <p className="font-bold text-emerald-400 mt-0.5">80% (Step 1/2) / 70% (Instant)</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-muted-foreground font-medium">Breach Status</p>
              <p className="font-bold text-emerald-400 mt-0.5">0 Rule Violations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funded Accounts Payout Action Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Your Funded Accounts & Payout Action</CardTitle>
          <CardDescription>Select a Funded account with realized profits to apply for payout.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-semibold border-y border-border/50">
                <tr>
                  <th className="p-4">Account Number</th>
                  <th className="p-4">Starting Capital</th>
                  <th className="p-4">Current Balance</th>
                  <th className="p-4">Net Profit</th>
                  <th className="p-4">Trader Share</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {fundedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No active Funded accounts found. Pass Phase 1 & Phase 2 or get an Instant Funding account to start earning payouts!
                    </td>
                  </tr>
                ) : (
                  fundedAccounts.map((acc) => {
                    const profit = acc.current_balance - acc.starting_balance;
                    const traderSplitPct = acc.rules?.profit_split_percent || ((acc.challenge_type || '').toUpperCase().includes('INSTANT') ? 70 : 80);
                    const traderSplitAmt = profit > 0 ? (profit * (traderSplitPct / 100)) : 0;
                    const isPending = acc.status === 'PAYOUT_PENDING';
                    const isEligible = profit > 0 && !isPending;

                    return (
                      <tr key={acc.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-foreground">
                          #{acc.account_number}
                          <span className="block text-[10px] text-muted-foreground font-sans font-normal">
                            {traderSplitPct}% Split ({acc.challenge_type || 'Funded'})
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{formatCurrency(acc.starting_balance)}</td>
                        <td className="p-4 font-semibold text-foreground">{formatCurrency(acc.current_balance)}</td>
                        <td className="p-4 font-display font-bold text-emerald-400">
                          {profit > 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
                        </td>
                        <td className="p-4 font-display font-bold text-gold-400">
                          {traderSplitAmt > 0 ? formatCurrency(traderSplitAmt) : '$0.00'}
                        </td>
                        <td className="p-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold text-[11px] border border-amber-500/20">
                              <Clock className="h-3 w-3 animate-pulse" /> Payout Pending Review
                            </span>
                          ) : isEligible ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Eligible for Payout
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-medium text-[11px]">
                              <AlertCircle className="h-3 w-3" /> No Profit Earned
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            onClick={() => handleOpenPayoutModal(acc)}
                            disabled={!isEligible}
                            className={`text-xs font-bold ${
                              isEligible
                                ? 'bg-gold-gradient text-black hover:opacity-90 shadow-md shadow-gold-400/10'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            Apply For Payout
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payout History Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Trader Payout History</CardTitle>
              <CardDescription>Track all profit payout requests submitted to Admin.</CardDescription>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              {payouts.length} Record{payouts.length === 1 ? '' : 's'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-semibold border-y border-border/50">
                <tr>
                  <th className="p-4">Payout ID</th>
                  <th className="p-4">Account #</th>
                  <th className="p-4">Net Profit</th>
                  <th className="p-4">Trader Share</th>
                  <th className="p-4">Gateway & Address</th>
                  <th className="p-4">Date Submitted</th>
                  <th className="p-4">Status & Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No payout requests found yet. Earn profits on a Funded account to apply!
                    </td>
                  </tr>
                ) : (
                  payouts.map((req) => (
                    <tr key={req.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-mono text-muted-foreground">{req.id}</td>
                      <td className="p-4 font-bold text-foreground">#{req.account_number}</td>
                      <td className="p-4 font-semibold text-foreground">{formatCurrency(req.total_profit)}</td>
                      <td className="p-4 font-display font-extrabold text-gold-400">
                        {formatCurrency(req.trader_payout_amount)}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          {req.payout_method === 'UPI' && <QrCode className="h-3.5 w-3.5 text-blue-400" />}
                          {req.payout_method === 'Crypto' && <Wallet className="h-3.5 w-3.5 text-amber-400" />}
                          {req.payout_method === 'Bank Transfer' && <Building2 className="h-3.5 w-3.5 text-emerald-400" />}
                          {req.payout_method === 'PayPal' && <CreditCard className="h-3.5 w-3.5 text-purple-400" />}
                          {req.payout_method}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                          {req.payout_address}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(req.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4">
                        {(req.status === 'REQUESTED' || req.status === 'UNDER_REVIEW' || req.status === 'PROCESSING') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                            <Clock className="h-3 w-3 animate-pulse" /> UNDER REVIEW
                          </span>
                        )}
                        {req.status === 'PAID' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> APPROVED & PAID
                            </span>
                            <div>
                              <Link
                                to="/dashboard/certificates"
                                className="inline-flex items-center gap-1 text-[10px] text-gold-400 hover:underline font-bold"
                              >
                                <Award className="h-3 w-3" /> View Certificate <ChevronRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        )}
                        {req.status === 'REJECTED' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-[11px]">
                              <XCircle className="h-3 w-3" /> DECLINED
                            </span>
                            {req.rejection_reason && (
                              <p className="text-[10px] text-rose-300 italic">{req.rejection_reason}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* APPLY FOR PAYOUT MODAL DIALOG */}
      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && selectedAccount && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-5 overflow-hidden my-auto"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">Apply For Trader Profit Payout</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Account #{selectedAccount.account_number} · {selectedAccount.rules?.profit_split_percent || ((selectedAccount.challenge_type || '').toUpperCase().includes('INSTANT') ? 70 : 80)}% Profit Split
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitPayout} className="space-y-4 text-xs">
                    {/* Profit Calculation Box */}
                    {(() => {
                      const netProf = selectedAccount.current_balance - selectedAccount.starting_balance;
                      const traderSplitPct = selectedAccount.rules?.profit_split_percent || ((selectedAccount.challenge_type || '').toUpperCase().includes('INSTANT') ? 70 : 80);
                      const traderAmt = netProf * (traderSplitPct / 100);
                      const firmAmt = netProf - traderAmt;
                      return (
                        <div className="p-4 rounded-xl bg-gold-400/10 border border-gold-400/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Realized Net Profit</span>
                            <span className="font-bold text-foreground">{formatCurrency(netProf)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-gold-400/20 pt-2">
                            <span className="font-semibold text-emerald-400">Your {traderSplitPct}% Trader Share</span>
                            <span className="font-display text-xl font-extrabold text-gold-400">
                              {formatCurrency(traderAmt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Firm {100 - traderSplitPct}% Share</span>
                            <span className="text-muted-foreground">{formatCurrency(firmAmt)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Select Gateway */}
                    <div className="space-y-1.5">
                      <label className="font-medium text-foreground block">Select Payment Method / Gateway</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'Crypto', label: 'Crypto USDT', icon: Wallet, desc: 'TRC20, ERC20, BEP20' },
                          { id: 'UPI', label: 'UPI / VPA', icon: QrCode, desc: 'GPay, PhonePe, Paytm' },
                          { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2, desc: 'Direct Deposit' },
                          { id: 'PayPal', label: 'PayPal / Wise', icon: CreditCard, desc: 'Instant Payout' },
                        ].map((m) => {
                          const Icon = m.icon;
                          const isSel = selectedMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedMethod(m.id as any)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                                isSel
                                  ? 'bg-gold-400/10 border-gold-400 text-foreground ring-1 ring-gold-400'
                                  : 'bg-background/50 border-border/60 hover:border-border text-muted-foreground'
                              }`}
                            >
                              <Icon className={`h-4 w-4 mt-0.5 ${isSel ? 'text-gold-400' : 'text-muted-foreground'}`} />
                              <div>
                                <p className="font-semibold text-xs text-foreground">{m.label}</p>
                                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gateway Form Fields */}
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                      <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-gold-400" /> Enter {selectedMethod} Details
                      </h4>

                      {selectedMethod === 'Crypto' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">Select Crypto Network</label>
                            <select
                              value={cryptoNetwork}
                              onChange={(e) => setCryptoNetwork(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                            >
                              <option value="USDT (TRC20)">USDT (TRC20 - Tron Network)</option>
                              <option value="USDT (ERC20)">USDT (ERC20 - Ethereum Network)</option>
                              <option value="USDT (BEP20)">USDT (BEP20 - BSC Network)</option>
                              <option value="Bitcoin (BTC)">Bitcoin (BTC)</option>
                              <option value="Ethereum (ETH)">Ethereum (ETH)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">Wallet Address <span className="text-rose-400">*</span></label>
                            <input
                              type="text"
                              placeholder="e.g. TXu8vN4pL3qKz9mR2wX1yZ0aB5cC7dE9fG"
                              required
                              value={cryptoAddress}
                              onChange={(e) => setCryptoAddress(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono focus:outline-none focus:border-gold-400"
                            />
                          </div>
                        </div>
                      )}

                      {selectedMethod === 'UPI' && (
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground block text-[11px]">UPI ID / VPA / Phone Number <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            placeholder="e.g. trader@okaxis or 9876543210@paytm"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      )}

                      {selectedMethod === 'Bank Transfer' && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">Account Holder Name</label>
                            <input
                              type="text"
                              placeholder="Full Name as on Bank"
                              required
                              value={bankAccountHolder}
                              onChange={(e) => setBankAccountHolder(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">Bank Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Chase / HDFC"
                              required
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">Account Number</label>
                            <input
                              type="text"
                              placeholder="Bank Account Number"
                              required
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">IFSC / SWIFT Code</label>
                            <input
                              type="text"
                              placeholder="e.g. HDFC0001234"
                              required
                              value={bankIfsc}
                              onChange={(e) => setBankIfsc(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                            />
                          </div>
                        </div>
                      )}

                      {selectedMethod === 'PayPal' && (
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground block text-[11px]">PayPal Email Address <span className="text-rose-400">*</span></label>
                          <input
                            type="email"
                            placeholder="yourpaypal@email.com"
                            required
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsModalOpen(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-gold-gradient text-black hover:opacity-90 font-bold text-xs px-5 shadow-md shadow-gold-400/10"
                      >
                        {submitting ? 'Submitting Request...' : 'Submit Payout Request'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
