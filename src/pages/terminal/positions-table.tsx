import React, { useState } from 'react';
import {
  Layers,
  History,
  Shield,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Sliders,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  closePositionApi,
  partialClosePositionApi,
  updatePositionSLTPApi,
} from '@/lib/api-client';

interface PositionsTableProps {
  account: any;
  positions: any[];
  onRefresh: () => void;
  className?: string;
}

export function PositionsTable({
  account,
  positions,
  onRefresh,
  className,
}: PositionsTableProps) {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'HISTORY' | 'RULES'>('POSITIONS');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Edit SL/TP Modal state
  const [editingPosition, setEditingPosition] = useState<any | null>(null);
  const [editSl, setEditSl] = useState<string>('');
  const [editTp, setEditTp] = useState<string>('');
  const [savingSlTp, setSavingSlTp] = useState(false);

  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const closedPositions = positions.filter((p) => p.status === 'CLOSED');

  // Full Close Position
  const handleClose = async (positionId: string) => {
    if (!account) return;
    setClosingId(positionId);
    const res = await closePositionApi({
      userId: account.user_id,
      accountId: account.id,
      positionId,
    });
    setClosingId(null);

    if (res.success) {
      toast.success(`✓ Position #${positionId.slice(-6)} closed at market rate.`);
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to close position.');
    }
  };

  // Close All Open Positions
  const handleCloseAll = async () => {
    if (!account || openPositions.length === 0) return;
    setClosingAll(true);
    let count = 0;
    for (const pos of openPositions) {
      const res = await closePositionApi({
        userId: account.user_id,
        accountId: account.id,
        positionId: pos.id,
      });
      if (res.success) count++;
    }
    setClosingAll(false);
    toast.success(`✓ Liquidated ${count} open positions.`);
    onRefresh();
  };

  // 1-Click Partial Close (50%)
  const handlePartialClose = async (pos: any) => {
    if (!account) return;
    const halfLots = Number((pos.lot_size / 2).toFixed(2));
    if (halfLots <= 0 || halfLots >= pos.lot_size) {
      toast.error('Lot size too small to divide partially.');
      return;
    }

    setActionLoadingId(pos.id);
    const res = await partialClosePositionApi({
      userId: account.user_id,
      accountId: account.id,
      positionId: pos.id,
      lotsToClose: halfLots,
    });
    setActionLoadingId(null);

    if (res.success) {
      toast.success(`✓ Partially closed ${halfLots} lots on #${pos.id.slice(-6)}.`);
      onRefresh();
    } else {
      toast.error(res.error || 'Partial close failed.');
    }
  };

  // 1-Click Move SL to Break-Even (entry price)
  const handleBreakEven = async (pos: any) => {
    if (!account) return;
    setActionLoadingId(pos.id);
    const res = await updatePositionSLTPApi({
      userId: account.user_id,
      accountId: account.id,
      positionId: pos.id,
      stopLoss: pos.open_price,
    });
    setActionLoadingId(null);

    if (res.success) {
      toast.success(`✓ Stop Loss on #${pos.id.slice(-6)} set to Break-Even (${pos.open_price}). Trade is now 100% risk-free!`);
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to update SL.');
    }
  };

  // Open Edit SL/TP Dialog
  const openEditModal = (pos: any) => {
    setEditingPosition(pos);
    setEditSl(pos.stop_loss !== undefined && pos.stop_loss !== null ? String(pos.stop_loss) : '');
    setEditTp(pos.take_profit !== undefined && pos.take_profit !== null ? String(pos.take_profit) : '');
  };

  // Save SL / TP Changes
  const handleSaveSlTp = async () => {
    if (!account || !editingPosition) return;
    setSavingSlTp(true);
    const res = await updatePositionSLTPApi({
      userId: account.user_id,
      accountId: account.id,
      positionId: editingPosition.id,
      stopLoss: editSl.trim() ? parseFloat(editSl) : null,
      takeProfit: editTp.trim() ? parseFloat(editTp) : null,
    });
    setSavingSlTp(false);

    if (res.success) {
      toast.success(`✓ SL/TP parameters updated on #${editingPosition.id.slice(-6)}.`);
      setEditingPosition(null);
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to update SL/TP.');
    }
  };

  // Core Financial & Margin Calculations
  const startingBal = Number(account?.starting_balance || 100000);
  const balance = Number(account?.current_balance || startingBal);
  const openPnLTotal = openPositions.reduce((sum, p) => sum + (p.floating_pnl || 0), 0);
  const currentEquity = Number(account?.current_equity ?? (balance + openPnLTotal));
  const usedMargin = openPositions.reduce((sum, p) => sum + (p.margin || 0), 0);
  const freeMargin = Math.max(0, currentEquity - usedMargin);
  const marginLevel = usedMargin > 0 ? ((currentEquity / usedMargin) * 100).toFixed(0) : '∞';

  // Rule Metrics
  const sodBaseline = Math.max(
    Number(account?.start_of_day_balance || startingBal),
    Number(account?.start_of_day_equity || startingBal)
  );
  const currentDailyLoss = Math.max(0, sodBaseline - currentEquity);
  const maxDailyAllowed = ((account?.rules?.daily_loss_limit_percent || 5) / 100) * sodBaseline;
  const dailyLossPct = Math.min(100, (currentDailyLoss / maxDailyAllowed) * 100);

  const currentOverallLoss = Math.max(0, startingBal - currentEquity);
  const maxOverallAllowed = ((account?.rules?.max_loss_limit_percent || 10) / 100) * startingBal;
  const overallLossPct = Math.min(100, (currentOverallLoss / maxOverallAllowed) * 100);

  const profitTargetPct = account?.rules?.profit_target_percent || 8;
  const profitTargetAmt = (profitTargetPct / 100) * startingBal;
  const currentProfit = Math.max(0, currentEquity - startingBal);
  const targetProgressPct = Math.min(100, (currentProfit / (profitTargetAmt || 1)) * 100);

  return (
    <div
      className={cn(
        'bg-slate-900 border-t border-slate-800 text-slate-100 flex flex-col h-full overflow-hidden select-none',
        className
      )}
    >
      {/* 1. Institutional Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-950/60 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('POSITIONS')}
            className={cn(
              'px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs',
              activeTab === 'POSITIONS'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Open Positions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-brand-400 font-bold border border-slate-700">
              {openPositions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs',
              activeTab === 'HISTORY'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>Closed History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
              {closedPositions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RULES')}
            className={cn(
              'px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs',
              activeTab === 'RULES'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Objectives & Drawdown Guard</span>
          </button>
        </div>

        {/* Right Tab Controls: Close All and Refresh */}
        <div className="flex items-center gap-2">
          {activeTab === 'POSITIONS' && openPositions.length > 0 && (
            <button
              type="button"
              disabled={closingAll}
              onClick={handleCloseAll}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {closingAll ? 'Liquidating...' : 'Close All Trades'}
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-700/70 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Positions"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Tab Body Content Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 bg-slate-950/40">
        {/* Tab 1: Open Positions Table */}
        {activeTab === 'POSITIONS' && (
          <>
            {openPositions.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1">
                <Layers className="h-8 w-8 opacity-20 mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-300">No Open Forex Positions</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Select a currency pair in Market Watch and execute a BUY or SELL order to open institutional ECN positions.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono select-none">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-sans font-bold border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">Ticket</th>
                    <th className="py-2 px-3">Symbol</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Volume</th>
                    <th className="py-2 px-3">Open Price</th>
                    <th className="py-2 px-3">SL / TP</th>
                    <th className="py-2 px-3">Margin</th>
                    <th className="py-2 px-3">Floating P/L</th>
                    <th className="py-2 px-3 text-right">Quick Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {openPositions.map((pos) => {
                    const isProfit = (pos.floating_pnl || 0) >= 0;
                    const isActionLoading = actionLoadingId === pos.id;
                    const canBreakEven = isProfit && pos.stop_loss !== pos.open_price;

                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-400">#{pos.id.slice(-6)}</td>
                        <td className="py-2 px-3 font-bold text-white tracking-wide">{pos.symbol}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-0.5',
                              pos.type === 'BUY'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            )}
                          >
                            {pos.type === 'BUY' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {pos.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-200">{pos.lot_size} Lots</td>
                        <td className="py-2 px-3 text-slate-300">{pos.open_price}</td>

                        {/* SL / TP with Click to Edit */}
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(pos)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer group"
                            title="Click to modify Stop Loss and Take Profit"
                          >
                            <span>
                              {pos.stop_loss || '-'} / {pos.take_profit || '-'}
                            </span>
                            <Edit3 className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 text-brand-400" />
                          </button>
                        </td>

                        <td className="py-2 px-3 text-slate-400">${(pos.margin || 0).toFixed(2)}</td>

                        {/* Floating P/L */}
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'font-bold text-xs font-mono',
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            )}
                          >
                            {isProfit ? '+' : ''}${pos.floating_pnl?.toFixed(2)}
                          </span>
                        </td>

                        {/* Quick Trade Controls: BE, ½ Close, Close */}
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Break Even button */}
                            {canBreakEven && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleBreakEven(pos)}
                                className="px-2 py-0.5 rounded bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-400 font-bold text-[10px] transition-all cursor-pointer"
                                title="Move Stop Loss to Entry Price (Break Even)"
                              >
                                BE
                              </button>
                            )}

                            {/* Partial Close 50% */}
                            {pos.lot_size >= 0.02 && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handlePartialClose(pos)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] transition-all cursor-pointer border border-slate-700"
                                title="Close 50% of position volume"
                              >
                                ½ Close
                              </button>
                            )}

                            {/* Full Close */}
                            <button
                              type="button"
                              disabled={closingId === pos.id || isActionLoading}
                              onClick={() => handleClose(pos.id)}
                              className="px-2.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-[10px] transition-all border border-rose-500/40 disabled:opacity-50 cursor-pointer"
                            >
                              {closingId === pos.id ? '...' : 'Close'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Tab 2: Closed Trade History Table */}
        {activeTab === 'HISTORY' && (
          <>
            {closedPositions.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1">
                <History className="h-8 w-8 opacity-20 mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-300">No Closed Trades Yet</p>
                <p className="text-[11px] text-slate-500">
                  Archived execution records and audit receipts will populate here when trades are liquidated.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono select-none">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-sans font-bold border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">Ticket</th>
                    <th className="py-2 px-3">Symbol</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Lots</th>
                    <th className="py-2 px-3">Entry</th>
                    <th className="py-2 px-3">Exit</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Realized P/L</th>
                    <th className="py-2 px-3 text-right">Closed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {closedPositions.map((pos) => {
                    const isProfit = (pos.realized_pnl || 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-400">#{pos.id.slice(-6)}</td>
                        <td className="py-2 px-3 font-bold text-white tracking-wide">{pos.symbol}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              pos.type === 'BUY'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            )}
                          >
                            {pos.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-200">{pos.lot_size} Lots</td>
                        <td className="py-2 px-3 text-slate-300">{pos.open_price}</td>
                        <td className="py-2 px-3 text-slate-300">{pos.close_price || '-'}</td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">{pos.close_reason || 'MANUAL'}</td>
                        <td className="py-2 px-3 font-bold">
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : ''}${pos.realized_pnl?.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          {pos.closed_at ? new Date(pos.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Tab 3: Objectives & Drawdown Guard */}
        {activeTab === 'RULES' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            {/* Daily Drawdown Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  Daily Drawdown Limit
                </span>
                <span className={cn('font-bold', dailyLossPct > 80 ? 'text-rose-400' : 'text-emerald-400')}>
                  {dailyLossPct.toFixed(1)}% / 100%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    dailyLossPct > 80 ? 'bg-rose-500' : dailyLossPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${dailyLossPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Loss: ${currentDailyLoss.toFixed(2)}</span>
                <span>Max Limit (5%): ${maxDailyAllowed.toFixed(2)}</span>
              </div>
            </div>

            {/* Max Overall Drawdown Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Max Overall Drawdown
                </span>
                <span className={cn('font-bold', overallLossPct > 80 ? 'text-rose-400' : 'text-emerald-400')}>
                  {overallLossPct.toFixed(1)}% / 100%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    overallLossPct > 80 ? 'bg-rose-500' : overallLossPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${overallLossPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Loss: ${currentOverallLoss.toFixed(2)}</span>
                <span>Max Limit (10%): ${maxOverallAllowed.toFixed(2)}</span>
              </div>
            </div>

            {/* Profit Target Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                  Profit Target ({profitTargetPct}%)
                </span>
                <span className="font-bold text-brand-400">
                  {targetProgressPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                  style={{ width: `${targetProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Current: +${currentProfit.toFixed(2)}</span>
                <span>Target: ${profitTargetAmt.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Institutional Trade Bottom Summary HUD Bar */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between shrink-0 overflow-x-auto gap-4">
        <div className="flex items-center gap-4 whitespace-nowrap">
          <div>
            <span className="text-slate-500 uppercase text-[10px] mr-1">Balance:</span>
            <span className="font-bold text-white">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] mr-1">Equity:</span>
            <span className={cn('font-bold', currentEquity >= balance ? 'text-emerald-400' : 'text-rose-400')}>
              ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] mr-1">Margin:</span>
            <span className="font-bold text-slate-200">${usedMargin.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] mr-1">Free Margin:</span>
            <span className="font-bold text-white">${freeMargin.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px] mr-1">Level:</span>
            <span className="font-bold text-brand-400">{marginLevel}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-500 uppercase text-[10px]">Floating P/L:</span>
          <span
            className={cn(
              'font-bold px-2 py-0.5 rounded text-xs',
              openPnLTotal > 0
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : openPnLTotal < 0
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-400'
            )}
          >
            {openPnLTotal > 0 ? '+' : ''}${openPnLTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 4. Edit SL/TP Dialog Modal */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-sm text-white">Modify Position #{editingPosition.id.slice(-6)}</h3>
                <p className="text-[11px] font-mono text-slate-400">
                  {editingPosition.symbol} · {editingPosition.type} · {editingPosition.lot_size} Lots @ {editingPosition.open_price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPosition(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">Stop Loss Rate</label>
                  <button
                    type="button"
                    onClick={() => setEditSl(String(editingPosition.open_price))}
                    className="text-[10px] text-brand-400 hover:underline"
                  >
                    Set Break-Even ({editingPosition.open_price})
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={editSl}
                  onChange={(e) => setEditSl(e.target.value)}
                  placeholder="Leave blank to remove"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Take Profit Rate</label>
                <input
                  type="number"
                  step="any"
                  value={editTp}
                  onChange={(e) => setEditTp(e.target.value)}
                  placeholder="Leave blank to remove"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPosition(null)}
                className="flex-1 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingSlTp}
                onClick={handleSaveSlTp}
                className="flex-1 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
              >
                {savingSlTp ? 'Saving...' : 'Update SL / TP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
