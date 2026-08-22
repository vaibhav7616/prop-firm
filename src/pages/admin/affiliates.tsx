import { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  DollarSign,
  RefreshCw,
  QrCode,
  Wallet,
  Building2,
  CreditCard,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { toast } from 'sonner';
import { fetchAdminAffiliateWithdrawalsApi, processAdminAffiliateWithdrawalApi } from '@/lib/api-client';

export function AdminAffiliates() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for Reject / Approve
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAdminAffiliateWithdrawalsApi();
    if (Array.isArray(data)) {
      setWithdrawals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcess = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedReq) return;
    setProcessing(true);

    try {
      const res = await processAdminAffiliateWithdrawalApi({
        withdrawalId: selectedReq.id,
        action,
        reason: action === 'REJECT' ? rejectReason : undefined,
      });

      if (res && res.success) {
        toast.success(
          `Affiliate withdrawal #${selectedReq.id} was ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'} successfully!`
        );
        setSelectedReq(null);
        setRejectReason('');
        loadData();
      } else {
        toast.error(res?.error || 'Failed to process withdrawal request.');
      }
    } catch (_) {
      toast.error('An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = withdrawals.filter((w) => {
    const matchesSearch =
      w.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      w.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      w.method?.toLowerCase().includes(search.toLowerCase()) ||
      w.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRequested = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const totalApproved = withdrawals
    .filter((w) => w.status === 'APPROVED')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const totalPending = withdrawals
    .filter((w) => w.status === 'APPROVAL PENDING')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Users className="h-3.5 w-3.5" />
            Admin Affiliate Payout Portal
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Affiliate Withdrawal Approval Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Review, approve, or reject user affiliate commission payout requests.</p>
        </div>
        <Button
          onClick={loadData}
          disabled={loading}
          variant="outline"
          className="border-border/60 hover:border-gold-400/50 text-xs gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Requests
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gold-400/10 text-gold-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Affiliate Payout Requests</p>
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
              <p className="text-xs text-muted-foreground font-medium">Approval Pending</p>
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
              <CardTitle className="text-lg">Affiliate Withdrawal Submissions ({filtered.length})</CardTitle>
              <CardDescription>Filter by status or search user email / gateway method.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search user email / gateway..."
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
                <option value="APPROVAL PENDING">Approval Pending</option>
                <option value="APPROVED">Approved</option>
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
                  <th className="p-4">User Details</th>
                  <th className="p-4">Requested Amount</th>
                  <th className="p-4">Gateway & Details</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No affiliate withdrawal requests match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{w.user_name || 'Trader'}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{w.user_email}</div>
                      </td>
                      <td className="p-4 font-display font-bold text-sm text-foreground">
                        {formatCurrency(w.amount)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          {w.method === 'UPI' && <QrCode className="h-3.5 w-3.5 text-blue-400" />}
                          {w.method === 'Crypto' && <Wallet className="h-3.5 w-3.5 text-amber-400" />}
                          {w.method === 'Bank Transfer' && <Building2 className="h-3.5 w-3.5 text-emerald-400" />}
                          {w.method === 'PayPal' && <CreditCard className="h-3.5 w-3.5 text-purple-400" />}
                          {w.method}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 max-w-xs truncate">
                          {w.payment_details?.upi_id && `UPI ID: ${w.payment_details.upi_id}`}
                          {w.payment_details?.wallet_address && `${w.payment_details.crypto_network || 'Crypto'}: ${w.payment_details.wallet_address}`}
                          {w.payment_details?.account_number && `A/C: ${w.payment_details.account_number} (${w.payment_details.bank_name || 'Bank'})`}
                          {w.payment_details?.paypal_email && `Email: ${w.payment_details.paypal_email}`}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(w.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4">
                        {w.status === 'APPROVAL PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                            <Clock className="h-3 w-3 animate-pulse" /> APPROVAL PENDING
                          </span>
                        )}
                        {w.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3 w-3" /> APPROVED
                          </span>
                        )}
                        {w.status === 'REJECTED' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-[11px]">
                              <XCircle className="h-3 w-3" /> REJECTED
                            </span>
                            {w.rejection_reason && (
                              <p className="text-[10px] text-rose-300 italic">{w.rejection_reason}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {w.status === 'APPROVAL PENDING' ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedReq(w)}
                            className="bg-gold-gradient text-black font-semibold text-xs h-8 px-3"
                          >
                            Review & Process
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Reviewed</span>
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

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Process Affiliate Withdrawal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Request #{selectedReq.id}</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-semibold text-foreground">{selectedReq.user_name} ({selectedReq.user_email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested Amount:</span>
                <span className="font-bold text-gold-400 text-sm">{formatCurrency(selectedReq.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-semibold text-foreground">{selectedReq.method}</span>
              </div>
              <div className="pt-2 border-t border-border/40 space-y-1">
                <span className="text-muted-foreground block font-medium">Payment Gateway Details:</span>
                <p className="font-mono text-foreground text-[11px] bg-background/80 p-2 rounded border border-border/60 break-all select-all">
                  {selectedReq.payment_details?.upi_id && `UPI ID: ${selectedReq.payment_details.upi_id}`}
                  {selectedReq.payment_details?.wallet_address && `Network: ${selectedReq.payment_details.crypto_network || 'Crypto'}\nAddress: ${selectedReq.payment_details.wallet_address}`}
                  {selectedReq.payment_details?.account_number && `Holder: ${selectedReq.payment_details.account_holder}\nBank: ${selectedReq.payment_details.bank_name}\nA/C: ${selectedReq.payment_details.account_number}\nIFSC/SWIFT: ${selectedReq.payment_details.ifsc_code}`}
                  {selectedReq.payment_details?.paypal_email && `PayPal Email: ${selectedReq.payment_details.paypal_email}`}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Rejection Reason (If Rejecting):</label>
              <input
                type="text"
                placeholder="e.g. Invalid wallet address or unverified user details."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="destructive"
                disabled={processing}
                onClick={() => handleProcess('REJECT')}
                className="text-xs gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject Request
              </Button>
              <Button
                disabled={processing}
                onClick={() => handleProcess('APPROVE')}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Approve & Confirm Payout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
