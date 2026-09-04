import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { MarketingLayout } from '@/components/layouts/marketing-layout';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { FsDashboardLayout } from '@/components/fs/fs-dashboard-layout';
import { FsAccountProvider } from '@/context/account-context';
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

// Auth pages
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';

// Checkout
import { CheckoutPage } from '@/pages/checkout';

// Dashboard pages
import { DashboardOverview } from '@/pages/dashboard/overview';
import { DashboardTrading } from '@/pages/dashboard/trading';
import { DashboardAccounts } from '@/pages/dashboard/accounts';
import { DashboardObjectives } from '@/pages/dashboard/objectives';
import { DashboardOrders } from '@/pages/dashboard/orders';
import { DashboardInvoices } from '@/pages/dashboard/invoices';
import { DashboardPayouts } from '@/pages/dashboard/payouts';
import { DashboardCertificates } from '@/pages/dashboard/certificates';
import { DashboardLeaderboard } from '@/pages/dashboard/leaderboard';
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
import { AdminPlaceholder } from '@/pages/admin/placeholder';
import { AdminLoginPage } from '@/pages/admin/login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" /></div>;
  if (!user || !isAdmin) return <AdminLoginPage />;
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
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Checkout */}
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

      {/* Trader Dashboard — Funded Shift Trader OS (authenticated redesign) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <FsAccountProvider>
              <FsDashboardLayout />
            </FsAccountProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="trading" element={<DashboardTrading />} />
        <Route path="accounts" element={<DashboardAccounts />} />
        <Route path="progress" element={<Navigate to="/dashboard/objectives" replace />} />
        <Route path="objectives" element={<DashboardObjectives />} />
        <Route path="orders" element={<DashboardOrders />} />
        <Route path="invoices" element={<DashboardInvoices />} />
        <Route path="payouts" element={<DashboardPayouts />} />
        <Route path="certificates" element={<DashboardCertificates />} />
        <Route path="leaderboard" element={<DashboardLeaderboard />} />
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
        <Route path="support" element={<AdminPlaceholder title="Support" description="Manage support tickets across the platform." />} />
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
            <AppRoutes />
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
