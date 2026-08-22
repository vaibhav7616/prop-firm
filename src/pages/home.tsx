import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Star,
  ShieldCheck,
  Clock,
  TrendingUp,
  Users,
  Globe,
  DollarSign,
  Headphones,
  Scale,
  BarChart3,
  Trophy,
  Zap,
  Wallet,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading } from '@/components/shared/section-heading';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { LivePayoutTicker } from '@/components/home/payout-ticker';
import { PayoutCalculator } from '@/components/home/payout-calculator';
import { ScalingRoadmap } from '@/components/home/scaling-roadmap';
import { InstrumentsPreview } from '@/components/home/instruments-preview';
import { CertificateModal } from '@/components/home/certificate-modal';

/* ---------- Hero Dashboard Preview ---------- */
function HeroDashboard() {
  const stats = [
    { label: 'Balance', value: '$104,250.00', sub: 'Starting: $100,000' },
    { label: 'Equity', value: '$104,890.50', sub: 'Real-time' },
    { label: "Today's P/L", value: '+$2,890.50', sub: '+2.89%', positive: true },
  ];

  const objectives = [
    { label: 'Profit Target', current: '$4,250', target: '$8,000', pct: 53 },
    { label: 'Daily Drawdown', current: '0.8%', target: '5%', pct: 16 },
    { label: 'Overall Drawdown', current: '1.2%', target: '10%', pct: 12 },
  ];

  const chartData = [20, 35, 28, 45, 38, 52, 48, 62, 58, 71, 65, 78, 82];
  const chartMax = Math.max(...chartData);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Floating card behind */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 w-full h-full rounded-2xl border border-border bg-secondary/40 -z-10 hidden sm:block"
      />
      <div className="absolute -bottom-4 -left-4 w-3/4 h-3/4 rounded-2xl border border-border bg-secondary/30 -z-10 hidden sm:block" />

      <div className="rounded-2xl border border-border bg-card shadow-float overflow-hidden">
        {/* Dashboard header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/30" />
            </div>
            <span className="text-xs font-medium text-muted-foreground ml-2">Trading Dashboard</span>
          </div>
          <span className="badge-brand text-[10px] py-0.5 px-2">Phase 1 · Active</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Account stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {stats.map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl border border-border bg-secondary/20 p-2.5 sm:p-3"
              >
                <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                <p className={cn('font-display font-bold text-xs sm:text-sm mt-1 truncate', s.positive && 'text-success')}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Performance</span>
              <span className="text-[10px] text-success font-medium flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                +4.25%
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {chartData.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / chartMax) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-100 to-brand-500 hover:brightness-110 transition-all"
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {['M', 'T', 'W', 'T', 'F', 'M', 'T', 'W', 'T', 'F', 'M', 'T', 'W'].map((d, i) => (
                <span key={i} className="text-[9px] text-muted-foreground">{d}</span>
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-foreground">Trading Objectives</span>
            {objectives.map((obj) => (
              <div key={obj.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{obj.label}</span>
                  <span className="text-[11px] font-medium text-foreground">{obj.current} / {obj.target}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${obj.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', obj.pct < 60 ? 'bg-brand-500' : obj.pct < 90 ? 'bg-success' : 'bg-warning')}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Trading calendar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Trading Calendar</span>
              <span className="text-[10px] text-muted-foreground">12 days</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 21 }).map((_, i) => {
                const active = i >= 3 && i <= 14;
                const today = i === 14;
                return (
                  <div
                    key={i}
                    className={cn(
                      'h-5 rounded text-[8px] flex items-center justify-center transition-all',
                      today
                        ? 'bg-brand-600 text-white font-bold shadow-sm'
                        : active
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-secondary text-muted-foreground/40'
                    )}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Section Data ---------- */
const TRUST_STATS = [
  { icon: Globe, value: '10+', label: 'Countries' },
  { icon: DollarSign, value: '$12M+', label: 'Payouts' },
  { icon: Zap, value: '< 2 Hrs', label: 'Avg Payout Speed' },
  { icon: Users, value: '50K+', label: 'Active Traders' },
  { icon: Star, value: '4.9/5', label: 'Trustpilot Rating' },
  { icon: Clock, value: '1.5 Years', label: 'In Business' },
];

const PROGRAMS = [
  {
    name: 'One Step',
    price: '$29',
    tagline: 'Single evaluation. Fastest path to funding.',
    features: ['8% profit target', '5% daily drawdown', '10% max drawdown', 'No time limit', 'Up to 90% profit split', 'Scaling plan included'],
    highlight: false,
  },
  {
    name: 'Two Step',
    price: '$24',
    tagline: 'Two-phase evaluation. Prove consistency.',
    features: ['8% then 5% target', '5% daily drawdown', '10% max drawdown', '3 min trading days', 'Up to 90% profit split', 'Scaling plan included'],
    highlight: true,
  },
  {
    name: 'Instant Funding',
    price: '$75',
    tagline: 'Skip evaluation. Start trading immediately.',
    features: ['No evaluation needed', '5% daily drawdown', '10% max drawdown', '7 min trading days', '70% profit split', 'Weekend holding allowed'],
    highlight: false,
  },
];

const STEPS = [
  { num: '01', title: 'Choose Challenge', desc: 'Select your account type, size, and platform.', icon: Target },
  { num: '02', title: 'Trade', desc: 'Receive your credentials and start trading.', icon: BarChart3 },
  { num: '03', title: 'Pass Evaluation', desc: 'Hit the profit target while respecting risk rules.', icon: ShieldCheck },
  { num: '04', title: 'Get Funded', desc: 'Receive a funded account and withdraw your profits.', icon: Trophy },
];

const WHY = [
  { icon: Zap, title: 'Fast Payouts', desc: 'Get paid within 7 days of your request. No waiting periods.' },
  { icon: ShieldCheck, title: 'Institutional Conditions', desc: 'Tight spreads, deep liquidity, and professional execution.' },
  { icon: Headphones, title: 'Professional Support', desc: '24/7 expert support team that understands trading.' },
  { icon: Scale, title: 'Fair Rules', desc: 'Transparent rules with no hidden traps. We want you to pass.' },
  { icon: TrendingUp, title: 'Scaling Plan', desc: 'Grow your account up to $2M with consistent performance.' },
  { icon: DollarSign, title: '90% Profit Split', desc: 'Keep the majority of your profits. The best split in the industry.' },
];

const COMPARISON = [
  { feature: 'Profit Target', one: '8%', two: '8% / 5%', instant: 'None' },
  { feature: 'Daily Drawdown', one: '5%', two: '5%', instant: '5%' },
  { feature: 'Max Drawdown', one: '10%', two: '10%', instant: '10%' },
  { feature: 'Min Trading Days', one: '0', two: '3', instant: '0' },
  { feature: 'Time Limit', one: 'None', two: 'None', instant: 'None' },
  { feature: 'Profit Split', one: 'Up to 90%', two: 'Up to 90%', instant: '50%' },
  { feature: 'Scaling Plan', one: 'Yes', two: 'Yes', instant: 'No' },
  { feature: 'Fee Refund', one: 'Yes', two: 'Yes', instant: 'No' },
];

const RULES_ACCORDION = [
  { rule: 'Profit Target', desc: 'The percentage of profit needed to pass the evaluation. One Step requires 8%, Two Step requires 8% in Phase 1 and 5% in Phase 2.' },
  { rule: 'Daily Drawdown', desc: 'Maximum loss allowed in a single trading day, calculated as 5% of your account balance. Exceeding this results in a breach.' },
  { rule: 'Maximum Drawdown', desc: 'The total maximum loss from your starting balance, set at 10%. This is a hard limit that cannot be exceeded at any point.' },
  { rule: 'Minimum Trading Days', desc: 'Some challenge types require a minimum number of active trading days before you can pass. One Step has no minimum.' },
  { rule: 'Consistency Rule', desc: 'No single trading day should account for more than 40% of your total profit, ensuring consistent trading behavior.' },
  { rule: 'News Trading', desc: 'One Step and Instant Funding allow trading during high-impact news. Two Step restricts it to encourage disciplined trading.' },
];

const TESTIMONIALS = [
  { name: 'James Carter', role: 'Funded Trader', location: 'United Kingdom', text: 'Funded Shift gave me the opportunity I needed. The process was smooth, the rules are fair, and I received my first payout in just 5 days.', rating: 5 },
  { name: 'Priya Sharma', role: 'Forex Trader', location: 'India', text: 'The instant funding option is a game changer. I skipped the evaluation and started trading real capital immediately.', rating: 5 },
  { name: 'Marcus Weber', role: 'Swing Trader', location: 'Germany', text: 'I failed my first challenge but the support team helped me understand where I went wrong. Passed on my second attempt.', rating: 5 },
];

const FAQS = [
  { q: 'What is a prop firm?', a: 'A proprietary trading firm provides traders with capital to trade. You prove your skill through an evaluation, and if you pass, you receive a funded account and keep a share of the profits.' },
  { q: 'How long do I have to pass the challenge?', a: 'There is no time limit. You can take as long as you need to pass your evaluation phases. Trade at your own pace without pressure.' },
  { q: 'When do I get paid?', a: 'We process payouts within 7 days of your request. Your first payout can be requested as soon as you are funded and meet the minimum trading requirements.' },
  { q: 'What platforms can I trade on?', a: 'All accounts trade exclusively on our high-performance FundedShift Web Terminal with integrated TradingView charts, one-click execution, and zero spread markup.' },
  { q: 'Is the challenge fee refunded?', a: 'Yes. When you pass your challenge and receive your first payout, your challenge fee is refunded in full.' },
  { q: 'What is the maximum account size?', a: 'We offer accounts from $5K to $200K. With our scaling plan, you can grow your funded account up to $2M over time.' },
];

/* ---------- Home Page ---------- */
export function HomePage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative pt-32 lg:pt-36 pb-20 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="badge-brand mb-6 inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trusted by 50,000+ traders worldwide
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] text-balance">
                Trade With Confidence.
                <br />
                <span className="text-brand-gradient">Get Funded By Professionals.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Prove your trading skill through our evaluation, get funded with up to $200K of institutional capital,
                and keep up to 90% of your profits. No time limits. No hidden rules.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link to="/challenges">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary text-base h-13 px-8 py-3.5"
                  >
                    Start Your Challenge
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                <Link to="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-secondary text-base h-13 px-8 py-3.5"
                  >
                    View Pricing
                  </motion.button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-500" /> No time limits</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-500" /> 7-day payouts</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-500" /> Fee refunded</span>
              </div>
            </motion.div>
            {/* Right - Dashboard preview */}
            <div>
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE PAYOUT TICKER ===== */}
      <LivePayoutTicker />

      {/* ===== SECTION 2: Trust Stats ===== */}
      <section className="border-y border-border bg-card">
        <div className="container-page py-14">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {TRUST_STATS.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="text-center"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 mb-3 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: Funding Programs ===== */}
      <section className="section-pad">
        <div className="container-page">
          <SectionHeading
            eyebrow="Funding Programs"
            title="Choose Your Path to Funding"
            subtitle="Three evaluation models designed for different trading styles. All with transparent rules and no time pressure."
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROGRAMS.map((program, idx) => (
              <motion.div
                key={program.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className={cn(
                  'card-elevated p-7 flex flex-col',
                  program.highlight && 'ring-2 ring-brand-500 shadow-soft-lg'
                )}
              >
                {program.highlight && (
                  <div className="mb-4">
                    <span className="badge-brand">Most Popular</span>
                  </div>
                )}
                <h3 className="font-display text-xl font-bold">{program.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{program.tagline}</p>
                <p className="font-display text-3xl font-bold mb-6">
                  {program.price}
                  <span className="text-sm font-normal text-muted-foreground"> / starting</span>
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {program.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-brand-600" />
                      </div>
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/challenges${program.highlight ? '?type=two_step' : `?type=${program.name.toLowerCase().replace(' ', '_')}`}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn('w-full', program.highlight ? 'btn-primary' : 'btn-secondary')}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INTERACTIVE PAYOUT & CHALLENGE CALCULATOR ===== */}
      <PayoutCalculator />

      {/* ===== SECTION 4: How It Works ===== */}
      <section className="section-pad bg-secondary/30 border-y border-border">
        <div className="container-page">
          <SectionHeading
            eyebrow="How It Works"
            title="From Evaluation to Funding"
            subtitle="A clear, straightforward process. Four steps between you and institutional capital."
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="relative card-elevated p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft-md">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-display text-2xl font-bold text-brand-100">{step.num}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 h-px w-6 bg-border" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FUNDED SHIFT SCALE CAPITAL ROADMAP ===== */}
      <ScalingRoadmap />

      {/* ===== SECTION 5: Why Funded Shift ===== */}
      <section className="section-pad">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why Funded Shift"
            title="Built for Serious Traders"
            subtitle="We remove the barriers between you and institutional capital so you can focus on what matters."
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="card-elevated p-6"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 mb-4 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== RAW SPREADS & INSTRUMENTS PREVIEW ===== */}
      <InstrumentsPreview />

      {/* ===== SECTION 6: Dashboard Preview ===== */}
      <section className="section-pad bg-secondary/30 border-y border-border">
        <div className="container-page">
          <SectionHeading
            eyebrow="Trading Dashboard"
            title="Professional Tools, Real Data"
            subtitle="Track your performance with institutional-grade analytics. Every metric you need, in one place."
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-14 rounded-2xl border border-border bg-card shadow-float overflow-hidden"
          >
            <DashboardPreviewLarge />
          </motion.div>
        </div>
      </section>

      {/* ===== SECTION 7: Comparison Table ===== */}
      <section className="section-pad">
        <div className="container-page">
          <SectionHeading
            eyebrow="Compare"
            title="Challenge Comparison"
            subtitle="Find the right evaluation model for your trading style."
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 overflow-x-auto"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Feature</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-brand-700">One Step</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-brand-700">Two Step</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-brand-700">Instant</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, idx) => (
                  <tr key={row.feature} className={cn('border-b border-border/60 transition-colors hover:bg-brand-50/30', idx % 2 === 0 && 'bg-secondary/20')}>
                    <td className="py-3.5 px-4 text-sm font-medium">{row.feature}</td>
                    <td className="py-3.5 px-4 text-sm text-center text-muted-foreground">{row.one}</td>
                    <td className="py-3.5 px-4 text-sm text-center text-muted-foreground">{row.two}</td>
                    <td className="py-3.5 px-4 text-sm text-center text-muted-foreground">{row.instant}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ===== SECTION 8: Trading Rules ===== */}
      <section className="section-pad bg-secondary/30 border-y border-border">
        <div className="container-page max-w-3xl">
          <SectionHeading
            eyebrow="Trading Rules"
            title="Clear, Fair, Transparent"
            subtitle="Simple rules that give you the best chance to succeed. No hidden traps, no fine print."
          />
          <div className="mt-12">
            <Accordion type="single" collapsible className="space-y-3">
              {RULES_ACCORDION.map((item) => (
                <AccordionItem key={item.rule} value={item.rule} className="card-elevated px-5 data-[state=open]:shadow-soft-md">
                  <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                    {item.rule}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {item.desc}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== CERTIFICATE VERIFICATION MODAL & HALL OF FAME ===== */}
      <CertificateModal />

      {/* ===== SECTION 9: Testimonials ===== */}
      <section className="section-pad">
        <div className="container-page">
          <SectionHeading
            eyebrow="Success Stories"
            title="What Our Traders Say"
            subtitle="Real traders, real results. Join thousands who have unlocked funded capital."
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="card-elevated p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-400 text-brand-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: FAQ ===== */}
      <section className="section-pad bg-secondary/30 border-y border-border">
        <div className="container-page max-w-3xl">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know before getting started."
          />
          <div className="mt-12">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q} className="card-elevated px-5 data-[state=open]:shadow-soft-md">
                  <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad">
        <div className="container-page">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-border bg-gradient-to-br from-brand-600 to-brand-800 p-12 lg:p-16 text-center overflow-hidden shadow-soft-2xl"
          >
            <div className="absolute inset-0 bg-dot-pattern opacity-10" />
            <div className="relative">
              <Target className="h-10 w-10 text-white/80 mx-auto mb-6" />
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                Ready to Get Funded?
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                Join 50,000+ traders who chose Funded Shift. Start your challenge today and trade with real capital.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/challenges">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-soft-md transition-all hover:bg-white/95 hover:shadow-soft-lg active:scale-[0.98]"
                  >
                    Get Started Now
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98]"
                  >
                    Create Account
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Large Dashboard Preview (Section 6) ---------- */
function DashboardPreviewLarge() {
  const [activeTab, setActiveTab] = useState('performance');

  const orders = [
    { pair: 'EUR/USD', type: 'Buy', size: '2.5', entry: '1.0845', pnl: '+$1,250.00', positive: true },
    { pair: 'GBP/USD', type: 'Sell', size: '1.0', entry: '1.2732', pnl: '+$680.50', positive: true },
    { pair: 'XAU/USD', type: 'Buy', size: '0.5', entry: '2,034.50', pnl: '-$210.00', positive: false },
    { pair: 'USD/JPY', type: 'Sell', size: '3.0', entry: '149.85', pnl: '+$940.00', positive: true },
  ];

  const metrics = [
    { label: 'Win Rate', value: '68%', sub: '42 wins / 62 trades' },
    { label: 'Profit Factor', value: '2.4', sub: 'Above average' },
    { label: 'Avg Win', value: '+$890', sub: 'Per trade' },
    { label: 'Avg Loss', value: '-$340', sub: 'Per trade' },
  ];

  const chartData = [30, 45, 38, 55, 48, 62, 58, 72, 68, 81, 75, 88, 82, 95];
  const chartMax = Math.max(...chartData);

  const tabs = [
    { id: 'performance', label: 'Performance' },
    { id: 'orders', label: 'Orders' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Account #FS-100425</p>
            <p className="text-xs text-muted-foreground">Two Step · $100,000 · Phase 1</p>
          </div>
        </div>
        <span className="badge-brand">Active</span>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-brand-700'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="dashTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-border bg-secondary/20 p-4">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-display text-xl font-bold mt-1">{m.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold">Profit Growth</p>
                    <p className="text-xs text-muted-foreground">Last 14 trading days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">+$4,250.00</p>
                    <p className="text-xs text-success">+4.25%</p>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {chartData.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / chartMax) * 100}%` }}
                        transition={{ duration: 0.4, delay: i * 0.02 }}
                        className="w-full rounded-t-md bg-gradient-to-t from-brand-100 to-brand-500 hover:brightness-110 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Pair</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Size</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Entry</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-3 text-sm font-medium">{o.pair}</td>
                        <td className="py-3 px-3">
                          <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', o.type === 'Buy' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                            {o.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-muted-foreground">{o.size}</td>
                        <td className="py-3 px-3 text-sm text-muted-foreground font-mono">{o.entry}</td>
                        <td className={cn('py-3 px-3 text-sm text-right font-medium font-mono', o.positive ? 'text-success' : 'text-destructive')}>
                          {o.pnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {orders.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', o.positive ? 'bg-success/10' : 'bg-destructive/10')}>
                      <span className={cn('text-xs font-bold', o.positive ? 'text-success' : 'text-destructive')}>{o.type === 'Buy' ? 'B' : 'S'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{o.pair}</p>
                      <p className="text-xs text-muted-foreground">{o.size} lots @ {o.entry}</p>
                    </div>
                  </div>
                  <span className={cn('text-sm font-medium font-mono', o.positive ? 'text-success' : 'text-destructive')}>{o.pnl}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

