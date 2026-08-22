import { useEffect, useState } from 'react';
import { Users, ShoppingCart, DollarSign, Wallet, CheckCircle2, XCircle, Clock, ShieldCheck, Activity } from 'lucide-react';
import { formatCurrency, formatAccountSize, ORDER_STATUS_LABELS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchAdminStatsApi, updateAccountStatusApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTypeTab, setActiveTypeTab] = useState<'1step' | '2step' | 'instant' | 'all'>('2step');

  const loadData = async () => {
    setLoading(true);
    const res = await fetchAdminStatsApi();
    if (res) {
      setData(res);
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
    } else {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-card animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl glass animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    total_users: 1,
    total_orders: 1,
    total_revenue: 499,
    total_accounts: 1,
    active_accounts: 1,
    passed_accounts: 0,
    failed_accounts: 0,
    pending_accounts: 0,
  };

  const users = data?.users || [];
  const accounts = data?.accounts || [];

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats.total_revenue), icon: DollarSign, color: 'text-success', bg: 'bg-emerald-500/10' },
    { label: 'Accounts Sold', value: stats.total_accounts, icon: Wallet, color: 'text-gold-400', bg: 'bg-gold-400/10' },
    { label: 'Active Accounts', value: stats.active_accounts, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Passed Accounts', value: stats.passed_accounts, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Failed Accounts', value: stats.failed_accounts, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Registered Users', value: stats.total_users, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Super Admin Control Center
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Platform Overview & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time statistics on accounts sold, revenue, failed/passed evaluations, and user details.</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-card border border-border hover:border-gold-400/40 text-xs font-medium transition-all"
        >
          Refresh Live Data
        </button>
      </div>

      {/* Primary Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{card.label}</p>
                <p className="font-display text-xl font-bold mt-1">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account Tier Breakdown & Status summary */}
      {(() => {
        const totalAccs = Number(stats.total_accounts || accounts.length || 0);
        const passedCount = Number(stats.passed_accounts || stats.funded_accounts || 0);
        const failedCount = Number(stats.failed_accounts || stats.breached_accounts || 0);
        const activeCount = Number(stats.active_accounts || 0);

        const passedPct = totalAccs > 0 ? Math.round((passedCount / totalAccs) * 100) : 0;
        const failedPct = totalAccs > 0 ? Math.round((failedCount / totalAccs) * 100) : 0;
        const activePct = totalAccs > 0 ? Math.round((activeCount / totalAccs) * 100) : 0;

        const byType = stats.sales_by_tier_and_type || {
          one_step: {},
          two_step: {},
          instant_funding: {},
        };

        const getCountForSize = (size: number) => {
          if (activeTypeTab === 'all') {
            return stats.sales_by_tier?.[size] || 0;
          }
          if (activeTypeTab === '1step') {
            return byType.one_step?.[size] || 0;
          }
          if (activeTypeTab === '2step') {
            return byType.two_step?.[size] || 0;
          }
          if (activeTypeTab === 'instant') {
            return byType.instant_funding?.[size] || 0;
          }
          return 0;
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass border-border/50 lg:col-span-2">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="font-display text-lg">Accounts Sold by Size Tier</CardTitle>
                  <CardDescription className="text-xs">Distribution of purchased challenge & instant accounts by type.</CardDescription>
                </div>

                {/* Challenge Type Tabs */}
                <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/50 text-xs">
                  <button
                    onClick={() => setActiveTypeTab('2step')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      activeTypeTab === '2step' ? 'bg-gold-400 text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    2-Step
                  </button>
                  <button
                    onClick={() => setActiveTypeTab('1step')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      activeTypeTab === '1step' ? 'bg-gold-400 text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    1-Step
                  </button>
                  <button
                    onClick={() => setActiveTypeTab('instant')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      activeTypeTab === 'instant' ? 'bg-gold-400 text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Instant
                  </button>
                  <button
                    onClick={() => setActiveTypeTab('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      activeTypeTab === 'all' ? 'bg-gold-400 text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Types
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[5000, 10000, 25000, 50000, 100000, 200000, 400000].map((size) => {
                    const count = getCountForSize(size);
                    return (
                      <div key={size} className="p-3.5 rounded-xl bg-card/60 border border-border/60 hover:border-gold-400/40 transition-all">
                        <p className="text-xs text-muted-foreground font-medium">{formatAccountSize(size)} Account</p>
                        <p className="font-display text-2xl font-bold mt-1 text-gold-400">{count}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {activeTypeTab === 'all' ? 'Total' : activeTypeTab === '1step' ? '1-Step' : activeTypeTab === 'instant' ? 'Instant' : '2-Step'}: {count === 1 ? '1 sold' : `${count} sold`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Evaluation Pass / Fail Rate</CardTitle>
                <CardDescription className="text-xs">Performance status across all active challenge accounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Passed / Funded</span>
                    <span>{passedCount} ({passedPct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${passedPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-red-400 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Failed (Breached)</span>
                    <span>{failedCount} ({failedPct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${failedPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-blue-400 flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> In Progress / Active</span>
                    <span>{activeCount} ({activePct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${activePct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* User Portfolio Details Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Trader Accounts & Purchases</CardTitle>
          <CardDescription className="text-xs">Detailed view of registered users, their total accounts, and evaluation statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No registered users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Accounts Purchased</th>
                    <th className="py-3 px-4">Passed</th>
                    <th className="py-3 px-4">Failed</th>
                    <th className="py-3 px-4">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((usr: any) => (
                    <tr key={usr.id} className="hover:bg-card/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{usr.full_name || 'Trader'}</p>
                        <p className="text-muted-foreground text-[11px]">{usr.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${usr.role === 'admin' ? 'bg-gold-400/20 text-gold-400' : 'bg-muted text-muted-foreground'}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{usr.accounts_count || 0}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">{usr.passed_count || 0}</td>
                      <td className="py-3 px-4 text-red-400 font-semibold">{usr.failed_count || 0}</td>
                      <td className="py-3 px-4 font-bold text-gold-400">{formatCurrency(usr.total_spent || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Management & Status Override */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">All Trading Accounts & Admin Status Controls</CardTitle>
          <CardDescription className="text-xs">Manually approve, pass, or mark accounts as failed.</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No trading accounts created yet.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="p-4 rounded-xl bg-card/60 border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center font-bold text-gold-400 text-sm">
                      {formatAccountSize(acc.account_size)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{acc.challenge_name || 'FundedShift Challenge'}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono">{acc.account_number}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Broker: {acc.broker || 'FundedShift'} · Balance: {formatCurrency(acc.current_balance || acc.account_size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        acc.status === 'active'
                          ? 'bg-blue-500/15 text-blue-400'
                          : acc.status === 'passed' || acc.status === 'funded'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : acc.status === 'failed'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {acc.status}
                    </span>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStatusChange(acc.id, 'passed')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-all"
                      >
                        Mark Passed
                      </button>
                      <button
                        onClick={() => handleStatusChange(acc.id, 'failed')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-all"
                      >
                        Mark Failed
                      </button>
                      <button
                        onClick={() => handleStatusChange(acc.id, 'active')}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-medium hover:bg-blue-500/20 transition-all"
                      >
                        Reactivate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
