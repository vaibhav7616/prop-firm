import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'segmented';
  showLabel?: boolean;
}

export function ThemeToggle({ className, variant = 'button', showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (variant === 'segmented') {
    return (
      <div className={cn('inline-flex items-center p-1 rounded-xl bg-secondary/80 border border-border', className)}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            theme === 'light'
              ? 'bg-card text-foreground shadow-xs border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            theme === 'dark'
              ? 'bg-card text-foreground shadow-xs border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Moon className="h-3.5 w-3.5 text-sky-400" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            theme === 'system'
              ? 'bg-card text-foreground shadow-xs border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Laptop className="h-3.5 w-3.5 text-purple-400" />
          <span>System</span>
        </button>
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-secondary/70 transition-colors shadow-xs text-xs font-semibold"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4 text-sky-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          {showLabel && (
            <span className="capitalize">{theme === 'system' ? `System (${resolvedTheme})` : theme}</span>
          )}
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-36 rounded-xl bg-card border border-border shadow-lg p-1.5 z-50 space-y-0.5"
            >
              <button
                type="button"
                onClick={() => { setTheme('light'); setDropdownOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  theme === 'light' ? 'bg-secondary text-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5 text-amber-500" /> Light
                </span>
                {theme === 'light' && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => { setTheme('dark'); setDropdownOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  theme === 'dark' ? 'bg-secondary text-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <Moon className="h-3.5 w-3.5 text-sky-400" /> Dark
                </span>
                {theme === 'dark' && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
              <button
                type="button"
                onClick={() => { setTheme('system'); setDropdownOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  theme === 'system' ? 'bg-secondary text-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <Laptop className="h-3.5 w-3.5 text-purple-400" /> System
                </span>
                {theme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default button toggle
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-xl border border-border bg-card hover:bg-secondary/80 text-foreground transition-all duration-200 shadow-xs flex items-center justify-center group',
        className
      )}
      title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle dark mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        {resolvedTheme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <Moon className="h-4 w-4 text-sky-400 fill-sky-400/20" />
            {showLabel && <span className="text-xs font-semibold">Dark</span>}
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <Sun className="h-4 w-4 text-amber-500 fill-amber-500/20" />
            {showLabel && <span className="text-xs font-semibold">Light</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
