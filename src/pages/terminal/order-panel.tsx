import React, { useState, useMemo } from 'react';
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
  Calculator,
  Percent,
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
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const balance = Number(account?.current_balance || 100000);
  const equity = Number(account?.current_equity || balance);
  const usedMargin = Number(account?.used_margin || 0);
  const freeMargin = Math.max(0, equity - usedMargin);
  const maxLotAllowed = account?.rules?.max_lot_size || (account?.account_size <= 10000 ? 10 : 50);

  const isJpy = selectedSymbol.toUpperCase().endsWith('JPY');
  const priceDecimals = isJpy ? 3 : 5;
  const pipUnit = isJpy ? 0.01 : 0.0001;

  // Calculate live institutional margin requirement
  const currentPrice = Number(activeQuote?.price || (activeQuote ? (activeQuote.bid + activeQuote.ask) / 2 : 1.085)) || 1.085;
  const requiredMargin = calculateInstitutionalMargin({
    symbol: selectedSymbol,
    lotSize: lotSize || 1,
    entryPrice: currentPrice,
    leverage: account?.rules?.leverage || 100,
  });

  const hasSufficientMargin = freeMargin >= requiredMargin;
  const isMarketOpen = activeQuote.isMarketOpen !== false;
  const isTradingLocked = account?.status === 'BREACHED' || account?.status === 'FAILED' || account?.status === 'PASSED';

  // Professional Forex Pip Value Calculation ($ per pip)
  const pipValue = useMemo(() => {
    const s = selectedSymbol.toUpperCase();
    let perLotUsd = 10; // Standard for USD quote pairs (EURUSD, GBPUSD, AUDUSD, NZDUSD)
    if (isJpy) {
      perLotUsd = currentPrice > 0 ? 1000 / currentPrice : 6.45;
    } else if (s.startsWith('USD') && !s.endsWith('USD')) {
      perLotUsd = currentPrice > 0 ? 10 / currentPrice : 10;
    } else if (s === 'EURGBP') {
      perLotUsd = 12.8;
    }
    return Number((perLotUsd * (lotSize || 0.01)).toFixed(2));
  }, [selectedSymbol, currentPrice, lotSize, isJpy]);

  // Risk / Reward Calculations
  const riskRewardMetrics = useMemo(() => {
    const slNum = parseFloat(stopLoss);
    const tpNum = parseFloat(takeProfit);
    const entryAsk = activeQuote.ask || currentPrice;
    const entryBid = activeQuote.bid || currentPrice;

    const baseEntry = orderType === 'BUY' ? entryAsk : entryBid;

    let slPips = 0;
    let slDollars = 0;
    let slAccountPct = 0;

    if (!isNaN(slNum) && slNum > 0) {
      if (orderType === 'BUY') {
        slPips = Math.max(0, (baseEntry - slNum) / pipUnit);
      } else {
        slPips = Math.max(0, (slNum - baseEntry) / pipUnit);
      }
      slDollars = Number((slPips * pipValue).toFixed(2));
      slAccountPct = equity > 0 ? Number(((slDollars / equity) * 100).toFixed(2)) : 0;
    }

    let tpPips = 0;
    let tpDollars = 0;
    let tpAccountPct = 0;

    if (!isNaN(tpNum) && tpNum > 0) {
      if (orderType === 'BUY') {
        tpPips = Math.max(0, (tpNum - baseEntry) / pipUnit);
      } else {
        tpPips = Math.max(0, (baseEntry - tpNum) / pipUnit);
      }
      tpDollars = Number((tpPips * pipValue).toFixed(2));
      tpAccountPct = equity > 0 ? Number(((tpDollars / equity) * 100).toFixed(2)) : 0;
    }

    const rrRatio = slDollars > 0 && tpDollars > 0 ? Number((tpDollars / slDollars).toFixed(2)) : null;

    return { slPips, slDollars, slAccountPct, tpPips, tpDollars, tpAccountPct, rrRatio };
  }, [stopLoss, takeProfit, orderType, activeQuote, currentPrice, pipUnit, pipValue, equity]);

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
    const execPrice = side === 'BUY' ? activeQuote.ask : activeQuote.bid;
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
        `✓ ${side} ${lotSize} lots executed on ${selectedSymbol} @ ${execPrice.toFixed(priceDecimals)}`,
        {
          description: `Ticket #${res.position?.id ? res.position.id.slice(-6) : 'ECN-ORD'} confirmed on ${account.server || 'FundedShift-Live01'}.`,
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
        'bg-card border border-slate-300 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs select-none space-y-3.5',
        className
      )}
    >
      {/* Top Header: Symbol & Market State */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-sm text-foreground">{selectedSymbol}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-semibold">
              1:{account?.rules?.leverage || 100}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Direct Institutional Forex ECN</p>
        </div>

        <div className="text-right">
          {isMarketOpen ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
              CLOSED
            </span>
          )}
        </div>
      </div>

      {/* Dual Large BUY & SELL Direct Execution Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* SELL (BID) */}
        <button
          type="button"
          disabled={submitting || isTradingLocked || !isMarketOpen}
          onClick={() => {
            setOrderType('SELL');
            handleExecute('SELL');
          }}
          className="group relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-b from-rose-500/10 to-rose-600/15 hover:from-rose-500/20 hover:to-rose-600/25 border border-rose-500/30 text-rose-500 hover:text-rose-400 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>SELL (BID)</span>
          </div>
          <span className="font-mono font-bold text-base sm:text-lg text-foreground tracking-tight">
            {activeQuote.bid ? activeQuote.bid.toFixed(priceDecimals) : '0.00000'}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {lotSize} Lots
          </span>
        </button>

        {/* BUY (ASK) */}
        <button
          type="button"
          disabled={submitting || isTradingLocked || !isMarketOpen}
          onClick={() => {
            setOrderType('BUY');
            handleExecute('BUY');
          }}
          className="group relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-600/15 hover:from-emerald-500/20 hover:to-emerald-600/25 border border-emerald-500/30 text-emerald-500 hover:text-emerald-400 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>BUY (ASK)</span>
          </div>
          <span className="font-mono font-bold text-base sm:text-lg text-foreground tracking-tight">
            {activeQuote.ask ? activeQuote.ask.toFixed(priceDecimals) : '0.00000'}
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
            className="h-8 w-8 rounded-xl border border-slate-300 dark:border-slate-800 bg-secondary/80 hover:bg-secondary text-foreground font-bold font-mono text-sm transition-all flex items-center justify-center active:scale-95 shrink-0"
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
            className="flex-1 h-8 bg-background border border-slate-300 dark:border-slate-800 rounded-xl px-2 text-center font-mono font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <button
            type="button"
            onClick={() => adjustLot(0.1)}
            className="h-8 w-8 rounded-xl border border-slate-300 dark:border-slate-800 bg-secondary/80 hover:bg-secondary text-foreground font-bold font-mono text-sm transition-all flex items-center justify-center active:scale-95 shrink-0"
          >
            +
          </button>
        </div>

        {/* Quick Lot Size Pills */}
        <div className="grid grid-cols-5 gap-1 pt-0.5">
          {[0.05, 0.1, 0.5, 1.0, 5.0].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setLotSize(val)}
              className={cn(
                'py-1 rounded-lg font-mono text-[10px] font-bold transition-all border text-center cursor-pointer',
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

      {/* Pip Value & Contract Spec Pill */}
      <div className="bg-secondary/30 border border-border/50 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calculator className="h-3 w-3 text-brand-400" />
          <span>Pip Value:</span>
        </div>
        <span className="font-bold text-brand-400">${pipValue.toFixed(2)} / pip</span>
      </div>

      {/* Stop Loss & Take Profit Inputs */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Stop Loss</label>
            {riskRewardMetrics.slDollars > 0 && (
              <span className="text-[9px] font-mono font-bold text-rose-500">
                -${riskRewardMetrics.slDollars} ({riskRewardMetrics.slAccountPct}%)
              </span>
            )}
          </div>
          <input
            type="number"
            step="any"
            placeholder={activeQuote.bid ? (activeQuote.bid - (isJpy ? 0.3 : 0.003)).toFixed(priceDecimals) : 'SL Rate'}
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full h-8 bg-background border border-slate-300 dark:border-slate-800 rounded-lg px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          {riskRewardMetrics.slPips > 0 && (
            <span className="text-[9px] text-muted-foreground font-mono block text-right">
              {riskRewardMetrics.slPips.toFixed(1)} pips
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Take Profit</label>
            {riskRewardMetrics.tpDollars > 0 && (
              <span className="text-[9px] font-mono font-bold text-emerald-500">
                +${riskRewardMetrics.tpDollars} ({riskRewardMetrics.tpAccountPct}%)
              </span>
            )}
          </div>
          <input
            type="number"
            step="any"
            placeholder={activeQuote.ask ? (activeQuote.ask + (isJpy ? 0.6 : 0.006)).toFixed(priceDecimals) : 'TP Rate'}
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-full h-8 bg-background border border-slate-300 dark:border-slate-800 rounded-lg px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {riskRewardMetrics.tpPips > 0 && (
            <span className="text-[9px] text-muted-foreground font-mono block text-right">
              {riskRewardMetrics.tpPips.toFixed(1)} pips
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Risk:Reward Indicator Badge */}
      {riskRewardMetrics.rrRatio !== null && (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg px-2.5 py-1 flex items-center justify-between text-[10px] font-mono">
          <span className="text-brand-400 font-bold uppercase">Risk : Reward Ratio</span>
          <span className="text-foreground font-bold">1 : {riskRewardMetrics.rrRatio}</span>
        </div>
      )}

      {/* Institutional Margin & Risk Guard Summary */}
      <div className="bg-secondary/40 border border-border/60 rounded-xl p-2 space-y-1 font-mono text-[10px]">
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

      {/* Direct One-Click Execution Button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOrderType('BUY')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer text-center',
            orderType === 'BUY'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'border-border/60 text-muted-foreground hover:text-foreground'
          )}
        >
          BUY Order
        </button>
        <button
          type="button"
          onClick={() => setOrderType('SELL')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer text-center',
            orderType === 'SELL'
              ? 'bg-rose-500/20 border-rose-500 text-rose-400'
              : 'border-border/60 text-muted-foreground hover:text-foreground'
          )}
        >
          SELL Order
        </button>
      </div>

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
            : `Place ${orderType} ${lotSize} Lots @ ${orderType === 'BUY' ? (activeQuote.ask || currentPrice).toFixed(priceDecimals) : (activeQuote.bid || currentPrice).toFixed(priceDecimals)}`}
        </span>
      </button>
    </div>
  );
}
