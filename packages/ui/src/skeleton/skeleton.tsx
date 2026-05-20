import { cn } from '@testea/util';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('bg-bg-3 animate-pulse rounded', className)} />
);

export const SkeletonText = ({ className }: SkeletonProps) => (
  <div className={cn('bg-bg-3 h-4 animate-pulse rounded', className)} />
);

export const SkeletonCircle = ({ className }: SkeletonProps) => (
  <div className={cn('bg-bg-3 h-4 w-4 animate-pulse rounded-full', className)} />
);
