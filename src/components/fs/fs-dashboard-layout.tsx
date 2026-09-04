import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard,
  CandlestickChart,
  Wallet,
  Gauge,
  Trophy,
  ShoppingCart,
  FileText,
  Banknote,
  BadgeCheck,
  Network,
  LifeBuoy,
  Bell,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  CircleHelp,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useFsAccount } from '@/context/account-context';
import { useFsNotifications } from '@/lib/fs-notifications';
import { fsAccountMeta } from '@/lib/fs-risk';
import { ACCOUNT_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Web Terminal', to: '/dashboard/trading', icon: CandlestickChart },
  { label: 'Trading Accounts', to: '/dashboard/accounts', icon: Wallet },
  { label: 'Trading Objectives', to: '/dashboard/objectives', icon: Gauge },
  { label: 'Trader Leaderboard', to: '/dashboard/leaderboard', icon: Trophy },
  { label: 'Orders', to: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Invoices', to: '/dashboard/invoices', icon: FileText },
  { label: 'Payouts', to: '/dashboard/payouts', icon: Banknote },
  { label: 'Certificates', to: '/dashboard/certificates', icon: BadgeCheck },
  { label: 'Affiliate', to: '/dashboard/affiliate', icon: Network },
  { label: 'Support', to: '/dashboard/support', icon: LifeBuoy },
  { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', to: '/dashboard/profile', icon: User },
  { label: 'Security', to: '/dashboard/security', icon: ShieldCheck },
];

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700">
        <span className="fs-num text-sm font-bold text-white">F</span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#0c0f16] bg-emerald-400" />
      </div>
      {!compact && (
        <div className="leading-none md:hidden lg:block">
          <p className="font-display text-[15px] font-bold tracking-tight text-slate-50">Funded Shift</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">Trader OS</p>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    onNavigate?.();
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        <Link to="/dashboard" onClick={onNavigate} className="md:mx-auto lg:mx-0">
          <Wordmark />
        </Link>
      </div>

      <div className="border-b border-slate-800/80 px-3 py-2.5 md:px-2">
        <Link
          to="/challenges"
          onClick={onNavigate}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="md:hidden lg:inline">New Challenge</span>
          <span className="hidden md:inline lg:hidden">+</span>
        </Link>
      </div>

      <nav className="fs-scroll flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3 md:px-2">
        <p className="fs-label mb-2 px-2 md:hidden lg:block">Workspace</p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onNavigate}
              title={item.label}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150',
                active ? 'text-slate-50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100',
                'md:justify-center lg:justify-start'
              )}
            >
              {active && (
                <>
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400" />
                  <span className="absolute inset-0 rounded-lg bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20 md:hidden lg:block" />
                </>
              )}
              <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200')} />
              <span className="md:hidden lg:inline">{item.label}</span>
              {item.to === '/dashboard/notifications' && <NotifRailBadge />}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200 ring-1 ring-slate-700">
            {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? 'T'}
          </div>
          <div className="min-w-0 flex-1 md:hidden lg:block">
            <p className="truncate text-sm font-medium text-slate-200">{profile?.full_name ?? 'Trader'}</p>
            <p className="truncate text-[11px] text-slate-500">{profile?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-300"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifRailBadge() {
  const { unread } = useFsNotifications();
  if (unread === 0) return null;
  return (
    <span className="ml-auto rounded-full bg-indigo-500 px-1.5 py-px text-[10px] font-semibold leading-4 text-white md:hidden lg:inline">
      {unread}
    </span>
  );
}

function AccountSwitcher() {
  const { accounts, selected, selectAccount } = useFsAccount();
  const meta = selected ? fsAccountMeta(selected) : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-1.5 text-left transition-colors hover:border-slate-600">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              meta?.accent === 'emerald' && 'bg-emerald-400',
              meta?.accent === 'rose' && 'bg-rose-400',
              meta?.accent === 'amber' && 'bg-amber-400',
              (!meta || meta.accent === 'indigo') && 'bg-indigo-400'
            )}
          />
          <span className="hidden min-w-0 sm:block">
            <span className="fs-num block text-xs font-semibold text-slate-100">
              {selected ? `#${selected.account_number ?? selected.id}` : 'No account'}
            </span>
            <span className="block text-[10px] text-slate-500">
              {meta?.subtitle ?? 'Select account'}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Select Trading Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map((acc) => {
          const m = fsAccountMeta(acc);
          const isSel = acc.id === selected?.id;
          return (
            <DropdownMenuItem key={acc.id} onSelect={() => selectAccount(acc.id)} className="flex items-center gap-2.5 py-2.5">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  m.accent === 'emerald' && 'bg-emerald-400',
                  m.accent === 'rose' && 'bg-rose-400',
                  m.accent === 'amber' && 'bg-amber-400',
                  m.accent === 'indigo' && 'bg-indigo-400'
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="fs-num block text-sm font-semibold text-slate-100">
                  #{acc.account_number ?? acc.id} · ${(acc.account_size / 1000).toFixed(0)}K
                </span>
                <span className="block text-xs text-slate-500">
                  {ACCOUNT_STATUS_LABELS[acc.status] ?? acc.status} · {acc.plan_name || acc.challenge?.name || 'Account'}
                </span>
              </span>
              {isSel && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopHeader() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { unread } = useFsNotifications();
  const { selected, loading } = useFsAccount();
  const meta = selected ? fsAccountMeta(selected) : null;

  const currentLabel = useMemo(() => {
    const path = window.location.pathname;
    const match = NAV.find((n) => (n.to === '/dashboard' ? path === '/dashboard' : path.startsWith(n.to)));
    return match?.label ?? 'Dashboard';
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-800/80 bg-[#0b0e15]/90 px-4 backdrop-blur-md sm:px-5">
      <MobileMenuButton />
      <div className="hidden text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:block">
        <span className="fs-num">{selected ? 'FS' : ''}</span> <span className="text-slate-200">{currentLabel}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-800" />
        ) : (
          <AccountSwitcher />
        )}
        {selected && meta && (
          <span className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-400 xl:flex">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                meta.accent === 'emerald' && 'bg-emerald-400',
                meta.accent === 'rose' && 'bg-rose-400',
                meta.accent === 'amber' && 'bg-amber-400',
                meta.accent === 'indigo' && 'bg-indigo-400'
              )}
            />
            {ACCOUNT_STATUS_LABELS[selected.status] ?? selected.status}
          </span>
        )}
        <div className="h-6 w-px bg-slate-800" />
        <Link
          to="/dashboard/support"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          title="Support"
        >
          <CircleHelp className="h-[18px] w-[18px]" />
        </Link>
        <Link
          to="/dashboard/notifications"
          className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-100 ring-1 ring-slate-700 transition-colors hover:ring-slate-500">
              {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? 'T'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {profile?.full_name ?? 'Trader'}
              <span className="block text-xs font-normal text-slate-500">{profile?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/dashboard/profile')}>
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/dashboard/security')}>
              <ShieldCheck className="h-4 w-4" /> Security
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/dashboard/affiliate')}>
              <Network className="h-4 w-4" /> Affiliate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={async () => { await signOut(); navigate('/'); }} className="text-rose-400 focus:text-rose-300">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MobileMenuButton() {
  const { setOpen } = useDrawer();
  return (
    <button
      onClick={() => setOpen(true)}
      className="-ml-1 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-800 lg:hidden"
      aria-label="Open navigation"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

/* tiny local drawer state via context-free singleton */
const drawerListeners = new Set<(v: boolean) => void>();
let drawerOpen = false;
function setOpenLocal(v: boolean) {
  drawerOpen = v;
  drawerListeners.forEach((l) => l(v));
}
function useDrawer() {
  const [open, setLocal] = useState(false);
  useEffect(() => {
    function cb(v: boolean) {
      setLocal(v);
    }
    drawerListeners.add(cb);
    return () => {
      drawerListeners.delete(cb);
    };
  }, []);
  return { open, setOpen: setOpenLocal };
}

export function FsDashboardLayout() {
  const location = useLocation();
  const { setOpen, open } = useDrawer();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);

  const { profile } = useAuth();

  return (
    <div className="fs-shell min-h-screen">
      <div className="fs-canvas min-h-screen">
        {/* Mobile / tablet off-canvas drawer (< lg uses overlay; lg+ shows the rail/full inline below) */}
        <div className="lg:hidden">
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/60"
                  onClick={() => setOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
                  className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-slate-800 bg-[#0b0e15]"
                >
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Persistent sidebar: icon rail on md, full on lg+ */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col border-r border-slate-800/80 bg-[#0b0e15] lg:w-[264px] md:flex">
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen flex-col md:pl-[84px] lg:pl-[264px]">
          <TopHeader />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <footer className="px-6 pb-5 text-[11px] text-slate-600">
            Funded Shift Trader OS · demo environment · market data may be simulated. Not investment advice.
            {profile ? '' : ''}
          </footer>
        </div>
      </div>
    </div>
  );
}
