import { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function AdminKyc() {
  const [kycSubmissions, setKycSubmissions] = useState([
    {
      id: 'kyc-1',
      trader_name: 'Alex Vance',
      email: 'trader@propfirm.com',
      document_type: 'PASSPORT',
      country: 'United States',
      status: 'VERIFIED',
      submitted_at: '2026-08-01T10:15:00Z',
    },
    {
      id: 'kyc-2',
      trader_name: 'Michael Chen',
      email: 'mchen@trading.io',
      document_type: 'DRIVERS_LICENSE',
      country: 'Canada',
      status: 'PENDING',
      submitted_at: '2026-08-07T14:30:00Z',
    },
    {
      id: 'kyc-3',
      trader_name: 'Sophia Mueller',
      email: 'sophia.m@finance.de',
      document_type: 'NATIONAL_ID',
      country: 'Germany',
      status: 'PENDING',
      submitted_at: '2026-08-07T18:45:00Z',
    },
  ]);

  const handleAction = (id: string, newStatus: 'VERIFIED' | 'REJECTED') => {
    setKycSubmissions((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: newStatus } : k))
    );
    toast.success(`Trader KYC status marked as ${newStatus}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance & Identity Verification
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">KYC Verifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review identity documents submitted by funded traders before first payout.
          </p>
        </div>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Submissions Queue ({kycSubmissions.length})</CardTitle>
          <CardDescription>Identity verification documents pending review</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-semibold border-y border-border/50">
                <tr>
                  <th className="p-4">Trader</th>
                  <th className="p-4">Document Type</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {kycSubmissions.map((k) => (
                  <tr key={k.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-foreground">{k.trader_name}</p>
                      <p className="text-[11px] text-muted-foreground">{k.email}</p>
                    </td>
                    <td className="p-4 font-mono font-medium text-foreground">
                      {k.document_type}
                    </td>
                    <td className="p-4 text-foreground">{k.country}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          k.status === 'VERIFIED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : k.status === 'REJECTED'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(k.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {k.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(k.id, 'VERIFIED')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold transition-all text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(k.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold transition-all text-[11px]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
