/**
 * 테스트 케이스 서버 액션이 반환하는 안정적 메시지 코드.
 *
 * 서버 액션은 next-intl 요청 컨텍스트에 의존하지 않도록 언어 문자열 대신
 * 아래 UPPER_SNAKE 코드를 반환한다. 클라이언트 소비처에서 `useTranslations('cases')`
 * 로 `messages.<CODE>` 를 조회하여 사용자에게 노출한다.
 */
export const CASE_MESSAGE_CODES = {
  // 성공
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_MOVED_TO_TRASH: 'CASE_MOVED_TO_TRASH',
  // 실패 (도메인 공통 의미)
  ACCESS_DENIED: 'ACCESS_DENIED',
  LOAD_FAILED: 'LOAD_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  ORIGINAL_NOT_FOUND: 'ORIGINAL_NOT_FOUND',
  CREATE_FAILED: 'CREATE_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
  DUPLICATE_FAILED: 'DUPLICATE_FAILED',
  TAGS_LOAD_FAILED: 'TAGS_LOAD_FAILED',
} as const;

export type CaseMessageCode = (typeof CASE_MESSAGE_CODES)[keyof typeof CASE_MESSAGE_CODES];
