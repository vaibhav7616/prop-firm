import { useEffect, useState } from 'react';
import { Search, UserCheck, Shield, ShieldAlert, Plus, Wallet, Mail, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { fetchAdminStatsApi, issueManualAccountApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Give Account Modal state
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [issueSize, setIssueSize] = useState(5000);
  const [issueStage, setIssueStage] = useState<'funded' | 'step_1' | 'step_2'>('funded');
  const [issueType, setIssueType] = useState('instant_funding');
  const [issuePlatform, setIssuePlatform] = useState('fundedshift_terminal');
  const [issuing, setIssuing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchAdminStatsApi();
    if (res) {
      if (res.users) setUsers(res.users);
      if (res.accounts) setAccounts(res.accounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' || currentRole === 'admin' ? 'USER' : 'ADMIN';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`User role updated to ${newRole}`);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_active: u.is_active === false } : u
      )
    );
    toast.success('User status updated');
  };

  const getUserAccountCount = (userId: string) => {
    return accounts.filter((a) => a.user_id === userId).length;
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <UserCheck className="h-3.5 w-3.5" />
            User Management Console
          </div>
          <h1 className="font-display text-2xl font-bold">Registered Users ({users.length})</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Admin access controls, user role assignments, and trader account overview.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or ID..."
          className="pl-10 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass border-border/50 text-center py-12">
          <CardContent>
            <p className="text-sm text-muted-foreground">No users found matching query.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const accCount = getUserAccountCount(user.id);
            const isAdmin = user.role === 'ADMIN' || user.role === 'admin';
            const isActive = user.is_active !== false;

            return (
              <Card key={user.id} className="glass border-border/50 hover:border-gold-400/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gold-gradient flex items-center justify-center shrink-0 shadow-md">
                        <span className="font-bold text-black text-sm">
                          {user.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{user.full_name ?? 'Unnamed Trader'}</p>
                          <span
                            className={cn(
                              'text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase',
                              isAdmin
                                ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                                : 'bg-secondary text-muted-foreground'
                            )}
                          >
                            {isAdmin ? 'ADMIN' : 'TRADER'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-gold-400" />
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 bg-secondary/40 px-3 py-1.5 rounded-xl border border-border/40">
                        <Wallet className="h-3.5 w-3.5 text-gold-400" />
                        <span className="font-mono font-bold text-foreground">{accCount}</span>
                        <span className="text-muted-foreground text-[11px]">accounts</span>
                      </div>

                      <div className="text-right text-[11px] text-muted-foreground hidden md:block">
                        Joined: {formatDate(user.created_at)}
                      </div>

                      {/* Admin Quick Action Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setTargetUser(user);
                            setIssueSize(5000);
                            setIssueStage('funded');
                            setIssueType('instant_funding');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-gold-400/15 hover:bg-gold-400/25 text-gold-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-gold-400/30 shadow-sm"
                          title="Give / Assign Trading Account"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Give Account
                        </button>

                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors border border-border/50"
                          title="Change Role"
                        >
                          {isAdmin ? 'Demote to Trader' : 'Make Admin'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={cn(
                            'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                            isActive
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                          )}
                        >
                          {isActive ? 'Active' : 'Suspended'}
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

      {/* Give Account to User Dialog */}
      <Dialog open={!!targetUser} onOpenChange={(open) => !open && setTargetUser(null)}>
        <DialogContent className="max-w-md glass border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-gold-400" />
              Give Account to {targetUser?.full_name || targetUser?.email}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Directly issue an institutional trading account with instant login credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Account Size</label>
              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 25000, 50000, 100000, 200000].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setIssueSize(size)}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all',
                      issueSize === size
                        ? 'border-gold-400 bg-gold-400/20 text-gold-400 shadow-sm'
                        : 'border-border/50 bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    ${size >= 1000 ? `${size / 1000}K` : size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Account Stage / Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'funded', label: 'Funded (Live)', desc: 'Direct Live Payouts' },
                  { key: 'step_1', label: 'Step 1 Challenge', desc: 'Evaluation Phase' },
                  { key: 'step_2', label: 'Step 2 Challenge', desc: 'Verification Phase' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setIssueStage(st.key as any)}
                    className={cn(
                      'p-2 rounded-xl border text-left transition-all',
                      issueStage === st.key
                        ? 'border-gold-400 bg-gold-400/20 text-gold-400'
                        : 'border-border/50 bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <p className="text-xs font-bold">{st.label}</p>
                    <p className="text-[9px] opacity-75 mt-0.5">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium text-foreground">{targetUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Execution Platform:</span>
                <span className="font-semibold text-foreground">FundedShift Web Terminal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ECN Broker Server:</span>
                <span className="font-mono text-gold-400 font-bold">FundedShift-Live01</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setTargetUser(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={issuing}
              onClick={async () => {
                if (!targetUser) return;
                setIssuing(true);
                const calculatedType = issueStage === 'funded' ? 'instant_funding' : issueStage === 'step_2' ? 'two_step' : issueType;
                const res = await issueManualAccountApi({
                  email: targetUser.email,
                  full_name: targetUser.full_name || undefined,
                  account_size: issueSize,
                  stage: issueStage,
                  type: calculatedType,
                  platform: issuePlatform,
                  broker: 'FundedShift Direct ECN',
                });
                setIssuing(false);

                if (res && res.success) {
                  toast.success(`Account #${res.account.account_number} issued to ${targetUser.email}!`);
                  setTargetUser(null);
                  loadData();
                } else {
                  toast.error(res?.error || 'Failed to issue account.');
                }
              }}
              className="px-4 py-2 rounded-xl bg-gold-gradient text-black font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              {issuing ? 'Provisioning...' : 'Confirm & Issue Account'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

