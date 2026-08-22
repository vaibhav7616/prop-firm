import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Wallet,
  Target,
  ShoppingCart,
  FileText,
  Award,
  Users,
  LifeBuoy,
  Bell,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronLeft,
  Sparkles,
  Zap,
  LineChart,
  Trophy,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const TRADER_NAV = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Web Terminal', to: '/dashboard/trading', icon: LineChart },
  { label: 'Trading Accounts', to: '/dashboard/accounts', icon: Wallet },
  { label: 'Challenge Progress', to: '/dashboard/progress', icon: Target },
  { label: 'Trading Objectives', to: '/dashboard/objectives', icon: Target },
  { label: 'Orders', to: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Invoices', to: '/dashboard/invoices', icon: FileText },
  { label: 'Payouts', to: '/dashboard/payouts', icon: Award },
  { label: 'Certificates', to: '/dashboard/certificates', icon: Award },
  { label: 'Affiliate', to: '/dashboard/affiliate', icon: Users },
  { label: 'Support', to: '/dashboard/support', icon: LifeBuoy },
  { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', to: '/dashboard/profile', icon: User },
  { label: 'Security', to: '/dashboard/security', icon: Shield },
];

const ADMIN_NAV = [
  { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: User },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Payments', to: '/admin/payments', icon: Wallet },
  { label: 'Trading Accounts', to: '/admin/accounts', icon: Wallet },
  { label: 'Challenges', to: '/admin/challenges', icon: Target },
  { label: 'Coupons', to: '/admin/coupons', icon: FileText },
  { label: 'Affiliates', to: '/admin/affiliates', icon: Users },
  { label: 'KYC', to: '/admin/kyc', icon: Shield },
  { label: 'Payouts', to: '/admin/payouts', icon: Award },
  { label: 'Support', to: '/admin/support', icon: LifeBuoy },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

interface DashboardLayoutProps {
  variant: 'trader' | 'admin';
}

export function DashboardLayout({ variant }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();

  const nav = variant === 'admin' ? ADMIN_NAV : TRADER_NAV;

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setSidebarOpen(false);
    await signOut();
    navigate('/');
  };

  const isActive = (to: string) =>
    to === `/${variant}` ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 border-r border-slate-300 bg-card shadow-sm transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-300">
            <div onClick={() => setSidebarOpen(false)} className="cursor-pointer">
              <Logo size="sm" />
            </div>
            <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-brand-500/10 text-brand-600 font-semibold dark:bg-brand-400/15 dark:text-brand-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavBg"
                      className="absolute inset-0 rounded-xl bg-brand-500/10 border border-brand-500/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110', active ? 'text-brand-500' : '')} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {variant === 'trader' && isAdmin && (
            <div className="p-3 border-t border-border">
              <Link to="/admin" onClick={() => setSidebarOpen(false)}>
                <button className="btn-secondary w-full justify-start text-sm py-2.5">
                  <Shield className="h-4 w-4" /> Admin Panel
                </button>
              </Link>
            </div>
          )}

          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? 'T'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Trader'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="btn-ghost w-full justify-start text-sm">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-slate-300 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button className="lg:hidden text-muted-foreground hover:text-foreground shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link to={variant === 'admin' ? '/admin' : '/dashboard'} className="lg:hidden shrink-0">
              <ChevronLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <h1 className="font-display font-bold text-sm sm:text-lg text-slate-900 truncate max-w-[120px] sm:max-w-none">
              {nav.find((n) => isActive(n.to))?.label ?? 'Dashboard'}
            </h1>
          </div>

          {/* Trigger Motion Buy Challenge / Get Funded Button */}
          <Link to={variant === 'admin' ? '/dashboard' : '/challenges'}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 0px rgba(16, 185, 129, 0)',
                  '0 0 20px rgba(16, 185, 129, 0.45)',
                  '0 0 0px rgba(16, 185, 129, 0)',
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 border border-emerald-400/30"
            >
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <Zap className="h-4 w-4 text-emerald-200 fill-emerald-200 animate-pulse" />
              <span className="relative z-10 font-bold tracking-wide">
                {variant === 'admin' ? 'View Site' : 'Get Funded · Buy Challenge'}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-emerald-100" />
            </motion.button>
          </Link>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
