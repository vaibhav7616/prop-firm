import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LifeBuoy, Plus, Send, MessageSquare, ArrowLeft, Search, CircleHelp } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatDateTime } from '@/lib/constants';
import type { SupportTicket } from '@/types';
import { DEFAULT_TICKETS } from '@/lib/default-data';
import { FsPanel, FsPageHeader, FsEmpty, StatusPill } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = ['Trading', 'Account', 'Rules', 'Payout', 'Payment', 'Technical', 'Verification', 'General'];

export function DashboardSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(DEFAULT_TICKETS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('ALL');

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Trading');
  const [message, setMessage] = useState('');

  const filtered = tickets.filter((t) => (cat === 'ALL' || t.category === cat) && (!q || (t.subject + ' ' + t.category).toLowerCase().includes(q.toLowerCase())));

  const open = openId ? tickets.find((t) => t.id === openId) : null;

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please add a subject and message.');
      return;
    }
    const now = new Date().toISOString();
    const t: SupportTicket = {
      id: `tick-${Date.now()}`,
      user_id: user?.id || 'demo-trader-id-12345',
      subject: subject.trim(),
      category,
      priority: 'normal',
      status: 'open',
      messages: [{ sender: 'user', message: message.trim(), created_at: now }],
      created_at: now,
      updated_at: now,
    };
    setTickets((prev) => [t, ...prev]);
    setSubject('');
    setMessage('');
    setCategory('Trading');
    setCreating(false);
    setOpenId(t.id);
    toast.success('Ticket created');
  };

  const reply = (ticketId: string, text: string) => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, messages: [...t.messages, { sender: 'user', message: text, created_at: now }], updated_at: now } : t)));
  };

  if (open) {
    return <ThreadView ticket={open} onBack={() => setOpenId(null)} onReply={reply} />;
  }

  return (
    <div className="space-y-5">
      <FsPageHeader
        eyebrow="Help"
        title="Support"
        description="Find answers or open a ticket with the Funded Shift team."
        actions={
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            <Plus className="h-4 w-4" /> New ticket
          </button>
        }
      />

      {/* category grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = c === 'Technical' ? CircleHelp : MessageSquare;
          const count = tickets.filter((t) => t.category === c).length;
          return (
            <button key={c} onClick={() => { setCat(c === cat ? 'ALL' : c); setCreating(c !== 'ALL'); if (c !== 'ALL') { setCategory(c); } }} className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left transition-colors hover:border-slate-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-100">{c}</span>
                <span className="text-[11px] text-slate-500">{count} ticket{count === 1 ? '' : 's'}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* tickets list */}
      <FsPanel className="overflow-hidden p-0">
        <div className="flex flex-col gap-2 border-b border-slate-800 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-6"><FsEmpty icon={<LifeBuoy className="h-5 w-5" />} title="No tickets found" /></div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => setOpenId(t.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-900/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-100">{t.subject}</p>
                    <span className="rounded bg-slate-800 px-1.5 py-px text-[10px] font-semibold text-slate-400">{t.category}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{t.messages[0]?.message?.slice(0, 80)}…</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{formatDateTime(t.updated_at)}</p>
                    <StatusPill tone={t.status === 'open' ? 'indigo' : t.status === 'pending' ? 'amber' : 'emerald'}>{t.status}</StatusPill>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </FsPanel>

      {/* create modal */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setCreating(false)}>
            <motion.form onSubmit={create} initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c0f16] p-5">
              <h3 className="mb-4 font-display text-base font-bold text-slate-50">Open a support ticket</h3>
              <label className="block">
                <span className="fs-label">Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                  {CATEGORIES.filter((c) => c !== 'ALL').map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="mt-3 block">
                <span className="fs-label">Subject</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
              </label>
              <label className="mt-3 block">
                <span className="fs-label">Message</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe your issue…" className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button>
                <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">Submit ticket</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThreadView({ ticket, onBack, onReply }: { ticket: SupportTicket; onBack: () => void; onReply: (id: string, text: string) => void }) {
  const [text, setText] = useState('');
  const send = (e: FormEvent) => {
    e.preventDefault();
    onReply(ticket.id, text);
    setText('');
  };
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft className="h-4 w-4" /> Back to tickets</button>
      <FsPanel className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-50">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-slate-500">Ticket #{ticket.id} · {ticket.category} · opened {formatDateTime(ticket.created_at)}</p>
          </div>
          <StatusPill tone={ticket.status === 'open' ? 'indigo' : ticket.status === 'pending' ? 'amber' : 'emerald'}>{ticket.status}</StatusPill>
        </div>
        <div className="mt-5 space-y-3">
          {ticket.messages.map((m, i) => (
            <div key={i} className={cn('max-w-[85%] rounded-xl border p-3', m.sender === 'user' ? 'ml-auto border-indigo-500/30 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/60')}>
              <p className="text-xs font-semibold capitalize text-slate-400">{m.sender === 'user' ? 'You' : 'Funded Shift Support'}</p>
              <p className="mt-1 text-sm text-slate-200">{m.message}</p>
              <p className="mt-1.5 text-[10px] text-slate-500">{formatDateTime(m.created_at)}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="mt-5 flex gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Write a reply…" className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none" />
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"><Send className="h-4 w-4" /> Send</button>
        </form>
      </FsPanel>
    </div>
  );
}
