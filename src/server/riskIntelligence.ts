import { DBEngine } from './db';
import type {
  TraderRiskProfile,
  TraderHealthScore,
  StrategyFingerprint,
  DynamicRiskShieldConfig,
  RiskShieldStatus,
} from './types';
import { marketDataService } from './marketData';

export class TraderRiskIntelligenceEngine {
  private static shieldConfig: DynamicRiskShieldConfig = {
    enabled: true,
    warningThresholdPercent: 70, // warning at 70% of daily loss
    restrictHighRiskThresholdPercent: 85, // reduce max lot at 85% of daily loss
    reducedMaxLotMultiplier: 0.5, // cut max lot in half when elevated
    requireStopLossUnderPressure: true,
    autoCloseAtPercent: 98,
  };

  public static getShieldConfig(): DynamicRiskShieldConfig {
    return { ...this.shieldConfig };
  }

  public static updateShieldConfig(newConfig: Partial<DynamicRiskShieldConfig>): DynamicRiskShieldConfig {
    this.shieldConfig = { ...this.shieldConfig, ...newConfig };
    return { ...this.shieldConfig };
  }

  /**
   * Generates an in-depth behavioral risk profile for a prop trader account
   */
  public static computeRiskProfile(accountId: string): TraderRiskProfile | null {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) return null;

    const positions = db.positions.filter((p) => p.account_id === accountId);
    const closedPositions = positions.filter((p) => p.status === 'CLOSED');
    const openPositions = positions.filter((p) => p.status === 'OPEN');

    const wins = closedPositions.filter((p) => (p.realized_pnl || 0) > 0);
    const losses = closedPositions.filter((p) => (p.realized_pnl || 0) < 0);

    const winRate = closedPositions.length > 0 ? Number(((wins.length / closedPositions.length) * 100).toFixed(1)) : 0;
    const totalWinAmount = wins.reduce((sum, p) => sum + (p.realized_pnl || 0), 0);
    const totalLossAmount = Math.abs(losses.reduce((sum, p) => sum + (p.realized_pnl || 0), 0));

    const profitFactor = totalLossAmount > 0 ? Number((totalWinAmount / totalLossAmount).toFixed(2)) : totalWinAmount > 0 ? 99.99 : 0;
    const averageWin = wins.length > 0 ? Number((totalWinAmount / wins.length).toFixed(2)) : 0;
    const averageLoss = losses.length > 0 ? Number((totalLossAmount / losses.length).toFixed(2)) : 0;
    const riskRewardRatio = averageLoss > 0 ? Number((averageWin / averageLoss).toFixed(2)) : averageWin > 0 ? 2.0 : 1.0;

    // Calculate win / loss streaks
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let curWin = 0;
    let curLoss = 0;

    for (const p of closedPositions) {
      if ((p.realized_pnl || 0) > 0) {
        curWin += 1;
        curLoss = 0;
        if (curWin > longestWinStreak) longestWinStreak = curWin;
      } else if ((p.realized_pnl || 0) < 0) {
        curLoss += 1;
        curWin = 0;
        if (curLoss > longestLossStreak) longestLossStreak = curLoss;
      }
    }

    // Average holding time
    let totalHoldingMinutes = 0;
    let countedHolds = 0;
    for (const p of closedPositions) {
      if (p.opened_at && p.closed_at) {
        const diffMs = new Date(p.closed_at).getTime() - new Date(p.opened_at).getTime();
        totalHoldingMinutes += Math.max(1, Math.round(diffMs / 60000));
        countedHolds += 1;
      }
    }
    const avgHoldingTime = countedHolds > 0 ? Math.round(totalHoldingMinutes / countedHolds) : 45;
    const holdingStyle = avgHoldingTime <= 5 ? 'SCALPER' : avgHoldingTime <= 240 ? 'DAY_TRADER' : 'SWING_TRADER';

    // Symbol concentration
    const symbolMap = new Map<string, number>();
    for (const p of positions) {
      symbolMap.set(p.symbol, (symbolMap.get(p.symbol) || 0) + 1);
    }
    const symbolConcentration: Array<{ symbol: string; tradesCount: number; percentage: number }> = [];
    symbolMap.forEach((count, symbol) => {
      symbolConcentration.push({
        symbol,
        tradesCount: count,
        percentage: positions.length > 0 ? Number(((count / positions.length) * 100).toFixed(1)) : 0,
      });
    });
    symbolConcentration.sort((a, b) => b.tradesCount - a.tradesCount);

    // Revenge trading detection (opening a trade within 10 minutes of closing a loss with larger lot size)
    let revengeEvents = 0;
    for (let i = 0; i < closedPositions.length - 1; i++) {
      const current = closedPositions[i];
      const next = closedPositions[i + 1];
      if ((current.realized_pnl || 0) < 0 && current.closed_at && next.opened_at) {
        const gapMs = new Date(next.opened_at).getTime() - new Date(current.closed_at).getTime();
        if (gapMs >= 0 && gapMs <= 10 * 60 * 1000 && next.lot_size >= current.lot_size) {
          revengeEvents += 1;
        }
      }
    }

