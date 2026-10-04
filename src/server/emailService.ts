import { DBEngine } from './db';
import type { EmailLogEntity } from './types';

export interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
  preview?: boolean;
}

export class EmailService {
  private static getApiKey(): string | null {
    const key = process.env.RESEND_API_KEY;
    if (key && key.trim().startsWith('re_')) {
      return key.trim();
    }
    return null;
  }

  private static getFromAddress(): string {
    return process.env.EMAIL_FROM || 'FundedShift <onboarding@resend.dev>';
  }

  private static getReplyToAddress(): string {
    return process.env.EMAIL_REPLY_TO || 'support@fundedshift.com';
  }

  private static getAppUrl(): string {
    return process.env.APP_URL || 'http://localhost:3000';
  }

  /**
   * Core dispatcher: sends via Resend REST API or falls back to preview log
   */
  public static async sendRawEmail(params: {
    to: string;
    recipientName?: string;
    subject: string;
    html: string;
    text?: string;
    template: EmailLogEntity['template'];
  }): Promise<EmailSendResult> {
    const db = DBEngine.getDB();
    if (!db.email_logs) db.email_logs = [];

    const apiKey = this.getApiKey();
    const from = this.getFromAddress();
    const replyTo = this.getReplyToAddress();

    const logEntry: EmailLogEntity = {
      id: `email-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
      recipient_email: params.to,
      recipient_name: params.recipientName,
      subject: params.subject,
      template: params.template,
      status: 'PREVIEW',
      provider: apiKey ? 'resend' : 'preview',
      sent_at: new Date().toISOString(),
    };

    if (!apiKey) {
      console.log(`[EmailService - PREVIEW MODE] Email to ${params.to} | Subject: "${params.subject}"`);
      logEntry.status = 'PREVIEW';
      db.email_logs.unshift(logEntry);
      DBEngine.saveDB();
      return { success: true, preview: true };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          reply_to: replyTo,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.id) {
        logEntry.status = 'DELIVERED';
        logEntry.resend_id = data.id;
        db.email_logs.unshift(logEntry);

        db.audit_logs.push({
          id: `audit-${Date.now()}`,
          actor_id: 'SYSTEM',
          actor_role: 'SYSTEM',
          action: 'EMAIL_DISPATCHED',
          target_id: logEntry.id,
          details: `Sent ${params.template} email to ${params.to} via Resend (#${data.id}).`,
          created_at: new Date().toISOString(),
        });

        DBEngine.saveDB();
        return { success: true, id: data.id };
      } else {
        const errorMsg = data.message || data.error || `HTTP ${res.status} from Resend`;
        logEntry.status = 'FAILED';
        logEntry.error_message = errorMsg;
        db.email_logs.unshift(logEntry);

        console.warn(`[EmailService Warning] Resend API error for ${params.to}:`, errorMsg);
        DBEngine.saveDB();
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      logEntry.status = 'FAILED';
      logEntry.error_message = err.message || String(err);
      db.email_logs.unshift(logEntry);
      DBEngine.saveDB();
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // EMAIL TEMPLATE 1: ORDER CONFIRMATION & TRADING CREDENTIALS
  // -------------------------------------------------------------
  public static async sendOrderCredentialsEmail(params: {
    recipientEmail: string;
    recipientName: string;
    orderId: string;
    planName: string;
    accountSize: number;
    accountNumber: string;
    traderPassword: string;
    investorPassword: string;
    server: string;
    platform: string;
    rules: {
      profit_target_percent?: number;
      daily_loss_limit_percent?: number;
      max_loss_limit_percent?: number;
      leverage?: number;
    };
  }): Promise<EmailSendResult> {
    const appUrl = this.getAppUrl();
    const targetAmt = params.rules?.profit_target_percent
      ? `$${((params.accountSize * params.rules.profit_target_percent) / 100).toLocaleString()}`
      : 'N/A (Direct Funded)';
    const dailyLossAmt = `$${((params.accountSize * (params.rules?.daily_loss_limit_percent || 5)) / 100).toLocaleString()}`;
    const maxLossAmt = `$${((params.accountSize * (params.rules?.max_loss_limit_percent || 10)) / 100).toLocaleString()}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your FundedShift Trading Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #080A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #0F1420; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(180deg, #1E293B 0%, #0F1420 100%); border-bottom: 1px solid #2A364E; text-align: center;">
              <div style="display: inline-block; font-size: 20px; font-weight: 800; color: #F59E0B; letter-spacing: 2px;">
                ⚡ FUNDED SHIFT
              </div>
              <p style="margin: 8px 0 0; color: #94A3B8; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">INSTITUTIONAL PROPRIETARY TRADING</p>
            </td>
          </tr>

          <!-- Welcome Banner -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #FFFFFF;">
                Welcome, ${params.recipientName || 'Trader'}!
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Your payment has been verified and your <strong style="color: #F59E0B;">$${params.accountSize.toLocaleString()} ${params.planName}</strong> has been provisioned on our direct ECN matching engine.
              </p>
            </td>
          </tr>

          <!-- Credentials Box -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" style="background-color: #161D2F; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);">
                <tr>
                  <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #243048;">
                    <span style="font-size: 11px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 1px;">🔐 LIVE TRADING CREDENTIALS</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 6px; font-size: 13px; color: #94A3B8;">Login / Account #:</td>
                  <td style="padding: 12px 0 6px; font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: monospace; text-align: right;">${params.accountNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Master Trader Password:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #10B981; font-family: monospace; text-align: right;">${params.traderPassword}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Investor (Read-Only) Password:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #CBD5E1; font-family: monospace; text-align: right;">${params.investorPassword}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Server:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #F59E0B; text-align: right;">${params.server}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0 0; font-size: 13px; color: #94A3B8;">Execution Platform:</td>
                  <td style="padding: 6px 0 0; font-size: 13px; font-weight: 600; color: #FFFFFF; text-align: right;">FundedShift Web Terminal</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trading Rules Table -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.5px;">Account Parameters & Rules</h3>
              <table width="100%" style="border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #1E293B;">
                  <td style="padding: 8px 0; color: #94A3B8;">Daily Drawdown Limit:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #EF4444;">${params.rules?.daily_loss_limit_percent || 5}% (${dailyLossAmt})</td>
                </tr>
                <tr style="border-bottom: 1px solid #1E293B;">
                  <td style="padding: 8px 0; color: #94A3B8;">Max Overall Drawdown:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #EF4444;">${params.rules?.max_loss_limit_percent || 10}% (${maxLossAmt})</td>
                </tr>
                <tr style="border-bottom: 1px solid #1E293B;">
                  <td style="padding: 8px 0; color: #94A3B8;">Profit Target:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10B981;">${params.rules?.profit_target_percent ? `${params.rules.profit_target_percent}% (${targetAmt})` : 'Direct Profit Share (80%)'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94A3B8;">Account Leverage:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #F59E0B;">1:${params.rules?.leverage || 100}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 36px; text-align: center;">
              <a href="${appUrl}/dashboard/trading" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000000; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                Open Web Trading Terminal →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0A0D14; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
              <p style="margin: 0 0 6px;">Need assistance? Reply directly to this email or reach us at <a href="mailto:support@fundedshift.com" style="color: #F59E0B; text-decoration: none;">support@fundedshift.com</a>.</p>
              <p style="margin: 0;">Order Reference: ${params.orderId} · Funded Shift Direct ECN Proprietary Firm.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendRawEmail({
      to: params.recipientEmail,
      recipientName: params.recipientName,
      subject: `⚡ Your $${params.accountSize.toLocaleString()} Trading Account Credentials (#${params.accountNumber})`,
      html,
      template: 'ORDER_CREDENTIALS',
    });
  }

