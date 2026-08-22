import { Outlet, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/logo';
import { TrendingUp, Shield, Zap, Check } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left: form */}
      <div className="flex-1 flex flex-col px-5 sm:px-8 py-8 bg-background">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/" className="text-sm text-muted-foreground hover:text-brand-600 transition-colors">
            Back to site
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Right: showcase */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-brand-700 to-brand-900">
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        <div className="relative flex flex-col justify-center px-12 xl:px-20">
          <h2 className="font-display text-4xl xl:text-5xl font-bold tracking-tight mb-6 text-white text-balance leading-[1.15]">
            Trade With Confidence.
            <br />
            Get Funded By Professionals.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md">
            Join 180,000+ traders who have unlocked funded accounts. Prove your skill and keep up to 90% of your profits.
          </p>
          <div className="space-y-4 max-w-md">
            {[
              { icon: Zap, text: 'Pass in a single step with our One Step challenge' },
              { icon: Shield, text: 'No time limits, no hidden rules, no tricks' },
              { icon: TrendingUp, text: 'Scale your account up to $2M with our scaling plan' },
              { icon: Check, text: 'Get paid within 7 days of your payout request' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-white/80">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
