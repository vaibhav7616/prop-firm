import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export function Logo({ className, showText = true, size = 'md', variant = 'dark' }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const textColor = variant === 'dark' ? 'text-foreground' : 'text-white';

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group', className)}>
      <div className={cn('relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft-md', iconSize)}>
        <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={cn('font-display font-bold tracking-tight', textSize, textColor)}>
          Funded<span className="text-brand-600">Shift</span>
        </span>
      )}
    </Link>
  );
}
