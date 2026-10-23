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
  Wifi,
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
  account = null,
  accounts = [],
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
    <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none sticky top-0 z-40 text-slate-100 shadow-md">
      {/* 1. Left: Brand Logo & Back to Dashboard */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-all shadow-xs"
          title="Return to Main Dashboard"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <Logo size="sm" />
          <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>24ms · London LD4 · Direct Forex ECN</span>
          </div>
        </div>
      </div>

      {/* 2. Center: Account Selector Dropdown & Live Account Balance Metrics */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        {/* Account Selector Pill */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-500/40 bg-slate-950 hover:bg-slate-800/80 text-white font-medium transition-all shadow-xs cursor-pointer"
          >
            <div className="h-5 w-5 rounded-md bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[10px]">
              #
            </div>
            <div className="text-left min-w-0">
              {(() => {
                const isFunded =
                  account?.is_funded === true ||
                  String(account?.status).toUpperCase() === 'FUNDED' ||
                  String(account?.type).toLowerCase() === 'instant_funding' ||
                  (account?.plan_name && account.plan_name.toLowerCase().includes('funded'));
                const headerPlanTitle = isFunded
                  ? (account?.plan_name && account.plan_name.toLowerCase().includes('funded')
                      ? account.plan_name
                      : `$${(account?.account_size || 100000).toLocaleString()} Funded Account`)
                  : (account?.plan_name || `$${(account?.account_size || 100000).toLocaleString()} Challenge`);

                return (
                  <>
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-mono font-bold text-xs text-white">
                        #{account?.account_number || account?.login || 'Active'}
                      </span>
                      {isFunded ? (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Funded
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Phase {account?.phase || 1}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 truncate max-w-[130px] sm:max-w-[170px] leading-tight mt-0.5 font-medium">
                      {headerPlanTitle}
                    </p>
                  </>
                );
              })()}
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {/* Account Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 mb-1">
                <span>Select Trading Account</span>
                <span className="font-mono text-[10px] text-brand-400">{accounts.length} Available</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {accounts.map((acc) => {
                  const isSelected = acc.id === account?.id;
                  const accIsFunded =
                    acc.is_funded === true ||
                    String(acc.status).toUpperCase() === 'FUNDED' ||
                    String(acc.type).toLowerCase() === 'instant_funding' ||
                    (acc.plan_name && acc.plan_name.toLowerCase().includes('funded'));
                  const accPlanTitle = accIsFunded
                    ? (acc.plan_name && acc.plan_name.toLowerCase().includes('funded')
                        ? acc.plan_name
                        : `$${Number(acc.account_size || 100000).toLocaleString()} Funded Account`)
                    : (acc.plan_name || `$${Number(acc.account_size || 100000).toLocaleString()} Challenge`);

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onSelectAccount(acc.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500/40 text-white font-semibold shadow-xs'
                          : 'border-transparent hover:bg-slate-800 text-slate-400 hover:text-white'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-white">#{acc.account_number}</span>
                          {accIsFunded ? (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                              Funded
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                              {acc.status || `Phase ${acc.phase || 1}`}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5 font-medium">{accPlanTitle}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-white block">
                          ${Number(acc.current_balance || acc.account_size).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Eq: ${Number(acc.current_equity || acc.current_balance || acc.account_size).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {onOpenLoginModal && (
                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-brand-400" />
                    <span>Login With Another Trading ID</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Balance & Equity Metrics Strip */}
        <div className="hidden lg:flex items-center gap-2.5 font-mono text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">Balance</span>
            <span className="font-bold text-white">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">Equity</span>
            <span
              className={cn(
                'font-bold transition-colors',
                equity >= balance ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">Free Margin</span>
            <span className="font-bold text-white">
              ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">Margin Level</span>
            <span className="font-bold text-brand-400">{marginLevel}%</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">Floating P/L</span>
            <span
              className={cn(
                'font-bold font-mono',
                floatingPnL > 0
                  ? 'text-emerald-400'
                  : floatingPnL < 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
              )}
            >
              {floatingPnL > 0 ? '+' : ''}${floatingPnL.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Prop Firm Safeguard Badges */}
        <div className="hidden 2xl:flex items-center gap-2 text-[10px] font-mono">
          <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>Daily Loss: </span>
            <strong className={cn(Number(dailyLossPct) > 75 ? 'text-rose-400' : 'text-emerald-400')}>
              {dailyLossPct}% / {account?.rules?.daily_loss_limit_percent || 5}%
            </strong>
          </div>
          <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-brand-400" />
            <span>Max DD: </span>
            <strong className={cn(Number(overallLossPct) > 75 ? 'text-rose-400' : 'text-emerald-400')}>
              {overallLossPct}% / {account?.rules?.max_loss_limit_percent || 10}%
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Right: Theme Toggle & Explicit Terminal Logout */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />

        <button
          type="button"
          onClick={onTerminalLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          title="Sign out of trading terminal (website session will remain active)"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout Terminal</span>
        </button>
      </div>
    </header>
  );
}
