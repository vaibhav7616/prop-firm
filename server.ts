import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DBEngine, hashPassword, verifyPassword } from './src/server/db';
import { ArchitecturePdfGenerator } from './src/server/generateArchitecturePdf';
import { marketDataService } from './src/server/marketData';
import { RuleEngine } from './src/server/ruleEngine';
import { tradeExecutionEngine } from './src/server/tradeEngine';
import { PayoutEngine } from './src/server/payoutEngine';
import { paymentService } from './src/server/paymentEngine';
import { ScheduledJobsEngine } from './src/server/auditJobs';
import { requireAuth, requireAdmin, createRateLimiter, generateToken, sanitizeUser } from './src/server/auth';
import { TraderRiskIntelligenceEngine } from './src/server/riskIntelligence';
import { TradeSimulatorEngine } from './src/server/simulator';
import { TraderTimelineEngine } from './src/server/timeline';
import { runAutomatedVerificationTests } from './tests/verification-suite';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// Initialize DB, background jobs, and generate Architecture PDF
DBEngine.getDB();
ScheduledJobsEngine.startJobs();
try {
  ArchitecturePdfGenerator.saveToFile();
} catch (e) {
  console.warn('PDF Generator initialization notice:', e);
}

// Rate Limiters
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many authentication attempts. Please try again later.' });
const tradingRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60, message: 'Order submission rate limit exceeded. Please wait a moment.' });
const checkoutRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20, message: 'Too many checkout attempts. Please try again shortly.' });

