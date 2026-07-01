import React from 'react';

import Link from 'next/link';

import { useRouteLoading } from '@/shared/lib/route-loading';
import { cn } from '@testea/util';

type NavItemProps = {
  label: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
  external?: boolean;
  onMouseEnter?: () => void;
};

export const AsideNavItem = ({
  label,
  href,
  icon: Icon,
  active,
  external,
  onMouseEnter,
}: NavItemProps) => {
  const { startRouteLoading } = useRouteLoading();

  const handleClick = () => {
    // 이미 활성 페이지면 로딩 표시하지 않음
    if (!active && !external) {
      startRouteLoading();
    }
  };

  const className = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    active ? 'bg-primary text-text-1' : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
  );
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={onMouseEnter}
        onClick={handleClick}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onMouseEnter={onMouseEnter} onClick={handleClick} className={className}>
      {content}
    </Link>
  );
};
