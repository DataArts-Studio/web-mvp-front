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
  /** true 면 출처 분석서가 없는(수동) 시나리오만. */
  manual?: boolean;
  type?: ScenarioType;
  status?: ScenarioStatus;
}

/** 시나리오 관리 마스터의 기능(요구사항) 한 항목. id=null 은 수동 버킷. */
export interface ScenarioFeatureListItem {
  /** 요구사항 분석 id. 수동 버킷이면 null. */
  id: string | null;
  title: string;
  summary: string;
  isManual: boolean;
  scenarioCount: number;
  statusCounts: Record<ScenarioStatus, number>;
  /** 수동 버킷은 null. */
  createdAt: string | null;
}
