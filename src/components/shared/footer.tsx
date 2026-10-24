import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Share2, MessageSquare, Video, ShieldCheck, Scale, Lock, RotateCcw } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Challenges', to: '/challenges' },
    { label: 'Pricing Plans', to: '/pricing' },
    { label: 'Trading Rules', to: '/rules' },
    { label: 'Live Leaderboard', to: '/leaderboard' },
    { label: 'Proof of Payout', to: '/proof-of-payout' },
    { label: 'Affiliates (15% Split)', to: '/affiliates' },
  ],
  Resources: [
    { label: 'FAQ & Help Desk', to: '/faq' },
    { label: 'Web Terminal', to: '/terminal' },
    { label: 'About FundedShift', to: '/about' },
    { label: 'Trading Blog', to: '/blog' },
    { label: 'Contact Support', to: '/contact' },
    { label: 'Trader Portal', to: '/dashboard' },
  ],
  Legal: [
    { label: 'Terms & Conditions', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Risk Parameters', to: '/rules' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container-page py-16">
        {/* Newsletter */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft mb-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl font-bold mb-1">Stay informed with FundedShift</h3>
              <p className="text-sm text-muted-foreground">Get trading insights, payout statistics, and platform updates. No spam.</p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <Input
                type="email"
                placeholder="trader@example.com"
                className="lg:w-72"
              />
              <Button
                className="btn-primary shrink-0"
                onClick={() => toast.success('Subscribed! Check your inbox for institutional updates.')}
              >
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Logo size="lg" />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Institutional capital for serious traders worldwide. Pass the evaluation, prove your consistency, and keep up to 90% of your profits with rapid bi-weekly disbursements.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: Globe, label: 'Twitter / X', href: 'https://twitter.com' },
                { Icon: Share2, label: 'Instagram', href: 'https://instagram.com' },
                { Icon: MessageSquare, label: 'Discord', href: 'https://discord.com' },
                { Icon: Video, label: 'YouTube', href: 'https://youtube.com' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:text-brand-600 hover:border-brand-200 hover:shadow-soft"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display font-semibold text-sm mb-4">{heading}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright & Direct Legal Links */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FundedShift Proprietary Trading Technologies Ltd. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors font-medium">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors font-medium">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors font-medium">Refund Policy</Link>
            <Link to="/rules" className="hover:text-foreground transition-colors font-medium">Trading Rules</Link>
          </div>
        </div>

        {/* Institutional Regulatory & Compliance Disclaimer */}
        <div className="mt-8 pt-6 border-t border-border/60 space-y-3 text-xs text-muted-foreground/80 leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Regulatory & Simulated Evaluation Disclosure:
          </p>
          <p>
            All accounts provided to clients are simulated accounts with fictitious funds. All activities are purely educational and evaluation-based in accordance with regulatory guidelines. FundedShift does not provide investment advice, brokerage services, portfolio management, or custody of client assets.
          </p>
          <p>
            Trading foreign exchange (Forex), commodities, precious metals, stock indices, and digital cryptocurrencies carries a high level of risk and may not be suitable for all individuals. Past simulated or evaluation performance is not indicative of future results. Hypothetical or simulated performance results have certain inherent limitations (CFTC Rule 4.41). No representation is being made that any account will or is likely to achieve profits or losses similar to those shown.
          </p>
        </div>
      </div>
    </footer>
  );
}
