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

    preCondition: '회원가입 페이지 진입',
    testSteps: '이메일에 잘못된 형식 입력 후 제출',
    expectedResult: '이메일 형식 오류 메시지 노출',
    sortOrder: 1000,

    createdAt: new Date('2024-12-01T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T01:35:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '인증 플로우 로그인 회원가입',
    resultStatus: 'untested',
    status: 'untested',
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

    preCondition: '유효한 계정 존재',
    testSteps: '아이디 비밀번호 입력 후 로그인',
    expectedResult: '대시보드로 이동',
    sortOrder: 2000,

    createdAt: new Date('2024-12-02T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T01:30:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '인증 플로우 로그인 회원가입',
    resultStatus: 'pass',
    status: 'passed',
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

    preCondition: '잔액이 부족한 계정',
    testSteps: '결제 시도',
    expectedResult: '잔액 부족 팝업 노출',
    sortOrder: 1000,

    createdAt: new Date('2024-12-03T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T00:40:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '결제 플로우 카드 결제 환불',
    resultStatus: 'fail',
    status: 'failed',
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

    preCondition: '일반 사용자 로그인 상태',
    testSteps: '어드민 경로로 직접 접근',
    expectedResult: '접근 거부 또는 권한 안내 화면 노출',
    sortOrder: 1000,

    createdAt: new Date('2024-12-04T03:00:00.000Z'),
    updatedAt: new Date('2024-12-20T01:10:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '권한과 접근 제어',
    resultStatus: 'blocked',
    status: 'blocked',
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

    preCondition: '첫 진입 사용자',
    testSteps: '튜토리얼 진행 후 완료 버튼 클릭',
    expectedResult: '홈 화면으로 이동 및 완료 상태 저장',
    sortOrder: 1000,

    createdAt: new Date('2024-12-05T03:00:00.000Z'),
    updatedAt: new Date('2024-12-19T23:40:00.000Z'),
    archivedAt: null,
    lifecycleStatus: 'ACTIVE',

    suiteTitle: '온보딩과 튜토리얼',
    resultStatus: 'pass',
    status: 'passed',
    lastExecutedAt: new Date('2024-12-19T23:40:00.000Z'),
  },
];
