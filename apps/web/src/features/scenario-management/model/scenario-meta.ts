import type { ScenarioStatus, ScenarioType } from '@/entities/test-scenario';

/** 시나리오 타입 배지 (requirement-analysis-preview 색 규약과 동일). */
export const SCENARIO_TYPE_META: Record<ScenarioType, { label: string; cls: string }> = {
  positive: { label: 'Positive', cls: 'bg-green-500/10 text-green-400' },
  negative: { label: 'Negative', cls: 'bg-red-500/10 text-red-400' },
  edge_case: { label: 'Edge Case', cls: 'bg-yellow-500/10 text-yellow-400' },
};

export const SCENARIO_TYPE_OPTIONS = (Object.keys(SCENARIO_TYPE_META) as ScenarioType[]).map(
  (value) => ({ value, label: SCENARIO_TYPE_META[value].label })
);

/** 시나리오 작성 상태 라벨. */
export const SCENARIO_STATUS_META: Record<ScenarioStatus, { label: string; cls: string }> = {
  DRAFT: { label: '초안', cls: 'bg-bg-3 text-text-3' },
  REVIEW: { label: '검토', cls: 'bg-blue-500/10 text-blue-400' },
  CONFIRMED: { label: '확정', cls: 'bg-primary/10 text-primary' },
};

export const SCENARIO_STATUS_OPTIONS = (Object.keys(SCENARIO_STATUS_META) as ScenarioStatus[]).map(
  (value) => ({ value, label: SCENARIO_STATUS_META[value].label })
);
