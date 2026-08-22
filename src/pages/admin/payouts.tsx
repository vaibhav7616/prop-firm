import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, CheckCircle2, XCircle, Clock, Search, DollarSign, AlertCircle, RefreshCw, Users, Eye, X, CreditCard, Building2, Wallet, QrCode, User, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchAdminStatsApi, processPayoutAdminApi } from '@/lib/api-client';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'sonner';
import { AdminAffiliates } from '@/pages/admin/affiliates';

export function AdminPayouts() {
  const [activeTab, setActiveTab] = useState<'TRADER_PAYOUTS' | 'AFFILIATE_WITHDRAWALS'>('TRADER_PAYOUTS');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [viewingPayout, setViewingPayout] = useState<any | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null); // For reject
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchAdminStatsApi();
    if (res && res.payout_requests) {
      setPayouts(res.payout_requests);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (payoutId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(true);
    try {
      const res = await processPayoutAdminApi(payoutId, action, action === 'REJECT' ? rejectReason : undefined);
      if (res && res.success) {
        toast.success(`Payout request ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'} successfully!`);
        setSelectedPayout(null);
        setViewingPayout(null);
        setRejectReason('');
        loadData();
      } else {
        toast.error(res?.error || 'Failed to process payout request.');
      }
    } catch (_) {
      toast.error('An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = payouts.filter((p) => {
    const matchesSearch =
      p.account_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.user_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.payout_method?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRequested = payouts.reduce((sum, p) => sum + (p.trader_payout_amount || 0), 0);
  const totalApproved = payouts.filter(p => p.status === 'APPROVED' || p.status === 'COMPLETED' || p.status === 'PAID').reduce((sum, p) => sum + (p.trader_payout_amount || 0), 0);
  const totalPending = payouts.filter(p => p.status === 'REQUESTED' || p.status === 'UNDER_REVIEW' || p.status === 'PROCESSING').reduce((sum, p) => sum + (p.trader_payout_amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Tab Bar */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab('TRADER_PAYOUTS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'TRADER_PAYOUTS'
              ? 'bg-gold-gradient text-black shadow-md shadow-gold-400/10'
              : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-gold-400/40'
          }`}
        >
          <Award className="h-4 w-4" /> Trader Account Payouts
        </button>
        <button
          onClick={() => setActiveTab('AFFILIATE_WITHDRAWALS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'AFFILIATE_WITHDRAWALS'
              ? 'bg-gold-gradient text-black shadow-md shadow-gold-400/10'
              : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-gold-400/40'
          }`}
        >
          <Users className="h-4 w-4" /> Affiliate Commission Withdrawals
        </button>
      </div>

      {activeTab === 'AFFILIATE_WITHDRAWALS' ? (
        <AdminAffiliates />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <Award className="h-3.5 w-3.5" />
                Payout Management Center
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">Trader Payout Requests</h1>
              <p className="text-muted-foreground text-sm mt-1">Review, approve, or reject trader profit split payout submissions with complete user payment details.</p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-card border border-border hover:border-gold-400/40 text-xs font-medium transition-all flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Payouts
            </button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gold-400/10 text-gold-400">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Requested Payouts</p>
                  <p className="font-display text-2xl font-bold">{formatCurrency(totalRequested)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Approved & Paid Out</p>
                  <p className="font-display text-2xl font-bold text-emerald-400">{formatCurrency(totalApproved)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Review</p>
                  <p className="font-display text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table & Controls */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Payout Submissions ({filtered.length})</CardTitle>
                  <CardDescription>Filter by payout status or search account numbers / user emails.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search account / email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="REQUESTED">Requested / Pending</option>
                    <option value="APPROVED">Approved / Paid</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-muted-foreground font-semibold border-y border-border/50">
                    <tr>
                      <th className="p-4">Account #</th>
                      <th className="p-4">Trader Name / Email</th>
                      <th className="p-4">Net Profit</th>
                      <th className="p-4">Trader Share</th>
                      <th className="p-4">Gateway</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No payout requests found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => {
                        const isPending = p.status === 'REQUESTED' || p.status === 'UNDER_REVIEW' || p.status === 'PROCESSING';
                        return (
                          <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-4 font-mono font-bold text-foreground">
                              #{p.account_number}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-foreground">{p.user_name || 'Valued Trader'}</p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{p.user_email || p.user_id}</p>
                            </td>
                            <td className="p-4 font-semibold text-emerald-400">
                              {formatCurrency(p.total_profit)}
                            </td>
                            <td className="p-4 font-display font-bold text-gold-400">
                              {formatCurrency(p.trader_payout_amount)}
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-foreground uppercase">{p.payout_method}</span>
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">{p.payout_address}</p>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  p.status === 'COMPLETED' || p.status === 'APPROVED' || p.status === 'PAID'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : p.status === 'REJECTED'
                                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {p.status === 'PAID' ? 'APPROVED & PAID' : p.status}
                              </span>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingPayout(p)}
                                  className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[11px] flex items-center gap-1 border border-border/60"
                                >
                                  <Eye className="h-3 w-3" /> View Details
                                </button>
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleAction(p.id, 'APPROVE')}
                                      disabled={processing}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold transition-all text-[11px]"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setSelectedPayout(p)}
                                      disabled={processing}
                                      className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-all text-[11px]"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
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

          {/* VIEW DETAILS MODAL */}
          {typeof window !== 'undefined' && viewingPayout &&
            createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-5 my-auto overflow-hidden text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                        <Award className="h-5 w-5 text-gold-400" /> Trader Payout Request Details
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Account #{viewingPayout.account_number} · ID: {viewingPayout.id}</p>
                    </div>
                    <button
                      onClick={() => setViewingPayout(null)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Trader User Info */}
                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">Trader Profile</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gold-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Full Name</p>
                          <p className="font-bold text-foreground">{viewingPayout.user_name || 'Valued Trader'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gold-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground">Email Address</p>
                          <p className="font-bold text-foreground truncate">{viewingPayout.user_email || viewingPayout.user_id}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="p-4 rounded-xl bg-gold-400/10 border border-gold-400/20 space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Realized Profit:</span>
                      <span className="font-bold text-foreground">{formatCurrency(viewingPayout.total_profit)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gold-400/20 pt-2 text-sm font-bold">
                      <span className="text-emerald-400">Trader Payout Amount ({viewingPayout.trader_split_percent || 80}%):</span>
                      <span className="text-gold-400 text-base">{formatCurrency(viewingPayout.trader_payout_amount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Prop Firm Retention ({100 - (viewingPayout.trader_split_percent || 80)}%):</span>
                      <span>{formatCurrency(viewingPayout.firm_share_amount ?? (viewingPayout.total_profit - viewingPayout.trader_payout_amount))}</span>
                    </div>
                  </div>

                  {/* Payment Details Box */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
                    <p className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-gold-400" /> Gateway: {viewingPayout.payout_method}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded-lg border border-border select-all">
                      {viewingPayout.payout_address}
                    </p>

                    {/* Render specific fields if available in payment_details */}
                    {viewingPayout.payment_details && (
                      <div className="mt-2 pt-2 border-t border-border/40 space-y-1.5">
                        {viewingPayout.payment_details.upi_id && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">UPI ID / Phone:</span>
                            <span className="font-bold text-foreground font-mono">{viewingPayout.payment_details.upi_id}</span>
                          </div>
                        )}
                        {viewingPayout.payment_details.crypto_network && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Network:</span>
                            <span className="font-bold text-foreground">{viewingPayout.payment_details.crypto_network}</span>
                          </div>
                        )}
                        {viewingPayout.payment_details.wallet_address && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Wallet:</span>
                            <span className="font-bold text-foreground font-mono truncate max-w-[220px]">{viewingPayout.payment_details.wallet_address}</span>
                          </div>
                        )}
                        {viewingPayout.payment_details.bank_name && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Account Holder:</span>
                              <span className="font-bold text-foreground">{viewingPayout.payment_details.account_holder}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bank Name:</span>
                              <span className="font-bold text-foreground">{viewingPayout.payment_details.bank_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Account Number:</span>
                              <span className="font-bold text-foreground font-mono">{viewingPayout.payment_details.account_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IFSC / SWIFT Code:</span>
                              <span className="font-bold text-foreground font-mono">{viewingPayout.payment_details.ifsc_code}</span>
                            </div>
                          </>
                        )}
                        {viewingPayout.payment_details.paypal_email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PayPal Email:</span>
                            <span className="font-bold text-foreground font-mono">{viewingPayout.payment_details.paypal_email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setViewingPayout(null)}
                      className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                    >
                      Close
                    </button>
                    {(viewingPayout.status === 'REQUESTED' || viewingPayout.status === 'UNDER_REVIEW' || viewingPayout.status === 'PROCESSING') && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPayout(viewingPayout);
                            setViewingPayout(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs hover:bg-red-500/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(viewingPayout.id, 'APPROVE')}
                          disabled={processing}
                          className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          {processing ? 'Approving...' : 'Approve & Issue Certificate'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* REJECT MODAL */}
          {typeof window !== 'undefined' && selectedPayout &&
            createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                <div className="relative w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle className="h-6 w-6" />
                    <h3 className="text-lg font-bold">Reject Payout Request</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Are you sure you want to reject payout for Account #{selectedPayout.account_number} ({formatCurrency(selectedPayout.trader_payout_amount)})?
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Rejection Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Rule violation detected during audit, or incorrect bank/crypto wallet credentials."
                      className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-red-400/50 min-h-[90px]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedPayout(null)}
                      className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(selectedPayout.id, 'REJECT')}
                      disabled={processing || !rejectReason.trim()}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-xs hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}
