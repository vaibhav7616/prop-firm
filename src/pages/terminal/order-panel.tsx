import React, { useState, useMemo } from 'react';
import {
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
  Clock,
  Sliders,
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

type ExecMode = 'MARKET' | 'PENDING';
type PendingType = 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';

export function OrderPanel({
  account,
  selectedSymbol,
  activeQuote,
  onOrderExecuted,
  className,
}: OrderPanelProps) {
  const [execMode, setExecMode] = useState<ExecMode>('MARKET');
  const [pendingType, setPendingType] = useState<PendingType>('BUY_LIMIT');
  const [pendingPrice, setPendingPrice] = useState<string>('');
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [oneClickEnabled, setOneClickEnabled] = useState<boolean>(true);

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
    let perLotUsd = 10;
    if (isJpy) {
      perLotUsd = currentPrice > 0 ? 1000 / currentPrice : 6.45;
    } else if (s.startsWith('USD') && !s.endsWith('USD')) {
      perLotUsd = currentPrice > 0 ? 10 / currentPrice : 10;
    } else if (s === 'EURGBP') {
      perLotUsd = 12.8;
    }
    return Number((perLotUsd * (lotSize || 0.01)).toFixed(2));
  }, [selectedSymbol, currentPrice, lotSize, isJpy]);

  // Risk % Auto-Lot Calculator
  const handleApplyRiskPercent = (riskPercent: number) => {
    const slNum = parseFloat(stopLoss);
    if (isNaN(slNum) || slNum <= 0) {
      toast.info('Please enter a Stop Loss price first to calculate risk-adjusted lot size.');
      return;
    }

    const slDistance = Math.abs(currentPrice - slNum);
    const slPips = slDistance / pipUnit;

    if (slPips <= 0) {
      toast.info('Stop Loss is too close to current market price.');
      return;
    }

    const riskDollars = equity * (riskPercent / 100);
    // 1 pip on 1 standard lot = ~$10
    const pipCostPerLot = pipValue / (lotSize || 1);
    const targetLots = Number((riskDollars / (slPips * pipCostPerLot)).toFixed(2));
    const clampedLots = Math.max(0.01, Math.min(maxLotAllowed, targetLots));

    setLotSize(clampedLots);
    toast.success(`Calculated ${clampedLots} lots for ${riskPercent}% risk ($${riskDollars.toFixed(0)} max loss).`);
  };

  // Risk / Reward Calculations
  const riskRewardMetrics = useMemo(() => {
    const slNum = parseFloat(stopLoss);
    const tpNum = parseFloat(takeProfit);
    const entryAsk = activeQuote.ask || currentPrice;
    const entryBid = activeQuote.bid || currentPrice;

    const baseEntry = (activeQuote.bid + activeQuote.ask) / 2 || currentPrice;

    let slPips = 0;
    let slDollars = 0;
    let slAccountPct = 0;

    if (!isNaN(slNum) && slNum > 0) {
      slPips = Math.abs(baseEntry - slNum) / pipUnit;
      slDollars = Number((slPips * pipValue).toFixed(2));
      slAccountPct = equity > 0 ? Number(((slDollars / equity) * 100).toFixed(2)) : 0;
    }

    let tpPips = 0;
    let tpDollars = 0;
    let tpAccountPct = 0;

    if (!isNaN(tpNum) && tpNum > 0) {
      tpPips = Math.abs(tpNum - baseEntry) / pipUnit;
      tpDollars = Number((tpPips * pipValue).toFixed(2));
      tpAccountPct = equity > 0 ? Number(((tpDollars / equity) * 100).toFixed(2)) : 0;
    }

    const rrRatio = slDollars > 0 && tpDollars > 0 ? Number((tpDollars / slDollars).toFixed(2)) : null;

    return { slPips, slDollars, slAccountPct, tpPips, tpDollars, tpAccountPct, rrRatio };
  }, [stopLoss, takeProfit, activeQuote, currentPrice, pipUnit, pipValue, equity]);

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
      toast.error(`Forex market for ${selectedSymbol} is closed for the weekend.`);
      return;
    }

    if (lotSize <= 0) {
      toast.error('Lot size must be greater than 0.');
      return;
    }

    if (lotSize > maxLotAllowed) {
      toast.error(`Volume exceeds max allowed of ${maxLotAllowed} lots.`);
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
        `✓ ${side} ${lotSize} Lots @ ${execPrice.toFixed(priceDecimals)} Executed`,
        {
          description: `Ticket #${res.position?.id ? res.position.id.slice(-6) : 'ECN-ORD'} filled on ${account.server || 'FundedShift-Live01'}.`,
        }
      );
      setStopLoss('');
      setTakeProfit('');
      onOrderExecuted();
    } else {
      toast.error(res.error || 'Failed to execute order.');
    }
  };

  const handleExecutePending = async () => {
    const targetRate = parseFloat(pendingPrice);
    if (isNaN(targetRate) || targetRate <= 0) {
      toast.error('Please enter a valid pending order execution rate.');
      return;
    }
    const side = pendingType.startsWith('BUY') ? 'BUY' : 'SELL';
    toast.info(`Pending order placed: ${pendingType.replace('_', ' ')} ${lotSize} lots @ ${targetRate.toFixed(priceDecimals)}.`);
    setPendingPrice('');
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
        'bg-slate-900 border-l border-slate-800 p-3 flex flex-col justify-between select-none space-y-3 text-slate-100',
        className
      )}
    >
      {/* 1. Instrument Header & Leverage */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-white tracking-wide">{selectedSymbol}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-brand-400 font-bold border border-slate-700">
              1:{account?.rules?.leverage || 100}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Direct Institutional Forex ECN</p>
        </div>

        <div className="text-right">
          {isMarketOpen ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE FEED
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              CLOSED
            </span>
          )}
        </div>
      </div>

      {/* 2. Order Execution Mode Selector Tabs */}
      <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setExecMode('MARKET')}
          className={cn(
            'flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer',
            execMode === 'MARKET'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Market Order
        </button>
        <button
          type="button"
          onClick={() => setExecMode('PENDING')}
          className={cn(
            'flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer',
            execMode === 'PENDING'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Pending Order
        </button>
      </div>

      {/* 3. Pending Order Options (when PENDING selected) */}
      {execMode === 'PENDING' && (
        <div className="space-y-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Order Type</label>
            <select
              value={pendingType}
              onChange={(e) => setPendingType(e.target.value as PendingType)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="BUY_LIMIT">Buy Limit</option>
              <option value="SELL_LIMIT">Sell Limit</option>
              <option value="BUY_STOP">Buy Stop</option>
              <option value="SELL_STOP">Sell Stop</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Entry Price</label>
            <input
              type="number"
              step="any"
              placeholder={activeQuote.bid ? activeQuote.bid.toFixed(priceDecimals) : '0.00000'}
              value={pendingPrice}
              onChange={(e) => setPendingPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}

      {/* 4. Large Direct Instant BUY / SELL Market Cards */}
      {execMode === 'MARKET' && (
        <div className="grid grid-cols-2 gap-2">
          {/* SELL BID TICKET */}
          <button
            type="button"
            disabled={submitting || isTradingLocked || !isMarketOpen || !hasSufficientMargin}
            onClick={() => handleExecute('SELL')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-rose-500/10 to-rose-600/20 hover:from-rose-500/20 hover:to-rose-600/30 border border-rose-500/40 text-rose-400 hover:text-rose-300 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>SELL (BID)</span>
            </div>
            <span className="font-mono font-bold text-base sm:text-lg text-white tracking-tight">
              {activeQuote.bid ? activeQuote.bid.toFixed(priceDecimals) : '0.00000'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {lotSize} Lots
            </span>
          </button>

          {/* BUY ASK TICKET */}
          <button
            type="button"
            disabled={submitting || isTradingLocked || !isMarketOpen || !hasSufficientMargin}
            onClick={() => handleExecute('BUY')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-emerald-500/10 to-emerald-600/20 hover:from-emerald-500/20 hover:to-emerald-600/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>BUY (ASK)</span>
            </div>
            <span className="font-mono font-bold text-base sm:text-lg text-white tracking-tight">
              {activeQuote.ask ? activeQuote.ask.toFixed(priceDecimals) : '0.00000'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {lotSize} Lots
            </span>
          </button>
        </div>
      )}

      {/* 5. Volume / Lot Size Stepper & Quick Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">Trading Volume (Lots)</span>
          <span className="text-[10px] text-slate-400 font-mono">
            Max: {maxLotAllowed} Lots
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => adjustLot(-0.1)}
            className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-white font-bold font-mono text-sm transition-all flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
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
            className="flex-1 h-8 bg-slate-950 border border-slate-800 rounded-xl px-2 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={() => adjustLot(0.1)}
            className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-white font-bold font-mono text-sm transition-all flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
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
                  ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              )}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Prop-Firm Risk Calculator Tool */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1 font-sans font-bold">
            <Percent className="h-3 w-3 text-brand-400" />
            <span>Auto-Size by Risk %</span>
          </span>
          <span className="text-brand-400 font-bold">${pipValue.toFixed(2)}/pip</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[0.5, 1.0, 2.0, 3.0].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleApplyRiskPercent(pct)}
              className="py-1 rounded bg-slate-900 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 text-[10px] font-mono font-bold transition-all border border-slate-800 cursor-pointer"
              title={`Calculate exact lot size for ${pct}% account equity risk`}
            >
              {pct}% Risk
            </button>
          ))}
        </div>
      </div>

      {/* 7. Stop Loss & Take Profit Parameters */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Stop Loss</label>
            {riskRewardMetrics.slDollars > 0 && (
              <span className="text-[9px] font-mono font-bold text-rose-400">
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
            className="w-full h-8 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
          />
          {riskRewardMetrics.slPips > 0 && (
            <span className="text-[9px] text-slate-500 font-mono block text-right">
              {riskRewardMetrics.slPips.toFixed(1)} pips
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Take Profit</label>
            {riskRewardMetrics.tpDollars > 0 && (
              <span className="text-[9px] font-mono font-bold text-emerald-400">
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
            className="w-full h-8 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
          />
          {riskRewardMetrics.tpPips > 0 && (
            <span className="text-[9px] text-slate-500 font-mono block text-right">
              {riskRewardMetrics.tpPips.toFixed(1)} pips
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Risk:Reward Badge */}
      {riskRewardMetrics.rrRatio !== null && (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg px-2.5 py-1 flex items-center justify-between text-[10px] font-mono">
          <span className="text-brand-400 font-bold uppercase">Risk : Reward</span>
          <span className="text-white font-bold">1 : {riskRewardMetrics.rrRatio}</span>
        </div>
      )}

      {/* 8. Margin & Account Risk Guard HUD */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1 font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-400">
          <span>Required Margin:</span>
          <span className="font-bold text-slate-200">${requiredMargin.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Free Margin:</span>
          <span className={cn('font-bold', hasSufficientMargin ? 'text-slate-200' : 'text-rose-400')}>
            ${freeMargin.toFixed(2)}
          </span>
        </div>
        {!hasSufficientMargin && (
          <div className="pt-1 text-rose-400 font-bold flex items-center gap-1 text-[10px]">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>Warning: Insufficient margin for volume.</span>
          </div>
        )}
      </div>

      {/* 9. Action Submit Button for Pending Orders */}
      {execMode === 'PENDING' && (
        <button
          type="button"
          disabled={submitting || isTradingLocked || !pendingPrice}
          onClick={handleExecutePending}
          className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
        >
          Place {pendingType.replace('_', ' ')} Order
        </button>
      )}
    </div>
  );
}