// -------------------------------------------------------------
// HEALTH & STATUS ENDPOINT
// -------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'FundedShift Prop Firm Backend & Simulated Trading Engine v2.0',
    version: '2.0.0',
    features: [
      'Institutional MT5 Execution Engine',
      'Dynamic Risk Shield',
      'Trader Risk Intelligence & Health Score',
      'Strategy Fingerprint',
      'What-If Rule Simulator',
      'Explainable Rule Breach',
      'Account Recovery Program',
      'Performance Timeline',
    ],
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// SYSTEM ARCHITECTURE DOCUMENTATION & PDF DOWNLOAD
// -------------------------------------------------------------
app.get('/api/docs/architecture.pdf', (_req, res) => {
  const pdfPath = path.join(process.cwd(), 'FundedShift_Architecture_Guide.pdf');
  if (!fs.existsSync(pdfPath)) {
    ArchitecturePdfGenerator.saveToFile(pdfPath);
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="FundedShift_Architecture_Guide.pdf"');
  res.sendFile(pdfPath);
});

app.get('/api/generate-pdf', (_req, res) => {
  try {
    const pdfPath = ArchitecturePdfGenerator.saveToFile();
    res.json({ success: true, message: 'Architecture PDF generated successfully.', path: pdfPath });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------
app.post('/api/auth/login', authRateLimiter, (req, res) => {
  const { email, password } = req.body;
  const db = DBEngine.getDB();

  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

  if (!user) {
    // If demo user is requested or dev environment demo login
    if (!email || email.toLowerCase() === 'trader@propfirm.com') {
      const demoTrader = db.users.find((u) => u.id === 'demo-trader-id-12345');
      if (demoTrader) {
        const token = generateToken(demoTrader);
        res.json({ token, user: sanitizeUser(demoTrader) });
        return;
      }
    }
    res.status(401).json({ error: 'Invalid email or password. Please verify your credentials or register.' });
    return;
  }

  // Verify password if provided
  if (password && !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/register', authRateLimiter, (req, res) => {
  const { email, password, full_name, country, phone } = req.body;
  const db = DBEngine.getDB();

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  let existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    if (password && !verifyPassword(password, existing.password_hash)) {
      res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      return;
    }
    const token = generateToken(existing);
    res.json({ token, user: sanitizeUser(existing) });
    return;
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    password_hash: hashPassword(password || 'Trader123!'),
    full_name: full_name || cleanEmail.split('@')[0],
    role: 'USER' as const,
    country: country || 'United States',
    phone: phone || '',
    affiliate_code: `FS${Math.floor(100 + Math.random() * 900)}`,
    is_verified: true,
    is_2fa_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.push(newUser);

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: newUser.id,
    actor_role: 'USER',
    action: 'USER_REGISTERED',
    target_id: newUser.id,
    entity_type: 'USER',
    details: `Trader registered account with email: ${newUser.email}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();

  const token = generateToken(newUser);
  res.json({ token, user: sanitizeUser(newUser) });
});

// Admin Authentication
app.post('/api/auth/admin-login', authRateLimiter, (req, res) => {
  const { username, email, password } = req.body;
  const adminUserEnv = process.env.ADMIN_USERNAME || 'vaibhav7616';
  const adminPassEnv = process.env.ADMIN_PASSWORD || '9545884016aA@';

  const providedUser = (username || email || '').trim();
  const providedPass = (password || '').trim();

  if (
    (providedUser.toLowerCase() === adminUserEnv.toLowerCase() ||
      providedUser.toLowerCase() === 'vaibhav7616' ||
      providedUser.toLowerCase() === 'admin@propfirm.com') &&
    (providedPass === adminPassEnv || providedPass === '9545884016aA@')
  ) {
    const db = DBEngine.getDB();
    let adminUser = db.users.find((u) => u.role === 'ADMIN');
    if (!adminUser) {
      adminUser = {
        id: 'admin-vaibhav-id-999',
        email: 'vaibhav7616@propfirm.com',
        password_hash: hashPassword(adminPassEnv),
        full_name: 'Vaibhav (Admin)',
        role: 'ADMIN' as const,
        country: 'Global',
        phone: '+1 800-FUNDEDSHIFT',
        affiliate_code: 'ADMIN_PRO',
        is_verified: true,
        is_2fa_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.push(adminUser);
      DBEngine.saveDB();
    }

    const token = generateToken(adminUser);

    db.audit_logs.push({
      id: `audit-${Date.now()}`,
      actor_id: adminUser.id,
      actor_role: 'ADMIN',
      action: 'ADMIN_LOGIN_SUCCESS',
      target_id: adminUser.id,
      entity_type: 'AUTH',
      details: 'Administrator logged into the admin command portal.',
      created_at: new Date().toISOString(),
    });
    DBEngine.saveDB();

    res.json({
      success: true,
      token,
      user: sanitizeUser(adminUser),
      profile: {
        ...sanitizeUser(adminUser),
        avatar_url: null,
        referred_by: null,
      },
    });
    return;
  }

  res.status(401).json({ error: 'Invalid admin credentials. Access denied.' });
});

// -------------------------------------------------------------
// MARKET DATA & SYMBOLS API
// -------------------------------------------------------------
app.get('/api/market/symbols', (_req, res) => {
  const db = DBEngine.getDB();
  res.json(db.symbols);
});

app.get('/api/market/quotes', (_req, res) => {
  const quotes = marketDataService.getAllQuotes();
  res.json(quotes);
});

app.get('/api/market/quotes/:symbol', (req, res) => {
  const quote = marketDataService.getQuote(req.params.symbol.toUpperCase());
  if (!quote) {
    res.status(404).json({ error: 'Symbol not found.' });
    return;
  }
  res.json(quote);
});

// Server-Sent Events Real-Time Ticks Stream for Live Charts & Terminal
app.get('/api/market/ticks/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Immediately send initial quotes snapshot
  const initialQuotes = marketDataService.getAllQuotes();
  res.write(`data: ${JSON.stringify(initialQuotes)}\n\n`);

  let lastSentTime = Date.now();

  // Instant push on live WebSocket ticks
  const unsubscribe = marketDataService.subscribeAll((updatedQuotes) => {
    const now = Date.now();
    // Throttle to 50ms per client for smooth 20 FPS real-time rendering
    if (now - lastSentTime >= 50) {
      lastSentTime = now;
      res.write(`data: ${JSON.stringify(updatedQuotes)}\n\n`);
    }
  });

  const interval = setInterval(() => {
    const quotes = marketDataService.getAllQuotes();
    res.write(`data: ${JSON.stringify(quotes)}\n\n`);
  }, 100);

  req.on('close', () => {
    unsubscribe();
    clearInterval(interval);
    res.end();
  });
});

// -------------------------------------------------------------
// ACCOUNT PLANS & CHALLENGE CONFIGURATION API
// -------------------------------------------------------------
app.get('/api/plans', (_req, res) => {
  const db = DBEngine.getDB();
  res.json(db.account_plans);
});

// -------------------------------------------------------------
// TRADING ACCOUNTS API
// -------------------------------------------------------------
app.get(['/api/accounts', '/api/user/accounts'], requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();

  const userAccounts = db.accounts.filter((a) => a.user_id === userId);

  // Evaluate rules on all user accounts to ensure live state
  for (const acc of userAccounts) {
    RuleEngine.evaluateAccount(acc.id);
  }

  res.json(userAccounts);
});

app.get('/api/accounts/:id', requireAuth, (req, res) => {
  const db = DBEngine.getDB();
  const acc = db.accounts.find((a) => a.id === req.params.id);
  if (!acc) {
    res.status(404).json({ error: 'Trading account not found.' });
    return;
  }
  RuleEngine.evaluateAccount(acc.id);
  res.json(acc);
});

app.get('/api/accounts/:id/positions', (req, res) => {
  RuleEngine.evaluateAccount(req.params.id);
  const db = DBEngine.getDB();
  const positions = db.positions.filter((p) => p.account_id === req.params.id);
  res.json(positions);
});

app.get('/api/accounts/:id/violations', (req, res) => {
  const db = DBEngine.getDB();
  const violations = db.rule_violations.filter((v) => v.account_id === req.params.id);
  res.json(violations);
});

// Explainable Rule Breach Engine
app.get('/api/accounts/:id/violations/explain', (req, res) => {
  const report = RuleEngine.getExplainableBreachReport(req.params.id);
  res.json(report);
});

// Performance Timeline Engine
app.get('/api/accounts/:id/timeline', (req, res) => {
  const events = TraderTimelineEngine.getAccountTimeline(req.params.id);
  res.json(events);
});

// Account Recovery & Re-evaluation Engine
app.get('/api/accounts/:id/recovery-options', (req, res) => {
  const options = TradeSimulatorEngine.evaluateRecoveryEligibility(req.params.id);
  if (!options) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  res.json(options);
});

app.post('/api/accounts/:id/recovery-reset', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const result = TradeSimulatorEngine.executeAccountRecovery(req.params.id, userId);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

// -------------------------------------------------------------
// TRADER RISK INTELLIGENCE & HEALTH SCORE API
// -------------------------------------------------------------
app.get('/api/trader/risk-profile/:accountId', (req, res) => {
  const profile = TraderRiskIntelligenceEngine.computeRiskProfile(req.params.accountId);
  if (!profile) {
    res.status(404).json({ error: 'Account not found or no trading history available.' });
    return;
  }
  res.json(profile);
});

app.get('/api/trader/health-score/:accountId', (req, res) => {
  const healthScore = TraderRiskIntelligenceEngine.computeHealthScore(req.params.accountId);
  if (!healthScore) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  res.json(healthScore);
});

app.get('/api/trader/strategy-fingerprint/:accountId', (req, res) => {
  const fingerprint = TraderRiskIntelligenceEngine.computeStrategyFingerprint(req.params.accountId);
  if (!fingerprint) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  res.json(fingerprint);
});

app.get('/api/trader/risk-shield/:accountId', (req, res) => {
  const status = TraderRiskIntelligenceEngine.getRiskShieldStatus(req.params.accountId);
  if (!status) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  res.json(status);
});

app.get('/api/admin/risk-shield/config', requireAdmin, (_req, res) => {
  res.json(TraderRiskIntelligenceEngine.getShieldConfig());
});

app.post('/api/admin/risk-shield/config', requireAdmin, (req, res) => {
  const updated = TraderRiskIntelligenceEngine.updateShieldConfig(req.body);
  res.json({ success: true, config: updated });
});

// -------------------------------------------------------------
// SIMULATED TRADING EXECUTION ENGINE API
// -------------------------------------------------------------
app.post('/api/trading/order', tradingRateLimiter, requireAuth, async (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { accountId, symbol, type, lotSize, stopLoss, takeProfit } = req.body;

  const result = await tradeExecutionEngine.executeMarketOrder({
    accountId,
    userId,
    symbol,
    type,
    lotSize: Number(lotSize),
    stopLoss: stopLoss ? Number(stopLoss) : undefined,
    takeProfit: takeProfit ? Number(takeProfit) : undefined,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json(result);
});

app.post('/api/trading/close-position', tradingRateLimiter, requireAuth, async (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { accountId, positionId } = req.body;

  const result = await tradeExecutionEngine.closePosition({
    accountId,
    positionId,
    userId,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json(result);
});

app.post('/api/trading/partial-close', tradingRateLimiter, requireAuth, async (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { accountId, positionId, lotsToClose } = req.body;

  const result = await tradeExecutionEngine.partialClosePosition({
    accountId,
    positionId,
    userId,
    lotsToClose: Number(lotsToClose),
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json(result);
});

// What-If Trade Simulator Engine
app.post('/api/trading/simulate-trade', (req, res) => {
  const { accountId, symbol, type, lotSize, stopLoss, takeProfit } = req.body;
  const result = TradeSimulatorEngine.simulateTrade({
    accountId,
    symbol,
    type,
    lotSize: Number(lotSize),
    stopLoss: stopLoss ? Number(stopLoss) : undefined,
    takeProfit: takeProfit ? Number(takeProfit) : undefined,
  });

  if ('error' in result) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, simulation: result });
});

// -------------------------------------------------------------
// CHECKOUT & ORDERS API
// -------------------------------------------------------------
app.get('/api/orders', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  const orders = db.orders.filter((o) => o.user_id === userId);
  res.json(orders);
});

app.post('/api/orders/checkout', checkoutRateLimiter, requireAuth, async (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { account_size, plan_id, challenge_id, platform, payment_method, coupon_code } = req.body;

  const result = await paymentService.processCheckout({
    userId,
    planId: plan_id || challenge_id || 'plan-2step-100k',
    accountSize: Number(account_size || 100000),
    platform: platform || 'mt5',
    paymentMethod: payment_method || 'visa',
    couponCode: coupon_code,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json(result);
});

// Payment Webhook (Idempotent with signature check)
app.post('/api/payments/webhook', (req, res) => {
  const signature = (req.headers['x-webhook-signature'] as string) || '';
  const idempotencyKey = (req.headers['idempotency-key'] as string) || '';
  const result = paymentService.handlePaymentWebhook({
    payload: req.body,
    signature,
    idempotencyKey,
  });
  res.json(result);
});

// -------------------------------------------------------------
// CHALLENGES & PRICING API
// -------------------------------------------------------------
app.get('/api/challenges', (_req, res) => {
  const db = DBEngine.getDB();
  if (!db.challenges || db.challenges.length === 0) {
    db.challenges = [
      { id: 'ch-one-5k', name: '5K One Step Challenge', type: 'one_step', account_size: 5000, price: 29, is_active: true, sort_order: 1, rules: { profit_target: 10, daily_drawdown: 4, max_drawdown: 8, min_trading_days: 3, max_trading_days: 0, leverage: 100, profit_split: 80, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-one-10k', name: '10K One Step Challenge', type: 'one_step', account_size: 10000, price: 49, is_active: true, sort_order: 2, rules: { profit_target: 10, daily_drawdown: 4, max_drawdown: 8, min_trading_days: 3, max_trading_days: 0, leverage: 100, profit_split: 80, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-one-25k', name: '25K One Step Challenge', type: 'one_step', account_size: 25000, price: 119, is_active: true, sort_order: 3, rules: { profit_target: 10, daily_drawdown: 4, max_drawdown: 8, min_trading_days: 3, max_trading_days: 0, leverage: 100, profit_split: 85, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-one-50k', name: '50K One Step Challenge', type: 'one_step', account_size: 50000, price: 199, is_active: true, sort_order: 4, rules: { profit_target: 10, daily_drawdown: 4, max_drawdown: 8, min_trading_days: 3, max_trading_days: 0, leverage: 100, profit_split: 85, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-one-100k', name: '100K One Step Challenge', type: 'one_step', account_size: 100000, price: 349, is_active: true, sort_order: 5, rules: { profit_target: 10, daily_drawdown: 4, max_drawdown: 8, min_trading_days: 3, max_trading_days: 0, leverage: 100, profit_split: 90, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-one-200k', name: '200K One Step Challenge', type: 'one_step', account_size: 200000, price: 649, is_active: true, sort_order: 6, rules: { profit_target: 10, daily_drawdown: 4, max_drawdown: 8, min_trading_days: 3, max_trading_days: 0, leverage: 100, profit_split: 90, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-two-5k', name: '5K Two Step Evaluation', type: 'two_step', account_size: 5000, price: 24, is_active: true, sort_order: 7, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 80, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-two-10k', name: '10K Two Step Evaluation', type: 'two_step', account_size: 10000, price: 45, is_active: true, sort_order: 8, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 80, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-two-25k', name: '25K Two Step Evaluation', type: 'two_step', account_size: 25000, price: 99, is_active: true, sort_order: 9, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 85, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-two-50k', name: '50K Two Step Evaluation', type: 'two_step', account_size: 50000, price: 179, is_active: true, sort_order: 10, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 85, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-two-100k', name: '100K Two Step Evaluation', type: 'two_step', account_size: 100000, price: 299, is_active: true, sort_order: 11, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 90, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-two-200k', name: '200K Two Step Evaluation', type: 'two_step', account_size: 200000, price: 549, is_active: true, sort_order: 12, rules: { profit_target: 8, daily_drawdown: 5, max_drawdown: 10, min_trading_days: 4, max_trading_days: 0, leverage: 100, profit_split: 90, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-inst-5k', name: '5K Instant Funding', type: 'instant_funding', account_size: 5000, price: 75, is_active: true, sort_order: 13, rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-inst-10k', name: '10K Instant Funding', type: 'instant_funding', account_size: 10000, price: 129, is_active: true, sort_order: 14, rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-inst-25k', name: '25K Instant Funding', type: 'instant_funding', account_size: 25000, price: 279, is_active: true, sort_order: 15, rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-inst-50k', name: '50K Instant Funding', type: 'instant_funding', account_size: 50000, price: 479, is_active: true, sort_order: 16, rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-inst-100k', name: '100K Instant Funding', type: 'instant_funding', account_size: 100000, price: 899, is_active: true, sort_order: 17, rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'ch-inst-200k', name: '200K Instant Funding', type: 'instant_funding', account_size: 200000, price: 1699, is_active: true, sort_order: 18, rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    DBEngine.saveDB();
  } else if (!db.challenges.some((c: any) => c.id === 'ch-inst-200k')) {
    db.challenges.push({
      id: 'ch-inst-200k',
      name: '200K Instant Funding',
      type: 'instant_funding',
      account_size: 200000,
      price: 1699,
      is_active: true,
      sort_order: 18,
      rules: { profit_target: 0, daily_drawdown: 3, max_drawdown: 6, min_trading_days: 7, max_trading_days: 0, leverage: 50, profit_split: 70, news_trading: true, weekend_holding: true, consistency: 0, scaling_plan: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    DBEngine.saveDB();
  }
  res.json(db.challenges);
});

app.post('/api/admin/challenges/update', requireAdmin, (req, res) => {
  const { id, price, rules } = req.body;
  const db = DBEngine.getDB();

  if (!db.challenges) {
    db.challenges = [];
  }

  const idx = db.challenges.findIndex((c: any) => c.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Challenge not found.' });
    return;
  }

  db.challenges[idx].price = Number(price);
  if (rules) {
    db.challenges[idx].rules = { ...db.challenges[idx].rules, ...rules };
  }
  db.challenges[idx].updated_at = new Date().toISOString();

  // Log audit
  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: 'ADMIN',
    actor_role: 'ADMIN',
    action: 'ADMIN_CHALLENGE_PRICE_UPDATE',
    target_id: id,
    details: `Updated challenge #${id} price to $${price}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, challenge: db.challenges[idx], challenges: db.challenges });
});

// -------------------------------------------------------------
// PAYOUT SYSTEM API
// -------------------------------------------------------------
app.get('/api/payouts/eligibility/:accountId', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const eligibility = PayoutEngine.checkPayoutEligibility(req.params.accountId, userId);
  res.json(eligibility);
});

app.post('/api/payouts/request', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { accountId, payoutMethod, payoutAddress, paymentDetails, userEmail, userName } = req.body;

  const result = PayoutEngine.requestPayout({
    accountId,
    userId,
    payoutMethod: payoutMethod || 'Crypto USDT',
    payoutAddress: payoutAddress || '0xDemoTraderWalletAddress',
    paymentDetails,
    userEmail,
    userName,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json(result);
});

app.get('/api/payouts', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  if (!db.payout_requests) db.payout_requests = [];
  const payouts = db.payout_requests.filter((p) => p.user_id === userId);
  res.json(payouts);
});

// -------------------------------------------------------------
// AFFILIATE WITHDRAWAL SYSTEM API
// -------------------------------------------------------------
app.get('/api/affiliate/withdrawals', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();

  if (!db.affiliate_withdrawals) {
    db.affiliate_withdrawals = [];
  }

  const userWithdrawals = db.affiliate_withdrawals.filter((w) => w.user_id === userId);

  // Calculate totals
  const totalEarnings = 480; // default base affiliate earnings
  const approvedWithdrawn = userWithdrawals
    .filter((w) => w.status === 'APPROVED')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const pendingAmount = userWithdrawals
    .filter((w) => w.status === 'APPROVAL PENDING')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const availableBalance = Math.max(0, totalEarnings - approvedWithdrawn - pendingAmount);

  res.json({
    withdrawals: userWithdrawals,
    stats: {
      total_earnings: totalEarnings,
      approved_withdrawn: approvedWithdrawn,
      pending_withdrawn: pendingAmount,
      available_balance: availableBalance,
      min_withdrawal: 250,
    },
  });
});

app.post('/api/affiliate/withdraw', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { amount, method, payment_details } = req.body;
  const db = DBEngine.getDB();

  if (!db.affiliate_withdrawals) {
    db.affiliate_withdrawals = [];
  }

  const reqAmount = Number(amount);
  if (isNaN(reqAmount) || reqAmount < 250) {
    res.status(400).json({ success: false, error: 'Minimum withdrawal amount for affiliate earnings is $250.' });
    return;
  }

  const userObj = db.users.find((u) => u.id === userId) || {
    id: userId,
    email: 'trader@propfirm.com',
    full_name: 'Alex Vance',
  };

  // Check balance
  const userWithdrawals = db.affiliate_withdrawals.filter((w) => w.user_id === userId);
  const totalEarnings = 480;
  const approvedWithdrawn = userWithdrawals.filter((w) => w.status === 'APPROVED').reduce((sum, w) => sum + Number(w.amount), 0);
  const pendingAmount = userWithdrawals.filter((w) => w.status === 'APPROVAL PENDING').reduce((sum, w) => sum + Number(w.amount), 0);
  const currentAvailable = Math.max(0, totalEarnings - approvedWithdrawn - pendingAmount);

  if (reqAmount > currentAvailable) {
    res.status(400).json({
      success: false,
      error: `Requested amount ($${reqAmount}) exceeds available balance ($${currentAvailable}).`,
    });
    return;
  }

  const newWithdrawal = {
    id: `aff-wd-${Date.now()}`,
    user_id: userId,
    user_email: userObj.email,
    user_name: userObj.full_name,
    amount: reqAmount,
    method: method || 'UPI',
    payment_details: payment_details || {},
    status: 'APPROVAL PENDING' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.affiliate_withdrawals.unshift(newWithdrawal);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: userId,
    title: 'Affiliate Withdrawal Submitted',
    body: `Your request to withdraw $${reqAmount} via ${method} is APPROVAL PENDING by Admin.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: userId,
    actor_role: 'USER',
    action: 'AFFILIATE_WITHDRAWAL_REQUESTED',
    target_id: newWithdrawal.id,
    details: `Requested affiliate withdrawal of $${reqAmount} via ${method}.`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();

  res.json({ success: true, withdrawal: newWithdrawal, withdrawals: db.affiliate_withdrawals.filter((w) => w.user_id === userId) });
});

app.get('/api/admin/affiliate/withdrawals', requireAdmin, (_req, res) => {
  const db = DBEngine.getDB();
  if (!db.affiliate_withdrawals) {
    db.affiliate_withdrawals = [];
  }
  res.json(db.affiliate_withdrawals);
});

app.post('/api/admin/affiliate/withdraw/process', requireAdmin, (req, res) => {
  const { withdrawalId, action, reason } = req.body;
  const db = DBEngine.getDB();

  if (!db.affiliate_withdrawals) {
    db.affiliate_withdrawals = [];
  }

  const item = db.affiliate_withdrawals.find((w) => w.id === withdrawalId);
  if (!item) {
    res.status(404).json({ success: false, error: 'Affiliate withdrawal request not found.' });
    return;
  }

  if (action === 'APPROVE') {
    item.status = 'APPROVED';
    item.updated_at = new Date().toISOString();
    item.reviewed_at = new Date().toISOString();

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: item.user_id,
      title: '✅ Affiliate Withdrawal Approved!',
      body: `Your affiliate payout of $${item.amount} via ${item.method} has been APPROVED and sent by Admin!`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } else {
    item.status = 'REJECTED';
    item.rejection_reason = reason || 'Declined by Admin review.';
    item.updated_at = new Date().toISOString();
    item.reviewed_at = new Date().toISOString();

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: item.user_id,
      title: '❌ Affiliate Withdrawal Declined',
      body: `Your affiliate withdrawal request for $${item.amount} was REJECTED. Reason: ${item.rejection_reason}`,
      type: 'error',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: 'ADMIN',
    actor_role: 'ADMIN',
    action: action === 'APPROVE' ? 'AFFILIATE_WITHDRAWAL_APPROVED' : 'AFFILIATE_WITHDRAWAL_REJECTED',
    target_id: item.id,
    details: `Admin ${action}D affiliate withdrawal request #${item.id} of $${item.amount} for user ${item.user_email}.`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();

  res.json({ success: true, withdrawal: item, withdrawals: db.affiliate_withdrawals });
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT & RISK DASHBOARD API
// -------------------------------------------------------------
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const db = DBEngine.getDB();

  const totalUsers = db.users.length;
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.status === 'PAID' ? o.total_amount : 0), 0);

  const totalAccounts = db.accounts.length;
  const activeAccounts = db.accounts.filter((a) => a.status === 'ACTIVE').length;
  const passedAccounts = db.accounts.filter((a) => a.status === 'PASSED').length;
  const fundedAccounts = db.accounts.filter((a) => a.status === 'FUNDED').length;
  const breachedAccounts = db.accounts.filter((a) => a.status === 'BREACHED').length;

  const salesByTier: Record<number, number> = {};
  const salesByTierAndType: Record<string, Record<number, number>> = {
    one_step: { 5000: 0, 10000: 0, 25000: 0, 50000: 0, 100000: 0, 200000: 0, 400000: 0 },
    two_step: { 5000: 0, 10000: 0, 25000: 0, 50000: 0, 100000: 0, 200000: 0, 400000: 0 },
    instant_funding: { 5000: 0, 10000: 0, 25000: 0, 50000: 0, 100000: 0, 200000: 0, 400000: 0 },
  };

  db.accounts.forEach((acc) => {
    salesByTier[acc.account_size] = (salesByTier[acc.account_size] || 0) + 1;

    const accType = (acc.type || (acc.plan_id?.includes('1step') ? 'one_step' : acc.plan_id?.includes('instant') ? 'instant_funding' : 'two_step')).toLowerCase();
    const typeKey = accType.includes('instant') ? 'instant_funding' : accType.includes('1step') || accType === 'one_step' ? 'one_step' : 'two_step';

    if (!salesByTierAndType[typeKey]) {
      salesByTierAndType[typeKey] = { 5000: 0, 10000: 0, 25000: 0, 50000: 0, 100000: 0, 200000: 0, 400000: 0 };
    }
    salesByTierAndType[typeKey][acc.account_size] = (salesByTierAndType[typeKey][acc.account_size] || 0) + 1;
  });

  res.json({
    stats: {
      total_users: totalUsers,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_accounts: totalAccounts,
      active_accounts: activeAccounts,
      passed_accounts: passedAccounts,
      funded_accounts: fundedAccounts,
      breached_accounts: breachedAccounts,
      sales_by_tier: salesByTier,
      sales_by_tier_and_type: salesByTierAndType,
    },
    users: db.users,
    orders: db.orders,
    accounts: db.accounts,
    payout_requests: db.payout_requests,
    rule_violations: db.rule_violations,
    audit_logs: db.audit_logs,
  });
});

app.post('/api/admin/users/:id/update-role', requireAdmin, (req, res) => {
  const { role } = req.body;
  const db = DBEngine.getDB();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }
  user.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
  user.updated_at = new Date().toISOString();

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: req.user?.id || 'ADMIN',
    actor_role: 'ADMIN',
    action: 'USER_ROLE_UPDATED',
    target_id: user.id,
    details: `Updated role of user ${user.email} to ${user.role}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/admin/users/:id/toggle-status', requireAdmin, (req, res) => {
  const db = DBEngine.getDB();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }
  (user as any).is_active = (user as any).is_active === false ? true : false;
  user.updated_at = new Date().toISOString();

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: req.user?.id || 'ADMIN',
    actor_role: 'ADMIN',
    action: 'USER_STATUS_TOGGLED',
    target_id: user.id,
    details: `Toggled user status of ${user.email} to ${(user as any).is_active ? 'ACTIVE' : 'DEACTIVATED'}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/admin/accounts/update-status', requireAdmin, (req, res) => {
  const { account_id, status, immediate } = req.body;
  const db = DBEngine.getDB();

  const acc = db.accounts.find((a) => a.id === account_id);
  if (!acc) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  const targetStatus = (status || '').toUpperCase();

  if (targetStatus === 'PASSED') {
    RuleEngine.handlePhasePass(acc, immediate !== false);
  } else if (targetStatus === 'FUNDED') {
    acc.status = 'FUNDED';
    acc.phase = 1;
    acc.is_funded = true;
    acc.funded_at = new Date().toISOString();
    acc.rules.profit_target_percent = 0;
    acc.plan_name = `$${acc.account_size.toLocaleString()} Funded Account`;
  } else {
    acc.status = targetStatus as any;
  }

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: 'ADMIN',
    actor_role: 'ADMIN',
    action: 'ADMIN_ACCOUNT_STATUS_CHANGE',
    target_id: acc.id,
    details: `Admin changed account #${acc.account_number} status to ${status}${immediate ? ' (immediate transition)' : ''}.`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, account: acc });
});

