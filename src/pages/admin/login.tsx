import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Key, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminLogin(username.trim(), password.trim());
      toast.success('Admin authentication successful! Access granted.');
      navigate('/admin');
    } catch (err: any) {
      setError(err?.message || 'Invalid admin credentials. Access denied.');
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <Logo size="lg" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold tracking-wider uppercase">
            <Shield className="h-3.5 w-3.5" />
            Admin Command Center
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Administrative Portal
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Authorized management access only. Secure server credentials required.
          </p>
        </div>

        <Card className="glass border-gold-400/20 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4 border-b border-border/40">
            <CardTitle className="text-lg font-display flex items-center justify-between">
              <span>Admin Login</span>
              <Lock className="h-4 w-4 text-gold-400" />
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your administrative credentials to sign in
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gold-400" />
                  Username or Admin Email
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-card/60 border-border/60 focus:border-gold-400 focus:ring-gold-400/20 text-sm pl-9"
                    required
                    autoFocus
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-gold-400" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-card/60 border-border/60 focus:border-gold-400 focus:ring-gold-400/20 text-sm pl-9"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-gradient text-black font-semibold hover:opacity-95 transition-all shadow-lg shadow-gold-400/10 h-11"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Verifying Credentials...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Access Admin Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground space-y-1">
              <p className="flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3 text-gold-400" />
                <span>Strict Admin Access · No Signup Option Available</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-gold-400 transition-colors"
          >
            ← Back to Main Prop Firm Website
          </a>
        </div>
      </div>
    </div>
  );
}
