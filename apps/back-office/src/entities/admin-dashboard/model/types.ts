import type { LucideIcon } from 'lucide-react';

/** 알림 심각도. 색상에만 의존하지 않도록 텍스트 라벨의 근거로 쓴다 (WCAG 1.4.1). */
export type AlertSeverity = 'critical' | 'warning' | 'info';

export type Alert = {
  title: string;
  description: string;
  severity: AlertSeverity;
  tone: string;
};

export type Metric = {
  label: string;
  value: string;
  unit: string;
  helper: string;
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  /** 구현된 메뉴의 경로. 미구현 메뉴는 비워 둔다(비활성 처리). */
  href?: string;
  /** 현재 활성 메뉴 여부. 라벨 문자열 비교 대신 데이터로 판별한다. */
  current?: boolean;
};

export type TrendPoint = {
  date: string;
  projects?: number;
  dau?: number;
  wau?: number;
  mau?: number;
  tc?: number;
  suite?: number;
  run?: number;
  milestone?: number;
};

export type ProjectActivity = [name: string, runs: string, testCases: string, aiCost: string];

export type ResourceUsage = {
  label: string;
  value: string;
  percent: number;
  color: string;
};

export type SystemStatus = [label: string, value: string];

export type CostProject = [
  name: string,
  todayCost: string,
  yesterdayCost: string,
  growthRate: string,
  cumulativeCost: string,
];

export type AbuseSignalItem = {
  title: string;
  description: string;
  value: string;
  helper?: string;
  tone: string;
};

export type AbuseSignal = {
  title: string;
  items: AbuseSignalItem[];
  footnote: string;
};

/** 상태 배지(텍스트 라벨 + 톤). 색상 단독 의존을 피하기 위해 라벨을 항상 동반한다. */
export type StatusBadge = { label: string; tone: string };

/** 가입 및 IP 모니터링 카드 데이터. */
export type SignupMonitoring = {
  newSignups: { count: string; average: string; status: StatusBadge };
  duplicateIp: { status: StatusBadge; ip: string; description: string; action: string };
};

/** Rate Limit 위반 카드 데이터. */
export type RateLimitViolation = {
  source: string;
  period: string;
  count: string;
  note: string;
  footnote: string;
};

export type FunnelStep = {
  /** 단계 라벨 (예: '프로젝트 생성') */
  label: string;
  /** 도달 수 표시 (예: '1,520') */
  count: string;
  /** 전환율 표시 문자열 (예: '100.0%') */
  rate: string;
  /** 전환율 수치(0~100). aria-valuenow·막대 width 의 단일 출처. */
  percent: number;
  /** 이탈 안내 (예: '18.0% 이탈'). 없으면 빈 문자열. */
  churn: string;
};

export type StorageProject = {
  name: string;
  /** 사용량 표시 (예: '3.62 GB') */
  usage: string;
  /** 사용률 수치(0~100). aria-valuenow·막대 width 의 단일 출처. */
  percent: number;
};

/** 스토리지 사용량 요약(총 용량/총 Row). */
export type StorageSummary = {
  totalSize: string;
  totalRows: string;
};