// Expedite scheduled phase transition (1-2 hour review skip / test mode)
app.post('/api/accounts/:id/expedite-transition', (req, res) => {
  const accId = req.params.id;
  const newAccount = RuleEngine.provisionScheduledAccount(accId);
  if (!newAccount) {
    res.status(400).json({ error: 'No scheduled transition found or account already provisioned.' });
    return;
  }
  res.json({ success: true, account: newAccount });
});

app.post('/api/admin/payouts/process', requireAdmin, (req, res) => {
  const { payoutId, action, reason } = req.body;
  const adminId = req.user?.id || 'admin-vaibhav-id-999';
  const result = PayoutEngine.processPayoutAdmin({
    payoutId,
    adminId,
    action,
    reason,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json(result);
});

// -------------------------------------------------------------
// ADMIN MANUAL ACCOUNT PROVISIONING
// -------------------------------------------------------------
app.post('/api/admin/accounts/issue-manual', requireAdmin, (req, res) => {
  const { email, full_name, account_size, type, stage, platform, broker } = req.body;
  const db = DBEngine.getDB();

  if (!email || !account_size) {
    res.status(400).json({ success: false, error: 'User email and account size are required.' });
    return;
  }

  // Find or create user
  let user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password_hash: hashPassword('TraderPass123!'),
      full_name: full_name || email.split('@')[0],
      role: 'USER',
      country: 'Global',
      phone: '+1 555-0192',
      affiliate_code: `AFF_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      is_verified: true,
      is_2fa_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.push(user);
  }

  let challengeType = type || 'two_step';
  const sizeNum = Number(account_size) || 5000;
  const selectedStage = stage || (challengeType === 'instant_funding' ? 'funded' : 'step_1');

  const isFunded = selectedStage === 'funded' || challengeType === 'instant_funding';
  const isStep2 = selectedStage === 'step_2';

  if (isFunded) {
    challengeType = 'instant_funding';
  } else if (isStep2) {
    challengeType = 'two_step';
  }

  const matchedPlan = db.account_plans.find((p) => p.account_size === sizeNum && p.type === challengeType);

  let planName: string;
  let phaseNum: number = 1;
  let accStatus: 'ACTIVE' | 'FUNDED' = 'ACTIVE';

  if (isFunded) {
    planName = `$${sizeNum.toLocaleString()} Funded Account`;
    phaseNum = 1;
    accStatus = 'FUNDED';
  } else if (isStep2) {
    planName = `$${sizeNum.toLocaleString()} 2-Step Challenge - Step 2`;
    phaseNum = 2;
    accStatus = 'ACTIVE';
  } else {
    const typeLabel = challengeType === 'one_step' ? 'One-Step Challenge' : '2-Step Challenge';
    planName = `$${sizeNum.toLocaleString()} ${typeLabel} - Step 1`;
    phaseNum = 1;
    accStatus = 'ACTIVE';
  }

  const planId = matchedPlan ? matchedPlan.id : `plan-${challengeType}-${sizeNum >= 1000 ? `${sizeNum / 1000}k` : sizeNum}`;
  const defaultMaxLot = sizeNum <= 5000 ? 5 : sizeNum <= 10000 ? 10 : sizeNum <= 25000 ? 20 : sizeNum <= 50000 ? 35 : sizeNum <= 100000 ? 50 : 100;

  const rulesConfig = {
    profit_target_percent: isFunded ? 0 : isStep2 ? 5 : challengeType === 'one_step' ? 10 : 8,
    daily_loss_limit_percent: challengeType === 'one_step' ? 4 : 5,
    max_loss_limit_percent: challengeType === 'one_step' ? 8 : 10,
    drawdown_model: 'STATIC' as const,
    min_trading_days: isFunded ? 0 : challengeType === 'one_step' ? 3 : 0,
    max_trading_days: null,
    leverage: isFunded ? 50 : 100,
    profit_split_percent: isFunded ? 80 : 90,
    max_lot_size: defaultMaxLot,
    max_open_positions: 15,
    news_trading_allowed: true,
    weekend_holding_allowed: !isFunded,
    ea_trading_allowed: true,
  };

  const orderId = `ord-${Date.now()}-admin`;
  const newOrder = {
    id: orderId,
    user_id: user.id,
    plan_id: planId,
    plan_name: planName,
    account_size: sizeNum,
    platform: platform || 'fundedshift_terminal',
    addons: [],
    discount_amount: matchedPlan ? matchedPlan.price : 99,
    total_amount: 0,
    status: 'PAID' as const,
    payment_method: 'visa' as const,
    created_at: new Date().toISOString(),
  };

  const newAccNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
  const traderPassword = `FS_${Math.random().toString(36).slice(-6)}!`;
  const investorPassword = `INV_${Math.random().toString(36).slice(-6)}#`;

  const newAccount = {
    id: `acc-${Date.now()}`,
    user_id: user.id,
    order_id: orderId,
    account_number: newAccNumber,
    login: newAccNumber,
    password_hash: traderPassword,
    investor_password_hash: investorPassword,
    server: 'FundedShift-Live01',
    broker: broker || 'FundedShift Direct ECN',
    platform: platform || 'fundedshift_terminal',
    plan_id: planId,
    plan_name: planName,
    type: challengeType as any,
    account_size: sizeNum,
    starting_balance: sizeNum,
    current_balance: sizeNum,
    current_equity: sizeNum,
    highest_balance: sizeNum,
    highest_equity: sizeNum,
    start_of_day_balance: sizeNum,
    start_of_day_equity: sizeNum,
    status: accStatus,
    phase: phaseNum,
    is_funded: isFunded,
    funded_at: isFunded ? new Date().toISOString() : undefined,
    trading_days: 0,
    leverage: rulesConfig.leverage,
    rules: rulesConfig,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  db.accounts.unshift(newAccount);

  const stageLabel = isFunded ? 'Direct Funded Account' : isStep2 ? 'Step 2 Verification' : 'Step 1 Challenge';
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: user.id,
    title: `🎉 Admin Issued ${stageLabel}!`,
    body: `Admin assigned a $${sizeNum.toLocaleString()} ${stageLabel} account (#${newAccNumber}) to your profile. Login: ${newAccNumber}, Password: ${traderPassword}`,
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
    details: `Admin issued $${sizeNum.toLocaleString()} ${stageLabel} account #${newAccNumber} to ${user.email}.`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();

  res.json({
    success: true,
    account: {
      ...newAccount,
      password_hash: traderPassword,
      investor_password_hash: investorPassword,
    },
    user,
    order: newOrder,
  });
});

// -------------------------------------------------------------
// PROMO / COUPON CODE MANAGEMENT API
// -------------------------------------------------------------
app.get('/api/promo-codes', (_req, res) => {
  const db = DBEngine.getDB();
  res.json(db.promo_codes || []);
});

app.post('/api/promo-codes/validate', (req, res) => {
  const { code, amount } = req.body;
  if (!code) {
    res.status(400).json({ valid: false, error: 'Promo code is required.' });
    return;
  }

  const db = DBEngine.getDB();
  const codeUpper = String(code).trim().toUpperCase();
  const promo = (db.promo_codes || []).find((p) => p.code.toUpperCase() === codeUpper && p.is_active);

  const basePrice = Number(amount || 0);

  if (!promo) {
    // Check fallback codes
    if (codeUpper === 'PROPFIRM20') {
      const discount = basePrice * 0.2;
      res.json({ valid: true, code: 'PROPFIRM20', discount_value: 20, discount_type: 'PERCENTAGE', discountAmount: discount, finalAmount: Math.max(0, basePrice - discount) });
      return;
    } else if (codeUpper === 'VAIBHAV100') {
      res.json({ valid: true, code: 'VAIBHAV100', discount_value: 100, discount_type: 'PERCENTAGE', discountAmount: basePrice, finalAmount: 0 });
      return;
    }
    res.status(400).json({ valid: false, error: 'Invalid or inactive promo code.' });
    return;
  }

  if (promo.usage_count >= promo.max_uses) {
    res.status(400).json({ valid: false, error: 'Promo code maximum usage limit reached.' });
    return;
  }

  let discountAmount = 0;
  if (promo.discount_type === 'PERCENTAGE') {
    discountAmount = (basePrice * promo.discount_value) / 100;
  } else {
    discountAmount = Math.min(basePrice, promo.discount_value);
  }

  res.json({
    valid: true,
    code: promo.code,
    discount_value: promo.discount_value,
    discount_type: promo.discount_type,
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Math.max(0, Number((basePrice - discountAmount).toFixed(2))),
  });
});

app.post('/api/admin/promo-codes', requireAdmin, (req, res) => {
  const { code, discount_type, discount_value, max_uses } = req.body;
  const db = DBEngine.getDB();

  if (!code || !discount_value) {
    res.status(400).json({ success: false, error: 'Code and discount value are required.' });
    return;
  }

  const newCode = String(code).trim().toUpperCase();
  const existing = (db.promo_codes || []).find((p) => p.code.toUpperCase() === newCode);
  if (existing) {
    res.status(400).json({ success: false, error: `Promo code ${newCode} already exists.` });
    return;
  }

  const created = {
    id: `promo-${Date.now()}`,
    code: newCode,
    discount_type: discount_type === 'FIXED' ? ('FIXED' as const) : ('PERCENTAGE' as const),
    discount_value: Number(discount_value),
    usage_count: 0,
    max_uses: Number(max_uses || 100),
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (!db.promo_codes) db.promo_codes = [];
  db.promo_codes.unshift(created);

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: 'ADMIN',
    actor_role: 'ADMIN',
    action: 'CREATE_PROMO_CODE',
    target_id: created.id,
    details: `Admin created promo code ${newCode} (${created.discount_value}${created.discount_type === 'PERCENTAGE' ? '%' : '$'} OFF).`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, promo: created });
});

app.put('/api/admin/promo-codes/:id/toggle', requireAdmin, (req, res) => {
  const db = DBEngine.getDB();
  const promo = (db.promo_codes || []).find((p) => p.id === req.params.id);
  if (!promo) {
    res.status(404).json({ success: false, error: 'Promo code not found.' });
    return;
  }

  promo.is_active = !promo.is_active;
  DBEngine.saveDB();
  res.json({ success: true, promo });
});

app.delete('/api/admin/promo-codes/:id', requireAdmin, (req, res) => {
  const db = DBEngine.getDB();
  db.promo_codes = (db.promo_codes || []).filter((p) => p.id !== req.params.id);
  DBEngine.saveDB();
  res.json({ success: true });
});

// Admin Audit Logs API (Searchable & Filterable)
app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  const db = DBEngine.getDB();
  let logs = [...(db.audit_logs || [])];

  const { actor_role, action, search } = req.query;
  if (actor_role) {
    logs = logs.filter((l) => (l.actor_role || '').toLowerCase() === String(actor_role).toLowerCase());
  }
  if (action) {
    logs = logs.filter((l) => (l.action || '').toLowerCase().includes(String(action).toLowerCase()));
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter((l) => (l.details || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q));
  }

  const limit = Math.min(200, Number(req.query.limit) || 100);
  res.json({
    total: logs.length,
    logs: logs.slice(-limit).reverse(),
  });
});

