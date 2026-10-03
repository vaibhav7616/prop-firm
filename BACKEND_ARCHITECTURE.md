# FundedShift Prop Firm Platform — Backend Architecture & Verification Manual

## 1. System Overview & Architecture

FundedShift is an institutional-grade Proprietary Trading Firm (Prop Firm) platform providing simulated evaluations and funded capital management.

### Technology Stack
* **Runtime**: Node.js v20+ / TypeScript (ES2022) with `tsx`
* **API Framework**: Express 4.x with custom security middlewares
* **Database & Storage**: Acid-like JSON Database Engine (`DBEngine`) in `.data/propfirm_database.json`
* **Authentication**: Cryptographic HMAC-SHA256 JWT tokens with role-based authorization (`requireAuth`, `requireAdmin`) and PBKDF2 (SHA-512) password hashing
* **Trading Engine**: MT5 Institutional Pricing, Margin, Slippage, and Commission Calculation Engine
* **Realtime Market Feeds**: TradingView Live Streaming WebSocket (`wss://data.tradingview.com`) with HTTP fallbacks and Server-Sent Events (SSE) broadcast (`/api/market/ticks/stream`)
* **Background Jobs**: Continuous 1-second risk monitor, 3-second transition scheduler, and 00:00 UTC daily baseline rollover (`ScheduledJobsEngine`)
* **Frontend**: React 19 + Vite (UI preserved 100% visually without modification)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19 SPA)                    │
│      Dashboard · Trading Terminal · Admin Command Portal    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE Stream
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Gateway                       │
│     Rate Limiter · JWT Auth · Role Guard · CORS · Logs      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│     Prop Firm Rule Engine    ││    Trade Execution Engine   │
│  · Daily Drawdown (UTC 00:00)││  · MT5 Margin & PnL Formula │
│  · Max Drawdown (Static/Trl) ││  · Market Orders & Partials │
│  · Profit Targets & Flating  ││  · SL / TP Execution Guard  │
│  · Auto-Liquidation Monitor  ││  · Dynamic Risk Shield      │
└──────────────┬───────────────┘└─────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Differentiated Feature Suite                   │
│  · Trader Risk Intelligence    · Trader Health Score (0-100)│
│  · Strategy Fingerprint        · What-If Rule Simulator    │
│  · Explainable Rule Breach     · Account Recovery Engine    │
│  · Performance Timeline        · Idempotent Payment Webhook │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Authoritative Database (DBEngine)            │
│  Users · Accounts · Orders · Payments · Positions · Audits  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Database Structure & Schema

The persistent database is maintained in `.data/propfirm_database.json` with the following entities:

1. **`users`**:
   * `id`: Unique user identifier (`usr-...`)
   * `email`: Lowercase, normalized email address
   * `password_hash`: 128-character PBKDF2-SHA512 hash
   * `full_name`, `role` (`'USER' | 'ADMIN' | 'SUPPORT' | 'FINANCE' | 'RISK_MANAGER'`)
   * `affiliate_code`, `is_verified`, `is_2fa_enabled`, `created_at`, `updated_at`

2. **`account_plans` & `challenges`**:
   * Account tiers: $5,000, $10,000, $25,000, $50,000, $100,000, $200,000
   * Challenge models:
     * `one_step`: 10% profit target, 4% daily DD, 8% max DD, 3 min trading days, 90% split.
     * `two_step`: Phase 1 (8% profit target, 5% daily DD, 10% max DD) -> Phase 2 (5% profit target) -> Funded.
     * `instant_funding`: 0% profit target, 3-5% daily DD, 6-10% max DD, 7 min trading days before payout, 70-80% split.

3. **`accounts`**:
   * `id`, `user_id`, `order_id`, `account_number`, `login`
   * `password_hash`, `investor_password_hash`
   * `server`, `broker`, `platform`, `plan_name`, `type`
   * `account_size`, `starting_balance`, `current_balance`, `current_equity`
   * `highest_balance`, `highest_equity`
   * `start_of_day_balance`, `start_of_day_equity` (reset at 00:00 UTC)
   * `status`: `'ACTIVE' | 'PASSED' | 'FUNDED' | 'BREACHED' | 'PAYOUT_PENDING' | 'CLOSED'`
   * `phase`: 1 for Step 1, 2 for Step 2, 1 for Funded
   * `trading_days`: Distinct calendar trading days tracked server-side
   * `rules`: Authoritative rule configuration

4. **`positions` & `trade_orders`**:
   * `id`, `account_id`, `user_id`, `symbol`, `type` (`BUY` / `SELL`)
   * `lot_size`, `open_price`, `close_price`, `stop_loss`, `take_profit`
   * `margin`, `floating_pnl`, `realized_pnl`, `commission`, `swap`
   * `status` (`'OPEN' | 'CLOSED'`), `opened_at`, `closed_at`
   * `close_reason` (`'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'BREACH_AUTO_CLOSE' | 'PHASE_PASSED_FLAT'`)

