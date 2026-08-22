import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatDateTime } from '@/lib/constants';
import type { Notification } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DEFAULT_NOTIFICATIONS } from '@/lib/default-data';

export function DashboardNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotifications(DEFAULT_NOTIFICATIONS);
    setLoading(false);
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    toast.success('Notification marked as read');
  };

  const displayNotifications = notifications.length > 0 ? notifications : DEFAULT_NOTIFICATIONS;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on your account activity and trade alerts.</p>
        </div>
        {displayNotifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {displayNotifications.map((n, idx) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
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
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