  // -------------------------------------------------------------
  // EMAIL TEMPLATE 2: RULE BREACH ALERT EMAIL
  // -------------------------------------------------------------
  public static async sendRuleBreachEmail(params: {
    recipientEmail: string;
    recipientName: string;
    accountNumber: string;
    accountSize: number;
    ruleViolated: string;
    breachEquity: number;
    thresholdLimit: number;
    breachTime?: string;
  }): Promise<EmailSendResult> {
    const appUrl = this.getAppUrl();
    const timeStr = params.breachTime || new Date().toUTCString();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Trading Rule Breach Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #080A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #0F1420; border: 1px solid #EF4444; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);">
          <!-- Red Alert Header -->
          <tr>
            <td style="padding: 24px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 20, 32, 0.8) 100%); border-bottom: 1px solid rgba(239, 68, 68, 0.3); text-align: center;">
              <span style="font-size: 28px;">⚠️</span>
              <h2 style="margin: 8px 0 0; color: #EF4444; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">
                TRADING RULE BREACH ALERT
              </h2>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 28px 32px 16px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #FFFFFF;">
                Hello ${params.recipientName || 'Trader'},
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Our risk engine detected a compliance limit violation on your account <strong style="color: #FFFFFF;">#${params.accountNumber}</strong> ($${params.accountSize.toLocaleString()}).
              </p>

              <!-- Breach Summary Box -->
              <table width="100%" style="background-color: #161D2F; border: 1px solid #2A364E; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Rule Violated:</td>
                  <td style="padding: 6px 0; text-align: right; color: #EF4444; font-weight: 700; font-size: 13px;">${params.ruleViolated}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Equity at Breach:</td>
                  <td style="padding: 6px 0; text-align: right; color: #FFFFFF; font-weight: 700; font-size: 14px; font-family: monospace;">$${Number(params.breachEquity).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Breach Threshold:</td>
                  <td style="padding: 6px 0; text-align: right; color: #CBD5E1; font-weight: 600; font-size: 13px; font-family: monospace;">$${Number(params.thresholdLimit).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0 0; color: #94A3B8; font-size: 13px;">Timestamp (UTC):</td>
                  <td style="padding: 6px 0 0; text-align: right; color: #64748B; font-size: 12px;">${timeStr}</td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.6; color: #94A3B8;">
                As specified in our risk policy, all active open positions were automatically liquidated to protect remaining capital. You can review the full explainable breach report and discounted evaluation reset options on your dashboard.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${appUrl}/dashboard/objectives" style="display: inline-block; background-color: #EF4444; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 12px 32px; border-radius: 10px; text-decoration: none;">
                Review Breach Report & Options →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0A0D14; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #64748B;">
              Funded Shift Automated Risk Management · <a href="mailto:support@fundedshift.com" style="color: #94A3B8; text-decoration: none;">Contact Risk Desk</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendRawEmail({
      to: params.recipientEmail,
      recipientName: params.recipientName,
      subject: `⚠️ Rule Breach Notification - Account #${params.accountNumber}`,
      html,
      template: 'RULE_BREACH',
    });
  }

  // -------------------------------------------------------------
  // EMAIL TEMPLATE 3: STAGE PASSED & PROMOTION EMAIL
  // -------------------------------------------------------------
  public static async sendStagePromotionEmail(params: {
    recipientEmail: string;
    recipientName: string;
    fromStage: string;
    toStage: string;
    accountSize: number;
    newAccountNumber?: string;
    newPassword?: string;
  }): Promise<EmailSendResult> {
    const appUrl = this.getAppUrl();
    const isFunded = params.toStage.toLowerCase().includes('funded');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Congratulations! Evaluation Stage Cleared</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #080A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #0F1420; border: 1px solid #10B981; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);">
          <!-- Emerald Celebration Header -->
          <tr>
            <td style="padding: 32px 32px 20px; background: linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 20, 32, 0.8) 100%); border-bottom: 1px solid rgba(16, 185, 129, 0.3); text-align: center;">
              <span style="font-size: 32px;">🏆</span>
              <h1 style="margin: 10px 0 0; color: #10B981; font-size: 22px; font-weight: 800;">
                CONGRATULATIONS, ${params.recipientName?.toUpperCase() || 'TRADER'}!
              </h1>
              <p style="margin: 6px 0 0; color: #94A3B8; font-size: 14px;">You have officially passed ${params.fromStage}!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Your outstanding trading discipline and risk management have cleared the evaluation target for your <strong style="color: #F59E0B;">$${params.accountSize.toLocaleString()} account</strong>.
              </p>

              ${
                params.newAccountNumber
                  ? `
              <div style="background-color: #161D2F; border: 1px solid #10B981; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 800; color: #10B981; text-transform: uppercase;">✨ Your New ${params.toStage} Details</p>
                <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;">New Account #: <strong style="color: #FFFFFF; font-family: monospace;">${params.newAccountNumber}</strong></p>
                ${params.newPassword ? `<p style="margin: 4px 0; font-size: 13px; color: #94A3B8;">Password: <strong style="color: #10B981; font-family: monospace;">${params.newPassword}</strong></p>` : ''}
                <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">Status: <strong style="color: #10B981;">Active</strong> · Profit Split: <strong style="color: #F59E0B;">${isFunded ? '80% - 90%' : 'N/A'}</strong></p>
              </div>`
                  : ''
              }

              <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.6; color: #94A3B8;">
                Your official Verified Trader Certificate has been stamped cryptographically and added to your trader achievements.
              </p>

              <div style="text-align: center;">
                <a href="${appUrl}/dashboard/certificates" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; font-size: 14px; font-weight: 800; padding: 14px 36px; border-radius: 12px; text-decoration: none;">
                  View & Download Certificate →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0A0D14; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #64748B;">
              Funded Shift Compliance & Evaluations Department
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendRawEmail({
      to: params.recipientEmail,
      recipientName: params.recipientName,
      subject: `🏆 Congratulations! You have Passed ${params.fromStage} ($${params.accountSize.toLocaleString()})`,
      html,
      template: 'STAGE_PROMOTION',
    });
  }

  // -------------------------------------------------------------
  // EMAIL TEMPLATE 4: PAYOUT DISBURSED EMAIL
  // -------------------------------------------------------------
  public static async sendPayoutDisbursedEmail(params: {
    recipientEmail: string;
    recipientName: string;
    payoutId: string;
    accountNumber: string;
    totalProfit: number;
    traderShare: number;
    firmShare: number;
    payoutMethod: string;
    destination: string;
  }): Promise<EmailSendResult> {
    const appUrl = this.getAppUrl();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Profit Split Payout Disbursed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #080A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #0F1420; border: 1px solid #F59E0B; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 20, 32, 0.8) 100%); border-bottom: 1px solid rgba(245, 158, 11, 0.3); text-align: center;">
              <span style="font-size: 32px;">💸</span>
              <h1 style="margin: 8px 0 0; color: #F59E0B; font-size: 22px; font-weight: 800;">
                PROFIT SPLIT PAYOUT APPROVED
              </h1>
              <p style="margin: 6px 0 0; color: #94A3B8; font-size: 13px;">Funds Dispatched to Your Selected Gateway</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #FFFFFF;">
                Hello ${params.recipientName || 'Trader'},
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Great job! Your withdrawal request on Funded Account <strong style="color: #FFFFFF;">#${params.accountNumber}</strong> has been audited and approved by our finance desk.
              </p>

              <!-- Breakdown Box -->
              <table width="100%" style="background-color: #161D2F; border: 1px solid #243048; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Total Account Profit:</td>
                  <td style="padding: 6px 0; text-align: right; color: #FFFFFF; font-weight: 600; font-size: 13px; font-family: monospace;">$${Number(params.totalProfit).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #F59E0B; font-size: 14px; font-weight: 700;">Trader Profit Split (Payout):</td>
                  <td style="padding: 6px 0; text-align: right; color: #10B981; font-weight: 800; font-size: 18px; font-family: monospace;">$${Number(params.traderShare).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Firm Retention (20% / 10%):</td>
                  <td style="padding: 6px 0; text-align: right; color: #64748B; font-size: 13px; font-family: monospace;">$${Number(params.firmShare).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Payment Gateway:</td>
                  <td style="padding: 6px 0; text-align: right; color: #CBD5E1; font-size: 13px; font-weight: 600;">${params.payoutMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0 0; color: #94A3B8; font-size: 13px;">Destination Address:</td>
                  <td style="padding: 6px 0 0; text-align: right; color: #94A3B8; font-size: 12px; font-family: monospace;">${params.destination}</td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.6; color: #94A3B8;">
                Your funded account balance has been reset to starting capital so you can immediately begin trading toward your next profit split cycle.
              </p>

              <div style="text-align: center;">
                <a href="${appUrl}/dashboard/payouts" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000000; font-size: 14px; font-weight: 800; padding: 13px 32px; border-radius: 10px; text-decoration: none;">
                  View Payout Invoice & Certificate →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0A0D14; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #64748B;">
              Funded Shift Finance & Treasury Desk · Transaction Ref: ${params.payoutId}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendRawEmail({
      to: params.recipientEmail,
      recipientName: params.recipientName,
      subject: `💸 Payout Disbursed: $${Number(params.traderShare).toFixed(2)} USD (Account #${params.accountNumber})`,
      html,
      template: 'PAYOUT_DISBURSED',
    });
  }

  // -------------------------------------------------------------
  // TEST EMAIL METHOD
  // -------------------------------------------------------------
  public static async sendTestEmail(toEmail: string): Promise<EmailSendResult> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #080A0F; color: #E2E8F0; padding: 40px;">
  <div style="max-width: 500px; margin: auto; background: #0F1420; border: 1px solid #F59E0B; border-radius: 12px; padding: 24px;">
    <h2 style="color: #F59E0B; margin: 0 0 12px;">⚡ FundedShift Email Engine Connected!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #94A3B8;">
      This test message confirms that your <strong>Resend API</strong> integration is fully functional and successfully delivering transactional emails.
    </p>
    <div style="background: #161D2F; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; margin: 16px 0;">
      <div>Provider: Resend API</div>
      <div>Sender: ${this.getFromAddress()}</div>
      <div>Timestamp: ${new Date().toISOString()}</div>
    </div>
    <p style="font-size: 12px; color: #64748B; margin: 0;">FundedShift Prop Firm Automated Notification System.</p>
  </div>
</body>
</html>`;

    return this.sendRawEmail({
      to: toEmail,
      subject: '⚡ FundedShift Email Engine Verification Test',
      html,
      template: 'TEST_EMAIL',
    });
  }

  public static getConfig() {
    const apiKey = this.getApiKey();
    const maskedKey = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : null;
    return {
      configured: Boolean(apiKey),
      provider: apiKey ? 'Resend REST API' : 'Simulation / Preview Mode',
      from: this.getFromAddress(),
      replyTo: this.getReplyToAddress(),
      apiKeyMasked: maskedKey,
      customDomainTarget: 'support@fundedshift.com',
      readyForProductionDomain: Boolean(apiKey),
    };
  }
}

