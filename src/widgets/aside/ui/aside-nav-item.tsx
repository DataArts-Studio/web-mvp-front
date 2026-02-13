import React from 'react';
import Link from 'next/link';

import { cn } from '@/shared';

type NavItemProps = {
  label: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
};

export const AsideNavItem = ({ label, href, icon: Icon, active }: NavItemProps) => {
  return (
    <Link
      href={href}
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