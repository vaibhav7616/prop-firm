import { useState, type FormEvent, type ReactNode } from 'react';
import { Lock, ShieldCheck, Mail, KeyRound, Smartphone, Globe, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { FsPanel, FsPageHeader, StatusPill } from '@/components/fs/fs-ui';
import { toast } from 'sonner';

export function DashboardSecurity() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [np, setNp] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const score = strength(np);

  const handleChange = async (e: FormEvent) => {
    e.preventDefault();
    if (np !== confirm) return toast.error('New passwords do not match.');
    if (np.length < 6) return toast.error('Password must be at least 6 characters.');
    if (!user) return toast.error('No authenticated session to update.');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: np });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated successfully');
    setCurrent(''); setNp(''); setConfirm('');
  };

  return (
    <div className="space-y-5">
      <FsPageHeader eyebrow="Account" title="Security" description="Manage your password and account security settings." />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* change password */}
        <FsPanel className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20"><Lock className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-100">Change password</p>
              <p className="text-xs text-slate-500">Use a strong, unique password.</p>
            </div>
          </div>
          <form onSubmit={handleChange} className="space-y-3">
            <Field label="Current password" type={show ? 'text' : 'password'} value={current} onChange={setCurrent} />
            <Field label="New password" type={show ? 'text' : 'password'} value={np} onChange={setNp} />
            <Field label="Confirm new password" type={show ? 'text' : 'password'} value={confirm} onChange={setConfirm} />
            {np && (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${score >= i ? (score >= 4 ? 'bg-emerald-400' : score >= 3 ? 'bg-amber-400' : 'bg-rose-400') : 'bg-slate-800'}`} />
                ))}
                <span className="w-20 text-right text-[11px] text-slate-500">{score >= 4 ? 'Strong' : score === 3 ? 'Good' : score >= 1 ? 'Weak' : ''}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? 'Hide' : 'Show'} passwords
            </button>
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </FsPanel>

        {/* security posture */}
        <FsPanel className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20"><ShieldCheck className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-100">Security posture</p>
              <p className="text-xs text-slate-500">Account protection status.</p>
            </div>
          </div>
          <div className="space-y-3">
            <Row icon={Mail} title="Email" value={user?.email ?? '—'} note={<StatusPill tone="emerald"><Check className="h-3 w-3" /> Verified</StatusPill>} />
            <Row icon={KeyRound} title="Password" value="Last changed unknown" note={<StatusPill tone="emerald"><Check className="h-3 w-3" /> Set</StatusPill>} />
            <Row icon={Smartphone} title="Two-factor auth" value="Not enabled" note={<StatusPill tone="slate">Optional</StatusPill>} />
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-slate-400">
              2FA adds an extra layer of protection when signing in. It becomes available once your email is verified by Funded Shift.
            </div>
          </div>
        </FsPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* active sessions */}
        <FsPanel className="p-5">
          <p className="fs-label mb-3">Active sessions</p>
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300"><Globe className="h-4 w-4" /></span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-100">This device</p>
              <p className="text-xs text-slate-500">Current browser session</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active now</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-600">Signing out closes this session. Revoke access from other devices through your account provider.</p>
        </FsPanel>

        {/* guidelines */}
        <FsPanel className="p-5">
          <p className="fs-label mb-3">Security tips</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Never share your password or broker credentials.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Funded Shift will never ask for your password by email.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Use a password manager and enable 2FA where possible.</li>
          </ul>
        </FsPanel>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type: string }) {
  return (
    <label className="block">
      <span className="fs-label">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none" />
    </label>
  );
}

function Row({ icon: Icon, title, value, note }: { icon: any; title: string; value: string; note?: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="text-xs text-slate-500">{value}</p>
        </div>
      </div>
      {note}
    </div>
  );
}
