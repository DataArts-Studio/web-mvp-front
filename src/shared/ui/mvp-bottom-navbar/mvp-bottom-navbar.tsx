/* eslint-disable no-restricted-imports */
'use client';
import React from 'react';



import Link from 'next/link';
import { usePathname } from 'next/navigation';



import { EyeOff, FolderTree, Home, LayoutDashboard, ListChecks, Milestone, Play } from 'lucide-react';










































const pages = [
  { id: '/', label: '홈', icon: Home, href: '/' },
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard, href: '/projects/sample-project' },
  {
    id: 'milestones',
    label: '마일스톤',
    icon: Milestone,
    href: '/projects/sample-project/milestones',
  },
  {
    id: 'test-suites',
    label: '테스트 스위트',
    icon: FolderTree,
    href: '/projects/sample-project/suites',
  },
  {
    id: 'test-cases',
    label: '테스트 케이스',
    icon: ListChecks,
    href: '/projects/sample-project/cases',
  },
  { id: 'test-runs', label: '테스트 실행', icon: Play, href: '/projects/sample-project/runs' },
];

/**
 * 이 컴포넌트는 MVP 및 개발 단계에서 페이지 간 빠른 이동(Quick Menu)을 위해 사용됩니다.
 * * - **목적:** URL 직접 입력의 불편함을 해소하고 개발 속도를 높입니다.
 * - **기술적 결정**
 * 1. `next/link`를 사용하여 클라이언트 측 라우팅(CSR) 성능을 확보합니다.
 * 2. ESLint 규칙 (`no-restricted-imports`)은 **재사용성보다 개발 편의성**을 우선하여 파일 단위로 무시됩니다.
 * 3. `position: fixed` 및 높은 `z-index`를 사용하여 모든 콘텐츠 위에 고정됩니다.
 * - **주의:** 이 컴포넌트는 최종 프로덕션 빌드에서 **제거되거나** 환경 변수(`NODE_ENV === 'development'`)로 감싸져야 합니다.
 */
export const MvpBottomNavbar = () => {
  // ------------------------------------------------------------------
  // 개발 환경에서만 렌더링
  // ------------------------------------------------------------------
  const isDev = process.env.NODE_ENV === 'development';

  // ------------------------------------------------------------------
  // 모든 훅은 조건문 이전에 호출되어야 함 (Rules of Hooks)
  // ------------------------------------------------------------------
  const currentPath = usePathname();

  // ------------------------------------------------------------------
  // 세션 저장소(SessionStorage)에서 상태를 읽어와 초기화
  // 기본값: 숨김 (false)
  // ------------------------------------------------------------------
  const [isVisible, setIsVisible] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('mvp_navbar_visible');
      return stored === null ? false : JSON.parse(stored);
    }
    return false;
  });

  const toggleVisibility = React.useCallback(() => {
    const newState = !isVisible;
    setIsVisible(newState);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mvp_navbar_visible', JSON.stringify(newState));
    }
  }, [isVisible]);

  // ------------------------------------------------------------------
  // 키보드 단축키: Ctrl+Q 로 토글
  // ------------------------------------------------------------------
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === 'q') {
        e.preventDefault();
        toggleVisibility();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisibility]);

  // 개발 환경이 아니거나 숨김 상태면 렌더링하지 않음
  if (!isDev || !isVisible) return null;

  // ------------------------------------------------------------------
  // 현재 경로와 활성화
  // URL을 기반으로 메뉴 활성화 상태를 결정
  // ------------------------------------------------------------------
  const isPageActive = (href: string) => {
    // 홈 경로(/)는 정확히 일치해야 합니다.
    if (href === '/') {
      return currentPath === '/';
    }
    // 대시보드 경로 (/projects/[slug])는 정확히 일치해야 합니다.
    const dashboardPattern = /^\/projects\/[^/]+$/;
    if (dashboardPattern.test(href)) {
      return currentPath === href;
    }
    // 다른 경로는 해당 href로 시작하면 활성화됩니다.
    return currentPath.startsWith(href);
  };

  return (
    <div className="fixed bottom-[24px] left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex flex-row items-center gap-[8px] rounded-[16px] border border-[rgba(11,181,127,0.2)] bg-[rgba(255,255,255,0.05)] px-[12px] py-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px] backdrop-filter">
        {pages.map((page) => {
          const Icon = page.icon;
          const isActive = isPageActive(page.href);

          return (
            <Link
              key={page.id}
              href={page.href}
              className={`flex cursor-pointer flex-col items-center gap-[4px] rounded-[8px] px-[16px] py-[8px] transition-all ${
                isActive
                  ? 'bg-[#0bb57f] text-white'
                  : 'text-[rgba(198,204,215,0.7)] hover:bg-[rgba(11,181,127,0.1)] hover:text-[#0bb57f]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-['Pretendard:Medium',sans-serif] text-[8px] tracking-[-0.24px]">
                {page.label}
              </span>
            </Link>
          );
        })}

        {/* 숨기기 버튼 (Ctrl+Shift+K 또는 클릭으로 숨김) */}
        <div
          onClick={toggleVisibility}
          className="flex cursor-pointer flex-col items-center gap-[4px] rounded-[8px] px-[16px] py-[8px] text-[rgba(198,204,215,0.7)] transition-all hover:bg-[rgba(11,181,127,0.1)] hover:text-[#0bb57f]"
          title="퀵 메뉴 숨기기 (Ctrl+Q)"
        >
          <EyeOff className="h-4 w-4" />
          <span className="font-['Pretendard:Medium',sans-serif] text-[12px] tracking-[-0.24px]">
            숨기기
          </span>
        </div>
      </div>
    </div>
  );
};
