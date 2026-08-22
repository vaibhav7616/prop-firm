import { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Check, RefreshCw, DollarSign, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DEFAULT_CHALLENGES } from '@/lib/default-data';
import { formatCurrency, formatAccountSize } from '@/lib/constants';
import { fetchChallengesApi, updateChallengePriceApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function AdminChallenges() {
  const [challenges, setChallenges] = useState(DEFAULT_CHALLENGES);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editSplit, setEditSplit] = useState<number>(90);

  const loadChallenges = async () => {
    setLoading(true);
    const data = await fetchChallengesApi();
    if (data && data.length > 0) {
      setChallenges(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setEditPrice(c.price);
    setEditSplit(c.rules?.profit_split || 90);
  };

  const handleSave = async (id: string) => {
    const res = await updateChallengePriceApi(id, editPrice, { profit_split: editSplit });
    
    // Update local state immediately
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              price: editPrice,
              rules: { ...c.rules, profit_split: editSplit },
            }
          : c
      )
    );

    if (res && res.challenges) {
      setChallenges(res.challenges);
    }

    setEditingId(null);
    toast.success('Price updated live across all checkout pages and plans!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Target className="h-3.5 w-3.5" />
            Challenge & Pricing Catalog
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Challenge Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure challenge tiers, entry fees, leverage, and profit split rules across 1-Step, 2-Step, and Instant Funding models.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['one_step', 'two_step', 'instant_funding'].map((typeKey) => {
          const typeName =
            typeKey === 'one_step' ? '1-Step Evaluation' : typeKey === 'two_step' ? '2-Step Evaluation' : 'Instant Funding';
          const typeList = challenges.filter((c) => c.type === typeKey);

          return (
            <Card key={typeKey} className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{typeName}</span>
                  <span className="text-xs font-normal text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                    {typeList.length} tiers
                  </span>
                </CardTitle>
                <CardDescription>Live pricing tier matrix</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 p-4">
                {typeList.map((c) => {
                  const isEditing = editingId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-gold-400/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-display font-bold text-sm text-foreground">
                          {formatAccountSize(c.account_size)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Split: up to {c.rules?.profit_split}% · Leverage 1:{c.rules?.leverage}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs bg-background border border-gold-400 rounded-lg text-foreground font-bold"
                            />
                            <button
                              onClick={() => handleSave(c.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-emerald-400 text-sm">
                              {formatCurrency(c.price)}
                            </span>
                            <button
                              onClick={() => handleEdit(c)}
                              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit price"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
