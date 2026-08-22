import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading } from '@/components/shared/section-heading';
import { supabase } from '@/lib/supabase';
import {
  CHALLENGE_TYPE_LABELS,
  CHALLENGE_TYPE_DESCRIPTIONS,
  formatCurrency,
  formatAccountSize,
} from '@/lib/constants';
import type { Challenge, ChallengeType } from '@/types';
import { cn } from '@/lib/utils';

import { DEFAULT_CHALLENGES } from '@/lib/default-data';
import { fetchChallengesApi } from '@/lib/api-client';

export function ChallengesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramType = searchParams.get('type') as ChallengeType | null;
  const [activeType, setActiveType] = useState<ChallengeType>(paramType || 'one_step');
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);

  // Sync state if URL search param changes from external navigation
  useEffect(() => {
    if (paramType && paramType !== activeType) {
      setActiveType(paramType);
    }
  }, [paramType]);

  const handleTypeSelect = (type: ChallengeType) => {
    setActiveType(type);
    setSearchParams({ type }, { replace: true });
  };

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

  const filtered = challenges.filter((c) => c.type === activeType);
  const types: ChallengeType[] = ['one_step', 'two_step', 'instant_funding'];

  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Challenges"
            title="Choose Your Challenge"
            subtitle="Select the evaluation type that fits your trading style, then pick your account size and platform."
          />
        </div>
      </section>

      <section className="pb-8">
        <div className="container-page">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {types.map((type) => {
              const active = activeType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={cn(
                    'relative rounded-2xl p-6 text-left transition-all duration-150 cursor-pointer select-none',
                    active
                      ? 'border-2 border-brand-500 bg-brand-50/80 shadow-soft-md scale-[1.01]'
                      : 'border border-border bg-card shadow-soft hover:shadow-soft-md hover:border-brand-200'
                  )}
                >
                  <h3 className="font-display text-lg font-bold mb-1">{CHALLENGE_TYPE_LABELS[type]}</h3>
                  <p className="text-sm text-muted-foreground">{CHALLENGE_TYPE_DESCRIPTIONS[type]}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page">
          <div
            key={activeType}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-150"
          >
            {filtered.map((challenge) => {
              const rules = challenge.rules;
              return (
                <div
                  key={challenge.id}
                  className="card-elevated p-6 flex flex-col hover:-translate-y-1 transition-transform duration-200"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-display text-2xl font-bold">{formatAccountSize(challenge.account_size)}</h3>
                    <span className="text-sm text-muted-foreground">{CHALLENGE_TYPE_LABELS[challenge.type]}</span>
                  </div>
                  <p className="font-display text-3xl font-bold text-brand-600 mb-6">{formatCurrency(challenge.price)}</p>

                  <div className="space-y-2.5 mb-6 flex-1">
                    <RuleRow label="Profit Target" value={`${rules.profit_target}%`} />
                    <RuleRow label="Daily Drawdown" value={`${rules.daily_drawdown}%`} />
                    <RuleRow label="Max Drawdown" value={`${rules.max_drawdown}%`} />
                    <RuleRow label="Min Trading Days" value={`${rules.min_trading_days}`} />
                    <RuleRow label="Max Trading Days" value={rules.max_trading_days ? `${rules.max_trading_days}` : 'None'} />
                    <RuleRow label="Leverage" value={`1:${rules.leverage}`} />
                    <RuleRow label="Profit Split" value={`Up to ${rules.profit_split}%`} />
                    <RuleRow label="News Trading" value={rules.news_trading ? 'Allowed' : 'Not Allowed'} />
                    <RuleRow label="Weekend Holding" value={rules.weekend_holding ? 'Allowed' : 'Not Allowed'} />
                  </div>

                  <Link to={`/checkout?challenge=${challenge.id}`}>
                    <button className="btn-primary w-full flex items-center justify-center gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

