import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { supabase } from '@/lib/supabase';
import { CHALLENGE_TYPE_LABELS, formatCurrency, formatAccountSize } from '@/lib/constants';
import type { Challenge, ChallengeType } from '@/types';

import { DEFAULT_CHALLENGES } from '@/lib/default-data';
import { fetchChallengesApi } from '@/lib/api-client';
import { PayoutCalculator } from '@/components/home/payout-calculator';

export function PricingPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);

  useEffect(() => {
    const load = async () => {
      const apiData = await fetchChallengesApi();
      if (apiData && apiData.length > 0) {
        setChallenges(apiData as Challenge[]);
        return;
      }
      try {
        const { data, error } = await supabase.from('challenges').select('*').order('sort_order', { ascending: true });
        if (data && data.length > 0 && !error) {
          setChallenges(data as Challenge[]);
        }
      } catch (_) {
        // Keep DEFAULT_CHALLENGES
      }
    };
    load();
  }, []);

  const types: ChallengeType[] = ['one_step', 'two_step', 'instant_funding'];

  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Pricing"
            title="Transparent Pricing"
            subtitle="No hidden fees. One-time payment. Get refunded when you pass your challenge."
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="container-page space-y-16">
          {types.map((type) => {
            const typeChallenges = challenges.filter((c) => c.type === type);
            if (typeChallenges.length === 0) return null;
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold">{CHALLENGE_TYPE_LABELS[type]}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {type === 'one_step' && 'Single evaluation phase. Fastest path to funding.'}
                      {type === 'two_step' && 'Two-phase evaluation. Prove consistency.'}
                      {type === 'instant_funding' && 'Skip evaluation. Start trading immediately.'}
                    </p>
                  </div>
                  <Link to={`/challenges?type=${type}`}>
                    <button className="btn-ghost text-brand-600">View Details</button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {typeChallenges.map((c) => (
                    <div key={c.id} className="card-elevated p-5 text-center">
                      <p className="font-display text-xl font-bold mb-1">{formatAccountSize(c.account_size)}</p>
                      <p className="text-2xl font-display font-bold text-brand-600 mb-3">{formatCurrency(c.price)}</p>
                      <div className="text-xs text-muted-foreground space-y-1 mb-4">
                        <p>Split: up to {c.rules.profit_split}%</p>
                        <p>Leverage: 1:{c.rules.leverage}</p>
                      </div>
                      <Link to={`/checkout?challenge=${c.id}`}>
                        <button className="btn-primary w-full text-xs py-2.5 px-4">
                          Buy
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <PayoutCalculator />

      <section className="pb-20">
        <div className="container-page">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-soft-md">
              <Check className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold mb-1">100% Fee Refund on Pass</h3>
              <p className="text-sm text-muted-foreground">
                When you pass your challenge and receive a funded account, your challenge fee is refunded in full with your first payout.
              </p>
            </div>
            <Link to="/challenges">
              <button className="btn-primary shrink-0">Start Now</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
