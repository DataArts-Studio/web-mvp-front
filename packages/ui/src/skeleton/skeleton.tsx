import { cn } from '../utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('animate-pulse rounded bg-bg-3', className)} />
);

export const SkeletonText = ({ className }: SkeletonProps) => (
  <div className={cn('h-4 animate-pulse rounded bg-bg-3', className)} />
);

export const SkeletonCircle = ({ className }: SkeletonProps) => (
  <div className={cn('h-4 w-4 animate-pulse rounded-full bg-bg-3', className)} />
);
