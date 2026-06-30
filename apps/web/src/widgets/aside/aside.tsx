'use client';
import React, { useCallback, useMemo } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import { dashboardQueryKeys } from '@/features/dashboard';
import { ProductLanguageSwitcher } from '@/features/locale-switcher';
import { NAVIGATION_EVENTS, track } from '@/shared/lib/analytics';
import { AsideMenuItem, createAsideMenus } from '@/widgets/aside/model';
import { AsideNavItem } from '@/widgets/aside/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Logo } from '@testea/ui';
import { Search } from 'lucide-react';
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

const handleAwaitItem = (e: React.MouseEvent, href: string, comingSoonMessage: string) => {
  if (href === '#') {
    e.preventDefault();
    toast.info(comingSoonMessage);
  }
};

// 메뉴 라벨 → prefetch할 쿼리 옵션을 동적으로 로드
type PrefetchOptions = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  staleTime?: number;
};
// 메뉴 식별 키(menu.ts 의 label) → prefetch 쿼리 옵션 로더.
const PREFETCH_LOADERS: Record<string, (pid: string) => Promise<PrefetchOptions>> = {
  'items.requirements': async (pid) => {
    const { requirementAnalysesQueryOptions } = await import('@/entities/requirement-analysis');
    return requirementAnalysesQueryOptions(pid) as unknown as PrefetchOptions;
  },
  'items.scenarios': async (pid) => {
    const { scenarioFeaturesQueryOptions } = await import('@/entities/test-scenario');
    return scenarioFeaturesQueryOptions(pid) as unknown as PrefetchOptions;
  },
  'items.cases': async (pid) => {
    const { testCasesQueryOptions } = await import('@/features/cases-list');
    return testCasesQueryOptions(pid) as unknown as PrefetchOptions;
  },
  'items.suites': async (pid) => {
    const { testSuitesQueryOptions } = await import('@/entities/test-suite');
    return testSuitesQueryOptions(pid) as unknown as PrefetchOptions;
  },
  'items.milestones': async (pid) => {
    const { milestonesQueryOptions } = await import('@/entities/milestone');
    return milestonesQueryOptions(pid) as unknown as PrefetchOptions;
  },
  'items.runs': async (pid) => {
    const { testRunsQueryOptions } = await import('@/features/runs');
    return testRunsQueryOptions(pid) as unknown as PrefetchOptions;
  },
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const Aside = () => {
  const t = useTranslations('aside');
  const params = useParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const projectSlug = params.slug as string;

  // 동적 메뉴 생성
  const menus = useMemo(() => {
    if (!projectSlug) return null;
    return createAsideMenus(projectSlug);
  }, [projectSlug]);

  // 호버 시 해당 페이지 데이터 prefetch (동적 import로 초기 번들 축소)
  const handlePrefetch = useCallback(
    async (label: string) => {
      const loader = PREFETCH_LOADERS[label];
      if (!loader) return;

      try {
        const statsData = queryClient.getQueryData<{
          success: boolean;
          data: { project: { id: string } };
        }>(dashboardQueryKeys.stats(projectSlug));
        let projectId = statsData?.success ? statsData.data.project.id : undefined;
        if (!projectId) {
          const projectIdResult = await queryClient.ensureQueryData(
            projectIdQueryOptions(projectSlug)
          );
          projectId = projectIdResult.success ? projectIdResult.data.id : undefined;
        }
        if (!projectId) return;

        const options = await loader(projectId);
        await queryClient.prefetchQuery(options);
      } catch {
        // Hover prefetch는 실패해도 실제 페이지 이동을 막지 않는다.
      }
    },
    [queryClient, projectSlug]
  );

  if (!menus || pathname.endsWith('/access')) {
    return null;
  }

  return (
    <aside
      id="aside"
      className="bg-bg-1 border-bg-4 text-text-1 sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r"
    >
      {/* 사이드바 상단 */}
      <div className="border-bg-4 border-b px-6 pt-10 pb-6">
        <Link href={`/projects/${projectSlug}`} className="block" aria-label={t('dashboardAria')}>
          <Logo aria-hidden="true" />
        </Link>
        <p className="typo-label-normal text-text-3 mt-4 tracking-[0.2em]">{t('brand')}</p>
      </div>

      {/* 검색 트리거 */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }
          className="rounded-3 border-line-2 bg-bg-3 text-text-4 hover:border-line-3 hover:text-text-3 flex w-full items-center gap-2 border px-3 py-1.5 transition-colors"
        >
          <Search size={14} />
          <span className="typo-label-normal flex-1 text-left">{t('search')}</span>
          <kbd className="typo-label-normal text-text-4 flex items-center gap-1">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* 사이드바 메인 메뉴 */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        {menus.sections.map((section) => (
          <section key={section.title} className="flex flex-col">
            <h2 className="typo-label-heading text-text-3 mb-3 tracking-[0.18em] uppercase">
              {t(section.title)}
            </h2>

            <div className="flex flex-col gap-1">
              {section.items.map((item: AsideMenuItem) => (
                <div
                  key={item.label}
                  onClick={() => track(NAVIGATION_EVENTS.NAV_CLICK, { menu_label: item.label })}
                >
                  <AsideNavItem
                    label={t(item.label)}
                    href={item.href}
                    icon={item.icon}
                    active={isPathActive(pathname, item.matchPath || '')}
                    onMouseEnter={() => handlePrefetch(item.label)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </nav>

      {/* 사이드바 하단 */}
      <div className="border-bg-4 mt-auto flex flex-col gap-3 border-t px-4 py-4">
        <div className="flex flex-col gap-1">
          {menus.bottom.map((item: AsideMenuItem) => (
            <div key={item.label} onClick={(e) => handleAwaitItem(e, item.href, t('comingSoon'))}>
              <AsideNavItem
                label={t(item.label)}
                href={item.href}
                icon={item.icon}
                active={isPathActive(pathname, item.matchPath || '')}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <ProductLanguageSwitcher />
        </div>
      </div>
    </aside>
  );
};
