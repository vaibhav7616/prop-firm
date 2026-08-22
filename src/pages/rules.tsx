import { Target, TrendingDown, Calendar, Gauge, Percent, Newspaper, Moon, BarChart3, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const RULES = [
  { icon: Target, name: 'Profit Target', desc: 'The percentage of profit you need to achieve to pass the evaluation phase. One Step requires 8%, Two Step requires 8% in Phase 1 and 5% in Phase 2.', detail: 'One Step: 8% · Two Step: 8% / 5%' },
  { icon: TrendingDown, name: 'Daily Drawdown', desc: 'The maximum loss you can incur in a single trading day, calculated from your starting balance or equity peak. Exceeding this limit results in a breach.', detail: '5% of account balance' },
  { icon: TrendingDown, name: 'Maximum Drawdown', desc: 'The total maximum loss allowed on your account from the initial starting balance. This is a hard limit that cannot be exceeded at any point.', detail: '10% of account balance' },
  { icon: Calendar, name: 'Minimum Trading Days', desc: 'The minimum number of days you must place trades before becoming eligible to pass. Some challenge types require zero minimum days.', detail: 'One Step: 0 · Two Step: 3' },
  { icon: Calendar, name: 'Maximum Trading Days', desc: 'There is no maximum time limit. You can take as long as you need to pass your evaluation. Trade without the pressure of deadlines.', detail: 'No time limit' },
  { icon: Gauge, name: 'Leverage', desc: 'The leverage provided on your trading account. Default leverage is 1:100 and can be increased with the Higher Leverage add-on.', detail: '1:100 (up to 1:200 with add-on)' },
  { icon: Percent, name: 'Profit Split', desc: 'The percentage of profits you keep when funded. Our standard split is up to 90% for evaluation challenges and 50% for instant funding.', detail: 'Up to 90% (50% for Instant)' },
  { icon: Newspaper, name: 'News Trading', desc: 'Whether you are allowed to hold positions during high-impact news events. One Step and Instant Funding allow news trading.', detail: 'One Step & Instant: Allowed' },
  { icon: Moon, name: 'Weekend Holding', desc: 'Whether you can hold positions over the weekend. Instant Funding allows weekend holding by default; other types can add it.', detail: 'Instant: Allowed · Others: Add-on' },
  { icon: BarChart3, name: 'Consistency Rule', desc: 'No single trading day should account for more than 40% of your total profit. This ensures consistent trading behavior.', detail: 'Max 40% per day' },
  { icon: ArrowUpRight, name: 'Scaling Plan', desc: 'Successfully funded traders can scale their account up to $2M by meeting profit targets over consecutive payout cycles.', detail: 'Scale up to $2M' },
];

export function RulesPage() {
  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Trading Rules"
            title="Clear, Fair, Transparent"
            subtitle="We believe in simple rules that give you the best chance to succeed. No hidden traps, no fine print."
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="container-page">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RULES.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.name}
                  className="card-elevated p-6 animate-fade-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 shrink-0">
                      <Icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-bold mb-2">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{rule.desc}</p>
                      <span className="badge-brand text-[11px]">{rule.detail}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page max-w-3xl">
          <div className="card-elevated p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
                <ShieldCheck className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-2">What happens if I breach a rule?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  If you breach the daily drawdown or maximum drawdown limit, your account will be marked as breached
                  and trading will be disabled. You will have the option to reset your challenge at a discounted rate.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We understand that mistakes happen. That is why we offer challenge resets so you can try again
                  without paying the full price. Your success is our priority.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
