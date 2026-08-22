import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Share2, MessageSquare, Video } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const FOOTER_LINKS = {
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/contact' },
    { label: 'Careers', to: '/about' },
  ],
  Platform: [
    { label: 'Challenges', to: '/challenges' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Trading Rules', to: '/rules' },
    { label: 'Leaderboard & Proofs', to: '/leaderboard' },
    { label: 'Affiliates', to: '/affiliates' },
  ],
  Resources: [
    { label: 'FAQ', to: '/faq' },
    { label: 'Login', to: '/login' },
    { label: 'Register', to: '/register' },
    { label: 'Dashboard', to: '/dashboard' },
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
              <h3 className="font-display text-xl font-bold mb-1">Stay informed</h3>
              <p className="text-sm text-muted-foreground">Get trading insights and platform updates. No spam.</p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <Input
                type="email"
                placeholder="you@example.com"
                className="lg:w-72"
              />
              <Button
                className="btn-primary shrink-0"
                onClick={() => toast.success('Subscribed! Check your inbox.')}
              >
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Logo size="lg" />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Institutional capital for serious traders. Pass the evaluation, get funded, and keep up to 90% of your profits.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: Globe, label: 'Twitter' },
                { Icon: Share2, label: 'Instagram' },
                { Icon: MessageSquare, label: 'LinkedIn' },
                { Icon: Video, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
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

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Funded Shift. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/rules" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/rules" className="hover:text-foreground transition-colors">Privacy</Link>
            <span className="hover:text-foreground transition-colors cursor-pointer">Risk Disclosure</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/70 max-w-4xl leading-relaxed">
          Risk Disclosure: Trading involves substantial risk of loss and is not suitable for every investor.
          Past performance is not indicative of future results. All content is for educational purposes only
          and does not constitute financial advice.
        </p>
      </div>
    </footer>
  );
}
