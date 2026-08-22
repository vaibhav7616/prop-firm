import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>
      <Card className="glass border-border/50">
        <CardContent className="p-12 text-center">
          <Construction className="h-16 w-16 text-gold-400/30 mx-auto mb-6" />
          <h2 className="font-display text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This section is part of Phase 2 of the Funded Shift roadmap. The data model is in place —
            the management interface will be built next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
