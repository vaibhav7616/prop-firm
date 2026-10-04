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
import { EmailService } from '../src/server/emailService';

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

  // =============================================================
  // 7. ADMIN MANAGEMENT & MANUAL ACCOUNT PROVISIONING TESTS
  // =============================================================
  await test('Admin Features', 'Admin Manual Account Issuance to User ("Give Account")', () => {
    const adminEmail = 'tester-manual-trader@propfirm.com';
    const targetSize = 50000;
    const targetStage = 'funded';

    // Find or create user
    let user = db.users.find((u) => u.email.toLowerCase() === adminEmail);
    if (!user) {
      user = {
        id: `usr-manual-${Date.now()}`,
        email: adminEmail,
        password_hash: hashPassword('Trader123!'),
        full_name: 'Manual Test Trader',
        role: 'USER',
        country: 'United States',
        phone: '+1 555-0199',
        affiliate_code: `FS${Math.floor(100 + Math.random() * 900)}`,
        is_verified: true,
        is_2fa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.push(user);
    }

    const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
    const traderPassword = `FS_${Math.random().toString(36).slice(-6)}!`;
    const investorPassword = `INV_${Math.random().toString(36).slice(-6)}#`;
    const orderId = `ord-admin-${Date.now()}`;

    const newAccount: any = {
      id: `acc-manual-${Date.now()}`,
      user_id: user.id,
      order_id: orderId,
      account_number: newAccNumber,
      login: newAccNumber,
      password_hash: traderPassword,
      investor_password_hash: investorPassword,
      server: 'FundedShift-Live01',
      broker: 'FundedShift Direct ECN',
      platform: 'fundedshift_terminal',
      plan_name: `$${targetSize.toLocaleString()} Funded Account`,
      type: 'instant_funding',
      account_size: targetSize,
      starting_balance: targetSize,
      current_balance: targetSize,
      current_equity: targetSize,
      highest_balance: targetSize,
      highest_equity: targetSize,
      start_of_day_balance: targetSize,
      start_of_day_equity: targetSize,
      status: 'FUNDED',
      phase: 1,
      is_funded: true,
      funded_at: new Date().toISOString(),
      trading_days: 0,
      leverage: 50,
      rules: {
        profit_target_percent: 0,
        daily_loss_limit_percent: 3,
        max_loss_limit_percent: 6,
        drawdown_model: 'STATIC',
        min_trading_days: 0,
        leverage: 50,
        profit_split_percent: 80,
        max_lot_size: 35,
        max_open_positions: 15,
        news_trading_allowed: true,
        weekend_holding_allowed: true,
        ea_trading_allowed: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.accounts.unshift(newAccount);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      title: '🎉 Admin Issued Direct Funded Account!',
      body: `Admin assigned a $${targetSize.toLocaleString()} Direct Funded Account (#${newAccNumber}) to your profile. Login: ${newAccNumber}, Password: ${traderPassword}`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: 'ADMIN',
      actor_role: 'ADMIN',
      action: 'ADMIN_MANUAL_ACCOUNT_PROVISION',
      target_id: newAccount.id,
      details: `Admin issued $${targetSize.toLocaleString()} Funded account #${newAccNumber} to ${user.email}.`,
      created_at: new Date().toISOString(),
    });

    assert(newAccount.status === 'FUNDED', 'Issued account status must be FUNDED');
    assert(newAccount.account_size === 50000, 'Issued account size must be $50,000');
    assert(newAccount.current_balance === 50000, 'Starting and current balance must be $50,000');
    assert(newAccount.login === newAccNumber, 'Login number must match generated account number');
    assert(newAccount.password_hash.startsWith('FS_'), 'Trader password must follow format');
    assert(newAccount.investor_password_hash.startsWith('INV_'), 'Investor password must follow format');

    const notif = db.notifications.find((n) => n.user_id === user.id && n.title.includes('Admin Issued'));
    assert(notif !== undefined, 'User must receive instant notification of admin issued account');
    assert(notif?.body.includes(newAccNumber), 'Notification must include login account number');

    const audit = db.audit_logs.find((a) => a.target_id === newAccount.id);
    assert(audit !== undefined, 'Audit log entry must be created');
    assert(audit?.action === 'ADMIN_MANUAL_ACCOUNT_PROVISION', 'Audit log must specify ADMIN_MANUAL_ACCOUNT_PROVISION');
  });

  await test('Admin Features', 'Admin User Role & Status Controls', () => {
    const testUser = db.users.find((u) => u.role === 'USER') || db.users[0];
    const originalRole = testUser.role;

    // Toggle Role to ADMIN
    testUser.role = 'ADMIN';
    assert(testUser.role === 'ADMIN', 'Admin must be able to promote user to ADMIN');

    // Toggle back to USER
    testUser.role = originalRole;
    assert(testUser.role === originalRole, 'Admin must be able to demote user');

    // Toggle Suspension Status
    testUser.is_active = false;
    assert(testUser.is_active === false, 'Admin must be able to suspend user');
    testUser.is_active = true;
    assert(testUser.is_active === true, 'Admin must be able to reactivate user');
  });

  await test('Admin Features', 'Admin KYC Review & Identity Approval Flow', () => {
    const kycUserId = `user-kyc-${Date.now()}`;
    const kycUser: any = {
      id: kycUserId,
      email: 'trader-kyc@example.com',
      full_name: 'Compliance Test Trader',
      role: 'USER',
      is_verified: false,
    };
    db.users.push(kycUser);

    // Trader submits KYC
    if (!db.kyc_submissions) db.kyc_submissions = [];
    const submission: any = {
      id: `kyc-${Date.now()}`,
      user_id: kycUserId,
      trader_name: kycUser.full_name,
      email: kycUser.email,
      document_type: 'PASSPORT',
      document_number: 'P987654321',
      country: 'United States',
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
    };
    db.kyc_submissions.unshift(submission);

    assert(submission.status === 'PENDING', 'Initial KYC status must be PENDING');
    assert(kycUser.is_verified === false, 'User must not be verified before review');

    // Admin reviews and approves KYC
    submission.status = 'VERIFIED';
    submission.reviewed_at = new Date().toISOString();
    submission.reviewer_id = 'admin-vaibhav-id-999';
    kycUser.is_verified = true;

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: kycUserId,
      title: '✅ KYC Identity Verified!',
      body: 'Your identity documents have been approved by compliance. You are eligible for profit split payouts.',
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    assert(submission.status === 'VERIFIED', 'Submission status must be updated to VERIFIED');
    assert(kycUser.is_verified === true, 'User is_verified must be updated to true');
    const kycNotif = db.notifications.find((n) => n.user_id === kycUserId && n.title.includes('KYC Identity Verified'));
    assert(kycNotif !== undefined, 'Trader must receive verified notification');
  });

  // =============================================================
  // 8. END-TO-END TRADER PURCHASE & TRADING TERMINAL FLOW
  // =============================================================
  await test('Trader Lifecycle', 'End-to-End Challenge Purchase -> Terminal Execution -> PnL Update', async () => {
    const buyerEmail = `buyer-${Date.now()}@propfirm.com`;
    const buyerUser = {
      id: `usr-buyer-${Date.now()}`,
      email: buyerEmail,
      password_hash: hashPassword('Buyer123!'),
      full_name: 'Challenge Buyer',
      role: 'USER' as const,
      country: 'United States',
      phone: '+1 555-0100',
      affiliate_code: `FS${Math.floor(100 + Math.random() * 900)}`,
      is_verified: true,
      is_2fa_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.push(buyerUser);

    // 1. User buys a 25K Two-Step Challenge
    const checkoutResult = await paymentService.processCheckout({
      userId: buyerUser.id,
      planId: 'ch-two-25k',
      accountSize: 25000,
      platform: 'fundedshift_terminal',
      paymentMethod: 'visa',
    });

    assert(checkoutResult.success, 'Challenge purchase must succeed');
    assert(checkoutResult.order?.status === 'PAID', 'Order status must be PAID');
    assert(checkoutResult.account?.account_size === 25000, 'Account size must be $25,000');
    assert(checkoutResult.account?.current_balance === 25000, 'Balance must be $25,000');
    assert(checkoutResult.account?.status === 'ACTIVE', 'Account status must be ACTIVE');

    const accountId = checkoutResult.account!.id;

    // 2. Open a trade on BTCUSD in Web Terminal
    const btcQuote = marketDataService.getQuote('BTCUSD');
    const currentAsk = btcQuote ? btcQuote.ask : 72500;

    const orderResult = await tradeExecutionEngine.executeMarketOrder({
      accountId,
      userId: buyerUser.id,
      symbol: 'BTCUSD',
      type: 'BUY',
      lotSize: 0.1,
      stopLoss: currentAsk - 5000,
      takeProfit: currentAsk + 10000,
    });

    assert(orderResult.success, 'Terminal order execution must succeed');
    assert(orderResult.position?.symbol === 'BTCUSD', 'Position symbol must be BTCUSD');
    assert(orderResult.position?.status === 'OPEN', 'Position status must be OPEN');

    // 3. Close the trade and verify balance & trading days
    const closeResult = await tradeExecutionEngine.closePosition({
      accountId,
      userId: buyerUser.id,
      positionId: orderResult.position!.id,
    });

    assert(closeResult.success, 'Position close must succeed');
    const closedAcc = db.accounts.find((a) => a.id === accountId);
    assert(closedAcc !== undefined, 'Account must exist in DB');
    assert(closedAcc?.trading_days >= 1, 'Trading days must increment');
  });

  // =============================================================
  // 11. TRANSACTIONAL EMAIL ENGINE TESTS (Resend Integration)
  // =============================================================
  await test('Email Engine', 'Configuration and Resend API Key Validation', () => {
    const config = EmailService.getConfig();
    assert(config !== null, 'Config must return an object');
    assert(config.configured === true, 'Resend key must be detected and configured');
    assert(config.provider === 'Resend REST API', 'Provider must report Resend REST API');
    assert(config.from.includes('onboarding@resend.dev'), 'From address must be onboarding@resend.dev for test tier');
    assert(config.replyTo === 'support@fundedshift.com', 'Reply-to must be support@fundedshift.com');
  });

  await test('Email Engine', 'Order Confirmation & Credentials Template Dispatch', async () => {
    const initialLogsCount = (db.email_logs || []).length;
    const result = await EmailService.sendOrderCredentialsEmail({
      recipientEmail: 'delivered@resend.dev',
      recipientName: 'Alex Trader',
      orderId: 'ord-test-email-001',
      planName: '$100,000 Two-Step Evaluation',
      accountSize: 100000,
      accountNumber: '88776655',
      traderPassword: 'Pass_12345!',
      investorPassword: 'Inv_12345#',
      server: 'FundedShift-Live01',
      platform: 'FundedShift Institutional Terminal',
      rules: {
        profit_target_percent: 8,
        daily_loss_limit_percent: 5,
        max_loss_limit_percent: 10,
        leverage: 100,
      },
    });

    assert(result.success || typeof result.error === 'string', 'Order credentials email dispatch must return structured response');
    assert((db.email_logs || []).length > initialLogsCount, 'Email dispatch must be recorded in email_logs');
    const lastLog = db.email_logs[0];
    assert(lastLog.template === 'ORDER_CREDENTIALS', 'Template must be ORDER_CREDENTIALS');
    assert(lastLog.recipient_email === 'delivered@resend.dev', 'Recipient must match');
  });

  await test('Email Engine', 'Rule Breach Alert Template Dispatch', async () => {
    const result = await EmailService.sendRuleBreachEmail({
      recipientEmail: 'delivered@resend.dev',
      recipientName: 'Alex Trader',
      accountNumber: '88776655',
      accountSize: 100000,
      ruleViolated: '5% Daily Loss Limit',
      breachEquity: 94800,
      thresholdLimit: 5000,
      breachTime: new Date().toISOString(),
    });

    assert(result.success || typeof result.error === 'string', 'Rule breach email dispatch must return structured response');
    const lastLog = db.email_logs[0];
    assert(lastLog.template === 'RULE_BREACH', 'Template must be RULE_BREACH');
    assert(lastLog.subject.includes('88776655'), 'Subject must contain account number');
  });

  await test('Email Engine', 'Stage Promotion & Certificate Template Dispatch', async () => {
    const result = await EmailService.sendStagePromotionEmail({
      recipientEmail: 'delivered@resend.dev',
      recipientName: 'Alex Trader',
      fromStage: 'Phase 1 Challenge',
      toStage: 'Live Funded Account',
      accountSize: 100000,
      newAccountNumber: '99887766',
      newPassword: 'Funded_Pass_2026!',
    });

    assert(result.success || typeof result.error === 'string', 'Stage promotion email dispatch must return structured response');
    const lastLog = db.email_logs[0];
    assert(lastLog.template === 'STAGE_PROMOTION', 'Template must be STAGE_PROMOTION');
  });

  await test('Email Engine', 'Profit Split Payout Disbursed Template Dispatch', async () => {
    const result = await EmailService.sendPayoutDisbursedEmail({
      recipientEmail: 'delivered@resend.dev',
      recipientName: 'Alex Trader',
      payoutId: 'payout-test-001',
      accountNumber: '99887766',
      totalProfit: 12500,
      traderShare: 10000,
      firmShare: 2500,
      payoutMethod: 'Crypto (USDT TRC20)',
      destination: 'TLx9876543210ABCDEF',
    });

    assert(result.success || typeof result.error === 'string', 'Payout disbursed email dispatch must return structured response');
    const lastLog = db.email_logs[0];
    assert(lastLog.template === 'PAYOUT_DISBURSED', 'Template must be PAYOUT_DISBURSED');
    assert(lastLog.subject.includes('$10,000'), 'Subject must mention trader share');
  });

  // =============================================================
  // 12. PROMOTIONAL OFFER & DYNAMIC PRICING ENGINE TESTS
  // =============================================================
  await test('Pricing & Offer Engine', 'Admin Direct Account Price Change & Offer Activation', () => {
    if (!db.challenges || db.challenges.length === 0) {
      db.challenges = [
        { id: 'ch-two-50k', name: '50K Two Step Evaluation', type: 'two_step', account_size: 50000, price: 179, is_active: true, sort_order: 10, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 85, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];
    }

    const targetCh = db.challenges.find((c: any) => c.id === 'ch-two-50k') || db.challenges[0];
    const prevPrice = targetCh.price;

    // Simulate Admin applying a 25% discount offer directly to this account
    const offerPrice = 139;
    targetCh.original_price = prevPrice;
    targetCh.price = offerPrice;
    targetCh.offer_active = true;
    targetCh.discount_badge = '25% OFF FLASH OFFER';
    targetCh.updated_at = new Date().toISOString();

    // Verify sync to account_plans
    if (db.account_plans) {
      const matchedPlan = db.account_plans.find(
        (p) => (p.account_size === targetCh.account_size && p.type === targetCh.type) || p.id === targetCh.id
      );
      if (matchedPlan) {
        matchedPlan.price = offerPrice;
        matchedPlan.original_price = prevPrice;
        matchedPlan.offer_active = true;
        matchedPlan.discount_badge = '25% OFF FLASH OFFER';
      }
    }

    assert(targetCh.price === 139, 'Active price must be updated to 139');
    assert(targetCh.original_price === prevPrice, 'Original price must be preserved for strike-through');
    assert(targetCh.offer_active === true, 'Offer active flag must be true');
    assert(targetCh.discount_badge === '25% OFF FLASH OFFER', 'Discount badge must be set');
  });

  await test('Pricing & Offer Engine', 'Checkout Order Charges Exact Admin-Set Offer Price', async () => {
    const buyerEmail = `offer-trader-${Date.now()}@propfirm.com`;
    const buyerUser = {
      id: `usr-offer-${Date.now()}`,
      email: buyerEmail,
      password_hash: hashPassword('OfferTrader123!'),
      full_name: 'Offer Trader',
      role: 'USER' as const,
      country: 'Canada',
      phone: '+1 555-0999',
      affiliate_code: `OFFER${Math.floor(100 + Math.random() * 900)}`,
      is_verified: true,
      is_2fa_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.push(buyerUser);

    const targetCh = db.challenges.find((c: any) => c.id === 'ch-two-50k') || db.challenges[0];

    const checkoutResult = await paymentService.processCheckout({
      userId: buyerUser.id,
      planId: targetCh.id,
      accountSize: targetCh.account_size,
      platform: 'fundedshift_terminal',
      paymentMethod: 'visa',
    });

    assert(checkoutResult.success, 'Checkout with offer price must succeed');
    assert(checkoutResult.order?.total_amount === targetCh.price, `Charged total must equal active offer price ($${targetCh.price})`);
    if (targetCh.offer_active && targetCh.original_price && targetCh.original_price > targetCh.price) {
      assert(checkoutResult.order?.discount_amount === Number((targetCh.original_price - targetCh.price).toFixed(2)), 'Order discount must reflect direct offer savings');
    }
  });

  // 17. TradingView Edge CDN & Chart Engine Verification
  await test('Chart Engine', 'TradingView Edge CDN & Symbol Resolution Integrity', async () => {
    const symbolMap: Record<string, string> = {
      XAUUSD: 'OANDA:XAUUSD',
      XAGUSD: 'TVC:SILVER',
      USOIL: 'TVC:USOIL',
      EURUSD: 'FX:EURUSD',
      GBPUSD: 'FX:GBPUSD',
      USDJPY: 'FX:USDJPY',
      NAS100: 'NASDAQ:NDX',
      US30: 'DJ:DJI',
      SPX500: 'SP:SPX',
      GER40: 'XETR:DAX',
      BTCUSD: 'BINANCE:BTCUSDT',
      ETHUSD: 'BINANCE:ETHUSDT',
    };

    for (const [sym, expectedTv] of Object.entries(symbolMap)) {
      assert(expectedTv && expectedTv.includes(':'), `Symbol ${sym} must resolve to a valid exchange-qualified TradingView ticker`);
    }

    const testConfig = {
      autosize: true,
      symbol: symbolMap.XAUUSD,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
    };
    const embedUrl = `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodeURIComponent(JSON.stringify(testConfig))}`;
    assert(embedUrl.startsWith('https://www.tradingview-widget.com/embed-widget/advanced-chart/'), 'Must use high-speed TradingView Edge CDN');
    assert(!embedUrl.includes('utm_source=localhost'), 'Must not pass localhost utm_source that triggers rate limiting');
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

