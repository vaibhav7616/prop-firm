import { useState } from 'react';
import { Settings, Save, ShieldAlert, Cpu, Lock, Globe, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function AdminSettings() {
  const [firmName, setFirmName] = useState('FundedShift');
  const [supportEmail, setSupportEmail] = useState('support@fundedshift.com');
  const [defaultLeverage, setDefaultLeverage] = useState('100');
  const [maxDrawdownModel, setMaxDrawdownModel] = useState('STATIC');
  const [autoPassPhase1, setAutoPassPhase1] = useState(true);
  const [newsTradingAllowed, setNewsTradingAllowed] = useState(true);

  const handleSave = () => {
    toast.success('Platform configuration saved successfully!');
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
            Configure risk defaults, automated evaluation rules, and general prop firm branding.
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
