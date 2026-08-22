import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { cn } from '@/lib/utils';

const FAQS = [
  { category: 'General', items: [
    { q: 'What is a prop firm?', a: 'A proprietary trading firm provides traders with capital to trade the markets. You prove your trading skill through an evaluation, and if you pass, you receive a funded account and keep a share of the profits you generate.' },
    { q: 'How does Funded Shift work?', a: 'Choose a challenge type (One Step, Two Step, or Instant Funding), select your account size, complete the checkout, and start trading. Pass the evaluation to receive a funded account and withdraw your profits.' },
    { q: 'Which countries do you accept?', a: 'We accept traders from 190+ countries. The only exceptions are countries under international sanctions. Check our terms for the full list.' },
    { q: 'Do I need prior trading experience?', a: 'While no formal experience is required, trading involves substantial risk. We recommend having a tested strategy and understanding of risk management before purchasing a challenge.' },
  ]},
  { category: 'Challenges', items: [
    { q: 'What is the difference between One Step and Two Step?', a: 'One Step requires you to pass a single evaluation phase. Two Step requires two phases, but typically has a lower profit target in the second phase. Both lead to a funded account.' },
    { q: 'What is Instant Funding?', a: 'Instant Funding skips the evaluation entirely. You pay an upfront fee and receive a funded account immediately. The profit split is 70/30 with 7 minimum trading days.' },
    { q: 'Is there a time limit to pass?', a: 'No. There is no time limit on any of our challenges. You can take as long as you need to meet the profit target.' },
    { q: 'Can I trade news events?', a: 'Yes, news trading is allowed on One Step and Instant Funding challenges. Two Step challenges restrict trading during high-impact news events.' },
  ]},
  { category: 'Payouts', items: [
    { q: 'When can I request my first payout?', a: 'Once you are funded, you can request your first payout after meeting the minimum trading days requirement. Payouts are processed within 7 days.' },
    { q: 'What is the profit split?', a: 'Evaluation challenges (One Step and Two Step) offer up to 90% profit split. Instant Funding offers a 70% profit split.' },
    { q: 'How do I pay for my challenge account?', a: 'We accept 13+ payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, MasterCard, RuPay via Stripe/Razorpay), and Crypto (USDT TRC20/ERC20, Bitcoin, Ethereum).' },
    { q: 'How do I receive my payout?', a: 'Payouts are processed within 24-48 hours via Crypto (USDT TRC20/ERC20, BTC), Direct Bank Wire / ACH, UPI, or contractor platforms (Rise Pay / Deel).' },
    { q: 'Is the challenge fee refunded?', a: 'Yes. When you pass your challenge and receive your first payout, your challenge fee is refunded in full.' },
  ]},
  { category: 'Account', items: [
    { q: 'What platforms do you support?', a: 'We trade exclusively on our high-performance FundedShift Web Terminal featuring integrated TradingView charts, one-click execution, and zero spread markup.' },
    { q: 'Can I hold positions over the weekend?', a: 'Weekend holding is allowed on Instant Funding by default. For One Step and Two Step, you can add the Weekend Holding add-on during checkout.' },
    { q: 'What leverage is provided?', a: 'Default leverage is 1:100. You can increase it to 1:200 with the Higher Leverage add-on during checkout.' },
    { q: 'How do I get my trading credentials?', a: 'After your payment is confirmed, our team assigns your trading account within 24 hours. You will receive an email and your credentials will appear in your dashboard.' },
  ]},
];

export function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Find answers to the most common questions about Funded Shift."
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page max-w-3xl">
          <div className="space-y-10">
            {FAQS.map((group) => (
              <div key={group.category}>
                <h3 className="font-display text-lg font-bold text-brand-700 mb-4">{group.category}</h3>
                <div className="space-y-3">
                  {group.items.map((faq) => {
                    const key = `${group.category}-${faq.q}`;
                    const isOpen = open === key;
                    return (
                      <div key={key} className="card-elevated overflow-hidden">
                        <button
                          onClick={() => setOpen(isOpen ? null : key)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <span className="font-display font-semibold text-base">{faq.q}</span>
                          <ChevronDown className={cn('h-5 w-5 text-brand-500 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
