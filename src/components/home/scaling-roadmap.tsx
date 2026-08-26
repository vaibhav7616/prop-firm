import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ShieldCheck, Zap, DollarSign, Award, ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { formatCurrency } from '@/lib/utils';

interface ScalingLevel {
  stage: number;
  months: string;
  capital: number;
  profitSplit: string;
  drawdown: string;
  payoutCycle: string;
  badge?: string;
}

const SCALING_STAGES: ScalingLevel[] = [
  { stage: 1, months: 'Initial', capital: 100000, profitSplit: '80%', drawdown: '10%', payoutCycle: '14 Days' },
  { stage: 2, months: '3 Months', capital: 125000, profitSplit: '85%', drawdown: '11%', payoutCycle: '14 Days', badge: '+25% Capital' },
  { stage: 3, months: '6 Months', capital: 156250, profitSplit: '85%', drawdown: '12%', payoutCycle: '7 Days', badge: '+25% Capital' },
  { stage: 4, months: '9 Months', capital: 200000, profitSplit: '90%', drawdown: '12%', payoutCycle: 'On-Demand', badge: '+25% Capital' },
  { stage: 5, months: '12 Months', capital: 400000, profitSplit: '90%', drawdown: '14%', payoutCycle: 'On-Demand', badge: 'Double Capital' },
  { stage: 6, months: '18 Months', capital: 1000000, profitSplit: '95%', drawdown: '15%', payoutCycle: 'Instant 24h', badge: 'VIP Trader' },
  { stage: 7, months: '24 Months', capital: 4000000, profitSplit: '95%', drawdown: '15%', payoutCycle: 'Instant 24h', badge: 'Institutional Max' },
];

export function ScalingRoadmap() {
  const [activeStage, setActiveStage] = useState<number>(3);

  const activeLevel = SCALING_STAGES.find((s) => s.stage === activeStage) || SCALING_STAGES[2];

  return (
    <section className="section-pad bg-card border-b border-border relative overflow-hidden">
      <div className="container-page">
        <SectionHeading
          badge="FundedShift Scale Plan"
          title="Scale Your Trading Capital Up to $4,000,000"
          subtitle="Consistently profitable traders get rewarded with 25% account increases every 3 months, up to 95% profit splits, and institutional leverage."
        />

        {/* Timeline Stage Buttons */}
        <div className="mt-12 overflow-x-auto pb-4">
          <div className="flex items-center gap-3 min-w-[720px] justify-between">
            {SCALING_STAGES.map((s, idx) => {
              const active = activeStage === s.stage;
              return (
                <button
                  key={s.stage}
                  onClick={() => setActiveStage(s.stage)}
                  className={`flex-1 p-4 rounded-2xl border text-left transition-all relative ${
                    active
                      ? 'border-brand-500 bg-brand-50/80 shadow-soft-md scale-[1.03] z-10'
                      : 'border-border bg-card hover:border-brand-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {s.months}
                    </span>
                    {s.badge && (
                      <span className="text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-display font-bold text-base sm:text-lg text-foreground">
                    {formatCurrency(s.capital)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {s.profitSplit} Split
                  </p>
                  {idx < SCALING_STAGES.length - 1 && (
                    <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 h-px w-3 bg-border z-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail Card */}
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 card-elevated p-6 sm:p-8 border-2 border-brand-500/20 bg-gradient-to-br from-card via-brand-50/20 to-card"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="badge-brand text-xs">Stage {activeLevel.stage} Scale</span>
                <span className="text-xs text-muted-foreground">• {activeLevel.months} Timeline</span>
              </div>

              <h3 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
                Managed Capital: <span className="text-brand-600">{formatCurrency(activeLevel.capital)}</span>
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Reach a cumulative return of 10% across 3 consecutive months to automatically scale your funded account. No complicated applications or re-evaluations required.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] text-muted-foreground">Profit Split</p>
                  <p className="font-display font-bold text-lg text-brand-600">{activeLevel.profitSplit}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] text-muted-foreground">Max Drawdown</p>
                  <p className="font-display font-bold text-lg text-foreground">{activeLevel.drawdown}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] text-muted-foreground">Payout Frequency</p>
                  <p className="font-display font-bold text-lg text-emerald-600">{activeLevel.payoutCycle}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] text-muted-foreground">Account Status</p>
                  <p className="font-display font-bold text-lg text-foreground">Funded</p>
                </div>
              </div>
            </div>

            {/* Visual Capital Progress Bar */}
            <div className="lg:col-span-5 rounded-2xl border border-border bg-secondary/30 p-6 space-y-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Scaling Progress</span>
                <span className="text-brand-600 font-bold">{Math.round((activeLevel.capital / 4000000) * 100)}% of Max $4M</span>
              </div>

              <div className="h-4 rounded-full bg-secondary overflow-hidden border border-border p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(5, Math.min(100, (activeLevel.capital / 4000000) * 100))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 shadow-sm"
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                <span>$100,000</span>
                <span>$1,000,000</span>
                <span className="font-bold text-foreground">$4,000,000</span>
              </div>

              <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  100% Fee Refunded
                </span>
                <span className="flex items-center gap-1 text-brand-600 font-semibold cursor-pointer hover:underline">
                  View Scaling Terms <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
