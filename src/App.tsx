import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { MarketingLayout } from '@/components/layouts/marketing-layout';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ScrollToTop } from '@/components/shared/scroll-to-top';
import { Toaster } from '@/components/ui/sonner';

// Marketing pages
import { HomePage } from '@/pages/home';
import { ChallengesPage } from '@/pages/challenges';
import { PricingPage } from '@/pages/pricing';
import { RulesPage } from '@/pages/rules';
import { FaqPage } from '@/pages/faq';
import { AffiliatesPage } from '@/pages/affiliates';
import { AboutPage } from '@/pages/about';
import { ContactPage } from '@/pages/contact';
import { BlogPage } from '@/pages/blog';
import { BlogPostPage } from '@/pages/blog-post';
import { LeaderboardPage } from '@/pages/leaderboard';
import { ProofOfPayoutPage } from '@/pages/proof-of-payout';
import { TermsPage } from '@/pages/terms';
import { PrivacyPage } from '@/pages/privacy';
import { RefundPolicyPage } from '@/pages/refund-policy';

// Auth pages
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';

// Checkout
import { CheckoutPage } from '@/pages/checkout';

// Dashboard pages
import { DashboardOverview } from '@/pages/dashboard/overview';
import { DashboardTrading } from '@/pages/dashboard/trading';
import WebTerminalPage from '@/pages/terminal';
import { DashboardAccounts } from '@/pages/dashboard/accounts';
import { DashboardObjectives } from '@/pages/dashboard/objectives';
import { DashboardOrders } from '@/pages/dashboard/orders';
import { DashboardInvoices } from '@/pages/dashboard/invoices';
import { DashboardPayouts } from '@/pages/dashboard/payouts';
import { DashboardCertificates } from '@/pages/dashboard/certificates';
import { DashboardLeaderboard } from '@/pages/dashboard/leaderboard';
import { DashboardCalendar } from '@/pages/dashboard/calendar';
import { DashboardAffiliate } from '@/pages/dashboard/affiliate';
import { DashboardSupport } from '@/pages/dashboard/support';
import { DashboardNotifications } from '@/pages/dashboard/notifications';
import { DashboardProfile } from '@/pages/dashboard/profile';
import { DashboardSecurity } from '@/pages/dashboard/security';

// Admin pages
import { AdminOverview } from '@/pages/admin/overview';
import { AdminUsers } from '@/pages/admin/users';
import { AdminOrders } from '@/pages/admin/orders';
import { AdminPayments } from '@/pages/admin/payments';
import { AdminAccounts } from '@/pages/admin/accounts';
import { AdminPayouts } from '@/pages/admin/payouts';
import { AdminChallenges } from '@/pages/admin/challenges';
import { AdminCoupons } from '@/pages/admin/coupons';
import { AdminAffiliates } from '@/pages/admin/affiliates';
import { AdminKyc } from '@/pages/admin/kyc';
import { AdminSettings } from '@/pages/admin/settings';
import { AdminSupport } from '@/pages/admin/support';
import { AdminLoginPage } from '@/pages/admin/login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message;
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 text-xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-400 mb-4">
              The application encountered an unexpected state. Please choose an option below to continue.
            </p>
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-rose-400 text-left overflow-x-auto max-h-24">
                {errorMessage}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.replace('/login');
                }}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Go to Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.replace('/');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" /></div>;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Marketing */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/affiliates" element={<AffiliatesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/proof-of-payout" element={<ProofOfPayoutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Checkout */}
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

      {/* Web Terminal Dedicated Standalone Route */}
      <Route path="/terminal" element={<ProtectedRoute><WebTerminalPage /></ProtectedRoute>} />

      {/* Trader Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout variant="trader" /></ProtectedRoute>}>
        <Route index element={<DashboardOverview />} />
        <Route path="trading" element={<Navigate to="/terminal" replace />} />
        <Route path="accounts" element={<DashboardAccounts />} />
        <Route path="progress" element={<Navigate to="/dashboard/objectives" replace />} />
        <Route path="objectives" element={<DashboardObjectives />} />
        <Route path="orders" element={<DashboardOrders />} />
        <Route path="invoices" element={<DashboardInvoices />} />
        <Route path="payouts" element={<DashboardPayouts />} />
        <Route path="certificates" element={<DashboardCertificates />} />
        <Route path="leaderboard" element={<DashboardLeaderboard />} />
        <Route path="calendar" element={<DashboardCalendar />} />
        <Route path="news" element={<Navigate to="/dashboard/calendar" replace />} />
        <Route path="affiliate" element={<DashboardAffiliate />} />
        <Route path="support" element={<DashboardSupport />} />
        <Route path="notifications" element={<DashboardNotifications />} />
        <Route path="profile" element={<DashboardProfile />} />
        <Route path="security" element={<DashboardSecurity />} />
      </Route>

      {/* Admin Panel */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoute><DashboardLayout variant="admin" /></AdminRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="accounts" element={<AdminAccounts />} />
        <Route path="challenges" element={<AdminChallenges />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="affiliates" element={<AdminAffiliates />} />
        <Route path="kyc" element={<AdminKyc />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ScrollToTop />
            <GlobalErrorBoundary>
              <AppRoutes />
            </GlobalErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'hsl(0 0% 5.5%)',
                  border: '1px solid hsl(0 0% 14%)',
                  color: 'hsl(0 0% 98%)',
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
