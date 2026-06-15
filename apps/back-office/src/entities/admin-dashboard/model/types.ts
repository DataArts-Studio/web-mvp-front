import type { LucideIcon } from 'lucide-react';

export type Alert = {
  title: string;
  description: string;
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

export type FunnelStep = [label: string, count: string, percent: string, churn: string];

export type StorageProject = [name: string, usage: string, percent: number];
