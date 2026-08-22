import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Check,
  Zap,
  Sliders,
  Award,
} from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { formatCurrency } from '@/lib/utils';

const ACCOUNT_SIZES = [
  { value: 5000, label: '$5,000' },
  { value: 10000, label: '$10,000' },
  { value: 25000, label: '$25,000' },
  { value: 50000, label: '$50,000' },
  { value: 100000, label: '$100,000' },
  { value: 200000, label: '$200,000' },
  { value: 400000, label: '$400,000' },
];

const EVAL_STEPS = [
  { id: 'one_step', name: '1-Step Evaluation', profitTarget: '8%', basePriceMult: 0.8 },
  { id: 'two_step', name: '2-Step Evaluation', profitTarget: '8% / 5%', basePriceMult: 1.0 },
  { id: 'instant', name: 'Instant Funding', profitTarget: 'Direct', basePriceMult: 2.2 },
];

const PLATFORMS = ['FundedShift Web Terminal'];

export function PayoutCalculator() {
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [evalStep, setEvalStep] = useState<string>('two_step');
  const [monthlyReturn, setMonthlyReturn] = useState<number>(8); // % gain
  const [profitSplit, setProfitSplit] = useState<number>(85); // %
  const [selectedPlatform, setSelectedPlatform] = useState<string>('FundedShift Web Terminal');
  const [addons, setAddons] = useState<{ [key: string]: boolean }>({
    split90: true,
    doubleLeverage: false,
    expressPayout: true,
  });

  // Calculate base price
  const sizePrices: { [key: number]: number } = {
    5000: 29,
    10000: 49,
    25000: 119,
    50000: 199,
    100000: 349,
    200000: 649,
    400000: 1299,
  };

  const currentStepObj = EVAL_STEPS.find((s) => s.id === evalStep) || EVAL_STEPS[1];
  const rawPrice = Math.round((sizePrices[accountSize] || 499) * currentStepObj.basePriceMult);

  // Addon price multipliers
  let priceAddonMultiplier = 1;
  if (addons.split90) priceAddonMultiplier += 0.15;
  if (addons.doubleLeverage) priceAddonMultiplier += 0.1;
  if (addons.expressPayout) priceAddonMultiplier += 0.1;

  const finalChallengePrice = Math.round(rawPrice * priceAddonMultiplier);

  // Profit calculation
  const totalMonthlyGainDollars = accountSize * (monthlyReturn / 100);
  const activeSplit = addons.split90 ? 90 : profitSplit;
  const traderProfitPayout = totalMonthlyGainDollars * (activeSplit / 100);
  const firmShare = totalMonthlyGainDollars - traderProfitPayout;
  const scaledCapitalIn3Months = accountSize * 1.25 * 1.25; // 25% scale twice

  const toggleAddon = (key: string) => {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="section-pad bg-secondary/30 border-y border-border relative overflow-hidden">
      {/* Subtle glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-page relative">
        <SectionHeading
          badge="Interactive Estimator"
          title="Custom Challenge & Payout Simulator"
          subtitle="Customize your evaluation parameters, select your preferred platform, and project your monthly payouts."
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configurator Controls (7 Cols) */}
          <div className="lg:col-span-7 card-elevated p-6 sm:p-8 space-y-7">
            {/* 1. Account Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-brand-600" />
                  1. Select Account Size
                </label>
                <span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                  {formatCurrency(accountSize)} Capital
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {ACCOUNT_SIZES.map((size) => {
                  const active = accountSize === size.value;
                  return (
                    <button
                      key={size.value}
                      onClick={() => setAccountSize(size.value)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        active
                          ? 'bg-brand-600 text-white shadow-soft-sm scale-[1.02]'
                          : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Evaluation Step Model */}
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-brand-600" />
                2. Choose Evaluation Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EVAL_STEPS.map((step) => {
                  const active = evalStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setEvalStep(step.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        active
                          ? 'border-brand-500 bg-brand-50/70 shadow-soft-sm'
                          : 'border-border bg-card hover:border-brand-200'
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{step.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Target: <span className="font-semibold text-foreground">{step.profitTarget}</span>
                      </p>
                      {active && (
                        <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Platform */}
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-brand-600" />
                3. Trading Platform
              </label>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('FundedShift Web Terminal')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all border-brand-500 bg-brand-600 text-white shadow-soft-sm flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-white" />
                    FundedShift Web Terminal
                  </span>
                  <span className="text-[10px] font-normal bg-white/20 px-2 py-0.5 rounded text-white">
                    Proprietary Trading Engine
                  </span>
                </button>
              </div>
            </div>

            {/* 4. Estimated Monthly Return % Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600" />
                  4. Projected Monthly Return
                </label>
                <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {monthlyReturn}% / month ({formatCurrency(totalMonthlyGainDollars)})
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={25}
                step={1}
                value={monthlyReturn}
                onChange={(e) => setMonthlyReturn(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer h-2 bg-secondary rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>3% (Conservative)</span>
                <span>8% (Target)</span>
                <span>15% (Aggressive)</span>
                <span>25% (Pro)</span>
              </div>
            </div>

            {/* 5. Custom Add-ons */}
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Sliders className="h-4 w-4 text-brand-600" />
                5. Customize Add-ons
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleAddon('split90')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    addons.split90 ? 'border-brand-500 bg-brand-50/60' : 'border-border bg-card'
                  }`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${addons.split90 ? 'bg-brand-600 border-brand-600 text-white' : 'border-muted-foreground'}`}>
                    {addons.split90 && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">90% Profit Split</p>
                    <p className="text-[10px] text-muted-foreground">+15% fee</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAddon('doubleLeverage')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    addons.doubleLeverage ? 'border-brand-500 bg-brand-50/60' : 'border-border bg-card'
                  }`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${addons.doubleLeverage ? 'bg-brand-600 border-brand-600 text-white' : 'border-muted-foreground'}`}>
                    {addons.doubleLeverage && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Double Leverage</p>
                    <p className="text-[10px] text-muted-foreground">+10% fee</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAddon('expressPayout')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    addons.expressPayout ? 'border-brand-500 bg-brand-50/60' : 'border-border bg-card'
                  }`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${addons.expressPayout ? 'bg-brand-600 border-brand-600 text-white' : 'border-muted-foreground'}`}>
                    {addons.expressPayout && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">24h Express Payouts</p>
                    <p className="text-[10px] text-muted-foreground">+10% fee</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-brand-800 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white p-7 shadow-soft-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-5 border-b border-brand-800/80">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span className="font-display font-semibold text-sm tracking-wide text-brand-100">
                    Projected Return Summary
                  </span>
                </div>
                <span className="badge-brand bg-brand-800 text-brand-200 border-brand-700 text-[10px]">
                  {selectedPlatform} · {activeSplit}% Split
                </span>
              </div>

              {/* Major Profit Metric */}
              <div className="py-6 text-center border-b border-brand-800/80">
                <p className="text-xs font-medium text-brand-300 uppercase tracking-wider">
                  Your Projected Monthly Payout
                </p>
                <motion.p
                  key={traderProfitPayout}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display font-extrabold text-4xl sm:text-5xl text-emerald-400 mt-2 font-mono tracking-tight"
                >
                  {formatCurrency(traderProfitPayout)}
                </motion.p>
                <p className="text-[11px] text-brand-300/80 mt-1">
                  Based on a {monthlyReturn}% gain on {formatCurrency(accountSize)} capital
                </p>
              </div>

              {/* Sub Metrics Grid */}
              <div className="py-5 space-y-3.5 text-xs border-b border-brand-800/80">
                <div className="flex justify-between items-center text-brand-200">
                  <span className="flex items-center gap-1.5 text-brand-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-400" /> Fee Refund on 1st Payout
                  </span>
                  <span className="font-bold font-mono text-white">+{formatCurrency(finalChallengePrice)} (100%)</span>
                </div>

                <div className="flex justify-between items-center text-brand-200">
                  <span className="flex items-center gap-1.5 text-brand-300">
                    <TrendingUp className="h-3.5 w-3.5 text-brand-400" /> Scaled Capital in 3 Months
                  </span>
                  <span className="font-bold font-mono text-emerald-300">{formatCurrency(scaledCapitalIn3Months)}</span>
                </div>

                <div className="flex justify-between items-center text-brand-200">
                  <span className="flex items-center gap-1.5 text-brand-300">
                    <Check className="h-3.5 w-3.5 text-brand-400" /> Evaluation Target
                  </span>
                  <span className="font-medium text-white">{currentStepObj.profitTarget}</span>
                </div>
              </div>

              {/* Pricing & Checkout */}
              <div className="pt-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[11px] text-brand-300 uppercase font-medium">One-Time Fee</p>
                    <p className="text-2xl font-extrabold font-mono text-white mt-0.5">
                      {formatCurrency(finalChallengePrice)}
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                    Refundable Registration
                  </span>
                </div>

                <Link to={`/checkout?account_size=${accountSize}&type=${evalStep}&platform=${selectedPlatform.toLowerCase()}`}>
                  <button className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-brand-950 font-bold text-sm shadow-soft-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2">
                    Start {formatCurrency(accountSize)} Challenge
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>

                <div className="flex items-center justify-center gap-4 text-[11px] text-brand-300/80 pt-1">
                  <span>✓ Instant Credentials</span>
                  <span>•</span>
                  <span>✓ Raw Spreads</span>
                  <span>•</span>
                  <span>✓ No Inactivity Fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
