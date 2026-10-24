import React from 'react';
import { Calendar, ShieldAlert, AlertTriangle, Info, CheckCircle2, Zap } from 'lucide-react';
import { TradingViewEconomicCalendar } from '@/components/trading/tradingview-economic-calendar';

export function DashboardCalendar() {
  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-brand-600" />
            Economic Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time macroeconomic releases, central bank decisions, and prop firm high-impact news buffer status.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Macro Synchronization</span>
        </div>
      </div>

      {/* 2. Institutional Prop Firm Rule Policy Banner */}
      <div className="rounded-2xl border-2 border-brand-200 dark:border-brand-900/60 bg-gradient-to-r from-brand-50/60 via-background to-brand-50/20 dark:from-brand-950/20 dark:via-background dark:to-brand-950/10 p-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-sm font-bold text-slate-900 dark:text-foreground block">
              Prop Firm High-Impact News Buffer Policy (2-Minute Rule)
            </strong>
            <p>
              News trading is <strong>fully permitted</strong> on One Step and Two Step evaluation challenges. For <strong>Instant Funding accounts</strong>, opening or manually closing positions is strictly prohibited within <strong>2 minutes before and 2 minutes after</strong> high-impact (Red-Folder) macroeconomic announcements (e.g., NFP, CPI, FOMC, and Central Bank decisions). Any Instant Funding execution during this window will trigger an immediate rule breach and account termination. Existing Stop-Loss and Take-Profit orders remain active and will execute automatically.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                One Step &amp; Two Step Evaluation: News Trading Permitted
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                Instant Funding: Strictly Prohibited (Immediate Breach)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official TradingView Economic Calendar Engine */}
      <TradingViewEconomicCalendar height={650} showNewsBufferNotice={true} />
    </div>
  );
}
