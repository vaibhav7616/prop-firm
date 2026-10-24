import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, AlertTriangle, ShieldCheck, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

export interface EconomicCalendarEvent {
  id: string;
  name: string;
  title: string;
  country: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  date: string;
  release_at_utc: string | null;
  time_utc: string | null;
  period?: string | null;
  actual?: string | null;
  prior?: string | null;
  consensus?: string | null;
  unit?: string | null;
  source_name?: string;
  source_url?: string | null;
}

interface NewsCalendarStatus {
  restricted: boolean;
  reason?: string;
  event?: EconomicCalendarEvent;
  secondsRemaining?: number;
}

interface EconomicCalendarProps {
  className?: string;
  height?: number | string;
  selectedCurrency?: string;
  showNewsBufferNotice?: boolean;
}

export function TradingViewEconomicCalendar({
  className = '',
  height = 650,
  selectedCurrency = 'ALL',
  showNewsBufferNotice = true,
}: EconomicCalendarProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'tradingview' | 'high_impact'>('tradingview');
  const [currencyFilter, setCurrencyFilter] = useState<string>(selectedCurrency);
  const [events, setEvents] = useState<EconomicCalendarEvent[]>([]);
  const [status, setStatus] = useState<NewsCalendarStatus>({ restricted: false });
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch structured events and 2-min buffer status from backend
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const [calRes, statusRes] = await Promise.all([
        fetch('/api/economic-calendar'),
        fetch('/api/economic-calendar/status?symbol=EURUSD'),
      ]);

      if (calRes.ok) {
        const data = await calRes.json();
        if (data && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      }

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatus(sData);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('Failed to load economic calendar API data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
    const interval = setInterval(loadCalendarData, 30000); // Poll status every 30s
    return () => clearInterval(interval);
  }, []);

  // Construct official TradingView iframe embed URL
  const iframeSrc = useMemo(() => {
    const config = {
      colorTheme: theme === 'dark' ? 'dark' : 'light',
      isTransparent: false,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter: '0,1',
      currencyFilter: currencyFilter === 'ALL' ? 'USD,EUR,GBP,JPY,CAD,AUD,CHF' : currencyFilter,
    };
    return `https://s.tradingview.com/embed-widget/events/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;
  }, [theme, currencyFilter]);

  // Filter high-impact events list
  const filteredHighImpact = events.filter((e) => {
    if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
    return e.impact === 'high' || e.impact === 'medium';
  });

  return (
    <div className={cn('flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm', className)}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-foreground flex items-center gap-2">
              Economic News Calendar
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                Live Macro Feeds
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Official macroeconomic data releases with institutional high-impact volatility ratings.
            </p>
          </div>
        </div>

        {/* View Switcher & Currency Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab buttons */}
          <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tradingview')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer',
                activeTab === 'tradingview'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Interactive Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('high_impact')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer',
                activeTab === 'high_impact'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Red Folder Events ({filteredHighImpact.length})
            </button>
          </div>

          {/* Currency Filter Dropdown */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            title="Filter by Currency"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD (United States)</option>
            <option value="EUR">EUR (Eurozone)</option>
            <option value="GBP">GBP (United Kingdom)</option>
            <option value="JPY">JPY (Japan)</option>
            <option value="CAD">CAD (Canada)</option>
            <option value="AUD">AUD (Australia)</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadCalendarData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            title="Refresh News Feed"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 2. Institutional Prop Firm 2-Minute News Buffer Notice */}
      {showNewsBufferNotice && (
        <div
          className={cn(
            'px-4 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-3',
            status.restricted
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
          )}
        >
          <div className="flex items-center gap-2">
            {status.restricted ? (
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 animate-bounce" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <div>
              <span className="font-bold mr-1.5">
                {status.restricted ? '⚠️ HIGH-IMPACT NEWS BUFFER ACTIVE:' : '🛡️ NEWS BUFFER STATUS: ALL CLEAR'}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {status.restricted
                  ? `${status.reason} (Instant Funding prohibited — triggers immediate breach)`
                  : '1-Step & 2-Step news trading allowed. Instant Funding 2-minute buffer currently all clear.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
            {status.restricted && status.secondsRemaining && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                Buffer ends in: {Math.floor(status.secondsRemaining / 60)}m {status.secondsRemaining % 60}s
              </span>
            )}
            <span className="text-muted-foreground">
              1-Step &amp; 2-Step: Allowed · Instant: Prohibited
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Calendar Container */}
      <div className="relative flex-1 bg-background" style={{ minHeight: height, height }}>
        {activeTab === 'tradingview' ? (
          <div className="h-full w-full relative" style={{ height }}>
            <iframe
              src={iframeSrc}
              className="w-full h-full border-none"
              style={{ height, minHeight: height }}
              title="TradingView Economic Calendar"
            />
          </div>
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto" style={{ height, maxHeight: height }}>
            {filteredHighImpact.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-xs">
                No high-impact economic news scheduled for the selected currency filter.
              </div>
            ) : (
              filteredHighImpact.map((evt) => {
                const releaseDate = evt.release_at_utc ? new Date(evt.release_at_utc) : null;
                const isPast = releaseDate ? releaseDate.getTime() < Date.now() : false;

                return (
                  <div
                    key={evt.id}
                    className={cn(
                      'p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all',
                      evt.impact === 'high'
                        ? 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40'
                        : 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                            evt.impact === 'high'
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          )}
                        >
                          {evt.impact.toUpperCase()} IMPACT
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted">
                          {evt.currency} ({evt.country})
                        </span>
                        {isPast && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Released
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{evt.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Source: {evt.source_name}</span>
                        {evt.period && <span>· Period: {evt.period}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono shrink-0 sm:text-right">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground uppercase">Scheduled Time</div>
                        <div className="font-bold text-foreground">
                          {releaseDate ? releaseDate.toUTCString().replace('GMT', 'UTC') : evt.date}
                        </div>
                      </div>

                      {(evt.actual || evt.consensus || evt.prior) && (
                        <div className="pl-3 border-l border-border space-y-0.5">
                          <div className="text-[10px] text-muted-foreground uppercase">Actual / Forecast</div>
                          <div className="font-bold text-brand-600">
                            {evt.actual || '-'} / {evt.consensus || evt.prior || '-'} {evt.unit}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Footer Status Bar */}
      <div className="p-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 font-mono">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-brand-600" />
          <span>Synchronized with Global Central Banks &amp; Bureau of Labor Statistics (UTC)</span>
        </div>
        <div className="text-[11px]">
          Refreshed: {lastRefreshed.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
