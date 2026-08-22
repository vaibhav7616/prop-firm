import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, Check } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function DashboardSecurity() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your password and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password change */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-gold-400" />
                </div>
                <CardTitle className="font-display text-lg">Change Password</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">New Password</Label>
                  <Input id="current" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" />
                </div>
                <Button type="submit" disabled={saving} className="bg-gold-gradient text-black hover:opacity-90 font-semibold">
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account info */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-gold-400" />
              </div>
              <CardTitle className="font-display text-lg">Account Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <span className="text-xs text-success flex items-center gap-1"><Check className="h-3 w-3" /> Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Last changed: Unknown</p>
                </div>
              </div>
              <span className="text-xs text-success flex items-center gap-1"><Check className="h-3 w-3" /> Set</span>
            </div>
            <div className="p-4 rounded-lg bg-gold-400/5 border border-gold-400/10">
              <p className="text-xs text-muted-foreground">
                For your security, we recommend using a strong, unique password and changing it regularly.
                Never share your credentials with anyone.
              </p>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
