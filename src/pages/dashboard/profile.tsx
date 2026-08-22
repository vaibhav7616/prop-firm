import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Save, ShieldCheck, Upload } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function DashboardProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, country, phone })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to update profile'); return; }
    await refreshProfile();
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <Card className="glass border-border/50">
            <CardContent className="p-6 text-center">
              <div className="h-24 w-24 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-400/20">
                <span className="font-display text-3xl font-bold text-black">
                  {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? 'T'}
                </span>
              </div>
              <p className="font-medium">{profile?.full_name ?? 'Trader'}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 text-xs font-medium text-gold-400 capitalize">
                <ShieldCheck className="h-3 w-3" /> {profile?.role ?? 'trader'}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile form */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <Card className="glass border-border/50">
            <CardHeader><CardTitle className="font-display text-lg">Personal Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email ?? ''} disabled className="opacity-60" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Your country" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="bg-gold-gradient text-black hover:opacity-90 font-semibold">
                  <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
