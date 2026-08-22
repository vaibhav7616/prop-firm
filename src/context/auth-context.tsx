import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  demoLogin: (role?: 'trader' | 'admin') => void;
  adminLogin: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_TRADER_USER: User = {
  id: 'demo-trader-id-12345',
  app_metadata: {},
  user_metadata: { full_name: 'Alex Vance' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'trader@propfirm.com',
};

const DEMO_TRADER_PROFILE: Profile = {
  id: 'demo-trader-id-12345',
  full_name: 'Alex Vance',
  email: 'trader@propfirm.com',
  role: 'trader',
  country: 'United States',
  phone: '+1 555-0192',
  avatar_url: null,
  affiliate_code: 'ALEX99',
  referred_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_ADMIN_USER: User = {
  id: 'demo-admin-id-67890',
  app_metadata: {},
  user_metadata: { full_name: 'System Administrator' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@propfirm.com',
};

const DEMO_ADMIN_PROFILE: Profile = {
  id: 'demo-admin-id-67890',
  full_name: 'System Administrator',
  email: 'admin@propfirm.com',
  role: 'admin',
  country: 'United States',
  phone: '+1 555-0199',
  avatar_url: null,
  affiliate_code: 'ADMIN01',
  referred_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('demo_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('demo_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const demoLogin = (role: 'trader' | 'admin' = 'trader') => {
    const user = role === 'admin' ? DEMO_ADMIN_USER : DEMO_TRADER_USER;
    const prof = role === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_TRADER_PROFILE;
    setDemoUser(user);
    setProfile(prof);
    localStorage.setItem('demo_user_session', JSON.stringify(user));
    localStorage.setItem('demo_user_profile', JSON.stringify(prof));
  };

  const adminLogin = async (username: string, password: string) => {
    const { adminLoginApi } = await import('@/lib/api-client');
    const res = await adminLoginApi(username, password);
    if (res && res.user && res.profile) {
      const uObj: User = {
        id: res.user.id,
        app_metadata: {},
        user_metadata: { full_name: res.user.full_name },
        aud: 'authenticated',
        created_at: res.user.created_at,
        email: res.user.email,
      };
      const pObj: Profile = res.profile;
      setDemoUser(uObj);
      setProfile(pObj);
      localStorage.setItem('demo_user_session', JSON.stringify(uObj));
      localStorage.setItem('demo_user_profile', JSON.stringify(pObj));
    }
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load profile:', error);
      return;
    }
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        if (data.session.user) {
          loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
          return;
        }
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else if (!demoUser) {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [demoUser]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // ignore
    }
    setProfile(null);
    setSession(null);
    setDemoUser(null);
    localStorage.removeItem('demo_user_session');
    localStorage.removeItem('demo_user_profile');
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const activeUser = session?.user ?? demoUser;

  const value: AuthContextValue = {
    session,
    user: activeUser,
    profile,
    loading,
    isAdmin: profile?.role?.toLowerCase() === 'admin',
    signOut,
    refreshProfile,
    demoLogin,
    adminLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
