import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TradingAccount } from '@/types';
import { useAuth } from '@/context/auth-context';
import { fetchUserAccounts } from '@/lib/api-client';
import { DEFAULT_ACCOUNTS } from '@/lib/default-data';

export const FS_SELECTED_KEY = 'fs_selected_account_id';

interface FsAccountContextValue {
  accounts: TradingAccount[];
  selected: TradingAccount | null;
  selectedId: string | null;
  loading: boolean;
  hasBackend: boolean;
  selectAccount: (id: string) => void;
  refreshAccounts: () => Promise<void>;
}

const FsAccountContext = createContext<FsAccountContextValue | undefined>(undefined);

export function FsAccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBackend, setHasBackend] = useState(false);

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    try {
      let accs: TradingAccount[] = [];
      if (user?.id) {
        const fetched = await fetchUserAccounts(user.id);
        if (fetched && fetched.length > 0) {
          accs = fetched;
          setHasBackend(true);
        }
      }
      if (accs.length === 0) {
        accs = DEFAULT_ACCOUNTS;
        setHasBackend(false);
      }
      setAccounts(accs);

      // Restore persisted selection if still valid, else default to first
      const stored = typeof window !== 'undefined' ? localStorage.getItem(FS_SELECTED_KEY) : null;
      const valid = stored && accs.some((a) => a.id === stored) ? stored : null;
      const next = valid || accs[0]?.id || null;
      setSelectedId(next);
      if (next && typeof window !== 'undefined') localStorage.setItem(FS_SELECTED_KEY, next);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const selectAccount = useCallback((id: string) => {
    setSelectedId(id);
    try {
      localStorage.setItem(FS_SELECTED_KEY, id);
    } catch {
      /* storage may be restricted */
    }
  }, []);

  const value = useMemo<FsAccountContextValue>(() => {
    const selected = accounts.find((a) => a.id === selectedId) || accounts[0] || null;
    return { accounts, selected, selectedId: selected?.id ?? null, loading, hasBackend, selectAccount, refreshAccounts };
  }, [accounts, selectedId, loading, hasBackend, selectAccount, refreshAccounts]);

  return <FsAccountContext.Provider value={value}>{children}</FsAccountContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFsAccount() {
  const ctx = useContext(FsAccountContext);
  if (!ctx) throw new Error('useFsAccount must be used within FsAccountProvider');
  return ctx;
}
