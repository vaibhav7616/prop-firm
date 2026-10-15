import React, { useState } from 'react';
import {
  Layers,
  History,
  Shield,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { closePositionApi } from '@/lib/api-client';

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

  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const closedPositions = positions.filter((p) => p.status === 'CLOSED');

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
      toast.success(`Position closed successfully.`);
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to close position.');
    }
  };

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
    toast.success(`Closed ${count} open positions.`);
    onRefresh();
  };

  // Rule metrics
  const startingBal = Number(account?.starting_balance || 100000);
  const currentEquity = Number(account?.current_equity || startingBal);
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
        'bg-card border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col',
        className
      )}
    >
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2 bg-secondary/30 dark:bg-slate-900/40 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('POSITIONS')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5',
              activeTab === 'POSITIONS'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Open Positions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
              {openPositions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5',
              activeTab === 'HISTORY'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>Trade History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-secondary text-[10px] font-mono">
              {closedPositions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RULES')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5',
              activeTab === 'RULES'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Objectives & Risk</span>
          </button>
        </div>

        {/* Right Tab Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'POSITIONS' && openPositions.length > 0 && (
            <button
              type="button"
              disabled={closingAll}
              onClick={handleCloseAll}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[11px] font-bold transition-all disabled:opacity-50"
            >
              {closingAll ? 'Closing All...' : 'Close All Positions'}
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Refresh Positions"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Body Contents */}
      <div className="flex-1 overflow-x-auto min-h-[160px] max-h-72 overflow-y-auto">
        {/* Tab 1: Open Positions Table */}
        {activeTab === 'POSITIONS' && (
          <>
            {openPositions.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-1">
                <Layers className="h-7 w-7 opacity-30 mb-1" />
                <p className="text-xs font-semibold text-foreground">No Open Executions</p>
                <p className="text-[11px] max-w-sm">
                  Select an instrument above and use the BUY/SELL panel to execute institutional ECN orders.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono select-none">
                <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] font-sans font-bold border-b border-border/60 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Ticket</th>
                    <th className="py-2 px-3">Symbol</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Volume</th>
                    <th className="py-2 px-3">Open Price</th>
                    <th className="py-2 px-3">SL / TP</th>
                    <th className="py-2 px-3">Commission</th>
                    <th className="py-2 px-3">Floating P/L</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {openPositions.map((pos) => {
                    const isProfit = (pos.floating_pnl || 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground">#{pos.id.slice(-6)}</td>
                        <td className="py-2 px-3 font-bold text-foreground">{pos.symbol}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              pos.type === 'BUY'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            )}
                          >
                            {pos.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">{pos.lot_size} Lots</td>
                        <td className="py-2 px-3">{pos.open_price}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {pos.stop_loss || '-'} / {pos.take_profit || '-'}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">-${pos.commission || 0}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'font-bold text-xs font-mono',
                              isProfit ? 'text-emerald-500' : 'text-rose-500'
                            )}
                          >
                            {isProfit ? '+' : ''}${pos.floating_pnl?.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            disabled={closingId === pos.id}
                            onClick={() => handleClose(pos.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] transition-all disabled:opacity-50 shadow-xs"
                          >
                            {closingId === pos.id ? 'Closing...' : 'Close'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Tab 2: Closed Trade History */}
        {activeTab === 'HISTORY' && (
          <>
            {closedPositions.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-1">
                <History className="h-7 w-7 opacity-30 mb-1" />
                <p className="text-xs font-semibold text-foreground">No Closed Trades Yet</p>
                <p className="text-[11px]">Completed executions will be archived here with detailed audit receipts.</p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono select-none">
                <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] font-sans font-bold border-b border-border/60 sticky top-0">
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
                <tbody className="divide-y divide-border/40">
                  {closedPositions.map((pos) => {
                    const isProfit = (pos.realized_pnl || 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground">#{pos.id.slice(-6)}</td>
                        <td className="py-2 px-3 font-bold text-foreground">{pos.symbol}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              pos.type === 'BUY'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-rose-500/10 text-rose-500'
                            )}
                          >
                            {pos.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">{pos.lot_size}L</td>
                        <td className="py-2 px-3">{pos.open_price}</td>
                        <td className="py-2 px-3">{pos.close_price || '-'}</td>
                        <td className="py-2 px-3 text-muted-foreground text-[10px]">{pos.close_reason || 'MANUAL'}</td>
                        <td className="py-2 px-3 font-bold">
                          <span className={isProfit ? 'text-emerald-500' : 'text-rose-500'}>
                            {isProfit ? '+' : ''}${pos.realized_pnl?.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
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

        {/* Tab 3: Prop Firm Objectives & Risk Monitor */}
        {activeTab === 'RULES' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Daily Drawdown Gauge */}
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Daily Drawdown
                </span>
                <span className="font-bold text-foreground">
                  {dailyLossPct.toFixed(1)}% / 100%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    dailyLossPct > 80 ? 'bg-rose-500' : dailyLossPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${dailyLossPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Loss: ${currentDailyLoss.toFixed(2)}</span>
                <span>Max Limit (5%): ${maxDailyAllowed.toFixed(2)}</span>
              </div>
            </div>

            {/* Max Overall Drawdown Gauge */}
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-foreground text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Max Total Drawdown
                </span>
                <span className="font-bold text-foreground">
                  {overallLossPct.toFixed(1)}% / 100%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    overallLossPct > 80 ? 'bg-rose-500' : overallLossPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${overallLossPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Loss: ${currentOverallLoss.toFixed(2)}</span>
                <span>Max Limit (10%): ${maxOverallAllowed.toFixed(2)}</span>
              </div>
            </div>

            {/* Profit Target Gauge */}
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-foreground text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
                  Profit Target ({profitTargetPct}%)
                </span>
                <span className="font-bold text-foreground">
                  {targetProgressPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                  style={{ width: `${targetProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Current: +${currentProfit.toFixed(2)}</span>
                <span>Target: ${profitTargetAmt.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
