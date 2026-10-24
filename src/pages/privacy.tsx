import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, Database, Globe, Key, FileCheck, CheckCircle2 } from 'lucide-react';

export function PrivacyPage() {
  const lastUpdated = 'October 24, 2026';

  return (
    <div className="pt-28 pb-20 bg-background min-h-screen">
      {/* Header Banner */}
      <section className="relative overflow-hidden py-12 border-b border-border bg-gradient-to-b from-brand-50/40 via-background to-background dark:from-brand-950/20">
        <div className="container-page relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            Institutional Data Protection
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-slate-600 dark:text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            FundedShift is committed to safeguarding your personal data, identity verification documents, and trading privacy with bank-grade security standards.
          </p>
          <p className="mt-2 text-xs font-mono text-slate-400">
            Last Updated & Effective Date: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Privacy Policy Body */}
      <section className="py-12">
        <div className="container-page max-w-4xl mx-auto space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">

          {/* Privacy Commitment Box */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6 flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 space-y-1">
              <strong className="font-bold text-sm block">Our Strict Data Promise: We Never Sell Your Data</strong>
              <p>
                FundedShift does not sell, rent, monetize, or trade your personal information, trading strategies, or KYC identity documents to third-party data brokers or marketing syndicates under any circumstances.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">01.</span> Information We Collect
            </h2>
            <p>
              When you interact with our platform, we collect information necessary to deliver trading services, comply with global Anti-Money Laundering (AML) standards, and secure your account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li>
                <strong>Identity & Account Data:</strong> Your full legal name, email address, password hash (one-way PBKDF2/SHA-512 cryptographic encryption), phone number, and residential country.
              </li>
              <li>
                <strong>Compliance & KYC Documents:</strong> Government-issued passport, national identity card, or driver&apos;s license, submitted strictly for payout disbursement compliance and fraud prevention.
              </li>
              <li>
                <strong>Technical & Telemetry Data:</strong> IP address, device fingerprints, browser version, operating system, and session security tokens to prevent unauthorized account access.
              </li>
              <li>
                <strong>Trading Activity & Order History:</strong> Position records, executed trade order tickets, lot sizes, entry/exit prices, and timestamps generated within the Web Terminal.
              </li>
              <li>
                <strong>Billing Data:</strong> Payment transaction identifiers, billing amounts, and payout wallet addresses. <em>Note: FundedShift does not store or process raw credit card numbers; all credit card payments are tokenized via PCI-DSS Level 1 compliant gateways (Stripe, Razorpay).</em>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">02.</span> How We Use Your Information
            </h2>
            <p>Your information is processed for specific, lawful purposes:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">Service Delivery & Execution</h4>
                <p className="text-xs text-slate-500">
                  Provisioning Web Terminal credentials, executing simulated orders, calculating drawdown limits, and delivering customer support.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">Financial Settlement & Payouts</h4>
                <p className="text-xs text-slate-500">
                  Verifying payout eligibility, generating cryptographic payout certificates, and executing withdrawals to your bank or crypto wallet.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">Security & Fraud Prevention</h4>
                <p className="text-xs text-slate-500">
                  Monitoring for unauthorized login attempts, account takeover, latency arbitrage bots, and cross-account hedging abuse.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground mb-1">Legal & Regulatory Compliance</h4>
                <p className="text-xs text-slate-500">
                  Complying with applicable global sanctions (OFAC), anti-money laundering (AML), and financial reporting standards.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">03.</span> Data Security & Storage Architecture
            </h2>
            <p>
              FundedShift employs multi-layered institutional security protocols to protect client data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
              <li><strong>End-to-End Encryption:</strong> All data transmitted between your browser and our servers is encrypted using Transport Layer Security (TLS 1.3 / SSL).</li>
              <li><strong>Encrypted Storage:</strong> Sensitive database records and KYC documents are encrypted at rest using AES-256 standard encryption.</li>
              <li><strong>Zero Password Visibility:</strong> Passwords are never stored in plaintext and are salted with cryptographic hashing algorithms before reaching the database.</li>
              <li><strong>Isolated Access Control:</strong> Only authorized compliance personnel with multi-factor authentication (MFA) can inspect KYC verification files.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">04.</span> Sharing of Information
            </h2>
            <p>We only share data with vetted third-party service providers essential for platform operations:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base">
              <li><strong>Payment Processors:</strong> Stripe, Razorpay, and Crypto nodes for processing challenge fees and disbursing payouts.</li>
              <li><strong>Transactional Email Infrastructure:</strong> Resend and secure SMTP relays for delivering account credentials and password resets.</li>
              <li><strong>Legal Authorities:</strong> Only when strictly required by a court order, subpoena, or mandatory statutory law.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">05.</span> Your Rights & Data Portability (GDPR / Global Standards)
            </h2>
            <p>
              Regardless of your geographical location, FundedShift respects your fundamental data rights:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base">
              <li><strong>Right of Access:</strong> Request a complete copy of all personal records and trade histories stored in your account.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal or contact details via your dashboard profile.</li>
              <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request permanent deletion of your account and personal data, subject to mandatory anti-fraud regulatory retention requirements.</li>
              <li><strong>Right to Opt-Out:</strong> Unsubscribe from non-essential promotional newsletters with a single click.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground flex items-center gap-2">
              <span className="text-brand-600 font-mono text-base">06.</span> Cookie Policy
            </h2>
            <p>
              Our website uses strictly necessary and analytical cookies:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base">
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely as you navigate between the Web Terminal and Dashboard.</li>
              <li><strong>Preference Cookies:</strong> Store your theme choice (Light/Dark mode) and default chart timeframes.</li>
              <li><strong>Security Cookies:</strong> Detect malicious bots, rate limit violations, and Cross-Site Request Forgery (CSRF).</li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-foreground">
              Data Protection Officer (DPO)
            </h2>
            <p className="text-sm">
              To exercise any of your data rights or file a privacy inquiry, please reach out to our dedicated privacy office:
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-card border border-border text-xs sm:text-sm font-mono">
              Email: dpo@fundedshift.com | privacy@fundedshift.com<br />
              Response Guarantee: Within 48 business hours
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
