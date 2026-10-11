'use client';

import { useSyncExternalStore } from 'react';

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
