'use client';

import React, { useSyncExternalStore } from 'react';

export type CaseStatus = 'idle' | 'running' | 'passed';

export const CASE_IDS = ['TC-001', 'TC-002', 'TC-003', 'TC-004'] as const;

/** 통과한 케이스 수(progress)로 각 케이스의 상태를 정한다. 다음 차례 케이스만 진행 중이다. */
export const statusOf = (index: number, progress: number): CaseStatus => {
  if (index < progress) return 'passed';
  if (index === progress) return 'running';
  return 'idle';
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

/** 시스템 "동작 줄이기" 설정. 서버 렌더에서는 false 로 본다. */
export const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );

/** 요소가 화면에 보이는 동안만 true. 반복 애니메이션을 화면 밖에서 멈추는 데 쓴다. */
export const useInView = <T extends Element>() => {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
};

/** active 인 동안 intervalMs 마다 1씩 늘어나는 박자. 반복 애니메이션의 현재 위치를 이 값으로 계산한다. */
export const useTicker = (active: boolean, intervalMs: number) => {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((prev) => prev + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return tick;
};
