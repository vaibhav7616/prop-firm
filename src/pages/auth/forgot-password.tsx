import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('Password reset link sent to your email.');
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 mb-6">
          <CheckCircle className="h-8 w-8 text-brand-600" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Check Your Email</h1>
        <p className="text-muted-foreground mb-8">
          We have sent a password reset link to <span className="text-brand-600 font-medium">{email}</span>.
          Follow the link to reset your password.
        </p>
        <Link to="/login"><button className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Login</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Forgot Password</h1>
      <p className="text-muted-foreground mb-8">Enter your email and we will send you a reset link.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full h-12">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link to="/login" className="text-brand-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
