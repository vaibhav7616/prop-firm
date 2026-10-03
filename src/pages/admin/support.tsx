import React, { useEffect, useState } from 'react';
import {
  Headphones,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Mail,
  ChevronRight,
  Shield,
  Tag,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  fetchAdminSupportTicketsApi,
  replySupportTicketApi,
  adminUpdateSupportTicketStatusApi,
} from '@/lib/api-client';

export function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAdminSupportTicketsApi();
    const list = Array.isArray(data) ? data : [];
    setTickets(list);
    if (list.length > 0 && !selectedTicketId) {
      setSelectedTicketId(list[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    setReplying(true);
    const res = await replySupportTicketApi(selectedTicketId, replyText.trim());
    setReplying(false);

    if (res && res.success) {
      toast.success('Reply submitted and dispatched to trader successfully!');
      setReplyText('');
      const updatedList = await fetchAdminSupportTicketsApi();
      setTickets(Array.isArray(updatedList) ? updatedList : []);
    } else {
      toast.error(res?.error || 'Failed to dispatch reply.');
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setStatusUpdating(true);
    const res = await adminUpdateSupportTicketStatusApi(ticketId, newStatus);
    setStatusUpdating(false);

    if (res && res.success) {
      toast.success(`Ticket status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
      );
    } else {
      toast.error(res?.error || 'Failed to update ticket status.');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Headphones className="h-3.5 w-3.5" />
            Support Helpdesk & Dispatch
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Trader Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review trader inquiries, technical requests, rules questions, and respond in real time.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          disabled={loading}
          className="border-border/50 hover:bg-secondary/40 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Desk
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold font-mono mt-1">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400">Open Tickets</p>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{openCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400">In Progress</p>
              <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{inProgressCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400">Resolved</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{resolvedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Ticket Queue & Filters */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="glass border-border/50">
            <CardHeader className="p-4 pb-3">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket ID, trader, subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 border-border/50 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-1/2 bg-background/50 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold-400"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-1/2 bg-background/50 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold-400"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Trading & Rules">Trading & Rules</option>
                    <option value="Billing & Checkout">Billing & Checkout</option>
                    <option value="Account Verification">Account Verification</option>
                    <option value="Payouts & Withdrawals">Payouts & Withdrawals</option>
                    <option value="Technical Issues">Technical Issues</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No Tickets Match Filter</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {tickets.length === 0
                        ? 'No trader support tickets have been created yet.'
                        : 'Try adjusting your search query or filters.'}
                    </p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-gold-500/10 border-l-2 border-gold-400'
                            : 'hover:bg-secondary/20'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                              #{t.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                t.status === 'open'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : t.status === 'in_progress'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                              {t.category || 'General'}
                            </span>
                          </div>
                          <h4 className="font-medium text-xs text-foreground truncate">{t.subject}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                            <span className="truncate">{t.user_name || t.user_email || 'Trader'}</span>
                            <span>•</span>
                            <span>{new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 mt-2 shrink-0 transition-transform ${
                            isSelected ? 'text-gold-400 translate-x-0.5' : 'text-muted-foreground/40'
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Conversation Thread & Actions */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="glass border-border/50 h-full flex flex-col">
              {/* Ticket Top bar */}
              <CardHeader className="p-5 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-gold-400">
                        #{selectedTicket.id}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{selectedTicket.category}</span>
                    </div>
                    <CardTitle className="text-lg font-bold">{selectedTicket.subject}</CardTitle>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selectedTicket.user_name || 'Trader'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedTicket.user_email || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <select
                      value={selectedTicket.status}
                      disabled={statusUpdating}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                      className="bg-secondary border border-border/60 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:border-gold-400"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              {/* Message Thread */}
              <CardContent className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[420px]">
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    No message history found for this ticket.
                  </p>
                ) : (
                  selectedTicket.messages.map((m: any, idx: number) => {
                    const isAdminMsg = m.sender === 'admin';
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span
                            className={`text-[11px] font-semibold ${
                              isAdminMsg ? 'text-gold-400' : 'text-blue-400'
                            }`}
                          >
                            {isAdminMsg ? 'FundedShift Support Desk' : selectedTicket.user_name || 'Trader'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                            isAdminMsg
                              ? 'bg-gold-500/15 border border-gold-500/25 text-foreground rounded-tr-none'
                              : 'bg-secondary/70 border border-border/40 text-foreground rounded-tl-none'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>

              {/* Reply Form */}
              <div className="p-4 border-t border-border/40 bg-secondary/10">
                <form onSubmit={handleReply} className="space-y-3">
                  <Textarea
                    placeholder={`Reply to ${selectedTicket.user_name || 'Trader'}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="bg-background/80 border-border/60 text-xs focus:border-gold-400 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Dispatching a reply will notify the trader and mark ticket as In Progress.
                    </p>
                    <Button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="bg-gold-gradient text-black font-semibold hover:opacity-90 text-xs h-9 px-4"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {replying ? 'Sending...' : 'Send Response'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="glass border-border/50 h-[500px] flex items-center justify-center">
              <div className="text-center p-6 text-muted-foreground max-w-sm">
                <Headphones className="h-10 w-10 mx-auto mb-2 opacity-30 text-gold-400" />
                <p className="text-sm font-semibold text-foreground">Select a Support Ticket</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a ticket from the queue on the left to read conversation messages and reply.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
