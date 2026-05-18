/**
 * 접근 시나리오 테스트 데이터. (도메인: access)
 *
 * 사전조건: 식별번호 8~16자로 발급된 `sample-project` 가 시드되어 있어야 한다.
 */
export const ACCESS_TEST_DATA = {
  slug: 'sample-project',
  /** 시드된 올바른 식별번호 (9자, 8~16 범위) */
  validCode: '123123123',
  /** 길이는 유효, 값만 틀림 → 서버까지 도달 (rate-limit 카운터 증가) */
  wrongCode: '000000000',
  /** 8자 미만 → 클라이언트 zod 에서 차단 (서버 미도달) */
  shortCode: '123',
} as const;

export const ASIDE_NAV_LINK = {
  TESTCASE: 'cases',
  TESTSUITE: 'suites',
  MILESTONE: 'milestones',
  TEST_RUN: 'runs',
  CHECKLIST: 'checklists',
  TRASH: 'trash',
  SETTINGS: 'settings',
} as const;

export const caseFactory = {
  uniqueTitle: () => `E2E Test Case ${Date.now()}`,
};