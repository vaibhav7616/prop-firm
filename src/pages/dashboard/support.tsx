import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LifeBuoy, Plus, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/constants';
import type { SupportTicket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DEFAULT_TICKETS } from '@/lib/default-data';

export function DashboardSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(DEFAULT_TICKETS);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTickets(DEFAULT_TICKETS);
    setLoading(false);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);

    const newTicket: SupportTicket = {
      id: `tick-${Date.now()}`,
      user_id: user?.id || 'demo-user',
      subject: subject.trim(),
      category: 'General',
      priority: 'normal',
      status: 'open',
      messages: [{ sender: 'user', message: message.trim(), created_at: new Date().toISOString() }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSubmitting(false);
    toast.success('Support ticket created successfully! Our team will respond shortly.');
    setSubject('');
    setMessage('');
    setShowForm(false);
  };

  const displayTickets = tickets.length > 0 ? tickets : DEFAULT_TICKETS;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">Get 24/7 assistance from our prop firm support desk.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gold-gradient text-black hover:opacity-90 font-semibold">
          <Plus className="h-4 w-4 mr-2" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
                <Button type="submit" disabled={submitting} className="bg-gold-gradient text-black hover:opacity-90 font-semibold">
                  {submitting ? 'Creating...' : <><Send className="h-4 w-4 mr-2" /> Submit Ticket</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        {displayTickets.map((ticket, idx) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(ticket.created_at)} · {ticket.messages?.length || 1} messages
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                      ticket.status === 'open'
                        ? 'bg-blue-500/15 text-blue-400'
                        : ticket.status === 'resolved'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : ticket.status === 'closed'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-amber-500/15 text-amber-400'
                    )}
                  >
                    {ticket.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
