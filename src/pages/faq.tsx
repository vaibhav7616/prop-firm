import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Scale, Shield, FileText } from 'lucide-react';
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
    { q: 'What is the difference between One Step and Two Step?', a: 'One Step requires you to pass a single evaluation phase. Two Step requires two phases, but typically has a lower profit target in the second phase. Both lead to a funded account with 5 minimum trading days.' },
    { q: 'What is Instant Funding?', a: 'Instant Funding skips the evaluation entirely. You pay an upfront fee and receive a funded account immediately. The profit split is standardized at 80/20 with a 5 minimum trading days requirement.' },
    { q: 'Is there a time limit to pass?', a: 'No. There is no time limit on any of our challenges. You can take as long as you need to meet the profit target.' },
    { q: 'Can I trade news events?', a: 'News trading is permitted without restriction on One Step and Two Step evaluation challenges. On Instant Funding accounts, news trading is strictly prohibited; opening or manually closing trades within 2 minutes before or after high-impact (Red-Folder) macroeconomic releases will result in an immediate account breach and termination.' },
    { q: 'Is there a consistency rule?', a: 'No, FundedShift operates with NO consistency rule across all challenges and accounts. You are free to trade your own edge without artificial daily profit percentage caps, lot size scaling formulas, or profit consistency restrictions.' },
  ]},
  { category: 'Payouts', items: [
    { q: 'When can I request my first payout?', a: 'Once you are funded, you can request your first payout after completing at least 5 distinct trading days and reaching at least $100 in realized net profit. Payouts are processed within 24-48 hours.' },
    { q: 'What is the profit split?', a: 'We offer an 80/20 profit split pattern across all accounts (80% to the trader, 20% to the firm), including One Step, Two Step, and Instant Funding accounts.' },
    { q: 'How do I pay for my challenge account?', a: 'We accept 13+ payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, MasterCard, RuPay via Stripe/Razorpay), and Crypto (USDT TRC20/ERC20, Bitcoin, Ethereum).' },
    { q: 'How do I receive my payout?', a: 'Payouts are processed within 24-48 hours via Crypto (USDT TRC20/ERC20, BTC), Direct Bank Wire / ACH, UPI, or contractor platforms (Rise Pay / Deel).' },
    { q: 'Is the challenge fee refunded?', a: 'Yes. When you pass your challenge and receive your first payout, your challenge fee is refunded in full.' },
    { q: 'What is the refund policy if I change my mind?', a: 'Under our 14-Day Zero-Trade Cooling-Off Guarantee, you are eligible for a 100% full refund within 14 days of purchase provided that no trades have been executed on the account. Once trading activity has commenced, the challenge fee becomes non-refundable. Please refer to our Refund Policy for complete details.' },
  ]},
  { category: 'Account', items: [
    { q: 'What platforms do you support?', a: 'We trade exclusively on our high-performance FundedShift Web Terminal featuring integrated TradingView charts, one-click execution, and zero spread markup.' },
    { q: 'Can I hold positions over the weekend?', a: 'Weekend holding is permitted on One Step and Two Step evaluation challenges. Weekend holding is strictly prohibited on Instant Funding accounts; all trades must be closed before the market closes on Friday at 21:00 UTC.' },
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

          {/* Quick Legal & Compliance Card */}
          <div className="mt-12 p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-display font-bold text-base flex items-center justify-center sm:justify-start gap-2">
                <FileText className="h-4 w-4 text-brand-600" /> Need formal legal or policy documentation?
              </h4>
              <p className="text-xs text-muted-foreground">
                Read our complete institutional regulatory disclosures, data protection guidelines, and refund guarantees.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <Link to="/terms" className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:border-brand-500 hover:text-brand-600 transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link to="/privacy" className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:border-brand-500 hover:text-brand-600 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/refund-policy" className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:border-brand-500 hover:text-brand-600 transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
