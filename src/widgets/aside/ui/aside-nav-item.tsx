import React from 'react';
import Link from 'next/link';

import { cn } from '@/shared/utils';
import { useRouteLoading } from '@/shared/lib/route-loading';

type NavItemProps = {
  label: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
  onMouseEnter?: () => void;
};

export const AsideNavItem = ({ label, href, icon: Icon, active, onMouseEnter }: NavItemProps) => {
  const { startRouteLoading } = useRouteLoading();

  const handleClick = () => {
    // 이미 활성 페이지면 로딩 표시하지 않음
    if (!active) {
      startRouteLoading();
    }
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={onMouseEnter}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-text-1'
          : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
};