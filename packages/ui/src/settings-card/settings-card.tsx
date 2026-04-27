import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils';
import { Skeleton, SkeletonCircle } from '../skeleton';

/* ─── Root ─────────────────────────────────────────────────────────────────── */

interface RootProps extends React.ComponentProps<'section'> {
  variant?: 'default' | 'danger';
}

const Root = ({ variant = 'default', className, children, ...props }: RootProps) => (
  <section
    className={cn(
      'rounded-5 flex flex-col border transition-colors',
      variant === 'danger'
        ? 'border-red-500/20 bg-red-500/[0.03]'
        : 'border-line-2 bg-bg-2',
      className,
    )}
    {...props}
  >
    {children}
  </section>
);

/* ─── Header ───────────────────────────────────────────────────────────────── */

interface HeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'danger';
}

const Header = ({ icon, title, description, variant = 'default' }: HeaderProps) => (
  <div className="p-6 pb-5">
    <div className="flex items-start gap-4">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          variant === 'danger'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-primary/10 text-primary',
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <h2
          className={cn(
            'typo-h2-heading',
            variant === 'danger' ? 'text-red-400' : 'text-text-1',
          )}
        >
          {title}
        </h2>
        <p className="typo-caption text-text-3">{description}</p>
      </div>
    </div>
  </div>
);

/* ─── Divider ──────────────────────────────────────────────────────────────── */

interface DividerProps {
  variant?: 'default' | 'danger';
}

const Divider = ({ variant = 'default' }: DividerProps) => (
  <div
    className={cn(
      'border-t',
      variant === 'danger' ? 'border-red-500/10' : 'border-line-2',
    )}
  />
);

/* ─── Body ─────────────────────────────────────────────────────────────────── */

const Body = ({ className, children, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('p-6 pt-5', className)} {...props}>
    {children}
  </div>
);

/* ─── Row — 라벨+입력+버튼 한 줄 (일반 설정 섹션에서 사용) ──────────────── */

const Row = ({ className, children, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex items-center gap-4 px-6 py-5', className)} {...props}>
    {children}
  </div>
);

/* ─── ConnectedStatus — 연결/설정 완료 상태 표시 ──────────────────────────── */

interface ConnectedStatusProps {
  label: string;
  description?: string;
  actions?: React.ReactNode;
}

const ConnectedStatus = ({ label, description, actions }: ConnectedStatusProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
        <Check className="h-4 w-4 text-green-400" />
      </div>
      <div className="flex flex-col">
        <span className="typo-body2-heading text-text-1">{label}</span>
        {description && (
          <span className="typo-caption text-text-3">{description}</span>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

/* ─── LoadingSkeleton — 공통 로딩 스켈레톤 ────────────────────────────────── */

const LoadingSkeleton = () => (
  <div className="rounded-5 border-line-2 bg-bg-2 flex flex-col border animate-pulse">
    <div className="flex items-start gap-4 p-6 pb-5">
      <SkeletonCircle className="h-10 w-10" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-52" />
      </div>
    </div>
    <div className="border-t border-line-2" />
    <div className="p-6 pt-5">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

/* ─── Export ───────────────────────────────────────────────────────────────── */

export const SettingsCard = {
  Root,
  Header,
  Divider,
  Body,
  Row,
  ConnectedStatus,
  LoadingSkeleton,
};
