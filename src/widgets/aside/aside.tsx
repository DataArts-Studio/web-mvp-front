'use client';
import React, { useMemo } from 'react';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { Logo } from '@/shared';
import { AsideMenuItem, createAsideMenus } from '@/widgets/aside/model';
import { AsideNavItem } from '@/widgets/aside/ui';
import { track, NAVIGATION_EVENTS } from '@/shared/lib/analytics';
import { toast } from 'sonner';

// 경로 매칭 함수: 현재 경로가 메뉴 경로와 일치하는지 확인
const isPathActive = (currentPath: string, matchPath: string): boolean => {
  if (!matchPath) return false;

  // 대시보드 경로인 경우 (/projects/[slug]) - 정확히 일치해야 함
  const dashboardPattern = /^\/projects\/[^/]+$/;
  if (dashboardPattern.test(matchPath)) {
    return currentPath === matchPath;
  }

  // 나머지는 시작 부분 일치
  return currentPath.startsWith(matchPath);
};

const handleAwaitBottom = (e: React.MouseEvent<HTMLDivElement>) => {
  e.preventDefault();
  toast.info('해당 기능은 준비중 입니다.');
}

export const Aside = () => {
  const params = useParams();
  const pathname = usePathname();
  const projectSlug = params.slug as string;

  // 동적 메뉴 생성
  const menus = useMemo(() => {
    if (!projectSlug) return null;
    return createAsideMenus(projectSlug);
  }, [projectSlug]);

  if (!menus) {
    return null;
  }

  return (
    <aside
      id="aside"
      className="bg-bg-1 sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-bg-4 text-text-1"
    >
      {/* 사이드바 상단 */}
      <div className="border-b border-bg-4 px-6 pt-10 pb-6">
        <Link href={`/projects/${projectSlug}`} className="block" aria-label="대시보드로 이동">
          <Logo aria-hidden="true" />
        </Link>
        <p className="typo-label-normal text-text-3 mt-4 tracking-[0.2em]">
          테스트 도구
        </p>
      </div>

      {/* 사이드바 메인 메뉴 */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        {menus.sections.map((section) => (
          <section key={section.title} className="flex flex-col">
            <h2 className="typo-label-heading text-text-3 mb-3 uppercase tracking-[0.18em]">
              {section.title}
            </h2>

            <div className="flex flex-col gap-1">
              {section.items.map((item: AsideMenuItem) => (
                <div key={item.label} onClick={() => track(NAVIGATION_EVENTS.NAV_CLICK, { menu_label: item.label })}>
                  <AsideNavItem
                    label={item.label}
                    href={item.href}
                    icon={item.icon}
                    active={isPathActive(pathname, item.matchPath || '')}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </nav>

      {/* 사이드바 하단 */}
      <div className="mt-auto border-t border-bg-4 px-4 py-4">
        <div className="flex flex-col gap-1" onClick={handleAwaitBottom}>
          {menus.bottom.map((item: AsideMenuItem) => (
            <AsideNavItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={isPathActive(pathname, item.matchPath || '')}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};
