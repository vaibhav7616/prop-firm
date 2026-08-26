import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Challenges', to: '/challenges' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Trading Rules', to: '/rules' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Proof of Payout', to: '/proof-of-payout' },
  { label: 'Affiliates', to: '/affiliates' },
  { label: 'FAQ', to: '/faq' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (to: string) => {
    if (to === '/challenges') return location.pathname === '/challenges' || location.pathname === '/pricing';
    return location.pathname === to;
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        scrolled || mobileOpen
          ? 'bg-white shadow-md border-b border-slate-200'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Logo />

          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={cn('nav-link relative py-1', active && 'active')}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login')}
                  className="btn-ghost"
                >
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                >
                  Start Challenge
                </motion.button>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-slate-800 hover:text-slate-900 focus:outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden pb-5 pt-2 border-t border-slate-200 bg-white"
            >
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors',
                      isActive(link.to)
                        ? 'text-brand-700 bg-brand-50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="h-px bg-slate-200 my-2" />
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary mx-4 my-1 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2 px-4 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl text-center border border-slate-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full text-center py-2.5 flex items-center justify-center"
                    >
                      Start Challenge
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

