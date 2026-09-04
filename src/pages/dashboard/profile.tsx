import { useEffect, useState, type FormEvent } from 'react';
import { User, Mail, Phone, MapPin, BadgeCheck, Save, Camera, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { FsPanel, FsPageHeader } from '@/components/fs/fs-ui';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function DashboardProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setCountry(profile?.country ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required.';
    else if (fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters.';
    if (phone && !/^[+\d][\d\s\-()]{5,}$/.test(phone.trim())) e.phone = 'Enter a valid phone number.';
    if (country && country.trim().length < 2) e.country = 'Enter a valid country.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), country: country.trim() || null, phone: phone.trim() || null }).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to update profile' + (error.message ? `: ${error.message}` : ''));
      return;
    }
    await refreshProfile();
    toast.success('Profile updated successfully');
  };

  const initial = (profile?.full_name || profile?.email || 'T')[0]?.toUpperCase() ?? 'T';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '—';
  const traderId = profile?.id || user?.id || '—';
  const verified = !!user?.email; // demo/session user email presence

  const rows = [
    { label: 'Full Name', value: fullName, set: setFullName, icon: User, type: 'text', placeholder: 'Your name', error: errors.fullName },
    { label: 'Email', value: user?.email ?? '', icon: Mail, type: 'email', disabled: true },
    { label: 'Country', value: country, set: setCountry, icon: MapPin, type: 'text', placeholder: 'Country', error: errors.country },
    { label: 'Phone', value: phone, set: setPhone, icon: Phone, type: 'tel', placeholder: '+1 555 000 0000', error: errors.phone },
  ];

  return (
    <div className="space-y-5">
      <FsPageHeader eyebrow="Account" title="Profile" description="Manage your personal information and preferences." />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* identity card */}
        <FsPanel className="h-fit p-5 lg:sticky lg:top-24">
          <div className="flex flex-col items-center text-center">
            <div className="group relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-4xl font-bold text-white ring-4 ring-indigo-500/20">
                {initial}
              </div>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" title="Change avatar">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-slate-50">{profile?.full_name ?? 'Funded Shift Trader'}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> {profile?.role === 'admin' ? 'Admin' : 'Trader'} verified
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-sm">
            <div>
              <p className="fs-label">Trader ID</p>
              <p className="fs-num mt-0.5 truncate text-slate-300">{traderId.slice(0, 16)}</p>
            </div>
            <div>
              <p className="fs-label">Member since</p>
              <p className="fs-num mt-0.5 text-slate-300">{memberSince}</p>
            </div>
            <div>
              <p className="fs-label">Referral code</p>
              <p className="fs-num mt-0.5 text-indigo-300">{profile?.affiliate_code || '—'}</p>
            </div>
            <div>
              <p className="fs-label">Email status</p>
              <p className="mt-0.5 flex items-center gap-1 text-emerald-400">{verified ? 'Verified' : '—'}</p>
            </div>
          </div>
        </FsPanel>

        {/* edit form */}
        <FsPanel className="p-5 lg:col-span-2">
          <p className="fs-label mb-4">Personal Information</p>
          <form onSubmit={handleSave} className="space-y-4">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <label key={r.label} className="block">
                  <span className="fs-label">{r.label}</span>
                  <div className="relative mt-1.5">
                    <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={r.type}
                      value={r.value}
                      disabled={r.disabled}
                      onChange={(e) => r.set?.(e.target.value)}
                      placeholder={r.placeholder}
                      className={cn(
                        'w-full rounded-lg border bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none',
                        r.disabled ? 'border-slate-800 opacity-60' : r.error ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      )}
                    />
                  </div>
                  {r.error && <p className="mt-1 text-xs text-rose-400">{r.error}</p>}
                </label>
              );
            })}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500">Changes are saved to your profile.</p>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </FsPanel>
      </div>
    </div>
  );
}
