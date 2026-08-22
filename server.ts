import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DBEngine, hashPassword, verifyPassword } from './src/server/db';
import { marketDataService } from './src/server/marketData';
import { RuleEngine } from './src/server/ruleEngine';
import { tradeExecutionEngine } from './src/server/tradeEngine';
import { PayoutEngine } from './src/server/payoutEngine';
import { paymentService } from './src/server/paymentEngine';
import { ScheduledJobsEngine } from './src/server/auditJobs';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize DB and background jobs
DBEngine.getDB();
ScheduledJobsEngine.startJobs();

// -------------------------------------------------------------
// HEALTH & STATUS ENDPOINT
// -------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'FundedShift Prop Firm Backend & Simulated Trading Engine v2.0',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = DBEngine.getDB();

  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

  if (!user) {
    // Auto-register demo trader if first time logging in
    const newUser = {
      id: `usr-${Date.now()}`,
      email: email || 'trader@propfirm.com',
      password_hash: hashPassword(password || 'Trader123!'),
      full_name: email ? email.split('@')[0] : 'Prop Trader',
      role: 'USER' as const,
      country: 'United States',
      phone: '+1 555-0192',
      affiliate_code: `FS${Math.floor(100 + Math.random() * 900)}`,
      is_verified: true,
      is_2fa_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    DBEngine.saveDB();

    const { password_hash, ...safeUser } = newUser;
    res.json({ token: `jwt-${newUser.id}`, user: safeUser });
    return;
  }

  // Verify password if provided
  if (password && !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const { password_hash, ...safeUser } = user;
  res.json({ token: `jwt-${user.id}`, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, full_name, country, phone } = req.body;
  const db = DBEngine.getDB();

  let existing = db.users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());
  if (existing) {
    const { password_hash, ...safeUser } = existing;
    res.json({ token: `jwt-${existing.id}`, user: safeUser });
    return;
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: email || `trader_${Date.now()}@propfirm.com`,
    password_hash: hashPassword(password || 'Trader123!'),
    full_name: full_name || 'New Prop Trader',
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
  DBEngine.saveDB();

  const { password_hash, ...safeUser } = newUser;
  res.json({ token: `jwt-${newUser.id}`, user: safeUser });
});

// Admin Authentication
app.post('/api/auth/admin-login', (req, res) => {
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
    const adminUser = {
      id: 'admin-vaibhav-id-999',
      email: 'vaibhav7616@propfirm.com',
      full_name: 'Vaibhav (Admin)',
      role: 'ADMIN' as const,
      country: 'Global',
      created_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      token: `admin-jwt-${adminUser.id}`,
      user: adminUser,
      profile: {
        ...adminUser,
        phone: '+1 800-FUNDEDSHIFT',
        avatar_url: null,
        affiliate_code: 'ADMIN_PRO',
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
app.get(['/api/accounts', '/api/user/accounts'], (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();

  // Evaluate rules on all user accounts to ensure live state
  const userAccounts = db.accounts.filter((a) => a.user_id === userId);
  for (const acc of userAccounts) {
    RuleEngine.evaluateAccount(acc.id);
  }

  res.json(userAccounts);
});

app.get('/api/accounts/:id', (req, res) => {
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

// -------------------------------------------------------------
// SIMULATED TRADING EXECUTION ENGINE API
// -------------------------------------------------------------
app.post('/api/trading/order', async (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
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

app.post('/api/trading/close-position', async (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
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

// -------------------------------------------------------------
// CHECKOUT & ORDERS API
// -------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  const orders = db.orders.filter((o) => o.user_id === userId);
  res.json(orders);
});

app.post('/api/orders/checkout', async (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const { account_size, plan_id, platform, payment_method, coupon_code } = req.body;

  const result = await paymentService.processCheckout({
    userId,
    planId: plan_id || 'plan-2step-100k',
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
    ];
    DBEngine.saveDB();
  }
  res.json(db.challenges);
});

app.post('/api/admin/challenges/update', (req, res) => {
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

app.get('/api/admin/affiliate/withdrawals', (_req, res) => {
  const db = DBEngine.getDB();
  if (!db.affiliate_withdrawals) {
    db.affiliate_withdrawals = [];
  }
  res.json(db.affiliate_withdrawals);
});

app.post('/api/admin/affiliate/withdraw/process', (req, res) => {
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
app.get('/api/admin/stats', (_req, res) => {
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

app.post('/api/admin/accounts/update-status', (req, res) => {
  const { account_id, status } = req.body;
  const db = DBEngine.getDB();

  const acc = db.accounts.find((a) => a.id === account_id);
  if (!acc) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  acc.status = status;
  db.audit_logs.push({
    id: `audit-${Date.now()}`,
    actor_id: 'ADMIN',
    actor_role: 'ADMIN',
    action: 'ADMIN_ACCOUNT_STATUS_CHANGE',
    target_id: acc.id,
    details: `Admin changed account #${acc.account_number} status to ${status}.`,
    created_at: new Date().toISOString(),
  });

  DBEngine.saveDB();
  res.json({ success: true, account: acc });
});

app.post('/api/admin/payouts/process', (req, res) => {
  const { payoutId, action, reason } = req.body;
  const result = PayoutEngine.processPayoutAdmin({
    payoutId,
    adminId: 'admin-vaibhav-id-999',
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
app.post('/api/admin/accounts/issue-manual', (req, res) => {
  const { email, full_name, account_size, type, platform, broker } = req.body;
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

  const challengeType = type || 'two_step';
  const plan = db.account_plans.find((p) => p.account_size === Number(account_size) && p.type === challengeType) || db.account_plans[1];
  const rulesConfig = plan ? plan.rules : db.account_plans[0].rules;
  const isInstant = challengeType === 'instant_funding';

  const orderId = `ord-${Date.now()}-admin`;
  const newOrder = {
    id: orderId,
    user_id: user.id,
    plan_id: plan ? plan.id : 'plan-2step-100k',
    plan_name: plan ? plan.name : `FundedShift $${Number(account_size).toLocaleString()} Account`,
    account_size: Number(account_size),
    platform: platform || 'fundedshift_terminal',
    addons: [],
    discount_amount: plan ? plan.price : 499,
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
    plan_id: plan ? plan.id : 'plan-2step-100k',
    plan_name: plan ? plan.name : `FundedShift $${Number(account_size).toLocaleString()} Account`,
    type: challengeType as any,
    account_size: Number(account_size),
    starting_balance: Number(account_size),
    current_balance: Number(account_size),
    current_equity: Number(account_size),
    highest_balance: Number(account_size),
    highest_equity: Number(account_size),
    start_of_day_balance: Number(account_size),
    start_of_day_equity: Number(account_size),
    status: isInstant ? ('FUNDED' as const) : ('ACTIVE' as const),
    phase: isInstant ? 3 : 1,
    trading_days: 0,
    leverage: rulesConfig.leverage,
    rules: rulesConfig,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  db.accounts.unshift(newAccount);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: user.id,
    title: '🎉 Admin Issued Trading Account!',
    body: `Admin assigned a $${Number(account_size).toLocaleString()} ${challengeType.replace('_', ' ').toUpperCase()} account (#${newAccNumber}) to your email. Login: ${newAccNumber}, Password: ${traderPassword}`,
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
    details: `Admin issued $${Number(account_size).toLocaleString()} account #${newAccNumber} to ${user.email}.`,
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

app.post('/api/admin/promo-codes', (req, res) => {
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

app.put('/api/admin/promo-codes/:id/toggle', (req, res) => {
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

app.delete('/api/admin/promo-codes/:id', (req, res) => {
  const db = DBEngine.getDB();
  db.promo_codes = (db.promo_codes || []).filter((p) => p.id !== req.params.id);
  DBEngine.saveDB();
  res.json({ success: true });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-trader-id-12345';
  const db = DBEngine.getDB();
  const userNotifs = db.notifications.filter((n) => n.user_id === userId);
  res.json(userNotifs);
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
