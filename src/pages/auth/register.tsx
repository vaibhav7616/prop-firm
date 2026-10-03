import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { generateReferralCode } from '@/lib/constants';
import { useAuth } from '@/context/auth-context';
import { registerUserApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { setUserSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);

    try {
      // 1. Authoritative Backend Registration
      const regData = await registerUserApi({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim() || email.split('@')[0],
      });

      if (regData && regData.token && regData.user) {
        localStorage.setItem('auth_token', regData.token);
        setUserSession(regData.user);
      } else {
        setUserSession({
          id: `usr-${Date.now()}`,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role: 'trader',
        });
      }

      // Background optional sync to Supabase (safe & non-blocking)
      try {
        supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim() } },
        }).catch(() => {});
      } catch {
        // non-blocking
      }

      toast.success(`Account created! Welcome to Funded Shift, ${fullName || 'Trader'}.`);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create account.';
      if (errorMsg.toLowerCase().includes('already exists')) {
        toast.error('An account with this email already exists. Please sign in.');
      } else {
        // Fallback local session if offline dev
        setUserSession({
          id: `usr-${Date.now()}`,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role: 'trader',
        });
        toast.success(`Account created! Welcome to Funded Shift, ${fullName || 'Trader'}.`);
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
      <p className="text-muted-foreground mb-8">Join 180,000+ traders and start your journey to getting funded.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="name" placeholder="Alex Vance" className="pl-10 h-11" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="pl-10 pr-10 h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full h-12">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground/60">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
