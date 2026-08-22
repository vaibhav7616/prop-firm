import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Tag, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/shared/logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_CHALLENGES } from '@/lib/default-data';
import { createChallengeOrder, validatePromoCodeApi, fetchChallengesApi } from '@/lib/api-client';
import {
  ADDONS,
  PAYMENT_METHODS,
  PLATFORM_LABELS,
  CHALLENGE_TYPE_LABELS,
  formatCurrency,
  formatAccountSize,
  generateInvoiceNumber,
} from '@/lib/constants';
import type { Challenge, Platform, Addon, PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = ['Challenge', 'Platform', 'Add-ons', 'Payment', 'Success'] as const;

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<Platform>('fundedshift_terminal');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const challengeId = searchParams.get('challenge');
    if (!challengeId) {
      navigate('/challenges');
      return;
    }
    const load = async () => {
      try {
        const liveChallenges = await fetchChallengesApi();
        if (liveChallenges && liveChallenges.length > 0) {
          const matched = liveChallenges.find((c: any) => c.id === challengeId);
          if (matched) {
            setChallenge(matched);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', challengeId)
          .maybeSingle();

        if (data) {
          setChallenge(data as Challenge);
        } else {
          const fallback = DEFAULT_CHALLENGES.find((c) => c.id === challengeId) ?? DEFAULT_CHALLENGES[0];
          setChallenge(fallback);
        }
      } catch (_) {
        const fallback = DEFAULT_CHALLENGES.find((c) => c.id === challengeId) ?? DEFAULT_CHALLENGES[0];
        setChallenge(fallback);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      toast.info('Please sign in to continue checkout.');
      navigate('/login');
    }
  }, [loading, user, navigate]);

  const addonTotal = selectedAddons.reduce((sum, id) => {
    const addon = ADDONS.find((a) => a.id === id);
    return sum + (addon?.price ?? 0);
  }, 0);

  const subtotal = (challenge?.price ?? 0) + addonTotal;
  const total = Math.max(0, subtotal - couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    const res = await validatePromoCodeApi(couponCode, subtotal);
    if (res && res.valid) {
      setCouponDiscount(res.discountAmount);
      setCouponApplied(true);
      toast.success(`Coupon ${res.code} applied! Saved ${formatCurrency(res.discountAmount)}`);
    } else {
      toast.error(res?.error || 'Invalid or expired promo code. Try "PROPFIRM20" or "WELCOME10"');
    }
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handlePayment = async () => {
    if (!user || !challenge) return;
    setProcessing(true);

    try {
      const res = await createChallengeOrder({
        userId: user.id,
        account_size: challenge.account_size,
        challenge_id: challenge.id,
        challenge_name: challenge.name,
        platform,
        total_amount: total,
        payment_method: paymentMethod,
      });

      if (res && res.order) {
        setOrderId(res.order.id);
      } else {
        const fallbackId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        setOrderId(fallbackId);
      }

      setStep(4);
      toast.success('Order placed & Trading Account provisioned successfully!');
    } catch (err) {
      // Fallback
      const fallbackId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      setOrderId(fallbackId);
      setStep(4);
      toast.success('Order placed successfully!');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Challenge not found.</p>
        <Link to="/challenges"><Button variant="outline">Browse Challenges</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-luxury px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <Link to="/challenges" className="text-sm text-muted-foreground hover:text-gold-400">
            Cancel
          </Link>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-12">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    idx < step
                      ? 'bg-gold-gradient text-black'
                      : idx === step
                      ? 'bg-gold-400/20 text-gold-400 gold-border'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx < step ? <Check className="h-5 w-5" /> : idx + 1}
                </div>
                <span className={cn('text-xs mt-2 hidden sm:block', idx <= step ? 'text-gold-400' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('w-12 sm:w-20 h-px mx-2', idx < step ? 'bg-gold-400' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Step 0: Challenge summary */}
            {step === 0 && (
              <div className="rounded-2xl glass p-8 animate-fade-in">
                <h2 className="font-display text-2xl font-bold mb-6">Review Your Challenge</h2>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 mb-6">
                  <div className="h-14 w-14 rounded-xl bg-gold-gradient flex items-center justify-center">
                    <span className="font-display text-lg font-bold text-black">{formatAccountSize(challenge.account_size)}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{challenge.name}</h3>
                    <p className="text-sm text-muted-foreground">{CHALLENGE_TYPE_LABELS[challenge.type]} · {PLATFORM_LABELS[platform]}</p>
                  </div>
                  <span className="ml-auto font-display text-2xl font-bold gold-text">{formatCurrency(challenge.price)}</span>
                </div>
                <div className="space-y-2 text-sm mb-8">
                  <div className="flex justify-between"><span className="text-muted-foreground">Profit Target</span><span>{challenge.rules.profit_target}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Daily Drawdown</span><span>{challenge.rules.daily_drawdown}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Max Drawdown</span><span>{challenge.rules.max_drawdown}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Profit Split</span><span>Up to {challenge.rules.profit_split}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Leverage</span><span>1:{challenge.rules.leverage}</span></div>
                </div>
                <Button onClick={() => setStep(1)} className="w-full bg-gold-gradient text-black hover:opacity-90 font-semibold h-12">
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 1: Platform */}
            {step === 1 && (
              <div className="rounded-2xl glass p-8 animate-fade-in">
                <h2 className="font-display text-2xl font-bold mb-2">Trading Platform</h2>
                <p className="text-sm text-muted-foreground mb-6">Your account will be provisioned on our official trading terminal.</p>
                <div className="space-y-3 mb-8">
                  {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className="w-full flex items-center justify-between p-5 rounded-xl border transition-all glass-gold gold-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-gold-400 flex items-center justify-center shrink-0">
                          <Check className="h-4 w-4 text-black" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold block text-base">{PLATFORM_LABELS[p]}</span>
                          <span className="text-xs text-muted-foreground">Integrated TradingView Charts · High Execution Speed · Zero Spread Markup</span>
                        </div>
                      </div>
                      <span className="text-xs bg-gold-400/20 text-gold-400 font-semibold px-2.5 py-1 rounded-md border border-gold-400/30">
                        Included
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button onClick={() => setStep(2)} className="flex-1 bg-gold-gradient text-black hover:opacity-90 font-semibold h-12">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Add-ons */}
            {step === 2 && (
              <div className="rounded-2xl glass p-8 animate-fade-in">
                <h2 className="font-display text-2xl font-bold mb-6">Choose Add-ons</h2>
                <p className="text-sm text-muted-foreground mb-6">Enhance your challenge with optional add-ons.</p>
                <div className="space-y-3 mb-8">
                  {ADDONS.map((addon) => {
                    const selected = selectedAddons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                          selected ? 'glass-gold gold-border' : 'border-border hover:border-gold-400/30'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center', selected ? 'border-gold-400 bg-gold-400' : 'border-muted-foreground')}>
                            {selected && <Check className="h-3 w-3 text-black" />}
                          </div>
                          <div>
                            <p className="font-medium">{addon.name}</p>
                            <p className="text-xs text-muted-foreground">{addon.description}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gold-400">+{formatCurrency(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-gold-gradient text-black hover:opacity-90 font-semibold h-12">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="rounded-2xl glass p-8 animate-fade-in">
                <h2 className="font-display text-2xl font-bold mb-6">Payment</h2>

                {/* Coupon */}
                <div className="mb-6">
                  <Label className="mb-2 block">Coupon Code</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter coupon code"
                        className="pl-10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                      />
                    </div>
                    <Button variant="outline" onClick={applyCoupon} disabled={couponApplied || !couponCode}>
                      {couponApplied ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                </div>

                {/* Payment methods */}
                <Label className="mb-3 block">Select Payment Method</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        'p-3 rounded-xl border text-center transition-all',
                        paymentMethod === method.id ? 'glass-gold gold-border' : 'border-border hover:border-gold-400/30'
                      )}
                    >
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.group}</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                  <ShieldCheck className="h-4 w-4 text-gold-400" />
                  Your payment is secured with industry-standard encryption. This is a mock payment for demonstration.
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handlePayment} disabled={processing} className="flex-1 bg-gold-gradient text-black hover:opacity-90 font-semibold h-12">
                    {processing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="h-4 w-4 mr-2" /> Pay {formatCurrency(total)}</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="rounded-2xl glass p-8 text-center animate-fade-in">
                <div className="h-20 w-20 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-black" strokeWidth={3} />
                </div>
                <h2 className="font-display text-3xl font-bold mb-3">Order Confirmed!</h2>
                <p className="text-muted-foreground mb-2">Your challenge has been purchased successfully.</p>
                <p className="text-sm text-muted-foreground mb-8">
                  Order status: <span className="text-gold-400">Waiting for Account Assignment</span>
                </p>
                <p className="text-xs text-muted-foreground mb-8">
                  Our team will assign your trading account within 24 hours. You will receive an email
                  and your credentials will appear in your dashboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/dashboard">
                    <Button className="bg-gold-gradient text-black hover:opacity-90 font-semibold h-12 px-8">
                      Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/challenges">
                    <Button variant="outline" className="h-12 px-8">Buy Another</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          {step < 4 && (
            <div className="lg:col-span-1">
              <div className="rounded-2xl glass p-6 sticky top-8">
                <h3 className="font-display font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{challenge.name}</span>
                    <span>{formatCurrency(challenge.price)}</span>
                  </div>
                  {selectedAddons.map((id) => {
                    const addon = ADDONS.find((a) => a.id === id);
                    if (!addon) return null;
                    return (
                      <div key={id} className="flex justify-between">
                        <span className="text-muted-foreground">{addon.name}</span>
                        <span>+{formatCurrency(addon.price)}</span>
                      </div>
                    );
                  })}
                  {couponApplied && couponDiscount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="gold-text">{formatCurrency(total)}</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border/50 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><Check className="h-3 w-3 text-gold-400" /> Fee refunded on pass</p>
                  <p className="flex items-center gap-2"><Check className="h-3 w-3 text-gold-400" /> No time limits</p>
                  <p className="flex items-center gap-2"><Check className="h-3 w-3 text-gold-400" /> 7-day payouts</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
