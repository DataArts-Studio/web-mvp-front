import type { ReactNode } from 'react';

import type { NavItem } from '@/entities/admin-dashboard';

type AdminInfo = { name: string; email: string };

type BackOfficeLayoutProps = {
  navItems: NavItem[];
  children: ReactNode;
  /** 로그인 주체. 세션 미연동 단계면 생략하면 스켈레톤이 표시된다. */
  admin?: AdminInfo;
  /** 현재 경로. 지정 시 item.href 와 비교해 현재 메뉴를 판별한다(item.current 보다 우선). */
  activeHref?: string;
};

export function BackOfficeLayout({ navItems, children, admin, activeHref }: BackOfficeLayoutProps) {
  return (
    <div className="text-text-primary min-h-dvh bg-gray-50 lg:pl-[240px]">
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
            const Icon = item.icon;
            // 현재 메뉴 판별: activeHref 가 있으면 href 비교, 없으면 데이터(current).
            const isCurrent = activeHref ? item.href === activeHref : Boolean(item.current);
            const baseClass = [
              'flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors',
              isCurrent
                ? 'bg-[#155DFC]/10 text-[#155DFC]'
                : 'text-text-secondary hover:text-text-primary hover:bg-gray-100',
            ].join(' ');

            // 미구현 메뉴(href 없음)는 '#' 이동 대신 비활성 버튼으로 처리한다.
            if (!item.href) {
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  aria-disabled="true"
                  className={`${baseClass} cursor-not-allowed text-left opacity-50`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={baseClass}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="border-border absolute bottom-0 hidden w-[239px] border-t px-6 py-4 text-sm lg:block">
          {admin ? (
            <>
              <div className="font-semibold">{admin.name}</div>
              <div className="text-text-secondary mt-1">{admin.email}</div>
            </>
          ) : (
            // 세션 미연동: 실제 값 하드코딩 대신 자리만 잡는 스켈레톤
            <div aria-hidden="true" className="animate-pulse space-y-2">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-100" />
            </div>
          )}
        </div>
      </aside>

      <main aria-label="백오피스 본문" className="min-w-0">
        {children}
      </main>
    </div>
  );
}
