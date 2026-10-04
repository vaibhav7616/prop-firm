import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, CheckCheck, BellOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatDateTime } from '@/lib/constants';
import type { Notification } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DEFAULT_NOTIFICATIONS } from '@/lib/default-data';
import { fetchNotificationsApi, markNotificationReadApi } from '@/lib/api-client';

export function DashboardNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    const userId = user?.id || 'demo-trader-id-12345';
    const isDemo = userId === 'demo-trader-id-12345';
    try {
      const data = await fetchNotificationsApi(userId);
      if (data && data.length > 0) {
        setNotifications(data);
      } else if (isDemo) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      } else {
        setNotifications([]);
      }
    } catch (_) {
      if (isDemo) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      } else {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
    if (user?.id) {
      await markNotificationReadApi(undefined, user.id);
    }
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    toast.success('Notification marked as read');
    if (user?.id) {
      await markNotificationReadApi(id, user.id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Bell className="h-3.5 w-3.5" /> Activity Center
          </div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on your challenge progress, trading rules, and payouts.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadNotifications} className="border-border/60 hover:border-gold-400/50">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="border-gold-400/30 text-gold-400 hover:bg-gold-400/10">
              <CheckCheck className="h-4 w-4 mr-2" /> Mark all read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="glass border-border/50 text-center py-16 px-4">
          <CardContent className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center text-gold-400 shadow-lg shadow-gold-400/5">
              <BellOff className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">No Notifications Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                You are all caught up! Real-time alerts regarding challenge orders, stage promotions, trading milestones, and payout dispatches will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
              whileHover={{ y: -2 }}
            >
              <Card className={cn('glass border-border/50 hover:border-gold-400/30 transition-all duration-300', !n.is_read && 'glass-gold')}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        n.type === 'success'
                          ? 'bg-emerald-500/10'
                          : n.type === 'warning'
                          ? 'bg-amber-500/10'
                          : n.type === 'error'
                          ? 'bg-red-500/10'
                          : 'bg-gold-400/10'
                      )}
                    >
                      <Bell
                        className={cn(
                          'h-5 w-5',
                          n.type === 'success'
                            ? 'text-emerald-400'
                            : n.type === 'warning'
                            ? 'text-amber-400'
                            : n.type === 'error'
                            ? 'text-red-400'
                            : 'text-gold-400'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDateTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markRead(n.id)} title="Mark as read">
                        <Check className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
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
