import type { ReactNode } from 'react';

import type { NavItem } from '@/entities/admin-dashboard';

type BackOfficeLayoutProps = {
  navItems: NavItem[];
  children: ReactNode;
};

export function BackOfficeLayout({ navItems, children }: BackOfficeLayoutProps) {
  return (
    <main
      id="dashboard-main"
      aria-labelledby="dashboard-title"
      className="text-text-primary min-h-dvh flex-1 bg-gray-50"
    >
      <div className="min-h-dvh bg-gray-50 lg:pl-[240px]">
        <aside
          aria-label="Back office 사이드바"
          className="border-border fixed inset-y-0 left-0 hidden w-[240px] border-r bg-white lg:block"
        >
          <div className="border-border border-b px-6 py-5">
            <div className="tracking-zero text-xl font-bold">Testea</div>
            <div className="text-text-secondary mt-1 text-sm">관리자</div>
          </div>
          <nav aria-label="Back office 주요 메뉴" className="flex flex-col gap-1 px-3 py-4 text-sm">
            {navItems.map((item) => {
              const isCurrent = item.label === '대시보드';

              return (
                <a
                  key={item.label}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors',
                    isCurrent
                      ? 'bg-[#155DFC]/10 text-[#155DFC]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100',
                  ].join(' ')}
                  href={isCurrent ? '#dashboard-main' : '#'}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.iconPath} />
                  </svg>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="border-border absolute bottom-0 hidden w-[239px] border-t px-6 py-4 text-sm lg:block">
            <div className="font-semibold">관리자</div>
            <div className="text-text-secondary mt-1">admin@testea.com</div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
