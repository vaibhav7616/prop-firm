import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  User,
  Server,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  KeyRound,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { loginTerminalApi } from '@/lib/api-client';
import type { TradingAccount } from '@/types';

interface TerminalLoginProps {
  userAccounts?: any[];
  prefilledAccountId?: string;
  onLoginSuccess: (sessionData: { token: string; account: any; active_positions: any[] }) => void;
  onCancel?: () => void;
}

export function TerminalLogin({
  userAccounts = [],
  prefilledAccountId = '',
  onLoginSuccess,
  onCancel,
}: TerminalLoginProps) {
  const navigate = useNavigate();

  // Find preselected account if available
  const defaultAccount = Array.isArray(userAccounts)
    ? userAccounts.find((a) => a && (a.id === prefilledAccountId || a.account_number === prefilledAccountId)) || userAccounts[0]
    : null;

  const [loginId, setLoginId] = useState(
    defaultAccount ? String(defaultAccount.account_number || defaultAccount.id || '') : ''
  );
  const [password, setPassword] = useState('');
  const [server, setServer] = useState(defaultAccount?.server || 'FundedShift-Live');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanLogin = loginId.trim();
    const cleanPass = password.trim();

    if (!cleanLogin) {
      setError('Please provide your Trading Account Login Number.');
      return;
    }
    if (!cleanPass) {
      setError('Please provide your Trading Account Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginTerminalApi({
        login: cleanLogin,
        password: cleanPass,
        server,
      });

      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Save terminal token
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('terminal_token', res.token);
      }

      onLoginSuccess({
        token: res.token,
        account: res.account,
        active_positions: res.active_positions || [],
      });
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreloadedAccount = (acc: any) => {
    setLoginId(acc.account_number || acc.id);
    if (acc.server) setServer(acc.server);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-brand-500/30">
      {/* Background Gradients & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(12,145,234,0.18),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/60 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gateway Online</span>
        </div>
      </div>

      {/* Main Terminal Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-8 z-10 relative">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Web Terminal Login</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect to your institutional MT5 simulation account
          </p>
        </div>

        {/* Quick Account Switcher (if user has accounts) */}
        {Array.isArray(userAccounts) && userAccounts.filter(Boolean).length > 0 && (
          <div className="mb-5 bg-slate-950/60 border border-slate-800/70 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Your Trading Account
            </span>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {userAccounts.filter(Boolean).map((acc, idx) => {
                const accId = String(acc.id || `acc-${idx}`);
                const accNum = String(acc.account_number || accId);
                const isSelected = loginId === accNum || loginId === accId;
                const sizeVal = Number(acc.current_balance || acc.account_size || 0);
                return (
                  <button
                    key={accId}
                    type="button"
                    onClick={() => handleSelectPreloadedAccount(acc)}
                    className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all border ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                        : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        <span>#{accNum}</span>
                        {acc.is_funded && (
                          <span className="text-[9px] bg-brand-500/20 text-brand-300 px-1.5 py-0.2 rounded font-sans uppercase">
                            Funded
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        ${sizeVal.toLocaleString()} • {acc.phase ? `Phase ${acc.phase}` : 'Standard'}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 bg-rose-950/40 border border-rose-800/60 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trading Server
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white appearance-none cursor-pointer"
              >
                <option value="FundedShift-Live">FundedShift-Live (Ultra Low Latency)</option>
                <option value="FundedShift-Evaluation">FundedShift-Evaluation (Simulated Bridge)</option>
                <option value="FundedShift-Demo">FundedShift-Demo (Test Environment)</option>
              </select>
            </div>
          </div>

          {/* Login ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Account Login ID / Account Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. 8820491 or acc-101"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Master Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Trading Account Password
              </label>
              <span className="text-[10px] text-slate-400">
                (Issued on account provisioning)
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter trading account password"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Gateway...</span>
              </>
            ) : (
              <>
                <span>Launch Web Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security / Help Info */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500/70" />
            <span>256-bit Encrypted Session</span>
          </div>
          <Link to="/dashboard/accounts" className="text-brand-400/80 hover:text-brand-300 underline underline-offset-2">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
