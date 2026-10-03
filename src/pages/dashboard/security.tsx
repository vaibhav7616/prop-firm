import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, Check, ShieldCheck, FileText, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { fetchKycStatusApi, submitKycApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  // KYC Verification State
  const [kycData, setKycData] = useState<{ is_verified: boolean; submission: any } | null>(null);
  const [docType, setDocType] = useState<'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID'>('PASSPORT');
  const [docNumber, setDocNumber] = useState('');
  const [docCountry, setDocCountry] = useState(user?.country || 'United States');
  const [submittingKyc, setSubmittingKyc] = useState(false);

  useEffect(() => {
    async function loadKyc() {
      if (!user) return;
      const data = await fetchKycStatusApi(user.id);
      setKycData(data);
    }
    loadKyc();
  }, [user]);

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      toast.error('Please enter your document ID number.');
      return;
    }
    setSubmittingKyc(true);
    const res = await submitKycApi({
      userId: user?.id,
      document_type: docType,
      document_number: docNumber.trim(),
      country: docCountry,
    });
    setSubmittingKyc(false);
    if (res && res.success) {
      toast.success('KYC document submitted for compliance verification!');
      setKycData({ is_verified: false, submission: res.submission });
    } else {
      toast.error(res?.error || 'Failed to submit document.');
    }
  };

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

        {/* KYC Verification Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="lg:col-span-2">
          <Card className="glass border-border/50 hover:border-gold-400/30 transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg">KYC & Identity Compliance</CardTitle>
                    <CardDescription>Required before processing profit split payouts on live funded accounts.</CardDescription>
                  </div>
                </div>
                {kycData?.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <Check className="h-3.5 w-3.5" /> ID Verified
                  </span>
                ) : kycData?.submission?.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5" /> Pending Compliance Review
                  </span>
                ) : kycData?.submission?.status === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
                    <XCircle className="h-3.5 w-3.5" /> Verification Declined
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border text-xs font-bold">
                    Not Submitted
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {kycData?.is_verified ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300">
                    Your identity has been fully verified and approved by compliance. Your account is eligible for immediate profit withdrawals.
                  </p>
                </div>
              ) : kycData?.submission?.status === 'PENDING' ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span>Submission Under Review</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We received your {kycData.submission.document_type} (ID #{kycData.submission.document_number}) submitted on {new Date(kycData.submission.submitted_at).toLocaleDateString()}. Our compliance department reviews submissions within 2 to 4 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitKyc} className="space-y-4">
                  {kycData?.submission?.status === 'REJECTED' && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                      Previous submission was declined: {kycData.submission.rejection_reason || 'Please submit valid identification.'}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="docType">Document Type</Label>
                      <select
                        id="docType"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                      >
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVERS_LICENSE">Driver's License</option>
                        <option value="NATIONAL_ID">National ID Card</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docNumber">Document ID Number</Label>
                      <Input
                        id="docNumber"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="e.g. A12345678"
                        required
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docCountry">Issuing Country</Label>
                      <Input
                        id="docCountry"
                        value={docCountry}
                        onChange={(e) => setDocCountry(e.target.value)}
                        placeholder="e.g. United States"
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={submittingKyc} className="bg-gold-gradient text-black hover:opacity-90 font-semibold text-xs">
                    {submittingKyc ? 'Submitting Documents...' : 'Submit Verification'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
