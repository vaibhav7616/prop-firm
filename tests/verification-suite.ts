/**
 * FundedShift Prop Firm Platform - Comprehensive Automated Verification Test Suite
 * Executes end-to-end tests across all backend engines, security layers, and differentiated features.
 */

import { DBEngine, hashPassword, verifyPassword } from '../src/server/db';
import { generateToken, verifyToken, sanitizeUser } from '../src/server/auth';
import { tradeExecutionEngine } from '../src/server/tradeEngine';
import { RuleEngine } from '../src/server/ruleEngine';
import { PayoutEngine } from '../src/server/payoutEngine';
import { paymentService } from '../src/server/paymentEngine';
import { TraderRiskIntelligenceEngine } from '../src/server/riskIntelligence';
import { TradeSimulatorEngine } from '../src/server/simulator';
import { TraderTimelineEngine } from '../src/server/timeline';
import { calculateMT5PnL, calculateInstitutionalMargin } from '../src/server/mt5';
import { marketDataService } from '../src/server/marketData';

export interface TestResultItem {
  category: string;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResultItem[];
}

export async function runAutomatedVerificationTests(): Promise<TestSuiteSummary> {
  const results: TestResultItem[] = [];
  const db = DBEngine.getDB();

  async function test(category: string, name: string, fn: () => void | Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      results.push({
        category,
        name,
        passed: true,
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        message: err.message || String(err),
        durationMs: Date.now() - start,
      });
    }
  }

  function assert(condition: any, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // =============================================================
  // 1. AUTHENTICATION & SECURITY TESTS
  // =============================================================
  await test('Authentication', 'Password Hashing & PBKDF2 Verification', () => {
    const rawPass = 'SecretTraderPass99!';
    const hash = hashPassword(rawPass);
    assert(typeof hash === 'string' && hash.length === 128, 'Hash must be 128 character hex string');
    assert(verifyPassword(rawPass, hash), 'Valid password must verify against hash');
    assert(!verifyPassword('WrongPass', hash), 'Invalid password must be rejected');
  });

  await test('Authentication', 'Cryptographic HMAC-SHA256 JWT Generation & Verification', () => {
    const mockUser: any = {
      id: 'test-user-auth-1',
      email: 'unit-tester@propfirm.com',
      role: 'USER',
      full_name: 'Test Trader',
    };
    const token = generateToken(mockUser, 3600);
    assert(token && token.split('.').length === 3, 'Token must be valid 3-part JWT');

    const decoded = verifyToken(token);
    assert(decoded !== null, 'Token must decode successfully');
    assert(decoded?.sub === mockUser.id, 'Decoded sub must match user ID');
    assert(decoded?.role === 'USER', 'Decoded role must match USER');

    const tampered = token.slice(0, -5) + 'xxxxx';
    assert(verifyToken(tampered) === null, 'Tampered token signature must be rejected');
  });

  await test('Authentication', 'User Sanitization (Credential Leaks Prevention)', () => {
    const sensitiveUser: any = {
      id: 'u-1',
      email: 'trader@propfirm.com',
      password_hash: 'super_secret_hash_value',
      full_name: 'Trader',
      role: 'USER',
    };
    const safe = sanitizeUser(sensitiveUser);
    assert(!('password_hash' in safe), 'password_hash must be completely stripped');
    assert(safe.id === 'u-1' && safe.email === 'trader@propfirm.com', 'Public fields must be preserved');
  });

  // =============================================================
  // 2. PROP FIRM TRADING ENGINE & MT5 CALCULATIONS
  // =============================================================
  await test('Trading Engine', 'Institutional Forex MT5 P&L Calculation (EURUSD)', () => {
    // 1 lot BUY EURUSD opened at 1.1650, current bid 1.1680 (+30 pips)
    const res = calculateMT5PnL({
      symbol: 'EURUSD',
      type: 'BUY',
      lotSize: 1.0,
      openPrice: 1.1650,
      currentBid: 1.1680,
      currentAsk: 1.1682,
      commission: 6.0,
    });
    // 30 pips * 100,000 * 1 = $300 gross. Net = $300 - $6 = $294
    assert(Math.round(res.grossPnl) === 300, `Gross PnL should be $300, got ${res.grossPnl}`);
    assert(Math.round(res.netPnl) === 294, `Net PnL should be $294, got ${res.netPnl}`);
  });

  await test('Trading Engine', 'Commodity MT5 P&L Calculation (Gold XAUUSD)', () => {
    // 1 lot Gold BUY opened at 4500.00, current bid 4510.00 (+$10 gain * 100 oz = $1000 gross)
    const res = calculateMT5PnL({
      symbol: 'XAUUSD',
      type: 'BUY',
      lotSize: 1.0,
      openPrice: 4500.00,
      currentBid: 4510.00,
      currentAsk: 4510.20,
      commission: 6.0,
    });
    assert(Math.round(res.grossPnl) === 1000, `Gold gross PnL should be $1000, got ${res.grossPnl}`);
  });

  await test('Trading Engine', 'Institutional Margin Calculation (EURUSD 1:100 leverage)', () => {
    const margin = calculateInstitutionalMargin({
      symbol: 'EURUSD',
      lotSize: 1.0,
      entryPrice: 1.1670,
      leverage: 100,
      contractSize: 100000,
    });
    // Notional = 1 * 100,000 * 1.1670 = $116,700. Margin = 116,700 / 100 = $1,167
    assert(Math.round(margin) === 1167, `Required margin should be approx $1,167, got ${margin}`);
  });

  await test('Trading Engine', 'Order Placement & Stop Loss Validation', async () => {
    // Test account setup
    const testAccId = `acc-test-order-${Date.now()}`;
    const testUserId = `user-test-${Date.now()}`;
    const testAccount: any = {
      id: testAccId,
      user_id: testUserId,
      account_number: '998811',
      account_size: 100000,
      starting_balance: 100000,
      current_balance: 100000,
      current_equity: 100000,
      highest_balance: 100000,
      highest_equity: 100000,
      start_of_day_balance: 100000,
      start_of_day_equity: 100000,
      status: 'ACTIVE',
      phase: 1,
      trading_days: 1,
      leverage: 100,
      rules: {
        profit_target_percent: 8,
        daily_loss_limit_percent: 5,
        max_loss_limit_percent: 10,
        drawdown_model: 'STATIC',
        min_trading_days: 3,
        max_trading_days: null,
        leverage: 100,
        profit_split_percent: 90,
        max_lot_size: 50,
        max_open_positions: 10,
        news_trading_allowed: true,
        weekend_holding_allowed: true,
        ea_trading_allowed: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.accounts.push(testAccount);

    // 1. Reject negative lot size
    const negRes = await tradeExecutionEngine.executeMarketOrder({
      accountId: testAccId,
      userId: testUserId,
      symbol: 'BTCUSD',
      type: 'BUY',
      lotSize: -1.0,
    });
    assert(!negRes.success, 'Negative lot size must be rejected');

    // 2. Reject BUY with Stop Loss above market price
    const btcQuote = marketDataService.getQuote('BTCUSD');
    const btcAsk = btcQuote ? btcQuote.ask : 72480.0;
    const invalidSLRes = await tradeExecutionEngine.executeMarketOrder({
      accountId: testAccId,
      userId: testUserId,
      symbol: 'BTCUSD',
      type: 'BUY',
      lotSize: 1.0,
      stopLoss: btcAsk + 5000, // strictly above market ask
    });
    assert(!invalidSLRes.success, 'BUY order with Stop Loss above market price must be rejected');

    // 3. Valid order execution (BTCUSD is 24/7 crypto, always open on weekends)
    const validRes = await tradeExecutionEngine.executeMarketOrder({
      accountId: testAccId,
      userId: testUserId,
      symbol: 'BTCUSD',
      type: 'BUY',
      lotSize: 1.0,
      stopLoss: btcAsk - 10000, // valid safe SL below ask
      takeProfit: btcAsk + 15000, // valid TP above ask
    });
    assert(validRes.success && validRes.position, 'Valid market order must execute successfully');
    assert(validRes.position.status === 'OPEN', 'Position status must be OPEN');

    // 4. Partial Close Test (Close 0.5 of 1.0 lot)
    const partRes = await tradeExecutionEngine.partialClosePosition({
      accountId: testAccId,
      userId: testUserId,
      positionId: validRes.position.id,
      lotsToClose: 0.5,
    });
    assert(partRes.success, 'Partial close must execute successfully');
    assert(partRes.remainingPosition?.lot_size === 0.5, 'Remaining lot size must be 0.5');

    // 5. Close remaining position
    const closeRes = await tradeExecutionEngine.closePosition({
      accountId: testAccId,
      userId: testUserId,
      positionId: validRes.position.id,
    });
    assert(closeRes.success, 'Full close must succeed');
  });

  // =============================================================
  // 3. PROP FIRM RULE ENGINE & BREACH LOGIC
  // =============================================================
  await test('Rule Engine', 'Daily Loss Limit Breach & Auto-Liquidation', () => {
    const accId = `acc-test-breach-${Date.now()}`;
    const userId = `user-breach-${Date.now()}`;
    const testAccount: any = {
      id: accId,
      user_id: userId,
      account_number: '776655',
      account_size: 100000,
      starting_balance: 100000,
      current_balance: 100000,
      current_equity: 94000, // $6,000 loss (6% > 5% daily limit)
      highest_balance: 100000,
      highest_equity: 100000,
      start_of_day_balance: 100000,
      start_of_day_equity: 100000,
      status: 'ACTIVE',
      phase: 1,
      trading_days: 1,
      rules: {
        profit_target_percent: 8,
        daily_loss_limit_percent: 5, // $5,000 max daily loss
        max_loss_limit_percent: 10,
        drawdown_model: 'STATIC',
        min_trading_days: 3,
        leverage: 100,
        profit_split_percent: 90,
        max_lot_size: 50,
        max_open_positions: 10,
        news_trading_allowed: true,
        weekend_holding_allowed: true,
        ea_trading_allowed: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.accounts.push(testAccount);

    // Add an open position that should be auto-liquidated on breach
    // In EURUSD, 1 lot = $10/pip. To have a -$6,000 loss, entry price must be 600 pips above current bid
    const eurQuote = marketDataService.getQuote('EURUSD');
    const currentBid = eurQuote ? eurQuote.bid : 1.1673;
    const losingOpenPrice = Number((currentBid + 0.0600).toFixed(5));

    const openPos: any = {
      id: `pos-test-breach-liq-${Date.now()}`,
      account_id: accId,
      user_id: userId,
      symbol: 'EURUSD',
      type: 'BUY',
      lot_size: 1.0,
      open_price: losingOpenPrice,
      margin: 1160,
      floating_pnl: -6000,
      swap: 0,
      commission: 6,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
    };
    db.positions.push(openPos);

    const evalResult = RuleEngine.evaluateAccount(accId);
    assert(evalResult.hasBreached, 'Account with $6,000 loss must trigger hasBreached');
    assert(testAccount.status === 'BREACHED', 'Account status must transition to BREACHED');
    assert(openPos.status === 'CLOSED', 'Open positions must be auto-liquidated on breach');
    assert(openPos.close_reason === 'BREACH_AUTO_CLOSE', 'Close reason must be BREACH_AUTO_CLOSE');

    // Verify Explainable Breach Report
    const explainReports = RuleEngine.getExplainableBreachReport(accId);
    assert(explainReports.length > 0, 'Explainable breach report must be generated');
    assert(explainReports[0].rule_violated === 'DAILY_LOSS', 'Report must state DAILY_LOSS rule');
  });

  await test('Rule Engine', 'Profit Target Pass & Multi-Stage Transition', () => {
    // 2-Step Challenge Phase 1 Pass
    const accId = `acc-test-pass-${Date.now()}`;
    const testAccount: any = {
      id: accId,
      user_id: 'user-pass-tester',
      account_number: '1234567',
      plan_name: '$100,000 Two-Step Evaluation - Step 1',
      type: 'two_step',
      account_size: 100000,
      starting_balance: 100000,
      current_balance: 108500, // +$8,500 (+8.5% > 8% target)
      current_equity: 108500,
      highest_balance: 108500,
      highest_equity: 108500,
      start_of_day_balance: 100000,
      start_of_day_equity: 100000,
      status: 'ACTIVE',
      phase: 1,
      trading_days: 5,
      rules: {
        profit_target_percent: 8,
        daily_loss_limit_percent: 5,
        max_loss_limit_percent: 10,
        drawdown_model: 'STATIC',
        min_trading_days: 3,
        leverage: 100,
        profit_split_percent: 90,
        max_lot_size: 50,
        max_open_positions: 10,
        news_trading_allowed: true,
        weekend_holding_allowed: true,
        ea_trading_allowed: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.accounts.push(testAccount);

    const evalRes = RuleEngine.evaluateAccount(accId);
    assert(evalRes.passedTarget, 'Target reached with flat positions must pass');
    assert(testAccount.status === 'PASSED', 'Account status must be PASSED');
    assert(testAccount.scheduled_transition?.target_type === 'step_2', 'Step 1 must schedule Step 2 Verification');

    // Provision next account
    const step2Acc = RuleEngine.provisionScheduledAccount(accId);
    assert(step2Acc !== null, 'Step 2 account must be provisioned');
    assert(step2Acc?.phase === 2, 'New account phase must be 2');
    assert(step2Acc?.status === 'ACTIVE', 'Step 2 account must be ACTIVE');
    assert(step2Acc?.rules.profit_target_percent === 5, 'Step 2 profit target must be 5%');
  });

  // =============================================================
  // 4. CHECKOUT & AUTHORITATIVE PRICING TESTS
  // =============================================================
  await test('Checkout & Payment', 'Server-Side Authoritative Pricing & Coupon Discounts', async () => {
    const userObj = db.users[0];
    const checkoutRes = await paymentService.processCheckout({
      userId: userObj.id,
      planId: 'plan-2step-100k',
      accountSize: 100000,
      platform: 'fundedshift_terminal',
      paymentMethod: 'visa',
      couponCode: 'PROPFIRM20', // 20% discount
    });

    assert(checkoutRes.success, 'Checkout must succeed');
    assert(checkoutRes.order, 'Order entity must be generated');
    assert(checkoutRes.account, 'Trading account must be provisioned');
    assert(checkoutRes.order.discount_amount > 0, 'Discount must be applied on server');
    assert(checkoutRes.account.account_size === 100000, 'Account size must be 100k');
  });

  // =============================================================
  // 5. PAYOUT ENGINE TESTS
  // =============================================================
  await test('Payout Engine', 'Funded Account Payout Eligibility & Approval Balance Reset', () => {
    const fundedAccId = `acc-funded-payout-${Date.now()}`;
    const fundedAccount: any = {
      id: fundedAccId,
      user_id: 'user-funded-trader',
      account_number: '5544332',
      account_size: 100000,
      starting_balance: 100000,
      current_balance: 106000, // $6,000 profit
      current_equity: 106000,
      highest_balance: 106000,
      highest_equity: 106000,
      start_of_day_balance: 100000,
      start_of_day_equity: 100000,
      status: 'FUNDED',
      phase: 1,
      is_funded: true,
      trading_days: 10,
      rules: {
        profit_target_percent: 0,
        daily_loss_limit_percent: 5,
        max_loss_limit_percent: 10,
        drawdown_model: 'STATIC',
        min_trading_days: 0,
        leverage: 50,
        profit_split_percent: 80, // 80% split
        max_lot_size: 50,
        max_open_positions: 10,
        news_trading_allowed: true,
        weekend_holding_allowed: true,
        ea_trading_allowed: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.accounts.push(fundedAccount);

    // 1. Eligibility Check
    const elig = PayoutEngine.checkPayoutEligibility(fundedAccId, 'user-funded-trader');
    assert(elig.eligible, 'Profitable funded account with no breaches must be eligible');
    assert(elig.profit === 6000, 'Profit must be $6,000');

    // 2. Request Payout
    const reqRes = PayoutEngine.requestPayout({
      accountId: fundedAccId,
      userId: 'user-funded-trader',
      payoutMethod: 'Crypto USDT (TRC20)',
      payoutAddress: 'TXu8vN4pL3qKz9mR2wX1yZ0aB5cC7dE9fG',
    });
    assert(reqRes.success && reqRes.payout, 'Payout request must succeed');
    assert(reqRes.payout.trader_payout_amount === 4800, 'Trader payout should be $4,800 (80% of $6,000)');
    assert(reqRes.payout.firm_share_amount === 1200, 'Firm share should be $1,200 (20%)');

    // 3. Admin Approval & Account Balance Reset
    const adminApproveRes = PayoutEngine.processPayoutAdmin({
      payoutId: reqRes.payout.id,
      adminId: 'admin-vaibhav-id-999',
      action: 'APPROVE',
    });
    assert(adminApproveRes.success, 'Admin approval must succeed');
    assert(adminApproveRes.payout?.status === 'PAID', 'Payout status must be PAID');
    assert(fundedAccount.current_balance === 100000, 'Account balance must reset to starting capital ($100,000)');
    assert(fundedAccount.status === 'FUNDED', 'Account status must remain FUNDED');
  });

  // =============================================================
  // 6. DIFFERENTIATED PROP FIRM ENGINES TESTS
  // =============================================================
  await test('Differentiated Features', 'Rule Simulator (What-If Prospective Trade Engine)', () => {
    const simAccount = db.accounts[0];
    const simRes = TradeSimulatorEngine.simulateTrade({
      accountId: simAccount.id,
      symbol: 'EURUSD',
      type: 'BUY',
      lotSize: 2.0,
      stopLoss: 1.1500,
      takeProfit: 1.1900,
    });
    assert(!('error' in simRes), 'Simulator must calculate successfully without error');
    if (!('error' in simRes)) {
      assert(simRes.requiredMargin > 0, 'Required margin must be computed');
      assert(simRes.riskAtStopLoss !== null, 'Risk at stop loss must be computed');
      assert(typeof simRes.wouldBreachDaily === 'boolean', 'wouldBreachDaily must be a boolean');
      assert(typeof simRes.safetyAdvice === 'string', 'Safety advice must be provided');
    }
  });

  await test('Differentiated Features', 'Trader Risk Intelligence & Health Score (0-100)', () => {
    const targetAccount = db.accounts[0];
    const profile = TraderRiskIntelligenceEngine.computeRiskProfile(targetAccount.id);
    assert(profile !== null, 'Risk profile must be generated');
    assert(typeof profile?.winRate === 'number', 'Win rate must be a number');
    assert(profile?.holdingStyle !== undefined, 'Holding style must be classified');

    const health = TraderRiskIntelligenceEngine.computeHealthScore(targetAccount.id);
    assert(health !== null, 'Health score must be generated');
    assert(health!.overallScore >= 0 && health!.overallScore <= 100, 'Score must be between 0 and 100');
    assert(health!.tier !== undefined, 'Health tier must be assigned');
    assert(health!.breakdown.drawdownControl.score <= 30, 'Drawdown breakdown score within bounds');
  });

  await test('Differentiated Features', 'Performance Timeline & Strategy Fingerprint', () => {
    const targetAccount = db.accounts[0];
    const timeline = TraderTimelineEngine.getAccountTimeline(targetAccount.id);
    assert(Array.isArray(timeline), 'Timeline must return an array');
    assert(timeline.length > 0, 'Timeline must contain at least provisioning event');

    const fingerprint = TraderRiskIntelligenceEngine.computeStrategyFingerprint(targetAccount.id);
    assert(fingerprint !== null, 'Strategy fingerprint must be generated');
    assert(fingerprint?.primaryStyle !== undefined, 'Primary style must be detected');
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
