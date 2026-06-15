import { BarChart3, FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react';

import type {
  AbuseSignal,
  Alert,
  CostProject,
  FunnelStep,
  Metric,
  NavItem,
  ProjectActivity,
  RateLimitViolation,
  ResourceUsage,
  SignupMonitoring,
  StorageProject,
  StorageSummary,
  SystemStatus,
  TrendPoint,
} from './types';

export const alerts: Alert[] = [
  {
    title: 'AI 비용 예산 초과 위험 (93% 사용)',
    description: '이번 달 AI 비용: $1,858 / 예산: $2,000 · 7일 남음',
    severity: 'critical',
    tone: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    title: 'Supabase 스토리지 한도 임박 (87%)',
    description: '현재 사용량: 8.7 GB / Free Tier 한도: 10 GB · 3개 프로젝트 정리 필요',
    severity: 'warning',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    title: '비정상 사용 패턴 감지 (3건)',
    description: 'AI 호출 과다 사용자 2명 · 동일 IP 다중 계정 1건 · 상세 확인',
    severity: 'info',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

export const metrics: Metric[] = [
  { label: '활성 사용자', value: '1,247', unit: 'DAU', helper: 'WAU: 3,124 · MAU: 9,856' },
  { label: '신규 프로젝트 (주간)', value: '12', unit: '+33%', helper: '이전 주: 9개' },
  { label: '테스트 실행률 (7일)', value: '68.4%', unit: '', helper: '실행: 3,119 / 전체: 4,559' },
  { label: '프로젝트 유지율 (30일)', value: '92.3%', unit: '', helper: '활성: 143 / 비활성: 12' },
];

export const navItems: NavItem[] = [
  {
    label: '대시보드',
    icon: LayoutDashboard,
    href: '/',
    current: true,
  },
  {
    label: '프로젝트 관리',
    icon: FolderKanban,
  },
  {
    label: '사용자 관리',
    icon: Users,
  },
  { label: '통계', icon: BarChart3 },
  {
    label: '설정',
    icon: Settings,
  },
];

export const projectTrend: TrendPoint[] = [
  { date: '3/31', projects: 1 },
  { date: '4/2', projects: 2 },
  { date: '4/4', projects: 1 },
  { date: '4/6', projects: 3 },
  { date: '4/8', projects: 2 },
  { date: '4/10', projects: 3 },
  { date: '4/12', projects: 2 },
  { date: '4/14', projects: 4 },
  { date: '4/16', projects: 2 },
  { date: '4/18', projects: 4 },
  { date: '4/20', projects: 1 },
  { date: '4/22', projects: 3 },
  { date: '4/24', projects: 2 },
  { date: '4/26', projects: 4 },
];

export const activeUserTrend: TrendPoint[] = [
  { date: '3/30', dau: 1247, wau: 3124, mau: 9856 },
  { date: '4/1', dau: 2022, wau: 3746, mau: 10322 },
  { date: '4/3', dau: 1633, wau: 4368, mau: 10944 },
  { date: '4/5', dau: 3344, wau: 5302, mau: 11566 },
  { date: '4/7', dau: 2955, wau: 5846, mau: 12033 },
  { date: '4/9', dau: 4355, wau: 6546, mau: 12655 },
  { date: '4/11', dau: 5288, wau: 7479, mau: 13277 },
  { date: '4/13', dau: 4900, wau: 8101, mau: 13744 },
  { date: '4/15', dau: 6377, wau: 9034, mau: 14521 },
  { date: '4/17', dau: 7155, wau: 9657, mau: 15144 },
  { date: '4/19', dau: 6688, wau: 10123, mau: 15610 },
  { date: '4/21', dau: 8244, wau: 10746, mau: 16077 },
  { date: '4/23', dau: 9177, wau: 11368, mau: 16699 },
];

export const productivityTrend: TrendPoint[] = [
  { date: '3/30', tc: 667, suite: 400, run: 133, milestone: 800 },
  { date: '4/1', tc: 1600, suite: 800, run: 400, milestone: 1600 },
  { date: '4/3', tc: 2267, suite: 1467, run: 667, milestone: 2267 },
  { date: '4/5', tc: 3467, suite: 1867, run: 1200, milestone: 3467 },
  { date: '4/7', tc: 4133, suite: 2800, run: 1600, milestone: 4133 },
  { date: '4/9', tc: 5600, suite: 3467, run: 2133, milestone: 5600 },
  { date: '4/11', tc: 6533, suite: 4133, run: 2800, milestone: 6533 },
  { date: '4/13', tc: 7467, suite: 5200, run: 3467, milestone: 7467 },
  { date: '4/15', tc: 9067, suite: 6133, run: 4133, milestone: 9067 },
  { date: '4/17', tc: 9867, suite: 6800, run: 4933, milestone: 9867 },
  { date: '4/19', tc: 11200, suite: 7733, run: 5600, milestone: 11200 },
  { date: '4/21', tc: 12133, suite: 8800, run: 6400, milestone: 12133 },
];

export const activeProjects: ProjectActivity[] = [
  ['E-commerce Platform', '1,247', '523', '$42.50'],
  ['Mobile App Backend', '982', '401', '$31.80'],
  ['Payment Gateway', '856', '378', '$29.50'],
  ['User Management', '723', '312', '$24.40'],
  ['Analytics Dashboard', '654', '289', '$21.20'],
  ['Notification Service', '587', '245', '$18.90'],
  ['Search Engine', '521', '223', '$16.50'],
  ['Chat System', '478', '201', '$15.20'],
  ['File Storage', '412', '178', '$13.10'],
  ['API Gateway', '389', '156', '$12.40'],
];

export const resourceUsages: ResourceUsage[] = [
  { label: 'Supabase DB', value: '8.7 GB / 10 GB', percent: 87, color: 'bg-amber-500' },
  { label: 'API 호출', value: '487K / 500K', percent: 97, color: 'bg-red-600' },
  { label: '데이터 전송', value: '34 GB / 50 GB', percent: 68, color: 'bg-[#155DFC]' },
];

export const systemStatuses: SystemStatus[] = [
  ['API 응답 시간 (평균)', '142ms'],
  ['에러율 (24시간)', '0.03%'],
  ['Uptime (30일)', '99.97%'],
  ['마지막 백업', '23분 전'],
  ['DB 커넥션 풀', '34 / 100'],
];

export const costProjects: CostProject[] = [
  ['AI 챗봇 테스트', '$18.50', '$3.20', '+478%', '$127.40'],
  ['E-commerce QA', '$12.30', '$5.80', '+112%', '$245.60'],
  ['모바일 앱 테스트', '$8.90', '$4.50', '+98%', '$156.70'],
];

export const abuseSignals: AbuseSignal[] = [
  {
    title: 'AI 호출 비정상 사용',
    items: [
      {
        title: 'user-7f3k2',
        description: '프로젝트: AI 챗봇 테스트',
        value: '47,234회',
        helper: '오늘',
        tone: 'border-red-200 bg-red-50 text-red-600',
      },
      {
        title: 'admin-ops-01',
        description: '프로젝트: E-commerce QA',
        value: '28,901회',
        helper: '오늘',
        tone: 'border-amber-200 bg-amber-50 text-orange-600',
      },
    ],
    footnote: '정상 평균: ~1,200회/일 · 기준: 10배 초과 시 알림',
  },
  {
    title: '스토리지 비정상 증가',
    items: [
      {
        title: '대용량 파일 업로드 프로젝트',
        description: '현재: 3.8 GB',
        value: '+2.3 GB',
        tone: 'border-red-200 bg-red-50 text-red-600',
      },
      {
        title: '레거시 시스템 검증',
        description: '현재: 1.2 GB',
        value: '+890 MB',
        tone: 'border-amber-200 bg-amber-50 text-orange-600',
      },
    ],
    footnote: '정상 평균: ~50 MB/일 · 기준: 500 MB 초과 시 알림',
  },
];

export const signupMonitoring: SignupMonitoring = {
  newSignups: {
    count: '24',
    average: '평균: 18명',
    status: { label: '정상', tone: 'bg-green-100 text-green-700' },
  },
  duplicateIp: {
    status: { label: '1건 감지', tone: 'bg-red-100 text-red-700' },
    ip: '203.0.113.45',
    description: '5개 계정 · 최근 2시간 내 생성',
    action: '차단 필요',
  },
};

export const rateLimitViolation: RateLimitViolation = {
  source: '테스트 자동화 스크립트',
  period: '최근 1시간',
  count: '127회',
  note: '제한 초과',
  footnote: 'API 호출 한도: 100회/분 · 현재 임시 차단: 0건',
};

export const funnel: FunnelStep[] = [
  { label: '프로젝트 생성', count: '1,520', rate: '100.0%', percent: 100, churn: '' },
  { label: '첫 TC 작성', count: '1,247', rate: '82.0%', percent: 82, churn: '18.0% 이탈' },
  { label: '첫 Run 실행', count: '1,089', rate: '71.6%', percent: 71.6, churn: '12.7% 이탈' },
  { label: '결과 확인', count: '978', rate: '64.3%', percent: 64.3, churn: '10.2% 이탈' },
];

export const storageSummary: StorageSummary = {
  totalSize: '14.76 GB',
  totalRows: '4,559,234',
};

export const storageProjects: StorageProject[] = [
  { name: 'E-commerce Platform', usage: '3.62 GB', percent: 92 },
  { name: 'Mobile App Backend', usage: '2.65 GB', percent: 72 },
  { name: 'Payment Gateway', usage: '2.07 GB', percent: 58 },
  { name: 'User Management', usage: '1.48 GB', percent: 44 },
  { name: 'Analytics Dashboard', usage: '1.33 GB', percent: 39 },
];
