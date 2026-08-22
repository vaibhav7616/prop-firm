import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}

export function SectionHeading({ eyebrow, badge, title, subtitle, center = true, className }: SectionHeadingProps) {
  const label = eyebrow || badge;
  return (
    <div className={cn(center && 'text-center mx-auto', 'max-w-3xl', className)}>
      {label && (
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-3">
          {label}
        </p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-balance leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          {subtitle}
        </p>
      )}
    </div>
  );
}
