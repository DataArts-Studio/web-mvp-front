/** 요구사항 생성 페이지 목록의 한 항목. */
export interface RequirementAnalysisListItem {
  id: string;
  title: string;
  summary: string;
  language: 'ko' | 'en';
  scenarioCount: number;
  functionalCount: number;
  /** 이 분석서에서 스위트로 저장된 시나리오 수. */
  savedSuiteCount: number;
  createdAt: string;
}
