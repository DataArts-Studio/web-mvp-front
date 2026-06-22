'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { usePathname } from 'next/navigation';

import { LoadingSpinner } from '@testea/ui';

type RouteLoadingContextType = {
  startRouteLoading: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextType>({
  startRouteLoading: () => {},
});

export const useRouteLoading = () => useContext(RouteLoadingContext);

const LOADING_DELAY_MS = 150;

export const RouteLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRouteLoading = useCallback(() => {
    // 짧은 딜레이 후 로딩 표시 (빠른 전환 시 깜빡임 방지)
    timerRef.current = setTimeout(() => {
      setIsLoading(true);
    }, LOADING_DELAY_MS);
  }, []);

  // pathname이 바뀌면 라우팅 완료 → 로딩 해제
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 시스템(라우터 pathname) 변화에 로딩 상태를 동기화. 네비게이션 완료 신호라 effect가 적절
    setIsLoading(false);
  }, [pathname]);

  return (
    <RouteLoadingContext.Provider value={{ startRouteLoading }}>
      {children}
      {isLoading && <LoadingSpinner fullScreen size="md" />}
    </RouteLoadingContext.Provider>
  );
};