5. **`rule_violations`**:
   * `id`, `account_id`, `user_id`, `rule_type`, `threshold_value`, `actual_value`
   * `balance_at_breach`, `equity_at_breach`, `drawdown_at_breach`, `details`, `created_at`

6. **`payout_requests`**:
   * `id`, `account_id`, `user_id`, `account_number`, `total_profit`, `trader_split_percent`
   * `trader_payout_amount`, `firm_share_amount`, `payout_method`, `payout_address`
   * `status` (`'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'`)
   * `paid_at`, `reviewed_at`, `reviewed_by`, `created_at`

7. **`audit_logs`**:
   * Immutable system event record: `id`, `actor_id`, `actor_role`, `action`, `target_id`, `entity_type`, `details`, `ip_address`, `metadata`, `created_at`.

---

## 3. Account Lifecycle State Machine

```
   [USER CHECKOUT]
          │
          ▼
   [PENDING_PAYMENT] ──(Webhook / Payment Completed)──► [ACTIVE (Phase 1)]
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      ▼                                               ▼
                              [TARGET REACHED]                                 [LIMIT BREACHED]
                                      │                                               │
                                      ▼                                               ▼
                              [PASSED (Phase 1)]                              [BREACHED]
                                      │                                               │
                     ┌────────────────┴────────────────┐                              ▼
                     │ (2-Step)                        │ (1-Step)            [RECOVERY / RESET]
                     ▼                                 ▼                              │
             [ACTIVE (Phase 2)]                        │                              ▼
                     │                                 │                       [ACTIVE RE-EVAL]
                     ▼                                 │
             [PASSED (Phase 2)]                        │
                     │                                 │
                     └────────────────┬────────────────┘
                                      │
                                      ▼
                              [FUNDED ACCOUNT]
                                      │
                                      ▼
                             [PAYOUT ELIGIBLE]
                                      │
                                      ▼
                             [PAYOUT_REQUESTED]
                                      │
                                      ▼
                             [PAYOUT_APPROVED]
                                      │ (Balance resets to initial capital)
                                      ▼
                              [FUNDED (Active)]
```

---

## 4. Trading Rule Engine

All calculations are enforced strictly server-side:

### Daily Drawdown
* **Baseline**: `startOfDayBaseline = Math.max(start_of_day_balance, start_of_day_equity)`.
* **Rollover**: Automatically reset daily at 00:00 UTC by `ScheduledJobsEngine`.
* **Current Daily Loss**: `Math.max(0, startOfDayBaseline - currentEquity)`.
* **Threshold**: `(rules.daily_loss_limit_percent / 100) * startOfDayBaseline`.
* **Warning**: Dispatched at 80% utilization of daily loss allowance.
* **Breach**: Immediately locks account, liquidates open positions with `BREACH_AUTO_CLOSE`, and records immutable violation audit.

### Maximum Drawdown
* **Static Model**: `currentOverallLoss = starting_balance - currentEquity`.
* **Trailing Model**: `currentOverallLoss = highest_equity - currentEquity`.
* **Threshold**: `(rules.max_loss_limit_percent / 100) * starting_balance`.

### Profit Target & Flating Requirement
* Target: e.g. 8% (Phase 1) and 5% (Phase 2).
* **Flat Requirement**: To officially pass and progress to the next phase, all positions must be closed flat with zero open floating risk.
* **Minimum Trading Days**: Enforces distinct execution calendar days.

### Weekend Holding Rule
* Accounts with `weekend_holding_allowed: false` are audited when underlying markets close for the weekend. Non-crypto open positions are automatically liquidated to protect capital.

---

## 5. Trade Engine

1. **Order Validation**:
   * Enforces positive finite lot sizes between `minLot` and `maxLot` and below account tier limit.
   * Enforces directional correctness of SL/TP:
     * BUY: `stopLoss < entryPrice` and `takeProfit > entryPrice`.
     * SELL: `stopLoss > entryPrice` and `takeProfit < entryPrice`.
   * Enforces available margin checks via MT5 institutional formulas.
2. **Partial Close**:
   * Supports `POST /api/trading/partial-close` allowing closing a portion of an active position (e.g. 0.5 of 1.0 lot) with proportional realized P&L, margin release, and balance updates.
3. **Execution**:
   * $6/lot round-turn commission.
   * Realized P&L updates balance; floating P&L updates equity.
   * Real-time SL/TP automated triggers on every price tick.

---

## 6. Payment, Checkout & Webhook Security

