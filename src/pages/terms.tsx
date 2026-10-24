import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, FileText, AlertTriangle, Scale, Lock, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';

export function TermsPage() {
  const lastUpdated = 'October 24, 2026';

  return (
    <div className="pt-28 pb-20 bg-background min-h-screen">
      {/* Header Banner */}
      <section className="relative overflow-hidden py-12 border-b border-border bg-gradient-to-b from-brand-50/40 via-background to-background dark:from-brand-950/20">
        <div className="container-page relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-4">
            <Scale className="h-3.5 w-3.5 text-brand-600" />
            Official Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-foreground">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-slate-600 dark:text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Please read these terms carefully before participating in any evaluation challenge or utilizing the FundedShift Web Terminal.
          </p>
          <p className="mt-2 text-xs font-mono text-slate-400">
            Last Updated & Effective Date: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="py-12">
        <div className="container-page max-w-4xl mx-auto space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">

          {/* Quick Notice Banner */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-5 sm:p-6 flex items-start gap-4 shadow-xs">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed space-y-1">
              <strong className="font-bold text-amber-950 dark:text-amber-100 block text-sm">
                CRITICAL REGULATORY NOTICE: SIMULATED ENVIRONMENT ONLY
              </strong>
              <p>
                All accounts provided to clients by FundedShift are <strong>simulated accounts with fictitious funds</strong>. All trading activities are conducted in a demo environment for educational, talent evaluation, and skill benchmarking purposes only. FundedShift does not act as a broker, custodian, or financial intermediary.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">01.</span> Acceptance of Terms & Introduction
            </h2>
            <p>
              These Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally binding agreement between you (&quot;Trader&quot;, &quot;User&quot;, &quot;Client&quot;, or &quot;You&quot;) and <strong>FundedShift Proprietary Trading Technologies Ltd.</strong> (&quot;FundedShift&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;).
            </p>
            <p>
              By purchasing an Evaluation Challenge, registering an account on our website, accessing the FundedShift Web Terminal, or requesting a profit distribution, you confirm that you have read, understood, and unconditionally accept all terms, rules, risk disclosures, and policies herein.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">02.</span> Nature of Service & Simulated Trading
            </h2>
            <p>
              FundedShift provides a proprietary talent identification platform for retail and institutional traders. The services encompass:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>
                <strong>Evaluation Challenges:</strong> 1-Step, 2-Step, and Instant Funding simulated evaluation tiers designed to test risk management and consistency.
              </li>
              <li>
                <strong>Web Trading Terminal:</strong> Access to simulated quote streams covering Forex pairs, Precious Metals (Gold/XAUUSD, Silver/XAGUSD), Stock Indices (US30, NAS100, SPX500, GER40), and Cryptocurrencies.
              </li>
              <li>
                <strong>Fictitious Capital:</strong> Under no circumstance does a client trade with their own capital or with real client deposits in the market. The account balances ($5,000 to $200,000) are purely virtual test parameters.
              </li>
              <li>
                <strong>Performance Rewards:</strong> Clients who successfully pass evaluations and maintain strict risk parameters may be entitled to receive performance fees (profit splits up to 90%) as independent contractor payouts.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">03.</span> Trader Eligibility & KYC Compliance
            </h2>
            <p>
              To create an account and participate in FundedShift programs, you must satisfy the following criteria:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>You must be at least eighteen (18) years of age or the legal age of majority in your jurisdiction.</li>
              <li>You must not reside in, or be a national of, any territory sanctioned by OFAC, the United Nations, or the European Union (including North Korea, Iran, Syria, Cuba, and Russian-occupied regions of Ukraine).</li>
              <li>You must successfully pass Know-Your-Customer (KYC) identity verification prior to receiving any profit payout. Verification requires government-issued photo identification (Passport, National ID, or Driver&apos;s License) and valid proof of address.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">04.</span> Trading Rules, Risk Limits & Automated Breaches
            </h2>
            <p>
              To maintain the integrity of our simulated risk model, traders must strictly comply with all published trading parameters:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">5% Maximum Daily Drawdown</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Losses on any single trading day must not equal or exceed 5% of the starting balance of that day. Calculated based on higher of balance or equity at daily rollover (00:00 UTC).
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">10% Maximum Overall Drawdown</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Account equity or balance must never fall 10% below the initial account size. This is a hard, non-negotiable trailing/static limit.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">5 Minimum Trading Days</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Traders must execute trades on at least 5 distinct trading days across One Step, Two Step (each phase), and Instant Funding accounts before becoming eligible for review, advancement, or payouts.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">No Consistency Rule</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  FundedShift enforces NO consistency rule. You have complete freedom to trade your strategy without artificial daily profit caps, lot size scaling limits, or lot consistency ratios.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">Automated Liquidation</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Breaching any risk rule triggers automatic closure of all open positions and immediate locking of credentials. Breached accounts cannot be reopened.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">05.</span> Strictly Prohibited Trading Practices
            </h2>
            <p>
              FundedShift looks for sustainable trading talent. The following practices exploit simulated environment conditions and are strictly prohibited across all accounts:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>
                <strong>Latency Arbitrage & Feed Exploitation:</strong> Using latency delays between pricing servers and internet connections to trade on delayed quotes.
              </li>
              <li>
                <strong>Reverse Trading & Cross-Account Hedging:</strong> Opening opposite buy and sell positions across multiple accounts held by the same trader or coordinated groups.
              </li>
              <li>
                <strong>High-Frequency Toxic Order Flow (HFT):</strong> Utilizing automated scripts that open and close hundreds of positions within milliseconds.
              </li>
              <li>
                <strong>Account Sharing & Passing Services:</strong> Granting third parties access to your account credentials or employing unauthorized challenge passing services.
              </li>
              <li>
                <strong>One-Sided News Gambling:</strong> Opening maximum leverage positions minutes before Tier-1 news releases (NFP, CPI, FOMC) with no risk controls.
              </li>
              <li>
                <strong>Instant Funding News Trading:</strong> News trading is permitted on One Step and Two Step evaluation models. However, opening or closing any trade within 2 minutes before or 2 minutes after a high-impact (Red-Folder) macroeconomic announcement on an Instant Funding account constitutes an immediate rule breach and triggers instant automated account liquidation and termination.
              </li>
              <li>
                <strong>Weekend Holding Restriction on Instant Funding:</strong> Holding trades over the weekend is permitted on One Step and Two Step evaluation accounts. On Instant Funding accounts, weekend holding is strictly prohibited; all open positions must be closed prior to Friday 21:00 UTC market close. Holding open positions past market close results in automated breach and liquidation.
              </li>
            </ul>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-2">
              * Any account detected engaging in prohibited strategies will be immediately terminated with forfeiture of all evaluation progress and payout eligibility.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">06.</span> Performance Distributions & Payouts
            </h2>
            <p>
              Funded account traders are eligible for profit distributions subject to the following institutional procedures:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>
                <strong>Profit Split Ratio:</strong> We operate a standardized 80/20 profit split pattern across all accounts (80% to the trader, 20% to the firm), including One Step, Two Step, and Instant Funding accounts.
              </li>
              <li>
                <strong>Payout Eligibility & Schedule:</strong> First payout request is eligible after completing at least 5 distinct trading days on the funded stage with a minimum net profit of $100. Subsequent payouts follow a 14-day cycle.
              </li>
              <li>
                <strong>Flat Positions Requirement:</strong> All positions must be completely closed and pending orders cancelled before submitting a withdrawal request.
              </li>
              <li>
                <strong>Supported Payment Methods:</strong> Payouts are disbursed via Crypto (USDT TRC20, USDC ERC20), Bank Wire Transfer, UPI, or Razorpay within 24 to 48 business hours of approval.
              </li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">07.</span> Fees, Cancellation & Refund Policy
            </h2>
            <p>
              Participation in an evaluation challenge requires payment of a one-time setup fee. Fees cover server provisioning, market data feeds, and proprietary risk monitoring software.
            </p>
            <p>
              For full details regarding the 14-day zero-trade cancellation guarantee and challenge fee refunds upon first payout, please review our comprehensive{' '}
              <Link to="/refund-policy" className="text-brand-600 font-bold hover:underline">
                Refund Policy
              </Link>.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">08.</span> Limitation of Liability
            </h2>
            <p>
              FundedShift, its directors, employees, and technology affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base text-slate-500">
              <li>Internet connection dropouts, hardware failures, or trader device malfunctions.</li>
              <li>Market volatility slippage during news events or market rollover sessions.</li>
              <li>Unauthorized access resulting from compromised client passwords or devices.</li>
            </ul>
          </div>

          {/* Section 9 */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground">
              Contact & Inquiries
            </h2>
            <p className="text-sm">
              If you have any questions or require clarification regarding these Terms and Conditions, please contact our legal and compliance desk:
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-card border border-border text-xs sm:text-sm font-mono">
              Email: compliance@fundedshift.com | support@fundedshift.com<br />
              Hours: 24/7 Global Trading Desk & Risk Operations
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
