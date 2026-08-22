import { useEffect, useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Copy,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  Lock,
  RefreshCw,
  QrCode,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/constants';
import type { Affiliate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchAffiliateWithdrawalsApi, submitAffiliateWithdrawalApi } from '@/lib/api-client';

export function DashboardAffiliate() {
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_earnings: 480,
    approved_withdrawn: 0,
    pending_withdrawn: 0,
    available_balance: 480,
    min_withdrawal: 250,
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(250);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Crypto' | 'Bank Transfer' | 'PayPal'>('UPI');
  const [submitting, setSubmitting] = useState(false);

  // Gateway Form Details
  const [upiId, setUpiId] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT (TRC20)');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  const loadAffiliateData = async () => {
    setLoading(true);
    const userId = user?.id || 'demo-trader-id-12345';
    const res = await fetchAffiliateWithdrawalsApi(userId);

    if (res) {
      setWithdrawals(res.withdrawals || []);
      if (res.stats) {
        setStats(res.stats);
        if (res.stats.available_balance >= 250) {
          setWithdrawAmount(res.stats.available_balance);
        } else {
          setWithdrawAmount(250);
        }
      }
    }

    setAffiliate({
      id: `aff-${userId}`,
      user_id: userId,
      referral_code: profile?.affiliate_code || 'FSALEX99',
      code: profile?.affiliate_code || 'FSALEX99',
      clicks: 142,
      conversions: 8,
      earnings: res?.stats?.total_earnings || 480,
      withdrawn: res?.stats?.approved_withdrawn || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
  };

  useEffect(() => {
    loadAffiliateData();
  }, [user, profile]);

  const referralCode = profile?.affiliate_code || affiliate?.code || 'FSALEX99';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const handleOpenModal = () => {
    if (stats.available_balance < 250) {
      toast.error('Minimum withdrawal amount is $250. You currently do not have enough available earnings.');
      return;
    }
    setWithdrawAmount(Math.min(stats.available_balance, Math.max(250, stats.available_balance)));
    setIsModalOpen(true);
  };

  const handleSubmitWithdrawal = async (e: FormEvent) => {
    e.preventDefault();

    if (withdrawAmount < 250) {
      toast.error('Minimum withdrawal amount is $250.');
      return;
    }

    if (withdrawAmount > stats.available_balance) {
      toast.error(`Requested amount ($${withdrawAmount}) exceeds available balance ($${stats.available_balance}).`);
      return;
    }

    // Validate details per gateway
    let payment_details: any = {};
    if (selectedMethod === 'UPI') {
      if (!upiId.trim()) {
        toast.error('Please enter a valid UPI ID (e.g. name@upi or phone number).');
        return;
      }
      payment_details = { upi_id: upiId.trim() };
    } else if (selectedMethod === 'Crypto') {
      if (!cryptoAddress.trim()) {
        toast.error('Please enter your Crypto Wallet Address.');
        return;
      }
      payment_details = {
        crypto_network: cryptoNetwork,
        wallet_address: cryptoAddress.trim(),
      };
    } else if (selectedMethod === 'Bank Transfer') {
      if (!bankAccountHolder.trim() || !bankName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim()) {
        toast.error('Please fill in all Bank Account details (Holder, Bank Name, Account #, IFSC/SWIFT).');
        return;
      }
      payment_details = {
        account_holder: bankAccountHolder.trim(),
        bank_name: bankName.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfsc.trim(),
      };
    } else if (selectedMethod === 'PayPal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        toast.error('Please enter a valid PayPal Email Address.');
        return;
      }
      payment_details = { paypal_email: paypalEmail.trim() };
    }

    setSubmitting(true);
    try {
      const res = await submitAffiliateWithdrawalApi({
        userId: user?.id || 'demo-trader-id-12345',
        amount: withdrawAmount,
        method: selectedMethod,
        payment_details,
      });

      if (res && res.success) {
        toast.success(`Withdrawal request of $${withdrawAmount} submitted! Status: APPROVAL PENDING.`);
        setIsModalOpen(false);
        // Refresh
        await loadAffiliateData();
      } else {
        toast.error(res?.error || 'Failed to submit withdrawal request.');
      }
    } catch (_) {
      toast.error('An unexpected error occurred while submitting withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Clicks', value: affiliate?.clicks ?? 142, icon: MousePointerClick, color: 'text-blue-400' },
    { label: 'Conversions', value: affiliate?.conversions ?? 8, icon: Users, color: 'text-gold-400' },
    { label: 'Total Commission', value: formatCurrency(stats.total_earnings), icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Available Balance', value: formatCurrency(stats.available_balance), icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Users className="h-3.5 w-3.5" /> Affiliate Program Dashboard
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Affiliate Commissions & Withdrawals</h1>
          <p className="text-muted-foreground text-sm mt-1">Earn 15% commission on every account purchase. Withdraw your earnings via UPI, Crypto, Bank Transfer, or PayPal.</p>
        </div>
        <Button
          onClick={loadAffiliateData}
          variant="outline"
          className="border-border/60 hover:border-gold-400/50 text-xs gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Balance
        </Button>
      </div>

      {/* Referral Link Card */}
      <Card className="glass border-border/50 bg-gradient-to-br from-card/80 via-card/50 to-gold-400/5">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Copy className="h-4 w-4 text-gold-400" /> Your Dedicated Referral Link
          </CardTitle>
          <CardDescription>Share this unique URL with traders. You earn 15% instant commission whenever someone purchases a challenge.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 rounded-xl bg-background/80 font-mono text-sm text-foreground truncate border border-border/60 select-all shadow-inner">
              {referralLink}
            </div>
            <Button onClick={copyLink} className="bg-gold-gradient text-black hover:opacity-90 font-semibold shadow-lg shadow-gold-400/10">
              <Copy className="h-4 w-4 mr-2" /> Copy Referral Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              whileHover={{ y: -3 }}
            >
              <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className="font-display text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Withdraw Card Banner */}
      <Card className="glass border-gold-400/30 bg-card/60 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-gold-400/5 blur-2xl pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Earnings</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                  Min. Withdrawal $250
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl sm:text-4xl font-extrabold gold-text">{formatCurrency(stats.available_balance)}</span>
                {stats.pending_withdrawn > 0 && (
                  <span className="text-xs text-amber-400 font-medium">
                    (${formatCurrency(stats.pending_withdrawn)} Pending Approval)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-gold-400" />
                Minimum withdrawal requirement is $250. Payouts require Admin review & approval before being dispatched.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={handleOpenModal}
                disabled={stats.available_balance < 250}
                className={`py-6 px-8 rounded-xl font-bold text-sm shadow-xl transition-all ${
                  stats.available_balance >= 250
                    ? 'bg-gold-gradient text-black hover:opacity-95 shadow-gold-400/15'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {stats.available_balance >= 250 ? (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Request Withdrawal
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" /> Min. $250 Required
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Requests History Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Affiliate Withdrawal History</CardTitle>
              <CardDescription>Track the approval status of your requested affiliate commission payouts.</CardDescription>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              {withdrawals.length} Request{withdrawals.length === 1 ? '' : 's'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-semibold border-y border-border/50">
                <tr>
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Requested Amount</th>
                  <th className="p-4">Gateway & Details</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No affiliate withdrawal requests yet. Earn at least $250 in commissions to request a payout.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((req) => (
                    <tr key={req.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{req.id}</td>
                      <td className="p-4 font-display font-bold text-sm text-foreground">
                        {formatCurrency(req.amount)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          {req.method === 'UPI' && <QrCode className="h-3.5 w-3.5 text-blue-400" />}
                          {req.method === 'Crypto' && <Wallet className="h-3.5 w-3.5 text-amber-400" />}
                          {req.method === 'Bank Transfer' && <Building2 className="h-3.5 w-3.5 text-emerald-400" />}
                          {req.method === 'PayPal' && <CreditCard className="h-3.5 w-3.5 text-purple-400" />}
                          {req.method}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 max-w-xs truncate">
                          {req.payment_details?.upi_id && `UPI ID: ${req.payment_details.upi_id}`}
                          {req.payment_details?.wallet_address && `${req.payment_details.crypto_network || 'Crypto'}: ${req.payment_details.wallet_address}`}
                          {req.payment_details?.account_number && `A/C: ${req.payment_details.account_number} (${req.payment_details.bank_name || 'Bank'})`}
                          {req.payment_details?.paypal_email && `Email: ${req.payment_details.paypal_email}`}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(req.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4">
                        {req.status === 'APPROVAL PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                            <Clock className="h-3 w-3 animate-pulse" /> APPROVAL PENDING
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> APPROVED
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-[11px]">
                              <XCircle className="h-3 w-3" /> REJECTED
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

      {/* WITHDRAWAL MODAL DIALOG */}
      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
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
                      <h3 className="font-display text-lg font-bold text-foreground">Request Affiliate Withdrawal</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Minimum withdrawal limit: $250. Payouts require Admin approval.</p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitWithdrawal} className="space-y-4 text-xs">
                    {/* Available Balance Box */}
                    <div className="p-3.5 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-[11px]">Available Affiliate Balance</p>
                        <p className="font-display text-xl font-bold text-gold-400">{formatCurrency(stats.available_balance)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-[11px]">Minimum Threshold</p>
                        <p className="font-semibold text-foreground">$250.00</p>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <label className="font-medium text-foreground block">
                        Withdrawal Amount ($ USD) <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                        <input
                          type="number"
                          min={250}
                          max={stats.available_balance}
                          step={1}
                          required
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                          className="w-full pl-7 pr-16 py-2.5 rounded-xl bg-background border border-border text-sm font-bold focus:outline-none focus:border-gold-400"
                        />
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(stats.available_balance)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold uppercase rounded bg-gold-400/20 text-gold-400 hover:bg-gold-400/30"
                        >
                          MAX
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Enter an amount between $250 and ${stats.available_balance}.</p>
                    </div>

                    {/* Payment Gateway Method Selection */}
                    <div className="space-y-1.5">
                      <label className="font-medium text-foreground block">Select Payment Gateway / Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'UPI', label: 'UPI / VPA', icon: QrCode, desc: 'GPay, PhonePe, Paytm' },
                          { id: 'Crypto', label: 'Crypto Wallet', icon: Wallet, desc: 'USDT, BTC, ETH' },
                          { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2, desc: 'Direct Bank Deposit' },
                          { id: 'PayPal', label: 'PayPal / Wise', icon: CreditCard, desc: 'Instant Email Payout' },
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

                    {/* Gateway Details Input Fields */}
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                      <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-gold-400" /> Enter {selectedMethod} Details
                      </h4>

                      {selectedMethod === 'UPI' && (
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground block text-[11px]">UPI ID (VPA) / Phone Number <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            placeholder="e.g. john@okaxis or 9876543210@paytm"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      )}

                      {selectedMethod === 'Crypto' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">Select Network</label>
                            <select
                              value={cryptoNetwork}
                              onChange={(e) => setCryptoNetwork(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
                            >
                              <option value="USDT (TRC20)">USDT (TRC20 - Tron Network)</option>
                              <option value="USDT (ERC20)">USDT (ERC20 - Ethereum Network)</option>
                              <option value="USDT (BEP20)">USDT (BEP20 - BSC Network)</option>
                              <option value="Bitcoin (BTC)">Bitcoin (BTC Network)</option>
                              <option value="Ethereum (ETH)">Ethereum (ETH Network)</option>
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
                              placeholder="e.g. HDFC / Chase"
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

                    {/* Footer buttons */}
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
                        {submitting ? 'Submitting Request...' : 'Submit for Admin Approval'}
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
