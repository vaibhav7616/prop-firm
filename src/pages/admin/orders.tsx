import { useEffect, useState } from 'react';
import { Search, User, Check, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatAccountSize, ORDER_STATUS_LABELS, PLATFORM_LABELS, formatDate } from '@/lib/constants';
import type { Order, Profile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { DEFAULT_ORDERS } from '@/lib/default-data';

import { fetchAdminStatsApi } from '@/lib/api-client';

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<any | null>(null);
  const [broker, setBroker] = useState('FundedShift Direct ECN');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');
  const [server, setServer] = useState('FundedShift-Live01');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetchAdminStatsApi();
      if (res && res.orders) {
        setOrders(res.orders);
        if (res.users) setUsers(res.users);
      } else {
        const { data } = await supabase
          .from('orders')
          .select('*, challenge:challenges(*), profile:profiles(id, email, full_name)')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) setOrders(data);
        else setOrders(DEFAULT_ORDERS as any);
      }
    } catch (_) {
      setOrders(DEFAULT_ORDERS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getUserForOrder = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const u = getUserForOrder(o.user_id);
    return (
      u?.email?.toLowerCase().includes(q) ||
      o.plan_name?.toLowerCase().includes(q) ||
      o.id.includes(q) ||
      o.payment_method?.toLowerCase().includes(q)
    );
  });

  const handleAssign = async () => {
    if (!assigning) return;
    if (!broker || !accountNumber || !password || !server) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);

    try {
      // Create trading account
      const { error: accError } = await supabase.from('trading_accounts').insert({
        order_id: assigning.id,
        user_id: assigning.user_id,
        challenge_id: assigning.challenge_id,
        account_size: assigning.account_size,
        platform: assigning.platform,
        broker,
        account_number: accountNumber,
        password,
        investor_password: investorPassword || null,
        server,
        status: 'active',
        starting_balance: assigning.account_size,
        current_balance: assigning.account_size,
        highest_balance: assigning.account_size,
        rules: assigning.challenge?.rules ?? {},
        assigned_at: new Date().toISOString(),
      });
      if (accError) throw accError;

      // Update order status
      await supabase.from('orders').update({ status: 'assigned' }).eq('id', assigning.id);

      // Notify trader
      await supabase.from('notifications').insert({
        user_id: assigning.user_id,
        title: 'Trading Account Assigned',
        body: `Your trading account has been assigned. Check your dashboard for credentials.`,
        type: 'success',
      });

      toast.success('Account assigned successfully. Trader has been notified.');
      setAssigning(null);
      setBroker(''); setAccountNumber(''); setPassword(''); setInvestorPassword(''); setServer('');
      load();
    } catch (err) {
      toast.error('Failed to assign account');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl glass animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and assign trading accounts to orders.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email, challenge, or order ID..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id} className="glass border-border/50">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold-400/10 flex items-center justify-center">
                      <span className="font-display font-bold text-gold-400 text-sm">{formatAccountSize(order.account_size)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.plan_name || order.challenge?.name || 'FundedShift Challenge'}</p>
                      <p className="text-xs text-muted-foreground">{getUserForOrder(order.user_id)?.email || order.profile?.email || 'trader@example.com'} · {PLATFORM_LABELS[order.platform as keyof typeof PLATFORM_LABELS] ?? order.platform} · {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                      order.status === 'waiting_assignment' ? 'bg-warning/15 text-warning' :
                      order.status === 'assigned' ? 'bg-success/15 text-success' :
                      'bg-muted text-muted-foreground'
                    )}>{ORDER_STATUS_LABELS[order.status]}</span>
                    {order.status === 'waiting_assignment' && (
                      <Button size="sm" className="bg-gold-gradient text-black hover:opacity-90 font-semibold" onClick={() => setAssigning(order)}>
                        Assign Account <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment dialog */}
      <Dialog open={!!assigning} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Assign Trading Account</DialogTitle>
          </DialogHeader>
          {assigning && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-card/50 text-sm">
                <p><span className="text-muted-foreground">Challenge:</span> {assigning.challenge?.name}</p>
                <p><span className="text-muted-foreground">Account Size:</span> {formatAccountSize(assigning.account_size)}</p>
                <p><span className="text-muted-foreground">Platform:</span> {PLATFORM_LABELS[assigning.platform as keyof typeof PLATFORM_LABELS] ?? assigning.platform}</p>
                <p><span className="text-muted-foreground">Trader:</span> {(assigning as any).profile?.email}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="broker">Broker *</Label>
                  <Input id="broker" value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="e.g. FundedShift Direct ECN" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Trader password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investorPassword">Investor Password</Label>
                  <Input id="investorPassword" value={investorPassword} onChange={(e) => setInvestorPassword(e.target.value)} placeholder="Investor password" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="server">Server *</Label>
                  <Input id="server" value={server} onChange={(e) => setServer(e.target.value)} placeholder="e.g. FundedShift-Live01" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={submitting} className="bg-gold-gradient text-black hover:opacity-90 font-semibold">
              {submitting ? 'Assigning...' : 'Assign Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
