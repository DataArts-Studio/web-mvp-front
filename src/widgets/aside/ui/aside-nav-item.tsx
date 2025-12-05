import React from 'react';
import Link from 'next/link';

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
      className={`
        flex items-center gap-3 rounded-lg px-3 py-2 text-md
        transition-colors
        ${active
          ? 'bg-primary text-bg-1'
          : 'text-text-2 hover:bg-bg-4 hover:text-text-1'}
      `}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </Link>
  );
};