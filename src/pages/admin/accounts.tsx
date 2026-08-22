import { useEffect, useState } from 'react';
import { Wallet, Search, Plus, Eye, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, UserCheck, Key, RefreshCw } from 'lucide-react';
import { formatDateTime, formatCurrency, PLATFORM_LABELS, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { fetchAdminStatsApi, updateAccountStatusApi, issueManualAccountApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function AdminAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ruleViolations, setRuleViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Manual Account Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueEmail, setIssueEmail] = useState('');
  const [issueFullName, setIssueFullName] = useState('');
  const [issueSize, setIssueSize] = useState(100000);
  const [issueType, setIssueType] = useState('two_step');
  const [issuePlatform, setIssuePlatform] = useState('mt5');
  const [issueBroker, setIssueBroker] = useState('FundedShift Brokerage');
  const [issuing, setIssuing] = useState(false);

  // Detail Modal State
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);

  const loadData = async () => {
    const res = await fetchAdminStatsApi();
    if (res) {
      if (res.accounts) setAccounts(res.accounts);
      if (res.users) setUsers(res.users);
      if (res.rule_violations) setRuleViolations(res.rule_violations);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (accountId: string, newStatus: string) => {
    const res = await updateAccountStatusApi(accountId, newStatus);
    if (res && res.success) {
      toast.success(`Account status updated to ${newStatus.toUpperCase()}`);
      loadData();
      if (selectedAccount && selectedAccount.id === accountId) {
        setSelectedAccount({ ...selectedAccount, status: newStatus });
      }
    } else {
      toast.error('Failed to update account status.');
    }
  };

  const handleIssueAccount = async () => {
    if (!issueEmail.trim()) {
      toast.error('Please enter a valid user email.');
      return;
    }
    setIssuing(true);
    const res = await issueManualAccountApi({
      email: issueEmail.trim(),
      full_name: issueFullName.trim() || undefined,
      account_size: issueSize,
      type: issueType,
      platform: issuePlatform,
      broker: issueBroker,
    });

    setIssuing(false);

    if (res && res.success) {
      toast.success(`Trading account #${res.account.account_number} issued to ${res.user.email}!`);
      setShowIssueModal(false);
      setIssueEmail('');
      setIssueFullName('');
      loadData();
    } else {
      toast.error(res?.error || 'Failed to issue account.');
    }
  };

  const getUserForAccount = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const getViolationsForAccount = (accountId: string) => {
    return ruleViolations.filter((v) => v.account_id === accountId);
  };

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const user = getUserForAccount(a.user_id);
    const matchesSearch =
      a.broker?.toLowerCase().includes(q) ||
      a.account_number?.includes(q) ||
      user?.email?.toLowerCase().includes(q) ||
      user?.full_name?.toLowerCase().includes(q) ||
      a.plan_name?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      a.status.toUpperCase() === statusFilter ||
      (statusFilter === 'BREACHED' && (a.status === 'BREACHED' || a.status === 'FAILED'));

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Trading Accounts Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time rule tracking, pass/breach details, and manual account provisioning.
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Give Account to User (Manual Issue)
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search account #, user email, or plan..."
            className="pl-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'ACTIVE', 'PASSED', 'FUNDED', 'BREACHED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap',
                statusFilter === st
                  ? 'bg-gold-400 text-black font-bold shadow-md shadow-gold-400/10'
                  : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
              )}
            >
              {st === 'BREACHED' ? 'BREACHED / FAILED' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Account Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl border border-border/50">
          <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No trading accounts found matching search.</p>
          <p className="text-xs text-muted-foreground mt-1">Try resetting your filters or issue a new manual account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((account: any) => {
            const accUser = getUserForAccount(account.user_id);
            const violations = getViolationsForAccount(account.id);
            const isBreached = account.status === 'BREACHED' || account.status === 'FAILED';
            const isPassed = account.status === 'PASSED';
            const isFunded = account.status === 'FUNDED';

            const startingBal = account.starting_balance || account.account_size;
            const currentEquity = account.current_equity || account.current_balance || startingBal;
            const pnl = currentEquity - startingBal;
            const pnlPercent = ((pnl / startingBal) * 100).toFixed(2);

            return (
              <Card key={account.id} className="glass border-border/50 hover:border-gold-400/30 transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Account Details */}
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="font-display font-bold text-gold-400 text-sm">
                          {account.account_size >= 1000 ? `${account.account_size / 1000}K` : account.account_size}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground">{account.plan_name || 'Challenge Account'}</p>
                          <span className={cn('text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase', ACCOUNT_STATUS_COLORS[account.status as keyof typeof ACCOUNT_STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            {ACCOUNT_STATUS_LABELS[account.status as keyof typeof ACCOUNT_STATUS_LABELS] || account.status}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          Trader: <span className="text-foreground font-medium">{accUser?.email ?? account.user_id}</span> ({accUser?.full_name ?? 'N/A'})
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                          <span>Acc #: <strong className="text-foreground">{account.account_number || account.login || 'Pending'}</strong></span>
                          <span>•</span>
                          <span>Server: {account.server || 'FundedShift-Live'}</span>
                          <span>•</span>
                          <span>Platform: {PLATFORM_LABELS[account.platform as keyof typeof PLATFORM_LABELS] ?? account.platform ?? 'MT5'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Equity & Rule Status */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-secondary/30 p-3 rounded-xl border border-border/40">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Starting Balance</span>
                        <span className="font-mono font-bold text-foreground">{formatCurrency(startingBal)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Current Equity</span>
                        <span className="font-mono font-bold text-foreground">{formatCurrency(currentEquity)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Total Return</span>
                        <span className={cn('font-mono font-bold', pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent}% ({formatCurrency(pnl)})
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        onClick={() => setSelectedAccount(account)}
                        className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border/50"
                      >
                        <Eye className="h-3.5 w-3.5 text-gold-400" />
                        Inspect Details
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStatusChange(account.id, 'PASSED')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors"
                          title="Mark Account Passed"
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => handleStatusChange(account.id, 'BREACHED')}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                          title="Mark Account Breached / Failed"
                        >
                          Breach
                        </button>
                        <button
                          onClick={() => handleStatusChange(account.id, 'ACTIVE')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors"
                          title="Reactivate Account"
                        >
                          Reactivate
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MANUAL ACCOUNT PROVISIONING MODAL */}
      <Dialog open={showIssueModal} onOpenChange={setShowIssueModal}>
        <DialogContent className="glass border-border/60 max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-gold-400" />
              Issue Manual Account to User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Directly assign a funded or evaluation trading account to a user by email. Ideal if payment was made offline or auto-generation was delayed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Trader Email Address *</label>
              <Input
                placeholder="e.g. trader@gmail.com"
                value={issueEmail}
                onChange={(e) => setIssueEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Trader Full Name (Optional)</label>
              <Input
                placeholder="e.g. John Doe"
                value={issueFullName}
                onChange={(e) => setIssueFullName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Account Size</label>
                <select
                  value={issueSize}
                  onChange={(e) => setIssueSize(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-xs font-bold"
                >
                  <option value={5000}>$5,000</option>
                  <option value={10000}>$10,000</option>
                  <option value={25000}>$25,000</option>
                  <option value={50000}>$50,000</option>
                  <option value={100000}>$100,000</option>
                  <option value={200000}>$200,000</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Account Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-xs"
                >
                  <option value="instant_funding">Instant Funded (No Eval)</option>
                  <option value="one_step">1-Step Challenge</option>
                  <option value="two_step">2-Step Challenge</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Platform</label>
                <select
                  value={issuePlatform}
                  onChange={(e) => setIssuePlatform(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-xs"
                >
                  <option value="fundedshift_terminal">FundedShift Web Trading Platform (Proprietary)</option>
                  <option value="fundedshift_pro">FundedShift Pro Desktop Engine</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Broker Server</label>
                <Input
                  value={issueBroker}
                  onChange={(e) => setIssueBroker(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              onClick={() => setShowIssueModal(false)}
              className="px-4 py-2 rounded-xl bg-secondary text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleIssueAccount}
              disabled={issuing || !issueEmail.trim()}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2"
            >
              {issuing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
              {issuing ? 'Provisioning...' : 'Provision & Issue Account'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ACCOUNT INSPECTION & RULE METRICS MODAL */}
      {selectedAccount && (
        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent className="glass border-border/60 max-w-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display flex items-center justify-between">
                <span>Account #{selectedAccount.account_number || selectedAccount.login} Details</span>
                <span className={cn('text-xs px-3 py-1 rounded-full font-bold uppercase', ACCOUNT_STATUS_COLORS[selectedAccount.status as keyof typeof ACCOUNT_STATUS_COLORS])}>
                  {selectedAccount.status}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Plan: {selectedAccount.plan_name} · Platform: {selectedAccount.platform} · Server: {selectedAccount.server}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 my-2">
              {/* Credentials Box */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-gold-400">
                  <Key className="h-4 w-4" />
                  Trading Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono pt-1">
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block">Login Number</span>
                    <strong className="text-foreground font-bold text-sm block truncate">
                      {selectedAccount.account_number || selectedAccount.login || 'Pending'}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block">Trader Password</span>
                    <strong
                      className="text-foreground font-bold block truncate max-w-full text-xs"
                      title={selectedAccount.password_hash || 'FS_Trader2026!'}
                    >
                      {selectedAccount.password_hash && selectedAccount.password_hash.length > 20
                        ? `FS_Trader_${selectedAccount.password_hash.slice(-6)}!`
                        : selectedAccount.password_hash || 'FS_Trader2026!'}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block">Investor Password</span>
                    <strong
                      className="text-foreground font-bold block truncate max-w-full text-xs"
                      title={selectedAccount.investor_password_hash || 'INV_Pass2026#'}
                    >
                      {selectedAccount.investor_password_hash && selectedAccount.investor_password_hash.length > 20
                        ? `INV_Pass_${selectedAccount.investor_password_hash.slice(-6)}#`
                        : selectedAccount.investor_password_hash || 'INV_Pass2026#'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Starting Balance</span>
                  <strong className="font-mono text-sm text-foreground">{formatCurrency(selectedAccount.starting_balance)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Current Equity</span>
                  <strong className="font-mono text-sm text-foreground">{formatCurrency(selectedAccount.current_equity || selectedAccount.current_balance)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Highest Equity</span>
                  <strong className="font-mono text-sm text-foreground">{formatCurrency(selectedAccount.highest_equity || selectedAccount.starting_balance)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Trading Days</span>
                  <strong className="font-mono text-sm text-foreground">{selectedAccount.trading_days || 0} Days</strong>
                </div>
              </div>

              {/* Rules & Limits Progress */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Rule Enforcement Limits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Daily Loss Limit</span>
                    <strong className="text-foreground">{selectedAccount.rules?.daily_loss_limit_percent ?? 5}% Max Daily</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Max Overall Loss</span>
                    <strong className="text-foreground">{selectedAccount.rules?.max_loss_limit_percent ?? 10}% Max Total</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Profit Target</span>
                    <strong className="text-foreground">{selectedAccount.rules?.profit_target_percent ?? 8}% Target</strong>
                  </div>
                </div>
              </div>

              {/* Rule Violation History */}
              {getViolationsForAccount(selectedAccount.id).length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    Recorded Breach Violations
                  </div>
                  {getViolationsForAccount(selectedAccount.id).map((v) => (
                    <div key={v.id} className="text-xs text-foreground/90 font-mono space-y-1">
                      <p>• {v.details}</p>
                      <p className="text-[10px] text-muted-foreground">Equity at Breach: {formatCurrency(v.equity_at_breach)} | Triggered: {formatDateTime(v.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Admin Status Controls:</span>
                <button
                  onClick={() => handleStatusChange(selectedAccount.id, 'PASSED')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold"
                >
                  Mark Passed
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAccount.id, 'BREACHED')}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold"
                >
                  Mark Breached
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAccount.id, 'ACTIVE')}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-bold"
                >
                  Reactivate
                </button>
              </div>

              <button
                onClick={() => setSelectedAccount(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-xs font-semibold"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
