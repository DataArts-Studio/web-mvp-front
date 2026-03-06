import type { TestCaseCardType } from '@/entities/test-case';
import { MOCK_PROJECT_ID } from '@/shared';

const SUITE_AUTH_ID = '0193a2e7-0f11-7d21-8c44-0b1c2d3e4f50';
const SUITE_RBAC_ID = '0193a2e7-0f12-7d21-8c44-0b1c2d3e4f51';
const SUITE_PAYMENT_ID = '0193a2e7-0f13-7d21-8c44-0b1c2d3e4f52';
const SUITE_ONBOARD_ID = '0193a2e7-0f14-7d21-8c44-0b1c2d3e4f53';

export const TEST_CASES_RICH_MOCK: TestCaseCardType[] = [
  {
    id: '0193b3c1-aaaa-7777-aaaa-aaaaaaaaaaaa',
    projectId: MOCK_PROJECT_ID,
    testSuiteId: SUITE_AUTH_ID,

    caseKey: 'TC-1001',
    title: '회원가입 - 이메일 형식이 잘못된 경우',
    testType: 'authentication',
    tags: ['ui', 'regression'],

    sortOrder: 1000,

    createdAt: new Date('2024-12-01T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T01:35:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '인증 플로우 로그인 회원가입',
    resultStatus: 'untested',
    status: 'untested',
    displayId: 1001,
    lastExecutedAt: null,
  },
  {
    id: '0193b3c1-bbbb-7777-aaaa-bbbbbbbbbbbb',
    projectId: MOCK_PROJECT_ID,
    testSuiteId: SUITE_AUTH_ID,

    caseKey: 'TC-1002',
    title: '로그인 - 정상 로그인 처리',
    testType: 'authentication',
    tags: ['smoke', 'critical_path'],

    sortOrder: 2000,

    createdAt: new Date('2024-12-02T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T01:30:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '인증 플로우 로그인 회원가입',
    resultStatus: 'pass',
    status: 'pass',
    displayId: 1002,
    lastExecutedAt: new Date('2024-12-20T01:30:00.000Z'),
  },
  {
    id: '0193b3c1-cccc-7777-aaaa-cccccccccccc',
    projectId: MOCK_PROJECT_ID,
    testSuiteId: SUITE_PAYMENT_ID,

    caseKey: 'TC-2001',
    title: '결제 - 잔액 부족 시 알림 팝업 노출',
    testType: 'payment',
    tags: ['ui'],

    sortOrder: 1000,

    createdAt: new Date('2024-12-03T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T00:40:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '결제 플로우 카드 결제 환불',
    resultStatus: 'fail',
    status: 'fail',
    displayId: 2001,
    lastExecutedAt: new Date('2024-12-20T00:40:00.000Z'),
  },
  {
    id: '0193b3c1-dddd-7777-aaaa-dddddddddddd',
    projectId: MOCK_PROJECT_ID,
    testSuiteId: SUITE_RBAC_ID,

    caseKey: 'TC-3001',
    title: '권한 - 관리자만 접근 가능해야 함',
    testType: 'rbac',
    tags: ['security', 'regression'],

    sortOrder: 1000,

    createdAt: new Date('2024-12-04T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T01:10:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '권한과 접근 제어',
    resultStatus: 'blocked',
    status: 'blocked',
    displayId: 3001,
    lastExecutedAt: new Date('2024-12-20T01:10:00.000Z'),
  },
  {
    id: '0193b3c1-eeee-7777-aaaa-eeeeeeeeeeee',
    projectId: MOCK_PROJECT_ID,
    testSuiteId: SUITE_ONBOARD_ID,

    caseKey: 'TC-4001',
    title: '온보딩 - 튜토리얼 완료 후 홈 진입',
    testType: 'ux',
    tags: ['smoke'],

    sortOrder: 1000,

    createdAt: new Date('2024-12-05T03:00:00.000Z'),
    updatedAt: new Date('2024-12-19T23:40:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '온보딩과 튜토리얼',
    resultStatus: 'pass',
    status: 'pass',
    displayId: 4001,
    lastExecutedAt: new Date('2024-12-19T23:40:00.000Z'),
  },
];
