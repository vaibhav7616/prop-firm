import { Link } from 'react-router-dom';
import { Users, MousePointerClick, DollarSign, Trophy, ArrowRight, TrendingUp } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';

const BENEFITS = [
  { icon: DollarSign, title: '15% Commission', desc: 'Earn 15% of every challenge purchase made through your referral link, with no cap on earnings.' },
  { icon: MousePointerClick, title: 'Track Every Click', desc: 'Real-time analytics show you clicks, conversions, and earnings with full transparency.' },
  { icon: Trophy, title: 'Monthly Leaderboard', desc: 'Top affiliates get bonus payouts and exclusive rewards every month.' },
  { icon: TrendingUp, title: 'Lifetime Earnings', desc: 'Your referrals keep earning for you. Get paid every time they purchase a new challenge.' },
];

const STEPS = [
  { step: '1', title: 'Get Your Link', desc: 'Sign up and instantly receive your unique referral link.' },
  { step: '2', title: 'Share It', desc: 'Post your link on social media, forums, and with friends.' },
  { step: '3', title: 'Earn 15%', desc: 'Get 15% commission every time someone buys a challenge.' },
  { step: '4', title: 'Withdraw', desc: 'Cash out your earnings once you reach the $100 minimum.' },
];

export function AffiliatesPage() {
  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Affiliate Program"
            title="Earn While You Refer"
            subtitle="Join our affiliate program and earn 15% commission on every challenge purchase through your referral link."
          />
          <div className="mt-8 flex justify-center">
            <Link to="/register">
              <button className="btn-primary text-base px-8 py-3.5">
                Become an Affiliate
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '15%', label: 'Commission Rate' },
              { value: '$100', label: 'Min Payout' },
              { value: '30 days', label: 'Cookie Duration' },
              { value: 'No Cap', label: 'Max Earnings' },
            ].map((s) => (
              <div key={s.label} className="text-center card-elevated p-6">
                <p className="font-display text-3xl font-bold text-brand-600">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-secondary/30 border-y border-border">
        <div className="container-page">
          <SectionHeading eyebrow="Benefits" title="Why Join Our Affiliate Program" />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFITS.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="card-elevated p-6 animate-fade-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 shrink-0">
                      <Icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <SectionHeading eyebrow="How It Works" title="Start Earning in 4 Steps" />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, idx) => (
              <div
                key={s.step}
                className="text-center animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center mb-4 shadow-soft-md">
                  <span className="font-display font-bold text-xl text-white">{s.step}</span>
                </div>
                <h3 className="font-display font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page">
          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-12 text-center">
            <Users className="h-12 w-12 text-brand-600 mx-auto mb-6" />
            <h2 className="font-display text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Create your account, get your referral link, and start earning 15% commission today.
            </p>
            <Link to="/register">
              <button className="btn-primary text-base px-8 py-3.5">
                Get Your Referral Link
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
