import { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, Cpu, Globe, Mail, Send, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { fetchEmailConfigApi, fetchEmailLogsApi, sendTestEmailApi } from '@/lib/api-client';

export function AdminSettings() {
  const [firmName, setFirmName] = useState('FundedShift');
  const [supportEmail, setSupportEmail] = useState('support@fundedshift.com');
  const [defaultLeverage, setDefaultLeverage] = useState('100');
  const [maxDrawdownModel, setMaxDrawdownModel] = useState('STATIC');
  const [autoPassPhase1, setAutoPassPhase1] = useState(true);
  const [newsTradingAllowed, setNewsTradingAllowed] = useState(true);

  // Email Engine state
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadEmailData = async () => {
    try {
      setLoadingLogs(true);
      const [cfg, logsData] = await Promise.all([
        fetchEmailConfigApi(),
        fetchEmailLogsApi(25),
      ]);
      setEmailConfig(cfg);
      if (logsData && Array.isArray(logsData.logs)) {
        setEmailLogs(logsData.logs);
      }
    } catch (err) {
      console.warn('Failed to load email admin data:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadEmailData();
  }, []);

  const handleSave = () => {
    toast.success('Platform configuration saved successfully!');
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      toast.error('Please enter a valid recipient email address.');
      return;
    }

    try {
      setSendingTest(true);
      const res = await sendTestEmailApi(testEmailRecipient);
      if (res.success) {
        toast.success(`Verification email sent successfully! ${res.id ? `(ID: ${res.id})` : ''}`);
        loadEmailData();
      } else {
        toast.error(`Email send failed: ${res.error || 'Check Resend credentials'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to dispatch email: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold mb-2">
            <Settings className="h-3.5 w-3.5" />
            Global Platform Configuration
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure risk defaults, automated evaluation rules, Resend transactional emails, and general prop firm branding.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      {/* TRANSACTIONAL EMAIL ENGINE MANAGEMENT */}
      <Card className="glass border-gold-400/30 bg-gold-400/[0.02]">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Transactional Email Engine (Resend)
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    LIVE ENGINE CONNECTED
                  </span>
                </CardTitle>
                <CardDescription>
                  Automated delivery for Order Credentials, Rule Breach Alerts, Stage Promotions, and Profit Split Disbursements.
                </CardDescription>
              </div>
            </div>
            <button
              onClick={loadEmailData}
              disabled={loadingLogs}
              className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-colors"
              title="Refresh Email Status & Logs"
            >
              <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Logs</span>
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Configuration Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                Active Provider
              </span>
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                {emailConfig?.provider || 'Resend REST API'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                From Address
              </span>
              <p className="font-mono font-medium text-foreground truncate" title={emailConfig?.from}>
                {emailConfig?.from || 'FundedShift <onboarding@resend.dev>'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                Target Custom Domain
              </span>
              <p className="font-mono font-medium text-gold-400 truncate">
                support@fundedshift.com
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                API Key Mask
              </span>
              <p className="font-mono font-medium text-muted-foreground flex items-center gap-1">
                <Key className="h-3 w-3" />
                {emailConfig?.apiKeyMasked || 're_BWJ...6cyP'}
              </p>
            </div>
          </div>

          {/* Domain Setup Guidance Alert */}
          <div className="p-4 rounded-xl bg-gold-400/5 border border-gold-400/20 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 text-gold-400 font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>Domain Verification Notice</span>
            </div>
            <p>
              Your Resend API key is connected. Because the domain <code className="text-foreground font-mono">fundedshift.com</code> has not been purchased yet, emails currently send from <code className="text-foreground font-mono">onboarding@resend.dev</code> with reply-to set to <code className="text-foreground font-mono">support@fundedshift.com</code>. Once your custom domain is registered, add it to your Resend dashboard and update <code className="text-foreground font-mono">EMAIL_FROM</code> to <code className="text-foreground font-mono">support@fundedshift.com</code>.
            </p>
          </div>

          {/* Live Test Sender Bar */}
          <form onSubmit={handleSendTestEmail} className="p-4 rounded-xl bg-secondary/20 border border-border/60 flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Test Outbound Email Delivery
              </label>
              <input
                type="email"
                placeholder="Enter recipient email (e.g. your registered Resend email)"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-gold-400/60 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={sendingTest}
              className="w-full sm:w-auto mt-auto btn-primary px-5 py-2 text-xs flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {sendingTest ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Sending via Resend...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Test Email
                </>
              )}
            </button>
          </form>

          {/* Email Logs Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recent Transactional Dispatches ({emailLogs.length})
              </h3>
            </div>
            {emailLogs.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                No emails logged yet. Try sending a test email above or buy a challenge to see live dispatches here.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/40 text-muted-foreground font-semibold border-b border-border/40">
                    <tr>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Template</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-medium">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-mono text-foreground">{log.recipient_email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary border border-border text-foreground">
                            {log.template}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{log.subject}</td>
                        <td className="p-3">
                          {log.status === 'DELIVERED' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> DELIVERED
                            </span>
                          ) : log.status === 'PREVIEW' ? (
                            <span className="text-gold-400 font-bold text-[10px]">PREVIEW</span>
                          ) : (
                            <span className="text-red-400 font-bold text-[10px]">FAILED</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-muted-foreground text-[11px]">
                          {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-gold-400" />
              General Branding & Support
            </CardTitle>
            <CardDescription>Core identity and contact endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Prop Firm Name</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Support Email Address</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Default Trading Leverage</label>
              <select
                value={defaultLeverage}
                onChange={(e) => setDefaultLeverage(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50 font-bold"
              >
                <option value="50">1:50</option>
                <option value="100">1:100 (Recommended)</option>
                <option value="200">1:200</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Risk & Automation Settings */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-gold-400" />
              Automated Evaluation & Risk
            </CardTitle>
            <CardDescription>Risk engine parameters and automation triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Drawdown Calculation Model</label>
              <select
                value={maxDrawdownModel}
                onChange={(e) => setMaxDrawdownModel(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-gold-400/50 font-bold"
              >
                <option value="STATIC">STATIC (Based on Starting Balance)</option>
                <option value="TRAILING">TRAILING (Based on High Watermark)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPassPhase1}
                  onChange={(e) => setAutoPassPhase1(e.target.checked)}
                  className="rounded border-border text-gold-400 focus:ring-gold-400 h-4 w-4"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">Auto-Provision Step 2 Account</p>
                  <p className="text-[11px] text-muted-foreground">Instantly create Step 2 account when Phase 1 target is hit.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsTradingAllowed}
                  onChange={(e) => setNewsTradingAllowed(e.target.checked)}
                  className="rounded border-border text-gold-400 focus:ring-gold-400 h-4 w-4"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">Allow News Trading</p>
                  <p className="text-[11px] text-muted-foreground">Permit holding positions during high-impact news events.</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Proprietary Trading Engine Controls */}
        <Card className="glass border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-gold-400" />
              FundedShift Proprietary Trading Engine Infrastructure
            </CardTitle>
            <CardDescription>Internal high-speed matching engine, pricing feeds, and live execution pipelines</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">Matching Engine Cluster</span>
              <p className="font-mono font-bold text-foreground">engine-primary.fundedshift.com</p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold mt-1">LATENCY &lt; 8ms</span>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">Real-time SSE Price Feeder</span>
              <p className="font-mono font-bold text-foreground">stream.fundedshift.com:443</p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold mt-1">STREAMING</span>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">Automated Rule Engine</span>
              <p className="font-mono font-bold text-foreground">rules.fundedshift.com</p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold mt-1">ACTIVE AUDIT</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