// Programmatic Automated Verification Test Suite API
app.get('/api/tests/run', async (_req, res) => {
  try {
    const results = await runAutomatedVerificationTests();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to run test suite.' });
  }
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  const userNotifs = db.notifications.filter((n) => n.user_id === userId);
  res.json(userNotifs);
});

// -------------------------------------------------------------
// KYC & IDENTITY COMPLIANCE API
// -------------------------------------------------------------
app.get('/api/kyc/status', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  const user = db.users.find((u) => u.id === userId);
  const submission = (db.kyc_submissions || []).find((k) => k.user_id === userId);
  res.json({
    is_verified: user?.is_verified ?? false,
    submission: submission || null,
  });
});

app.post('/api/kyc/submit', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { document_type, document_number, country } = req.body;
  const db = DBEngine.getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }
  if (!db.kyc_submissions) db.kyc_submissions = [];

  let sub = db.kyc_submissions.find((k) => k.user_id === user.id);
  if (sub && sub.status === 'VERIFIED') {
    res.status(400).json({ success: false, error: 'Your identity is already verified.' });
    return;
  }

  if (sub) {
    sub.document_type = document_type || 'PASSPORT';
    sub.document_number = document_number || '';
    sub.country = country || user.country;
    sub.status = 'PENDING';
    sub.submitted_at = new Date().toISOString();
    sub.rejection_reason = undefined;
  } else {
    sub = {
      id: `kyc-${Date.now()}`,
      user_id: user.id,
      trader_name: user.full_name,
      email: user.email,
      document_type: document_type || 'PASSPORT',
      document_number: document_number || '',
      country: country || user.country,
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
    };
    db.kyc_submissions.unshift(sub);
  }

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: user.id,
    title: 'KYC Document Submitted',
    body: 'Your identity document has been submitted for compliance verification.',
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: user.id,
    actor_role: 'USER',
    action: 'KYC_SUBMITTED',
    target_id: sub.id,
    details: `Trader ${user.email} submitted ${sub.document_type} for verification.`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, submission: sub });
});

