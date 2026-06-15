import type { AutomationStatus } from '@/features/automation-candidates';
import type { StatusBadgeConfig } from '@testea/ui';

/**
 * FDD-TR13 콜드스타트 판정 임계.
 *
 * 후보·플래키가 모두 비어 있고 실행 이력이 있는 케이스가 이 값 미만이면
 * 빈 목록 대신 회귀 반복 실행(TR12) 유도 안내를 노출한다.
 */
export const COLD_START_RUNS_THRESHOLD = 3;

/** automation_status 배지 설정 (UI 표시용). */
export const AUTOMATION_STATUS_CONFIG: Record<AutomationStatus, StatusBadgeConfig> = {
  manual: { label: '수동', style: 'bg-slate-500/20 text-slate-300' },
  candidate: { label: '자동화 대상', style: 'bg-blue-500/20 text-blue-300' },
  automated: { label: '자동화 완료', style: 'bg-green-500/20 text-green-300' },
};

/** pass율(0~1)을 % 정수 문자열로 변환. */
export const formatPassRate = (passRate: number): string => `${Math.round(passRate * 100)}%`;
