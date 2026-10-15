import { useState, useEffect } from 'react';
import { Target, Edit2, Check, RefreshCw, Sparkles, Tag, Flame, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DEFAULT_CHALLENGES } from '@/lib/default-data';
import { formatCurrency, formatAccountSize } from '@/lib/constants';
import { fetchChallengesApi, updateChallengePriceApi, batchOfferApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function AdminChallenges() {
  const [challenges, setChallenges] = useState(DEFAULT_CHALLENGES);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit form state
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editOriginalPrice, setEditOriginalPrice] = useState<number | undefined>(undefined);
  const [editOfferActive, setEditOfferActive] = useState<boolean>(false);
  const [editBadge, setEditBadge] = useState<string>('SPECIAL OFFER');
  const [editSplit, setEditSplit] = useState<number>(90);
  const [editLeverage, setEditLeverage] = useState<number>(100);

  // Batch campaign state
  const [batchPercent, setBatchPercent] = useState<number>(20);
  const [batchTarget, setBatchTarget] = useState<string>('all');
  const [batchBadge, setBatchBadge] = useState<string>('20% OFF SPECIAL OFFER');
  const [applyingBatch, setApplyingBatch] = useState<boolean>(false);

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
    setEditOriginalPrice(c.original_price || c.price);
    setEditOfferActive(Boolean(c.offer_active));
    setEditBadge(c.discount_badge || 'SPECIAL OFFER');
    setEditSplit(c.rules?.profit_split || 90);
    setEditLeverage(c.rules?.leverage || 100);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    const payload = {
      price: editPrice,
      original_price: editOfferActive ? editOriginalPrice || editPrice : undefined,
      offer_active: editOfferActive,
      discount_badge: editOfferActive ? editBadge.trim() : undefined,
      rules: { profit_split: editSplit, leverage: editLeverage },
    };

    const res = await updateChallengePriceApi(id, payload);

    if (res && res.challenges) {
      setChallenges(res.challenges);
    } else {
      // Local state fallback update
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...payload,
                rules: { ...c.rules, profit_split: editSplit, leverage: editLeverage },
              }
            : c
        )
      );
    }

    setEditingId(null);
    toast.success('Challenge price & offer updated live across entire platform!');
  };

  const handleApplyBatchOffer = async () => {
    if (batchPercent <= 0 || batchPercent >= 100) {
      toast.error('Please enter a valid discount percentage (1-99%).');
      return;
    }

    try {
      setApplyingBatch(true);
      const res = await batchOfferApi({
        discount_percent: batchPercent,
        discount_badge: batchBadge || `${batchPercent}% OFF OFFER`,
        target_type: batchTarget,
      });

      if (res && res.challenges) {
        setChallenges(res.challenges);
      } else {
        await loadChallenges();
      }
      toast.success(`Applied ${batchPercent}% discount offer to ${batchTarget === 'all' ? 'all' : batchTarget} accounts!`);
    } catch (err: any) {
      toast.error('Failed to apply batch offer: ' + err.message);
    } finally {
      setApplyingBatch(false);
    }
  };

  const handleClearAllOffers = async () => {
    try {
      setApplyingBatch(true);
      const res = await batchOfferApi({ clear_offers: true });
      if (res && res.challenges) {
        setChallenges(res.challenges);
      } else {
        await loadChallenges();
      }
      toast.success('Cleared all promotional offers! Regular prices restored.');
    } catch (err: any) {
      toast.error('Failed to clear offers: ' + err.message);
    } finally {
      setApplyingBatch(false);
    }
  };

  const activeOffersCount = challenges.filter((c: any) => c.offer_active).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Target className="h-3.5 w-3.5" />
            Pricing & Offer Control Engine
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Challenge & Offer Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Change account prices, configure promotional discounts, set custom offer badges, and synchronize pricing instantly across all checkout and public pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadChallenges}
            disabled={loading}
            className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 border border-border/50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Matrix</span>
          </button>
        </div>
      </div>

      {/* Promotional Campaign Quick Launcher Bar */}
      <Card className="glass border-gold-400/30 bg-gradient-to-r from-gold-400/[0.04] to-transparent">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gold-400/15 text-gold-400 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Launch Promotional Offer Campaign
                  {activeOffersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-400/20 text-gold-400 border border-gold-400/30 flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {activeOffersCount} Active Offers Live
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Apply a direct discount across accounts in 1 click without requiring traders to type promo codes.
                </CardDescription>
              </div>
            </div>

            {activeOffersCount > 0 && (
              <button
                onClick={handleClearAllOffers}
                disabled={applyingBatch}
                className="btn-secondary px-3.5 py-1.5 text-xs text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50 flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset All Offers to Regular Price
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Discount Percentage
              </label>
              <select
                value={batchPercent}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBatchPercent(val);
                  setBatchBadge(`${val}% OFF SPECIAL OFFER`);
                }}
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400 font-bold"
              >
                <option value={10}>10% OFF</option>
                <option value={15}>15% OFF</option>
                <option value={20}>20% OFF (Recommended)</option>
                <option value={25}>25% OFF</option>
                <option value={30}>30% OFF</option>
                <option value={40}>40% OFF</option>
                <option value={50}>50% OFF FLASH SALE</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Target Challenge Model
              </label>
              <select
                value={batchTarget}
                onChange={(e) => setBatchTarget(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400 font-bold"
              >
                <option value="all">All Models (Store-wide)</option>
                <option value="two_step">2-Step Evaluation Only</option>
                <option value="one_step">1-Step Challenge Only</option>
                <option value="instant_funding">Instant Funding Only</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Display Offer Badge Text
              </label>
              <input
                type="text"
                value={batchBadge}
                onChange={(e) => setBatchBadge(e.target.value)}
                placeholder="e.g. 20% OFF LIMITED TIME"
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400 font-medium"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyBatchOffer}
                disabled={applyingBatch}
                className="w-full btn-primary p-2.5 text-xs flex items-center justify-center gap-2 font-bold"
              >
                <Flame className="h-4 w-4 text-black" />
                {applyingBatch ? 'Applying Campaign...' : `Apply ${batchPercent}% Offer Live`}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Matrix By Model */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['one_step', 'two_step', 'instant_funding'].map((typeKey) => {
          const typeName =
            typeKey === 'one_step' ? '1-Step Evaluation' : typeKey === 'two_step' ? '2-Step Evaluation' : 'Instant Funding';
          const typeList = challenges.filter((c: any) => c.type === typeKey);

          return (
            <Card key={typeKey} className="glass border-border/50">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{typeName}</span>
                  <span className="text-[11px] font-normal text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                    {typeList.length} tiers
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">Live accounts & pricing configuration</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 p-4">
                {typeList.map((c: any) => {
                  const isEditing = editingId === c.id;
                  const hasOffer = Boolean(c.offer_active);
                  const originalPrice = c.original_price || c.price;

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        hasOffer
                          ? 'bg-gold-400/[0.04] border-gold-400/40 shadow-sm'
                          : 'bg-secondary/30 border-border/50 hover:border-border'
                      }`}
                    >
                      {/* View Mode */}
                      {!isEditing ? (
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-sm text-foreground">
                                {formatAccountSize(c.account_size)}
                              </span>
                              {hasOffer && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gold-400/20 text-gold-400 border border-gold-400/30">
                                  <Flame className="h-2.5 w-2.5" />
                                  {c.discount_badge || 'OFFER'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Split: {c.rules?.profit_split}% · Leverage 1:{c.rules?.leverage}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              {hasOffer && c.original_price && c.original_price > c.price && (
                                <span className="text-[11px] line-through text-muted-foreground block leading-none font-mono">
                                  {formatCurrency(c.original_price)}
                                </span>
                              )}
                              <span className="font-display font-bold text-emerald-400 text-sm">
                                {formatCurrency(c.price)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleEdit(c)}
                              className="p-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                              title="Edit price & offer settings"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Expanded In-Place Offer & Price Editor */
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <span className="font-bold text-xs text-gold-400 flex items-center gap-1.5">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              Edit {formatAccountSize(c.account_size)} Tier
                            </span>
                            <button
                              onClick={handleCancelEdit}
                              className="text-muted-foreground hover:text-foreground p-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-muted-foreground font-semibold block mb-1">
                                Active Price ($)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-gold-400 text-xs font-bold text-foreground"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-muted-foreground font-semibold block mb-1">
                                Regular Price ($)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={editOriginalPrice ?? editPrice}
                                onChange={(e) => setEditOriginalPrice(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-muted-foreground font-mono"
                                placeholder="Strike-through"
                              />
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/40 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editOfferActive}
                                onChange={(e) => setEditOfferActive(e.target.checked)}
                                className="rounded border-border text-gold-400 focus:ring-gold-400 h-3.5 w-3.5"
                              />
                              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5 text-gold-400" />
                                Activate Special Offer on this Account
                              </span>
                            </label>

                            {editOfferActive && (
                              <div>
                                <label className="text-[10px] text-muted-foreground font-semibold block mb-1">
                                  Offer Badge Label
                                </label>
                                <input
                                  type="text"
                                  value={editBadge}
                                  onChange={(e) => setEditBadge(e.target.value)}
                                  placeholder="e.g. 20% OFF, FLASH SALE"
                                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded-lg text-foreground font-medium"
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                                Profit Split (%)
                              </label>
                              <input
                                type="number"
                                min={50}
                                max={100}
                                value={editSplit}
                                onChange={(e) => setEditSplit(Number(e.target.value))}
                                className="w-full px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                                Leverage 1:X
                              </label>
                              <input
                                type="number"
                                min={10}
                                max={500}
                                value={editLeverage}
                                onChange={(e) => setEditLeverage(Number(e.target.value))}
                                className="w-full px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSave(c.id)}
                              className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5 font-bold"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}
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