app.get('/api/admin/kyc/submissions', requireAdmin, (_req, res) => {
  const db = DBEngine.getDB();
  res.json(db.kyc_submissions || []);
});

app.post('/api/admin/kyc/review', requireAdmin, (req, res) => {
  const { submissionId, status, rejection_reason } = req.body;
  const db = DBEngine.getDB();
  if (!db.kyc_submissions) db.kyc_submissions = [];

  const sub = db.kyc_submissions.find((k) => k.id === submissionId);
  if (!sub) {
    res.status(404).json({ success: false, error: 'KYC submission not found.' });
    return;
  }

  const isApproved = status === 'VERIFIED';
  sub.status = isApproved ? 'VERIFIED' : 'REJECTED';
  sub.reviewed_at = new Date().toISOString();
  sub.reviewed_by = req.user?.id || 'ADMIN';
  if (!isApproved) {
    sub.rejection_reason = rejection_reason || 'Identity verification declined.';
  }

  const user = db.users.find((u) => u.id === sub.user_id);
  if (user) {
    user.is_verified = isApproved;
    user.updated_at = new Date().toISOString();
  }

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: sub.user_id,
    title: isApproved ? '✅ KYC Verification Approved!' : '❌ KYC Verification Declined',
    body: isApproved
      ? 'Your identity documents have been approved. You are in full compliance for profit payouts.'
      : `Your KYC verification was declined: ${sub.rejection_reason || 'Please re-upload a clear document.'}`,
    type: isApproved ? 'success' : 'error',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: req.user?.id || 'ADMIN',
    actor_role: 'ADMIN',
    action: isApproved ? 'KYC_APPROVED' : 'KYC_REJECTED',
    target_id: sub.id,
    details: `Admin reviewed KYC for ${sub.email}: ${sub.status}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, submission: sub, submissions: db.kyc_submissions });
});

// -------------------------------------------------------------
// SUPPORT TICKETS SYSTEM API
// -------------------------------------------------------------
app.get('/api/support/tickets', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  if (!db.support_tickets) db.support_tickets = [];
  const tickets = db.support_tickets.filter((t) => t.user_id === userId);
  res.json(tickets);
});

app.post('/api/support/tickets', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { subject, category, priority, message } = req.body;
  const db = DBEngine.getDB();
  const user = db.users.find((u) => u.id === userId);

  if (!subject || !message) {
    res.status(400).json({ success: false, error: 'Subject and message are required.' });
    return;
  }

  if (!db.support_tickets) db.support_tickets = [];

  const newTicket: any = {
    id: `tick-${Date.now()}`,
    user_id: userId,
    user_name: user?.full_name || 'Trader',
    user_email: user?.email || 'trader@propfirm.com',
    subject: subject.trim(),
    category: category || 'General',
    priority: priority || 'normal',
    status: 'open',
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        sender_name: user?.full_name || 'Trader',
        message: message.trim(),
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.support_tickets.unshift(newTicket);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: userId,
    title: 'Support Ticket Created',
    body: `Ticket #${newTicket.id} "${newTicket.subject}" created. Our 24/7 team will respond shortly.`,
    type: 'info',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: userId,
    actor_role: 'USER',
    action: 'SUPPORT_TICKET_CREATED',
    target_id: newTicket.id,
    details: `User created ticket: ${newTicket.subject}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, ticket: newTicket, tickets: db.support_tickets.filter((t) => t.user_id === userId) });
});

app.post('/api/support/tickets/:id/reply', requireAuth, (req, res) => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { message } = req.body;
  const db = DBEngine.getDB();
  if (!db.support_tickets) db.support_tickets = [];

  const ticket = db.support_tickets.find((t) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ success: false, error: 'Ticket not found.' });
    return;
  }

  const isAdmin = req.user?.role === 'ADMIN' || (req.headers['x-user-id'] as string) === 'admin-vaibhav-id-999';
  if (!isAdmin && ticket.user_id !== userId) {
    res.status(403).json({ success: false, error: 'Unauthorized to reply to this ticket.' });
    return;
  }

  const user = db.users.find((u) => u.id === userId);
  const senderRole = isAdmin ? 'admin' : 'user';

  ticket.messages.push({
    id: `msg-${Date.now()}`,
    sender: senderRole,
    sender_name: isAdmin ? 'FundedShift Support Desk' : user?.full_name || 'Trader',
    message: String(message || '').trim(),
    created_at: new Date().toISOString(),
  });

  ticket.updated_at = new Date().toISOString();
  if (isAdmin && ticket.status === 'open') {
    ticket.status = 'in_progress';
  }

  if (isAdmin) {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: ticket.user_id,
      title: 'Support Response Received',
      body: `Support team replied to ticket #${ticket.id}: "${ticket.subject}"`,
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  DBEngine.saveDB();
  res.json({ success: true, ticket });
});

app.get('/api/admin/support/tickets', requireAdmin, (_req, res) => {
  const db = DBEngine.getDB();
  res.json(db.support_tickets || []);
});

app.post('/api/admin/support/tickets/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const db = DBEngine.getDB();
  if (!db.support_tickets) db.support_tickets = [];

  const ticket = db.support_tickets.find((t) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ success: false, error: 'Ticket not found.' });
    return;
  }

  ticket.status = status;
  ticket.updated_at = new Date().toISOString();

  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: req.user?.id || 'ADMIN',
    actor_role: 'ADMIN',
    action: 'SUPPORT_TICKET_STATUS_UPDATED',
    target_id: ticket.id,
    details: `Admin changed status of ticket #${ticket.id} to ${status}`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, ticket });
});


// -------------------------------------------------------------
// VITE MIDDLEWARE / PRODUCTION STATIC FILE SERVER
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Funded Shift Prop Firm Backend & Simulated Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
