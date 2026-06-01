/**
 * 테스트 스위트 서버 액션이 반환하는 안정적 메시지 코드.
 *
 * 서버 액션은 next-intl 요청 컨텍스트에 의존하지 않도록 언어 문자열 대신
 * 아래 UPPER_SNAKE 코드를 반환한다. 클라이언트 소비처에서 `useTranslations('suites')`
 * 로 `messages.<CODE>` 를 조회하여 사용자에게 노출한다.
 */
export const SUITE_MESSAGE_CODES = {
  // 성공
  SUITE_CREATED: 'SUITE_CREATED',
  SUITE_UPDATED: 'SUITE_UPDATED',
  SUITE_ARCHIVED: 'SUITE_ARCHIVED',
  // 실패 (도메인 공통 의미)
  ACCESS_DENIED: 'ACCESS_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  LOAD_FAILED: 'LOAD_FAILED',
  CREATE_FAILED: 'CREATE_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  ARCHIVE_FAILED: 'ARCHIVE_FAILED',
} as const;

export type SuiteMessageCode = (typeof SUITE_MESSAGE_CODES)[keyof typeof SUITE_MESSAGE_CODES];
