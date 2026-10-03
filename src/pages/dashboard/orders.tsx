import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency, formatAccountSize, ORDER_STATUS_LABELS, PLATFORM_LABELS, formatDate } from '@/lib/constants';
import type { Order } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchUserOrders } from '@/lib/api-client';
import { DEFAULT_ORDERS } from '@/lib/default-data';

export function DashboardOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user) {
          const apiOrders = await fetchUserOrders(user.id);
          if (apiOrders && apiOrders.length > 0) {
            setOrders(apiOrders);
            setLoading(false);
            return;
          } else if (user.id === 'demo-trader-id-12345') {
            setOrders(DEFAULT_ORDERS);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Orders fetch error:', err);
      }
      if (user?.id === 'demo-trader-id-12345') {
        setOrders(DEFAULT_ORDERS);
      } else {
        setOrders([]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const displayOrders = orders;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Your challenge purchase history.</p>
      </div>

      {displayOrders.length === 0 ? (
        <Card className="glass border-border/50 text-center py-12">
          <CardContent className="space-y-3">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-base font-semibold text-foreground">No Orders Yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven't placed any challenge orders yet. When you enroll in an evaluation, your receipt and order history will appear here.
            </p>
            <Link to="/challenges">
              <Button size="sm" className="mt-2">
                Browse Challenges
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
      <div className="space-y-3">
        {displayOrders.map((order, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold-400/10 flex items-center justify-center">
                      <span className="font-display font-bold text-gold-400 text-sm">
                        {formatAccountSize(order.account_size)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.challenge?.name ?? order.plan_name ?? 'Prop Challenge'}</p>
                      <p className="text-xs text-muted-foreground">
                        {PLATFORM_LABELS[order.platform] || order.platform} · {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(order.total_amount)}</p>
                      {order.discount_amount > 0 && (
                        <p className="text-xs text-success">Saved {formatCurrency(order.discount_amount)}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        order.status === 'PAID' || order.status === 'assigned'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}
