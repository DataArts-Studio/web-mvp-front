import type { ReactNode } from 'react';
import { cn } from '../utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-4 py-12 text-center', className)}>
    <div className="text-text-3">{icon}</div>
    <div className="flex flex-col gap-1">
      <p className="text-text-1 font-semibold">{title}</p>
      {description && <p className="text-text-3 text-sm">{description}</p>}
    </div>
    {action}
  </div>
);
