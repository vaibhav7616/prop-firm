import { Link } from 'react-router-dom';
import { DollarSign, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export function RefundPolicyPage() {
  const lastUpdated = 'October 24, 2026';

  return (
    <div className="pt-28 pb-20 bg-background min-h-screen">
      {/* Header Banner */}
      <section className="relative overflow-hidden py-12 border-b border-border bg-gradient-to-b from-brand-50/40 via-background to-background dark:from-brand-950/20">
        <div className="container-page relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4">
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
            Transparent Financial Policy
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-foreground">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-3 text-slate-600 dark:text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Clear, upfront terms regarding evaluation challenge purchases, cancellation windows, 100% fee refunds on payouts, and chargeback rules.
          </p>
          <p className="mt-2 text-xs font-mono text-slate-400">
            Last Updated & Effective Date: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container-page max-w-4xl mx-auto space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
                100%
              </div>
              <h3 className="font-bold text-slate-900 dark:text-foreground text-sm sm:text-base">
                14-Day Cooling-Off Period
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Full 100% refund available within 14 days of purchase <strong>provided that zero trades have been opened</strong> on the account.
              </p>
            </div>

            <div className="p-5 rounded-2xl border-2 border-brand-300 bg-brand-50/50 dark:bg-brand-950/20 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold">
                🎁
              </div>
              <h3 className="font-bold text-slate-900 dark:text-foreground text-sm sm:text-base">
                Fee Refund on 1st Payout
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your entire initial challenge registration fee is refunded in full alongside your first successful profit distribution on 2-Step accounts.
              </p>
            </div>

            <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold">
                ⚠️
              </div>
              <h3 className="font-bold text-slate-900 dark:text-foreground text-sm sm:text-base">
                Non-Refundable Once Traded
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Once the first trade is placed or orders are executed, evaluation costs are active and non-refundable due to server resource allocation.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">01.</span> Digital Evaluation Service Model
            </h2>
            <p>
              When purchasing an evaluation challenge on FundedShift, you are purchasing immediate access to proprietary digital software, simulated market data feeds, risk management servers, and talent benchmarking services.
            </p>
            <p>
              Upon purchase confirmation, your credentials and server environment are instantly provisioned. In accordance with digital service regulations, the right of withdrawal is waived once performance of the digital service has begun with your consent.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">02.</span> 14-Day Zero-Trade Cancellation Guarantee
            </h2>
            <p>
              We want all traders to feel completely confident when joining FundedShift. If you change your mind after purchasing an account, you are entitled to a 100% full refund under the following strict conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>Your refund request is submitted within fourteen (14) calendar days of the original purchase timestamp.</li>
              <li><strong>Zero trades have been placed:</strong> The account has 0 open, closed, or pending orders, and the starting balance has not fluctuated by any amount.</li>
              <li>You have not breached any platform policies or created duplicate accounts to circumvent rules.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Approved zero-trade refunds are processed back to the original payment method (Card, UPI, or Crypto wallet) within 3 to 5 business days.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">03.</span> Registration Fee Refund on First Payout
            </h2>
            <p>
              FundedShift rewards disciplined, profitable trading talent. When you successfully:
            </p>
            <ol className="list-decimal pl-6 space-y-1.5 text-sm sm:text-base">
              <li>Pass Phase 1 and Phase 2 of the 2-Step Evaluation Challenge.</li>
              <li>Complete the verification process and receive your live Funded Account.</li>
              <li>Reach your first profit milestone and request your first payout cycle.</li>
            </ol>
            <p className="mt-2">
              <strong>Your 100% initial registration fee is reimbursed and paid out on top of your performance profit split.</strong> This means passing your evaluation makes the entire program completely free of cost.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">04.</span> Ineligible Circumstances for Refunds
            </h2>
            <p>Refunds will strictly NOT be granted in the following scenarios:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>
                <strong>Rule Violations & Account Breaches:</strong> Breaching the 5% daily drawdown, 10% maximum total drawdown, or prohibited trading rules does not qualify for a refund.
              </li>
              <li>
                <strong>Active or Traded Accounts:</strong> Any account that has executed at least one trade is ineligible for a purchase fee refund.
              </li>
              <li>
                <strong>Market Volatility or Slippage:</strong> Claims based on adverse market movements, news spikes, or stop loss executions occurring during real market volatility.
              </li>
              <li>
                <strong>Client Technical Issues:</strong> Local internet service disconnections, browser cache errors, power outages, or device crashes on the client&apos;s side.
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">05.</span> Chargeback & Fraud Dispute Warning
            </h2>
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-sm">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Zero-Tolerance Policy for Fraudulent Chargebacks
              </div>
              <p className="text-xs sm:text-sm text-red-900 dark:text-red-200/90 leading-relaxed">
                Initiating an unauthorized chargeback or payment dispute through your bank, card issuer, or payment provider without first contacting FundedShift support will result in:
              </p>
              <ul className="list-disc pl-5 text-xs sm:text-sm text-red-900 dark:text-red-200/90 space-y-1">
                <li>Immediate permanent termination of all active trading accounts and dashboard access.</li>
                <li>Forfeiture of all pending or accrued profit disbursements.</li>
                <li>Permanent blacklisting across institutional proprietary trading fraud networks.</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">06.</span> How to Request a Refund
            </h2>
            <p>
              If your account is eligible under the 14-Day Zero-Trade Guarantee, submit your request to our billing desk:
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-card border border-border text-xs sm:text-sm font-mono space-y-1">
              <p>Email: billing@fundedshift.com</p>
              <p>Subject: Zero-Trade Refund Request - [Your Order ID or Account Number]</p>
              <p>Include: Registered email, payment transaction receipt, and reason for cancellation.</p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-foreground">Have questions about challenge rules?</p>
              <p className="text-xs text-slate-500">Read our complete risk parameters and objectives guide.</p>
            </div>
            <Link
              to="/rules"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>Explore Trading Rules</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
