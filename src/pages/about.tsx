import { Target, Eye, Heart, TrendingUp, Users, Shield } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';

const VALUES = [
  { icon: Shield, title: 'Integrity', desc: 'We do what we say. Transparent rules, fair evaluations, and on-time payouts. Always.' },
  { icon: TrendingUp, title: 'Opportunity', desc: 'We provide capital to talented traders who might not otherwise have access to it.' },
  { icon: Heart, title: 'Community', desc: 'We invest in our traders success because when you win, we win together.' },
  { icon: Target, title: 'Excellence', desc: 'We hold ourselves to the highest standards in technology, support, and service.' },
];

const STATS = [
  { value: '1.5 Yrs', label: 'In Business' },
  { value: '50K+', label: 'Traders Funded' },
  { value: '$12M+', label: 'Total Payouts' },
  { value: '10+', label: 'Countries' },
];

export function AboutPage() {
  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="About Us"
            title="Democratizing Access to Capital"
            subtitle="Funded Shift was founded with one mission: to give talented traders access to institutional capital, regardless of their background or bankroll."
          />
        </div>
      </section>

      <section className="py-12">
        <div className="container-narrow">
          <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
            <p>
              We started Funded Shift because we believed the trading industry was broken. Talented traders
              were being held back by lack of capital, while traditional prop firms imposed unfair rules
              designed to make traders fail.
            </p>
            <p>
              Our founders, a team of former professional traders and fintech engineers, set out to build a
              different kind of prop firm. One with transparent rules, fair evaluations, and a genuine
              commitment to trader success. No hidden traps. No impossible targets. Just real capital for
              real traders.
            </p>
            <p>
              Today, Funded Shift has funded over 180,000 traders across 190+ countries and deployed more
              than $2.4 billion in trading capital. But we are just getting started. Our mission is to become
              the most trusted name in proprietary trading, and we are building the technology and community
              to make that happen.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-border bg-card">
        <div className="container-page">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl lg:text-5xl font-bold text-brand-600">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-elevated p-8">
              <Target className="h-10 w-10 text-brand-600 mb-4" />
              <h3 className="font-display text-2xl font-bold mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to trading capital by identifying and funding talented traders worldwide,
                removing the financial barriers that prevent skilled individuals from reaching their full potential.
              </p>
            </div>
            <div className="card-elevated p-8">
              <Eye className="h-10 w-10 text-brand-600 mb-4" />
              <h3 className="font-display text-2xl font-bold mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become the most trusted and innovative proprietary trading firm in the world, empowering
                millions of traders with the capital, technology, and support they need to succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-secondary/30 border-y border-border">
        <div className="container-page">
          <SectionHeading eyebrow="Our Values" title="What We Stand For" />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="card-elevated p-6 text-center animate-fade-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 mx-auto mb-4">
                    <Icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="font-display font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
