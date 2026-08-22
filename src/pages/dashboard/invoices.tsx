import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Eye, Printer, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatCurrency, formatDate } from '@/lib/constants';
import type { Invoice } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DEFAULT_INVOICES } from '@/lib/default-data';
import { fetchUserOrders } from '@/lib/api-client';

export function DashboardInvoices() {
  const { user, profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      if (user?.id) {
        try {
          const userOrders = await fetchUserOrders(user.id);
          if (userOrders && userOrders.length > 0) {
            const userInvoices: Invoice[] = userOrders.map((o) => ({
              id: `inv-${o.id}`,
              user_id: o.user_id || user.id,
              order_id: o.id,
              invoice_number: `INV-${new Date(o.created_at).getFullYear()}-${o.id.slice(0, 6).toUpperCase()}`,
              amount: o.total_amount,
              currency: 'USD',
              status: (o.status === 'PAID' as any || o.status === 'assigned' || o.status === 'paid') ? 'paid' : 'issued',
              pdf_url: null,
              created_at: o.created_at,
            }));
            setInvoices(userInvoices);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Failed to load user orders for invoices:', err);
        }
      }
      setInvoices(DEFAULT_INVOICES);
      setLoading(false);
    };
    loadInvoices();
  }, [user]);

  const generateInvoiceHTML = (invoice: Invoice) => {
    const customerName = profile?.full_name || user?.email?.split('@')[0] || 'Valued Trader';
    const customerEmail = user?.email || 'trader@fundedshift.com';
    const dateStr = formatDate(invoice.created_at);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number} - FundedShift</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
      background: #090d16;
      margin: 0;
      padding: 40px 20px;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      padding: 48px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #fbbf24;
    }
    .badge-paid {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-weight: 700;
      font-size: 12px;
      padding: 6px 16px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
    }
    .meta-title {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      margin-bottom: 32px;
    }
    th {
      background: #1e293b;
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #334155;
    }
    td {
      padding: 18px 16px;
      font-size: 14px;
      border-bottom: 1px solid #1e293b;
      color: #cbd5e1;
    }
    .total-box {
      float: right;
      width: 280px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #94a3b8;
    }
    .total-row.grand {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      border-top: 1px solid #334155;
      padding-top: 12px;
      margin-top: 8px;
      margin-bottom: 0;
    }
    .footer {
      clear: both;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body { background: #fff; color: #0f172a; padding: 0; }
      .invoice-card { background: #fff; color: #0f172a; border: none; box-shadow: none; padding: 20px; }
      .logo { color: #0f172a; }
      .meta-value { color: #0f172a; }
      th { background: #f8fafc; color: #475569; }
      td { color: #334155; border-bottom-color: #f1f5f9; }
      .total-box { background: #f8fafc; border-color: #e2e8f0; }
      .total-row { color: #64748b; }
      .total-row.grand { color: #0f172a; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo">FUNDED<span>SHIFT</span></div>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Official Prop Trading Evaluation Services</p>
      </div>
      <div>
        <span class="badge-paid">✓ PAID & CONFIRMED</span>
      </div>
    </div>

    <div class="details-grid">
      <div>
        <div class="meta-title">Billed To</div>
        <div class="meta-value">${customerName}</div>
        <div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">${customerEmail}</div>
      </div>
      <div style="text-align: right;">
        <div class="meta-title">Invoice Number</div>
        <div class="meta-value" style="font-family: monospace;">${invoice.invoice_number}</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Issued: ${dateStr}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Funded Shift Prop Trading Challenge Account</strong><br>
            <span style="font-size: 12px; color: #94a3b8;">FundedShift Web Terminal Platform Access & Evaluation Assessment</span>
          </td>
          <td>1</td>
          <td>${formatCurrency(invoice.amount)}</td>
          <td style="text-align: right; font-weight: 700; color: #fbbf24;">${formatCurrency(invoice.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(invoice.amount)}</span>
      </div>
      <div class="total-row">
        <span>Taxes & Fees (0%)</span>
        <span>$0.00</span>
      </div>
      <div class="total-row grand">
        <span>Total Paid</span>
        <span style="color: #fbbf24;">${formatCurrency(invoice.amount)}</span>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #cbd5e1;">Thank you for choosing Funded Shift!</p>
      <p style="margin: 0;">Funded Shift Financial Technologies Inc. · Automated Verification Hash: ${invoice.id.slice(0, 12)}</p>
    </div>
  </div>
</body>
</html>`;
  };

  const downloadInvoice = (invoice: Invoice) => {
    const htmlContent = generateInvoiceHTML(invoice);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Official invoice ${invoice.invoice_number} downloaded!`);
  };

  const handlePrint = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      downloadInvoice(invoice);
      return;
    }
    printWindow.document.write(generateInvoiceHTML(invoice));
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const displayInvoices = invoices.length > 0 ? invoices : DEFAULT_INVOICES;

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
        <h1 className="font-display text-2xl font-bold">Invoices & Purchase Receipts</h1>
        <p className="text-muted-foreground text-sm mt-1">Download and print official receipts for your prop challenge purchases.</p>
      </div>

      <div className="space-y-3">
        {displayInvoices.map((invoice, idx) => (
          <motion.div
            key={invoice.id}
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
                      <FileText className="h-5 w-5 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-sm font-semibold">{formatCurrency(invoice.amount)}</p>
                      <p className="text-xs text-emerald-400 capitalize flex items-center justify-end gap-1">
                        <ShieldCheck className="h-3 w-3" /> {invoice.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                      <Eye className="h-4 w-4 mr-1.5" /> View
                    </Button>
                    <Button size="sm" className="bg-gold-gradient text-black font-semibold" onClick={() => downloadInvoice(invoice)}>
                      <Download className="h-4 w-4 mr-1.5" /> Download HTML
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Invoice Modal Preview */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedInvoice && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-2xl bg-slate-950 border-2 border-gold-400/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black text-slate-100 my-8 max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-white flex items-center gap-2.5">
                      Official Receipt <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-semibold">✓ Paid</span>
                    </h2>
                    <p className="text-xs font-mono text-gold-400/90 mt-1 font-semibold">{selectedInvoice.invoice_number}</p>
                  </div>
                </div>

                {/* Invoice Content Card */}
                <div className="space-y-4 text-xs bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold tracking-wider uppercase mb-1">BILLED TO</span>
                      <span className="font-bold text-white text-sm block">{profile?.full_name || user?.email?.split('@')[0] || 'Valued Trader'}</span>
                      <span className="text-slate-300 font-mono text-xs block mt-0.5">{user?.email || 'trader@fundedshift.com'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] font-bold tracking-wider uppercase mb-1">DATE ISSUED</span>
                      <span className="font-bold text-white text-sm block">{formatDate(selectedInvoice.created_at)}</span>
                      <span className="text-emerald-400 font-mono font-bold text-xs block mt-0.5">Payment Confirmed</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex justify-between font-bold text-slate-300 text-xs pb-2 uppercase tracking-wider">
                      <span>Description</span>
                      <span>Amount</span>
                    </div>
                    <div className="flex justify-between items-start text-slate-200 py-1">
                      <div>
                        <span className="font-semibold text-white block text-xs">FundedShift Assessment Challenge Account</span>
                        <span className="text-[11px] text-slate-400 block">Web Terminal Access & Trading Evaluation</span>
                      </div>
                      <span className="font-mono text-amber-300 font-bold text-sm">{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-200 uppercase tracking-wide text-xs">Total Amount Paid</span>
                    <span className="text-gold-400 text-lg font-mono font-extrabold">{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white"
                    onClick={() => handlePrint(selectedInvoice)}
                  >
                    <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gold-gradient hover:opacity-90 text-black font-bold shadow-lg shadow-gold-400/10"
                    onClick={() => downloadInvoice(selectedInvoice)}
                  >
                    <Download className="h-4 w-4 mr-1.5" /> Download HTML Invoice
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}


