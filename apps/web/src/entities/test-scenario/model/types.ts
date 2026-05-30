import type { ScenarioStatus, ScenarioType } from './schema';

/** 시나리오 목록/상세의 한 항목. */
export interface ScenarioListItem {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  status: ScenarioStatus;
  relatedRequirementIds: string[];
  /** 출처 요구사항 분석서 id. 수동 작성이면 null. */
  requirementAnalysisId: string | null;
  /** 출처 분석서 제목(있을 때). 목록 필터·표시용. */
  analysisTitle: string | null;
  /** 이 시나리오에서 파생된 ACTIVE 스위트 수. */
  derivedSuiteCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 목록 조회 필터. */
export interface ScenarioListFilter {
  requirementAnalysisId?: string;
  type?: ScenarioType;
  status?: ScenarioStatus;
}
