import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LifeBuoy, Plus, Send, MessageSquare, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/constants';
import type { SupportTicket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchUserSupportTicketsApi, createSupportTicketApi, replySupportTicketApi } from '@/lib/api-client';

export function DashboardSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Trading & Rules');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchUserSupportTicketsApi(user.id);
    setTickets(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);

    const res = await createSupportTicketApi({
      userId: user?.id,
      subject: subject.trim(),
      category,
      message: message.trim(),
    });

    setSubmitting(false);
    if (res && res.success) {
      toast.success('Support ticket created successfully! Our team will respond shortly.');
      setSubject('');
      setMessage('');
      setShowForm(false);
      loadData();
    } else {
      toast.error(res?.error || 'Failed to create ticket.');
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    const res = await replySupportTicketApi(ticketId, replyText.trim(), user?.id);
    setReplying(false);
    if (res && res.success) {
      toast.success('Reply sent successfully.');
      setReplyText('');
      loadData();
    } else {
      toast.error(res?.error || 'Failed to send reply.');
    }
  };

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                    >
                      <option value="Trading & Rules">Trading & Rule Inquiries</option>
                      <option value="Account & Login">Account & Credentials</option>
                      <option value="Payouts & Billing">Payouts & Profit Split</option>
                      <option value="Technical Support">Technical & Connectivity</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
                <Button type="submit" disabled={submitting} className="bg-gold-gradient text-black hover:opacity-90 font-semibold text-xs">
                  {submitting ? 'Creating...' : <><Send className="h-4 w-4 mr-2" /> Submit Ticket</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {tickets.length === 0 ? (
        <Card className="glass border-border/50 p-12 text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-gold-400/10 text-gold-400 flex items-center justify-center mx-auto mb-3">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Support Tickets Yet</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Need help with your evaluation account, trade rules, or payouts? Our 24/7 prop firm support team is ready to assist.
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-gold-gradient text-black font-semibold text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Open Support Ticket
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket, idx) => {
            const isExpanded = expandedTicketId === ticket.id;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
              >
                <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-5 cursor-pointer" onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-5 w-5 text-gold-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(ticket.created_at)} · {ticket.category || 'General'} · {ticket.messages?.length || 1} message{(ticket.messages?.length || 1) > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardContent>

                  {isExpanded && (
                    <div className="border-t border-border/40 p-5 bg-card/40 space-y-4">
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {(ticket.messages || []).map((msg: any, mIdx: number) => {
                          const isSupport = msg.sender === 'admin' || msg.sender === 'support';
                          return (
                            <div
                              key={msg.id || mIdx}
                              className={cn(
                                'p-3.5 rounded-xl text-xs space-y-1 max-w-xl',
                                isSupport
                                  ? 'ml-auto bg-gold-400/10 border border-gold-400/20 text-foreground'
                                  : 'bg-secondary/60 border border-border/50 text-foreground'
                              )}
                            >
                              <div className="flex items-center justify-between gap-4 font-semibold text-[11px] text-muted-foreground">
                                <span>{isSupport ? '🛡️ FundedShift Support Desk' : 'Trader'}</span>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          );
                        })}
                      </div>

                      {ticket.status !== 'closed' && (
                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply to support..."
                            className="text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(ticket.id);
                              }
                            }}
                          />
                          <Button
                            onClick={() => handleReply(ticket.id)}
                            disabled={replying || !replyText.trim()}
                            size="sm"
                            className="bg-gold-gradient text-black font-semibold text-xs shrink-0"
                          >
                            <Send className="h-3.5 w-3.5 mr-1" /> Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
