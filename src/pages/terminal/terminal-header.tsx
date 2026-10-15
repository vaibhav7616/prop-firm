import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  LogOut,
  Zap,
  Shield,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';
import type { TradingAccount } from '@/types';

interface TerminalHeaderProps {
  account: any;
  accounts: any[];
  onSelectAccount: (accountId: string) => void;
  onTerminalLogout: () => void;
  onOpenLoginModal?: () => void;
  floatingPnL?: number;
}

export function TerminalHeader({
  account,
  accounts,
  onSelectAccount,
  onTerminalLogout,
  onOpenLoginModal,
  floatingPnL = 0,
}: TerminalHeaderProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const balance = Number(account?.current_balance || account?.account_size || 100000);
  const equity = Number((account?.current_equity ?? balance + floatingPnL).toFixed(2));
  const usedMargin = Number((account?.used_margin ?? 0).toFixed(2));
  const freeMargin = Math.max(0, Number((equity - usedMargin).toFixed(2)));
  const marginLevel = usedMargin > 0 ? ((equity / usedMargin) * 100).toFixed(0) : '∞';

  // Drawdown risk metrics
  const sodBaseline = Math.max(
    account?.start_of_day_balance || account?.starting_balance || balance,
    account?.start_of_day_equity || account?.starting_balance || balance
  );
  const currentDailyLoss = Math.max(0, sodBaseline - equity);
  const maxDailyLossAllowed = ((account?.rules?.daily_loss_limit_percent || 5) / 100) * sodBaseline;
  const dailyLossPct = ((currentDailyLoss / maxDailyLossAllowed) * 100).toFixed(1);

  const initialStartingBal = account?.starting_balance || balance;
  const currentOverallLoss = Math.max(0, initialStartingBal - equity);
  const maxOverallAllowed = ((account?.rules?.max_loss_limit_percent || 10) / 100) * initialStartingBal;
  const overallLossPct = ((currentOverallLoss / maxOverallAllowed) * 100).toFixed(1);

  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none sticky top-0 z-40 shadow-xs">
      {/* Left: Brand Logo & Navigation Back */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold text-xs transition-all shadow-xs"
          title="Return to Main Dashboard"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 pl-1 border-l border-border/70">
          <Logo size="sm" />
          <span className="hidden xl:inline text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold whitespace-nowrap">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
            Direct ECN Matcher
          </span>
        </div>
      </div>

      {/* Center: Account Selector Dropdown & Core Metrics */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
        {/* Account Selector Pill */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10 text-foreground font-medium transition-all shadow-xs"
          >
            <div className="h-5 w-5 rounded-md bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-[10px]">
              #
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-mono font-bold text-xs">
                  #{account?.account_number || account?.login || 'Active'}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {account?.status === 'FUNDED' ? 'Funded' : `Phase ${account?.phase || 1}`}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate max-w-[130px] sm:max-w-[180px] leading-tight mt-0.5">
                {account?.plan_name || `$${(account?.account_size || 100000).toLocaleString()} Challenge`}
              </p>
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {/* Account Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-card border border-slate-300 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/60 mb-1">
                <span>Select Trading Account</span>
                <span className="font-mono text-[10px]">{accounts.length} Available</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {accounts.map((acc) => {
                  const isSelected = acc.id === account?.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onSelectAccount(acc.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between',
                        isSelected
                          ? 'bg-brand-500/10 border-brand-500/40 text-foreground font-semibold shadow-xs'
                          : 'border-transparent hover:bg-secondary/60 text-muted-foreground'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-foreground">#{acc.account_number}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-secondary font-bold">
                            {acc.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{acc.plan_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-foreground block">
                          ${Number(acc.current_balance || acc.account_size).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Eq: ${Number(acc.current_equity || acc.current_balance || acc.account_size).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {onOpenLoginModal && (
                <div className="pt-1.5 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-center py-2 px-3 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="h-3.5 w-3.5 text-brand-500" />
                    <span>Login With Another Trading ID</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Balance & Equity Metrics Strip */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">Balance</span>
            <span className="font-bold text-foreground">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">Equity</span>
            <span
              className={cn(
                'font-bold transition-colors',
                equity >= balance ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500'
              )}
            >
              ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">Free Margin</span>
            <span className="font-bold text-foreground">
              ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">Floating P/L</span>
            <span
              className={cn(
                'font-bold font-mono',
                floatingPnL > 0
                  ? 'text-emerald-500'
                  : floatingPnL < 0
                  ? 'text-rose-500'
                  : 'text-muted-foreground'
              )}
            >
              {floatingPnL > 0 ? '+' : ''}${floatingPnL.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Prop Firm Safeguard Badges */}
        <div className="hidden 2xl:flex items-center gap-2 text-[10px] font-mono">
          <div className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>Daily Loss: </span>
            <strong className={cn(Number(dailyLossPct) > 75 ? 'text-rose-400' : 'text-emerald-400')}>
              {dailyLossPct}% / {account?.rules?.daily_loss_limit_percent || 5}%
            </strong>
          </div>
          <div className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-brand-400" />
            <span>Max DD: </span>
            <strong className={cn(Number(overallLossPct) > 75 ? 'text-rose-400' : 'text-emerald-400')}>
              {overallLossPct}% / {account?.rules?.max_loss_limit_percent || 10}%
            </strong>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle & Explicit Terminal Logout */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />

        <button
          type="button"
          onClick={onTerminalLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          title="Sign out of trading terminal (website session will remain active)"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout Terminal</span>
        </button>
      </div>
    </header>
  );
}