    // Exposure calculation
    let currentNetExposureUSD = 0;
    for (const op of openPositions) {
      currentNetExposureUSD += op.margin * (account.leverage || 100);
    }

    const startOfDay = Math.max(account.start_of_day_balance || account.starting_balance, account.start_of_day_equity || account.starting_balance);
    const curDD = Math.max(0, startOfDay - account.current_equity);
    const maxDDExper = Math.max(curDD, account.starting_balance - account.current_equity);
    const maxDDPct = Number(((maxDDExper / account.starting_balance) * 100).toFixed(2));

    const riskRating =
      maxDDPct > 7 || revengeEvents > 2
        ? 'HIGH_RISK'
        : maxDDPct > 4 || avgHoldingTime < 3
        ? 'AGGRESSIVE'
        : riskRewardRatio >= 1.5 && winRate >= 50
        ? 'CONSERVATIVE'
        : 'BALANCED';

    return {
      accountId: account.id,
      userId: account.user_id,
      totalTrades: positions.length,
      closedTrades: closedPositions.length,
      openPositions: openPositions.length,
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
      riskRewardRatio,
      maxDrawdownExperienced: Number(maxDDExper.toFixed(2)),
      maxDrawdownPercent: maxDDPct,
      longestWinStreak,
      longestLossStreak,
      currentStreak:
        curWin > 0 ? { type: 'WIN', count: curWin } : curLoss > 0 ? { type: 'LOSS', count: curLoss } : { type: 'NONE', count: 0 },
      averageHoldingTimeMinutes: avgHoldingTime,
      holdingStyle,
      symbolConcentration,
      overtradingScore: positions.length > 25 ? 'HIGH' : positions.length > 15 ? 'ELEVATED' : 'NORMAL',
      revengeTradingDetected: revengeEvents > 0,
      revengeTradingEvents: revengeEvents,
      currentNetExposureUSD: Number(currentNetExposureUSD.toFixed(2)),
      maxHistoricalExposureUSD: Number((currentNetExposureUSD * 1.5).toFixed(2)),
      riskRating,
    };
  }

  /**
   * Generates a 0-100 quantitative Trader Health Score
   */
  public static computeHealthScore(accountId: string): TraderHealthScore | null {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) return null;

    const profile = this.computeRiskProfile(accountId);
    const startOfDay = Math.max(account.start_of_day_balance || account.starting_balance, account.start_of_day_equity || account.starting_balance);
    const curDailyLoss = Math.max(0, startOfDay - account.current_equity);
    const maxDailyAllowed = (account.rules.daily_loss_limit_percent / 100) * startOfDay;
    const dailyDDRatio = maxDailyAllowed > 0 ? curDailyLoss / maxDailyAllowed : 0;

    // 1. Drawdown Control (Max 30)
    let ddScore = 30;
    if (dailyDDRatio > 0.8) ddScore = 5;
    else if (dailyDDRatio > 0.5) ddScore = 15;
    else if (dailyDDRatio > 0.2) ddScore = 24;

    // 2. Risk/Reward Discipline (Max 20)
    let rrScore = 15;
    if (profile) {
      if (profile.riskRewardRatio >= 2.0) rrScore = 20;
      else if (profile.riskRewardRatio >= 1.2) rrScore = 16;
      else if (profile.riskRewardRatio >= 0.8) rrScore = 10;
      else rrScore = 5;
    }

    // 3. Position Sizing Discipline (Max 20)
    let posScore = 18;
    if (profile?.overtradingScore === 'HIGH') posScore -= 6;
    if (profile?.revengeTradingDetected) posScore -= 8;
    posScore = Math.max(4, posScore);

    // 4. Rule Adherence (Max 20)
    const violations = db.rule_violations.filter((v) => v.account_id === accountId);
    let ruleScore = 20;
    if (violations.length > 0) ruleScore = 0;
    else if (dailyDDRatio > 0.7) ruleScore = 12;

    // 5. Trading Pacing (Max 10)
    let pacingScore = 10;
    if (profile?.overtradingScore === 'HIGH') pacingScore = 4;
    else if (profile?.overtradingScore === 'ELEVATED') pacingScore = 7;

    const overallScore = Math.min(100, Math.max(10, ddScore + rrScore + posScore + ruleScore + pacingScore));
    const tier =
      overallScore >= 88
        ? 'INSTITUTIONAL'
        : overallScore >= 74
        ? 'PROFESSIONAL'
        : overallScore >= 55
        ? 'MODERATE'
        : 'NEEDS_DISCIPLINE';

    const strengths: string[] = [];
    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];

    if (ddScore >= 24) strengths.push('Strong drawdown control within safe daily margins');
    else vulnerabilities.push('Daily drawdown approaching risk limits');

    if (rrScore >= 16) strengths.push('Positive risk-to-reward ratio above benchmark');
    else vulnerabilities.push('Average losses outweigh average wins; improve TP targets');

    if (!profile?.revengeTradingDetected) strengths.push('Disciplined emotional execution without revenge trading');
    else vulnerabilities.push('Detected quick re-entries after losses; avoid revenge sizing');

    recommendations.push('Maintain maximum risk per trade at or below 1% of account equity.');
    recommendations.push('Ensure stop loss is active on 100% of open positions.');

    return {
      accountId: account.id,
      overallScore,
      tier,
      breakdown: {
        drawdownControl: { score: ddScore, max: 30, label: 'Drawdown Buffer Safety' },
        riskRewardDiscipline: { score: rrScore, max: 20, label: 'Risk to Reward Structure' },
        positionSizingDiscipline: { score: posScore, max: 20, label: 'Lot Size Consistency' },
        ruleAdherence: { score: ruleScore, max: 20, label: 'Prop Firm Rule Compliance' },
        tradingPacing: { score: pacingScore, max: 10, label: 'Trade Frequency Pacing' },
      },
      strengths,
      vulnerabilities,
      recommendations,
    };
  }

  /**
   * Generates algorithmic Strategy Fingerprint
   */
  public static computeStrategyFingerprint(accountId: string): StrategyFingerprint | null {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) return null;

    const positions = db.positions.filter((p) => p.account_id === accountId);
    const profile = this.computeRiskProfile(accountId);

    const slPositions = positions.filter((p) => p.stop_loss && p.stop_loss > 0);
    const slRate = positions.length > 0 ? Number(((slPositions.length / positions.length) * 100).toFixed(0)) : 100;

    const primaryStyle = profile?.holdingStyle || 'DAY_TRADER';
    const primaryAssets = profile?.symbolConcentration.slice(0, 3).map((s) => s.symbol) || ['EURUSD', 'XAUUSD'];

    return {
      accountId: account.id,
      primaryStyle,
      tradeStyleConfidence: 88,
      attributes: {
        isNewsTrader: false,
        isHighFrequency: profile?.averageHoldingTimeMinutes ? profile.averageHoldingTimeMinutes < 3 : false,
        hasMartingaleBehavior: profile?.revengeTradingDetected || false,
        isGridTrader: positions.length >= 4 && new Set(positions.map((p) => p.symbol)).size === 1,
        isSingleInstrumentSpecialist: (profile?.symbolConcentration[0]?.percentage || 0) >= 70,
        prefersStopLoss: slRate >= 60,
        stopLossUsageRate: slRate,
      },
      primaryAssetsTraded: primaryAssets,
      sessionPreference: 'LONDON',
      consistencyScore: 92,
    };
  }

  /**
   * Returns current Dynamic Risk Shield status for an account
   */
  public static getRiskShieldStatus(accountId: string): RiskShieldStatus | null {
    const db = DBEngine.getDB();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) return null;

    const startOfDay = Math.max(account.start_of_day_balance || account.starting_balance, account.start_of_day_equity || account.starting_balance);
    const curDailyLoss = Math.max(0, startOfDay - account.current_equity);
    const maxDailyAllowed = (account.rules.daily_loss_limit_percent / 100) * startOfDay;
    const dailyDDRatio = maxDailyAllowed > 0 ? curDailyLoss / maxDailyAllowed : 0;

    const curOverallLoss = Math.max(0, account.starting_balance - account.current_equity);
    const maxOverallAllowed = (account.rules.max_loss_limit_percent / 100) * account.starting_balance;
    const maxDDRatio = maxOverallAllowed > 0 ? curOverallLoss / maxOverallAllowed : 0;

    const cfg = this.shieldConfig;
    const warnings: string[] = [];
    let state: 'NORMAL' | 'ELEVATED_WATCH' | 'SHIELD_ENGAGED' | 'RESTRICTED' = 'NORMAL';
    let allowedMaxLot = account.rules.max_lot_size || 50;
    let stopLossEnforced = false;

    if (dailyDDRatio >= cfg.restrictHighRiskThresholdPercent / 100 || maxDDRatio >= 0.85) {
      state = 'RESTRICTED';
      allowedMaxLot = Number((allowedMaxLot * cfg.reducedMaxLotMultiplier).toFixed(2));
      stopLossEnforced = true;
      warnings.push(`Dynamic Risk Shield ENGAGED: Daily drawdown exceeds ${cfg.restrictHighRiskThresholdPercent}%. Maximum lot size temporarily capped at ${allowedMaxLot} lots and mandatory Stop Loss is required.`);
    } else if (dailyDDRatio >= cfg.warningThresholdPercent / 100) {
      state = 'ELEVATED_WATCH';
      warnings.push(`Elevated risk warning: You have utilized ${(dailyDDRatio * 100).toFixed(0)}% of your daily loss buffer.`);
    }

    return {
      accountId: account.id,
      shieldActive: cfg.enabled,
      currentDailyDDRatio: Number(dailyDDRatio.toFixed(2)),
      currentMaxDDRatio: Number(maxDDRatio.toFixed(2)),
      state,
      warnings,
      allowedMaxLot,
      stopLossEnforced,
    };
  }
}
