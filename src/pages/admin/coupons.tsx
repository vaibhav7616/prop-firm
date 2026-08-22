import { useState, useEffect } from 'react';
import { Tag, Plus, Check, Trash2, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchPromoCodesApi, createPromoCodeApi, togglePromoCodeApi, deletePromoCodeApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState(15);
  const [newType, setNewType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [maxUses, setMaxUses] = useState(100);

  const loadData = async () => {
    const list = await fetchPromoCodesApi();
    setCoupons(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    const res = await createPromoCodeApi({
      code: newCode.trim().toUpperCase(),
      discount_type: newType,
      discount_value: newValue,
      max_uses: maxUses,
    });

    if (res && res.success) {
      toast.success(`Promo code ${res.promo.code} created!`);
      setNewCode('');
      loadData();
    } else {
      toast.error(res?.error || 'Failed to create promo code');
    }
  };

  const handleToggle = async (id: string) => {
    const res = await togglePromoCodeApi(id);
    if (res && res.success) {
      toast.success('Promo code status updated.');
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePromoCodeApi(id);
    if (res && res.success) {
      toast.success('Promo code deleted.');
      loadData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Tag className="h-3.5 w-3.5" />
            Promotions & Discounts
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Coupon Code Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create custom discount promo codes for checkout promotion campaigns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Coupon Card */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Create New Coupon</CardTitle>
            <CardDescription>Generate a promo code for traders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Promo Code</label>
              <input
                type="text"
                placeholder="e.g. SUMMER25"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50 font-mono font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Discount Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Discount Value</label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50 font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!newCode.trim()}
              className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </button>
          </CardContent>
        </Card>

        {/* Coupons List */}
        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Active Coupons ({coupons.length})</CardTitle>
            <CardDescription>Active and historic discount codes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 text-muted-foreground font-semibold border-y border-border/50">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Uses</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-gold-400 text-sm">
                        {c.code}
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {c.usage_count} / {c.max_uses}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            c.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                            title="Delete Code"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
