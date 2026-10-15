import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { executeOrderApi } from '@/lib/api-client';
import { calculateInstitutionalMargin } from '@/utils/mt5';

interface OrderPanelProps {
  account: any;
  selectedSymbol: string;
  activeQuote: {
    symbol: string;
    price: number;
    bid: number;
    ask: number;
    high: number;
    low: number;
    change24h: number;
    spread?: number;
    isMarketOpen?: boolean;
  };
  onOrderExecuted: () => void;
  className?: string;
}

export function OrderPanel({
  account,
  selectedSymbol,
  activeQuote,
  onOrderExecuted,
  className,
}: OrderPanelProps) {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [executionMode, setExecutionMode] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const balance = Number(account?.current_balance || 100000);
  const equity = Number(account?.current_equity || balance);
  const usedMargin = Number(account?.used_margin || 0);
  const freeMargin = Math.max(0, equity - usedMargin);
  const maxLotAllowed = account?.rules?.max_lot_size || (account?.account_size <= 10000 ? 10 : 50);

  // Calculate live institutional margin requirement
  const requiredMargin = calculateInstitutionalMargin({
    symbol: selectedSymbol,
    lotSize,
    currentPrice: activeQuote.price || (activeQuote.bid + activeQuote.ask) / 2 || 100,
    leverage: account?.rules?.leverage || 100,
  });

  const hasSufficientMargin = freeMargin >= requiredMargin;
  const isMarketOpen = activeQuote.isMarketOpen !== false;
  const isTradingLocked = account?.status === 'BREACHED' || account?.status === 'FAILED' || account?.status === 'PASSED';

  const handleExecute = async (side: 'BUY' | 'SELL') => {
    if (!account) {
      toast.error('No active trading account selected.');
      return;
    }

    if (isTradingLocked) {
      toast.error(`Trading is locked: Account is currently ${account.status}.`);
      return;
    }

    if (!isMarketOpen) {
      toast.error(`Market for ${selectedSymbol} is currently closed. Execution resumes Sunday 22:00 UTC.`);
      return;
    }

    if (lotSize <= 0) {
      toast.error('Lot size must be greater than 0.');
      return;
    }

    if (lotSize > maxLotAllowed) {
      toast.error(`Order exceeds maximum allowed lot size of ${maxLotAllowed} lots.`);
      return;
    }

    if (!hasSufficientMargin) {
      toast.error(`Insufficient margin. Required: $${requiredMargin.toFixed(2)}, Available: $${freeMargin.toFixed(2)}.`);
      return;
    }

    setSubmitting(true);
    const res = await executeOrderApi({
      userId: account.user_id,
      accountId: account.id,
      symbol: selectedSymbol,
      type: side,
      lotSize,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success(
        `✓ ${side} ${lotSize} lots executed on ${selectedSymbol} at $${(side === 'BUY' ? activeQuote.ask : activeQuote.bid).toFixed(2)}`,
        {
          description: `Ticket #${res.position?.id || 'ECN-ORD'} confirmed on ${account.server || 'FundedShift-Live01'}.`,
        }
      );
      setStopLoss('');
      setTakeProfit('');
      onOrderExecuted();
    } else {
      toast.error(res.error || 'Failed to execute order.');
    }
  };

  const adjustLot = (delta: number) => {
    setLotSize((prev) => {
      const next = Math.max(0.01, Math.min(maxLotAllowed, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  return (
    <div
      className={cn(
        'bg-card border border-slate-300 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs select-none space-y-4',
        className
      )}
    >
      {/* Top Header: Symbol & Market State */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-sm text-foreground">{selectedSymbol}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-semibold">
              1:{account?.rules?.leverage || 100}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Instant ECN Execution</p>
        </div>

        <div className="text-right">
          {isMarketOpen ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
              MARKET CLOSED
            </span>
          )}
        </div>
      </div>

      {/* Dual Large BUY & SELL Direct Execution Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* SELL (BID) */}
        <button
          type="button"
          disabled={submitting || isTradingLocked || !isMarketOpen}
          onClick={() => handleExecute('SELL')}
          className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-rose-500/10 to-rose-600/15 hover:from-rose-500/20 hover:to-rose-600/25 border border-rose-500/30 text-rose-500 hover:text-rose-400 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-xs"
        >
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>SELL (BID)</span>
          </div>
          <span className="font-mono font-bold text-base sm:text-lg text-foreground tracking-tight">
            {activeQuote.bid ? activeQuote.bid.toFixed(activeQuote.price > 500 ? 2 : 5) : '0.00'}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {lotSize} Lots
          </span>
        </button>

        {/* BUY (ASK) */}
        <button
          type="button"
          disabled={submitting || isTradingLocked || !isMarketOpen}
          onClick={() => handleExecute('BUY')}
          className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-600/15 hover:from-emerald-500/20 hover:to-emerald-600/25 border border-emerald-500/30 text-emerald-500 hover:text-emerald-400 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-xs"
        >
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>BUY (ASK)</span>
          </div>
          <span className="font-mono font-bold text-base sm:text-lg text-foreground tracking-tight">
            {activeQuote.ask ? activeQuote.ask.toFixed(activeQuote.price > 500 ? 2 : 5) : '0.00'}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {lotSize} Lots
          </span>
        </button>
      </div>

      {/* Lot Size Volume Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground text-[11px] uppercase tracking-wider">Volume (Lots)</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Max: {maxLotAllowed} Lots
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => adjustLot(-0.1)}
            className="h-9 w-9 rounded-xl border border-slate-300 dark:border-slate-800 bg-secondary/80 hover:bg-secondary text-foreground font-bold font-mono text-sm transition-all flex items-center justify-center active:scale-95 shrink-0"
          >
            -
          </button>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={maxLotAllowed}
            value={lotSize}
            onChange={(e) => setLotSize(Math.max(0.01, Math.min(maxLotAllowed, parseFloat(e.target.value) || 0.01)))}
            className="flex-1 h-9 bg-background border border-slate-300 dark:border-slate-800 rounded-xl px-3 text-center font-mono font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <button
            type="button"
            onClick={() => adjustLot(0.1)}
            className="h-9 w-9 rounded-xl border border-slate-300 dark:border-slate-800 bg-secondary/80 hover:bg-secondary text-foreground font-bold font-mono text-sm transition-all flex items-center justify-center active:scale-95 shrink-0"
          >
            +
          </button>
        </div>

        {/* Quick Lot Size Pills */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {[0.01, 0.1, 0.5, 1.0, 5.0].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setLotSize(val)}
              className={cn(
                'py-1 rounded-lg font-mono text-[10px] font-bold transition-all border text-center',
                lotSize === val
                  ? 'bg-brand-500 text-white border-brand-600 shadow-xs'
                  : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/50'
              )}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Stop Loss & Take Profit Inputs */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Stop Loss ($)</label>
          <input
            type="number"
            step="any"
            placeholder="Price level"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full h-8 bg-background border border-slate-300 dark:border-slate-800 rounded-lg px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase block">Take Profit ($)</label>
          <input
            type="number"
            step="any"
            placeholder="Price level"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-full h-8 bg-background border border-slate-300 dark:border-slate-800 rounded-lg px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Institutional Margin & Risk Guard Summary */}
      <div className="bg-secondary/40 border border-border/60 rounded-xl p-2.5 space-y-1 font-mono text-[10px]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Required Margin:</span>
          <span className="font-bold text-foreground">${requiredMargin.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Free Margin Available:</span>
          <span className={cn('font-bold', hasSufficientMargin ? 'text-foreground' : 'text-rose-500')}>
            ${freeMargin.toFixed(2)}
          </span>
        </div>
        {!hasSufficientMargin && (
          <div className="pt-1 text-rose-500 font-bold flex items-center gap-1 text-[10px]">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>Warning: Free margin insufficient for this volume.</span>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        disabled={submitting || isTradingLocked || !isMarketOpen || !hasSufficientMargin}
        onClick={() => handleExecute(orderType)}
        className={cn(
          'w-full py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98 text-white cursor-pointer',
          orderType === 'BUY'
            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
            : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20',
          (submitting || isTradingLocked || !isMarketOpen || !hasSufficientMargin) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        <span>
          {submitting
            ? 'Executing Order...'
            : isTradingLocked
            ? `Trading Disabled (${account?.status})`
            : !isMarketOpen
            ? 'Market Closed'
            : `Place ${orderType} ${lotSize} Lots`}
        </span>
      </button>
    </div>
  );
}
