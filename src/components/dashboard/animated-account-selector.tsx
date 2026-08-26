import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Wallet, ShieldCheck, Award } from 'lucide-react';
import type { TradingAccount } from '@/types';
import { cn } from '@/lib/utils';

interface AnimatedAccountSelectorProps {
  accounts: TradingAccount[];
  selectedAccount?: TradingAccount;
  onSelect: (account: TradingAccount) => void;
  className?: string;
}

export function AnimatedAccountSelector({
  accounts,
  selectedAccount,
  onSelect,
  className,
}: AnimatedAccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const active = selectedAccount || accounts[0];

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-left font-medium transition-all duration-200 border',
          'bg-card border-slate-300 dark:border-slate-700/80 shadow-xs hover:border-brand-400 dark:hover:border-brand-500/60',
          isOpen ? 'ring-2 ring-brand-500/20 border-brand-500' : ''
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Wallet className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold text-foreground">
                #{active?.account_number || '---'}
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md font-mono',
                  String(active?.status).toLowerCase() === 'active' || String(active?.status).toLowerCase() === 'funded'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : String(active?.status).toLowerCase() === 'passed'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                )}
              >
                {active?.status || 'active'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-[180px] sm:max-w-[220px]">
              {active?.plan_name || `$${(active?.account_size || 100000).toLocaleString()} Challenge`}
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground shrink-0 ml-1"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-84 rounded-2xl bg-card border border-slate-300 dark:border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl"
          >
            <div className="px-2.5 py-1.5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Your Trading Accounts</span>
              <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">
                {accounts.length} Total
              </span>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {accounts.map((acc, idx) => {
                const isSelected = acc.id === active?.id;
                return (
                  <motion.button
                    key={acc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.15 }}
                    type="button"
                    onClick={() => {
                      onSelect(acc);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors duration-150',
                      isSelected
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20'
                        : 'hover:bg-secondary/70 text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'h-6 w-6 rounded-md flex items-center justify-center text-xs shrink-0',
                          isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-secondary text-muted-foreground'
                        )}
                      >
                        {String(acc.status).toLowerCase() === 'passed' ? (
                          <Award className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold truncate">#{acc.account_number}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {acc.plan_name || `$${acc.account_size.toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono',
                          String(acc.status).toLowerCase() === 'active' || String(acc.status).toLowerCase() === 'funded'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : String(acc.status).toLowerCase() === 'passed'
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                            : 'bg-rose-500/10 text-rose-600'
                        )}
                      >
                        {acc.status}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-brand-500" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