* **Server-Side Authoritative Pricing**: Client amounts are never trusted. Prices and rule presets are pulled strictly from `challenges` and `account_plans`.
* **Coupon Validation**: Checks code active status, expiration, and usage limits server-side.
* **Duplicate Submission Protection**: Deduplicates submissions within 5-second windows to prevent double account generation.
* **Idempotent Webhook (`/api/payments/webhook`)**: Validates transaction keys and signatures before completing orders and provisioning accounts.

---

## 7. Payout Engine

* **Eligibility Criteria**:
  1. Account status must be `FUNDED`.
  2. Zero active rule breaches.
  3. **Flat Position Requirement**: Zero open positions.
  4. Realized profit must be positive with minimum $100 payout threshold.
  5. 14-day payout cooldown period between payouts.
* **Profit Split Calculation**:
  * Trader payout: `(profit_split_percent / 100) * netProfit`.
  * Firm share: `netProfit - traderPayout`.
* **Admin Approval**:
  * On approval, the account balance is reset to `starting_balance`, start-of-day baselines are updated, payout marked `PAID`, and immutable audit log created.

---

## 8. Differentiated Prop Firm Features

1. **Trader Risk Intelligence (`GET /api/trader/risk-profile/:accountId`)**:
   * Calculates win rate, profit factor, average win/loss, risk-to-reward ratio, winning/losing streaks, holding style (Scalper / Day Trader / Swing Trader), symbol concentration, overtrading score, and revenge trading detection.
2. **Trader Health Score (`GET /api/trader/health-score/:accountId`)**:
   * Quantitative 0-100 score across 5 institutional dimensions: Drawdown Control (30 pts), Risk/Reward Discipline (20 pts), Position Sizing (20 pts), Rule Adherence (20 pts), and Pacing (10 pts).
3. **Strategy Fingerprint (`GET /api/trader/strategy-fingerprint/:accountId`)**:
   * Algorithmic behavior classification: Style confidence, News trading detection, Martingale/Grid detection, Single-instrument specialization, and Stop Loss usage rate.
4. **Dynamic Risk Shield (`GET /api/trader/risk-shield/:accountId`, `/api/admin/risk-shield/config`)**:
   * Configurable risk buffer: Warning at 70% daily loss; at 85% daily loss, caps max lot size by 50% and mandates Stop Loss on new positions.
5. **Rule Simulator / What-If Engine (`POST /api/trading/simulate-trade`)**:
   * Real server calculation of prospective trades: required margin, risk at SL, reward at TP, projected daily DD, remaining DD allowance, and breach warning before order placement.
6. **Explainable Rule Breach (`GET /api/accounts/:id/violations/explain`)**:
   * Detailed breakdown of rule breaches with exact mathematical formulas, baselines, equity drops, timestamps, and recovery advice.
7. **Account Recovery & Re-evaluation Engine (`GET /api/accounts/:id/recovery-options`, `POST /api/accounts/:id/recovery-reset`)**:
   * Provides eligible breached accounts a structured re-evaluation / reset option with loyalty discounts while archiving historical performance.
8. **Performance Timeline (`GET /api/accounts/:id/timeline`)**:
   * Chronologically structured event timeline capturing provisioning, trade executions, milestone achievements, warnings, breaches, and payouts.

---

## 9. Security Model

* **Cryptographic JWTs**: HMAC-SHA256 signed tokens with 7-day expiration and role claims.
* **Role-Based Authorization**: `requireAdmin` middleware guards all `/api/admin/*` endpoints.
* **Brute-Force & Rate Limiting**: In-memory sliding window limiters for authentication, checkout, and order submissions.
* **Credential Protection**: Password hashes and salts are stripped from all client responses via `sanitizeUser`.
* **Financial Tamper Protection**: Balances, equities, margins, and prices are computed exclusively on the server.

---

## 10. Automated Test Suite

Run the full verification suite using:
```bash
npm test
```
Or via HTTP endpoint:
```http
GET /api/tests/run
```

The automated test suite verifies:
* PBKDF2 hashing & verification
* Cryptographic JWT generation, decoding & tampering rejection
* User sanitization
* Institutional Forex & Commodity MT5 P&L formulas
* MT5 Margin calculation (EURUSD 1:100 leverage)
* Market order placement & invalid SL rejection
* Partial position close execution & lot size reduction
* Daily loss limit breach & automated open position liquidation
* Profit target pass & multi-stage account transition (Step 1 -> Step 2)
* Checkout with server-side authoritative pricing & discount calculation
* Funded account payout eligibility & admin approval balance reset
* What-If Rule Simulator calculations
* Trader Risk Profile, Health Score (0-100), and Strategy Fingerprint
* Performance Timeline event generation
