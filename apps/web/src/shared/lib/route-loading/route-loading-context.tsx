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

type RouteLoadingContextType = {
  startRouteLoading: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextType>({
  startRouteLoading: () => {},
});

export const useRouteLoading = () => useContext(RouteLoadingContext);

const LOADING_DELAY_MS = 250;

export const RouteLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRouteLoading = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // 짧은 전환에서는 전체 화면 스피너를 띄우지 않는다.
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
      {isLoading && (
        <div className="bg-primary fixed top-0 right-0 left-0 z-[1000] h-0.5 animate-pulse" />
      )}
    </RouteLoadingContext.Provider>
  );
};
