import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronLeft,
  Briefcase,
  AlertCircle,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';

interface TerminalNoAccountsProps {
  pendingOrders?: any[];
  breachedAccounts?: any[];
  userEmail?: string;
}

export function TerminalNoAccounts({
  pendingOrders = [],
  breachedAccounts = [],
  userEmail,
}: TerminalNoAccountsProps) {
  const hasPending = pendingOrders.length > 0;
  const hasBreached = breachedAccounts.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-amber-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.12),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />

      {/* Top Bar */}
      <div className="w-full max-w-xl mb-6 flex items-center justify-between z-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/60 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
          <span>Terminal Access Gate</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-8 z-10 relative">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Briefcase className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            No Active Trading Account Found
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            To unlock the FundedShift Web Terminal and trade institutional live liquidity, you must hold an active prop challenge or funded account.
          </p>
        </div>

        {/* Pending Orders Notice (if any) */}
        {hasPending && (
          <div className="mb-6 bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-300 mb-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Pending Order Awaiting Completion</span>
            </div>
            <p className="text-slate-300 mb-3">
              You have an order pending activation. Complete payment or wait for broker assignment to activate your MT5 credentials.
            </p>
            <div className="space-y-2">
              {pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                >
                  <div>
                    <span className="font-mono font-bold text-white text-xs block">
                      Order #{ord.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ${Number(ord.account_size || 0).toLocaleString()} • {ord.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <Link
                    to="/dashboard/orders"
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[11px] font-semibold transition-colors"
                  >
                    View Status
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breached Accounts Notice (if any) */}
        {hasBreached && !hasPending && (
          <div className="mb-6 bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-rose-300 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Previous Account Breached</span>
            </div>
            <p className="text-slate-300 mb-3">
              Your previous evaluation account reached the maximum drawdown limit and was deactivated. You can acquire a new challenge or reset your evaluation.
            </p>
          </div>
        )}

        {/* Value Proposition Box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 mb-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            FundedShift Trading Specifications
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Up to 90% Profit Split</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Raw Spreads from 0.0 Pips</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>5% Daily / 10% Max DD</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>No Minimum Trading Days</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/challenges"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 text-xs uppercase tracking-wider group"
          >
            <Sparkles className="w-4 h-4" />
            <span>Choose an Evaluation Challenge</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/dashboard/accounts"
            className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>Manage Existing Accounts in Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
