export type ProjectInfo = {
  id: string;
  name: string;
  identifier: string;
  description: string;
  ownerName: string;
  createdAt: Date;
};

export type TestCaseStats = {
  total: number;
  // 추후 테스트 실행 결과 테이블이 연결되면 활성화
  // passed: number;
  // failed: number;
  // blocked: number;
  // untested: number;
};

export type TestSuiteSummary = {
  id: string;
  name: string;
  description: string;
  caseCount: number;
};

export type RecentActivity = {
  id: string;
  type: 'test_case_created' | 'test_suite_created' | 'test_run_completed';
  title: string;
  createdAt: Date;
};

export type DashboardStats = {
  project: ProjectInfo;
  testCases: TestCaseStats;
  testSuites: TestSuiteSummary[];
  recentActivities: RecentActivity[];
};
