import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export function Logo({ className, showText = true, size = 'md', variant }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900 dark:text-white';
  const shiftColor = variant === 'light' ? 'text-brand-400' : 'text-brand-500';

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group select-none', className)}>
      <div className={cn('relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft-md shrink-0', iconSize)}>
        <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={cn('font-display font-bold tracking-tight', textSize, textColor)}>
          Funded<span className={shiftColor}>Shift</span>
        </span>
      )}
    </Link>
  );
}
