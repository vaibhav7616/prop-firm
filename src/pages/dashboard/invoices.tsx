import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FileText, Download, Eye, X, Printer } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency, formatDate } from '@/lib/constants';
import type { Invoice } from '@/types';
import { fetchUserOrders } from '@/lib/api-client';
import { DEFAULT_INVOICES } from '@/lib/default-data';
import { FsPanel, FsPageHeader, FsEmpty, FsStat } from '@/components/fs/fs-ui';
import { cn } from '@/lib/utils';

export function DashboardInvoices() {
  const { user, profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);

  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        try {
          const orders = await fetchUserOrders(user.id);
          if (orders && orders.length > 0) {
            const invs: Invoice[] = orders.map((o) => ({
              id: `inv-${o.id}`,
              user_id: o.user_id || user.id,
              order_id: o.id,
              invoice_number: `INV-${new Date(o.created_at).getFullYear()}-${o.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`,
              amount: o.total_amount,
              currency: 'USD',
              status: o.status === 'assigned' || o.status === 'paid' || (o.status as any) === 'PAID' ? 'paid' : 'issued',
              pdf_url: null,
              created_at: o.created_at,
            }));
            setInvoices(invs);
            setLoading(false);
            return;
          }
        } catch {
          /* fallthrough */
        }
      }
      setInvoices(DEFAULT_INVOICES);
      setLoading(false);
    };
    load();
  }, [user]);

  const paid = invoices.filter((i) => i.status === 'paid').length;

  const download = (inv: Invoice) => {
    const name = profile?.full_name || 'Funded Shift Trader';
    const html = invoiceHtml(inv, name);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <FsPageHeader eyebrow="Billing" title="Invoices" description="Tax records for your challenge purchases." />
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FsStat label="Invoices" value={String(invoices.length)} />
          <FsStat label="Paid" value={String(paid)} accent="emerald" />
          <FsStat label="Issued" value={String(invoices.filter((i) => i.status === 'issued').length)} accent="amber" />
          <FsStat label="Outstanding" value={formatCurrency(invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0))} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800/70" />)}</div>
      ) : invoices.length === 0 ? (
        <FsEmpty icon={<FileText className="h-5 w-5" />} title="No invoices yet" description="Invoices are generated for each challenge purchase." />
      ) : (
        <FsPanel className="overflow-hidden p-0">
          <div className="fs-scroll overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  {['Invoice', 'Product', 'Amount', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="fs-row-hover">
                    <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-slate-100">{inv.invoice_number}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-300">Challenge purchase</td>
                    <td className="px-4 py-3"><span className="fs-num text-sm font-semibold text-slate-50">{formatCurrency(inv.amount)}</span></td>
                    <td className="px-4 py-3"><Badge status={inv.status} /></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(inv)} className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"><Eye className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FsPanel>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0e15]">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                <p className="text-sm font-semibold text-slate-100">{selected.invoice_number}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => download(selected)} className="rounded-md p-2 text-slate-300 hover:bg-slate-800"><Download className="h-4 w-4" /></button>
                  <button onClick={() => setSelected(null)} className="rounded-md p-2 text-slate-300 hover:bg-slate-800"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <InvoiceBody inv={selected} name={profile?.full_name || 'Funded Shift Trader'} email={user?.email || ''} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = { paid: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10', issued: 'text-amber-300 border-amber-500/40 bg-amber-500/10', void: 'text-rose-300 border-rose-500/40 bg-rose-500/10' };
  const label = status === 'paid' ? 'Paid' : status === 'issued' ? 'Pending' : 'Void';
  return <span className={cn('rounded-full border px-2 py-px text-[11px] font-semibold capitalize', map[status] || map.issued)}>{label}</span>;
}

function InvoiceBody({ inv, name, email }: { inv: Invoice; name: string; email: string }) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between border-b border-slate-800 pb-5">
        <div>
          <p className="font-display text-xl font-bold text-slate-50">Funded Shift</p>
          <p className="text-xs text-slate-500">Prop trading platform</p>
        </div>
        <div className="text-right">
          <p className="fs-num text-sm font-semibold text-slate-100">{inv.invoice_number}</p>
          <p className="text-xs text-slate-500">{formatDate(inv.created_at)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 py-5 text-sm">
        <div>
          <p className="fs-label">Bill to</p>
          <p className="mt-1 font-medium text-slate-100">{name}</p>
          <p className="text-slate-500">{email}</p>
        </div>
        <div className="text-right">
          <p className="fs-label">Status</p>
          <p className="mt-1 capitalize text-slate-200">{inv.status}</p>
        </div>
      </div>
      <table className="w-full">
        <thead className="border-y border-slate-800 text-left">
          <tr>
            <th className="py-2 text-[10px] uppercase tracking-wider text-slate-500">Description</th>
            <th className="py-2 text-right text-[10px] uppercase tracking-wider text-slate-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-800/60">
            <td className="py-3 text-sm text-slate-300">Trading challenge purchase</td>
            <td className="py-3 text-right fs-num text-sm text-slate-100">{formatCurrency(inv.amount)}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-end pt-4">
        <div className="w-56">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="fs-num font-bold text-slate-50">{formatCurrency(inv.amount)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Currency</span><span className="fs-num text-slate-300">{inv.currency}</span></div>
        </div>
      </div>
    </div>
  );
}

function invoiceHtml(inv: Invoice, name: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${inv.invoice_number}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;background:#0b0e15;color:#e2e8f0;padding:40px}.c{max-width:720px;margin:auto;background:#11161f;border:1px solid #1e293b;border-radius:16px;padding:40px}.h{display:flex;justify-content:space-between;border-bottom:1px solid #1e293b;padding-bottom:20px}.mono{font-family:ui-monospace,monospace}table{width:100%;border-collapse:collapse}.lbl{color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:.08em}</style></head><body>
<div class="c"><div class="h"><div><h2 style="margin:0">Funded Shift</h2><p class="lbl">Prop trading platform</p></div><div style="text-align:right"><p class="mono" style="font-weight:700">${inv.invoice_number}</p><p class="lbl">${formatDate(inv.created_at)}</p></div></div>
<div style="padding:20px 0"><p class="lbl">Bill to</p><p style="margin:4px 0">${name}</p></div>
<table><thead><tr><th class="lbl" style="text-align:left;padding:8px 0">Description</th><th class="lbl" style="text-align:right">Amount</th></tr></thead><tbody><tr style="border-top:1px solid #1e293b"><td style="padding:12px 0">Trading challenge purchase</td><td style="text-align:right" class="mono">${formatCurrency(inv.amount)}</td></tr></tbody></table>
<div style="text-align:right;padding-top:16px"><p class="mono" style="font-size:18px;font-weight:800">${formatCurrency(inv.amount)}</p></div></div></body></html>`;
}
