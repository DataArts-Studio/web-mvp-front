import type { AutomationStatus } from '@testea/db';

export type { AutomationStatus };

/**
 * 후보/플래키 행 1건. frontend 가 "5회 / pass100% / 4일전" 식으로 그대로 표시할 수 있도록
 * 추천 근거 데이터를 함께 담는다.
 */
export interface CandidateRow {
  caseId: string;
  /** UI 표시용 케이스 식별자 (예: TC-123). 없으면 null. */
  caseKey: string | null;
  /** display_id (정수). 없으면 null. */
  displayId: number | null;
  name: string;
  suiteId: string | null;
  testType: string | null;
  tags: string[] | null;
  automationStatus: AutomationStatus;

  // --- 추천 근거 (signals) ---
  /** 빈도: 서로 다른 test_run 회수 (untested/excluded 제외). */
  distinctRuns: number;
  /** 집계 대상이 된 실행 결과 건수 (untested/excluded 제외). pass율 분모. */
  evaluatedResults: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  /** pass율 0~1. evaluatedResults 가 0이면 0. */
  passRate: number;
  /** 마지막 실행 시각 (excluded 제외). 없으면 null. */
  lastExecutedAt: string | null;
  /** 마지막 실행 경과일. lastExecutedAt 이 null 이면 null. */
  daysSinceLastRun: number | null;

  /** 후보 정렬용 종합 점수 (높을수록 우선). */
  score: number;
  /** 사람이 후보를 검토할 때 쓰는 파생 판단 데이터. */
  decision: CandidateDecision;
  /** 각 신호 충족 여부 (frontend 가 배지/사유 표시에 사용). */
  reasons: CandidateReasons;
}

export interface CandidateDecision {
  priority: 'high' | 'medium' | 'low';
  confidence: 'high' | 'medium' | 'low';
  estimatedManualRunsSaved: number;
  recommendationReason: string;
  signalLabels: string[];
  riskLabels: string[];
}

export interface CandidateReasons {
  /** 빈도 충족 (distinctRuns >= MIN_DISTINCT_RUNS). */
  frequent: boolean;
  /** 표본 수 충족 (evaluatedResults >= MIN_EVALUATED_RESULTS). */
  enoughHistory: boolean;
  /** 안정 충족 (passRate + 신뢰도 보정 + blocked 비율). */
  stable: boolean;
  /** blocked 비율이 허용 범위 이내. */
  lowBlocked: boolean;
  /** 최근 충족 (daysSinceLastRun <= RECENCY_DAYS). */
  recent: boolean;
  /** 플래키 판정 (pass·fail 공존 + passRate < ceiling). true면 후보에서 제외됨. */
  flaky: boolean;
}

export interface AutomationCandidatesStats {
  /** 프로젝트의 ACTIVE 케이스 총 수 (automated 포함). */
  totalCases: number;
  /** 실행 이력이 1건이라도 있는(untested/excluded 제외) 케이스 수. */
  totalCasesWithRuns: number;
  /** 빈도 임계(MIN_DISTINCT_RUNS) 이상 실행된 케이스 수. */
  ge3Runs: number;
  /** 이미 automated 로 마킹돼 추천에서 제외된 케이스 수. */
  alreadyAutomated: number;
  /** 플래키로 분류된 케이스 수. */
  flakyCount: number;
  /** 후보로 추천된 케이스 수. */
  candidateCount: number;
}

export interface AutomationCandidatesResult {
  /** 자동화 후보 (점수 내림차순). */
  candidates: CandidateRow[];
  /** 플래키로 게이트된 케이스 (점수 내림차순). 별도 그룹으로 표시. */
  flaky: CandidateRow[];
  /** 콜드스타트 진단용 수치. 후보 0개여도 왜 비었는지 판단 가능. */
  stats: AutomationCandidatesStats;
}

export interface CoverageBySuite {
  suiteId: string | null;
  suiteName: string | null;
  totalCases: number;
  automatedCases: number;
  candidateCases: number;
  manualCases: number;
  /** 0~100 정수. totalCases 가 0이면 0. */
  coveragePercent: number;
}

export interface AutomationCoverageResult {
  totalCases: number;
  automatedCases: number;
  candidateCases: number;
  manualCases: number;
  /** 0~100 정수. */
  coveragePercent: number;
  bySuite: CoverageBySuite[];
}

export interface SetAutomationStatusInput {
  caseId: string;
  status: AutomationStatus;
}

export interface SetAutomationStatusResult {
  caseId: string;
  automationStatus: AutomationStatus;
}
