/**
 * GA4 Event Constants
 * @see Notion: [Analytics] GA Tracking Plan
 *
 * 네이밍 컨벤션: snake_case (GA4 표준)
 * 카테고리: Landing, Access, Dashboard, TestCase
 */

// ─── Landing + Project Create ────────────────────────────────────
export const LANDING_EVENTS = {
  /** CTA "무료로 시작하기" 클릭 */
  PROJECT_CREATE_START: 'project_create_start',
  /** "내 프로젝트 찾기" 클릭 */
  PROJECT_SEARCH_OPEN: 'project_search_open',
  /** 네비게이션 메뉴 클릭 */
  NAV_CLICK: 'nav_click',
} as const;

export const PROJECT_CREATE_EVENTS = {
  /** 모달 열림 */
  MODAL_OPEN: 'modal_open',
  /** 각 단계 완료 */
  STEP: 'project_create_step',
  /** 프로젝트 생성 완료 */
  COMPLETE: 'project_create_complete',
  /** 중도 이탈 */
  ABANDON: 'project_create_abandon',
  /** 모달 닫힘 */
  MODAL_CLOSE: 'modal_close',
  /** 링크 복사 */
  LINK_COPY: 'project_link_copy',
} as const;

export const PROJECT_SEARCH_EVENTS = {
  /** 검색 실행 */
  SUBMIT: 'project_search_submit',
  /** 검색 결과 클릭 */
  RESULT_CLICK: 'project_search_result_click',
} as const;

// ─── Access (인증) ───────────────────────────────────────────────
export const ACCESS_EVENTS = {
  /** 접근 페이지 진입 (상세) */
  PAGE_VIEW: 'access_page_view',
  /** 인증 시도 */
  ATTEMPT: 'access_attempt',
  /** 인증 성공 */
  SUCCESS: 'access_success',
  /** 인증 실패 */
  FAIL: 'access_fail',
  /** 토큰 만료 */
  TOKEN_EXPIRED: 'access_token_expired',
  /** 비밀번호 표시/숨김 토글 */
  PASSWORD_TOGGLE: 'password_visibility_toggle',
} as const;

// ─── Dashboard ───────────────────────────────────────────────────
export const DASHBOARD_EVENTS = {
  /** 대시보드 데이터 로드 완료 */
  VIEW: 'dashboard_view',
  /** TC 생성 버튼 클릭 */
  TESTCASE_CREATE_START: 'testcase_create_start',
  /** 스위트 생성 버튼 클릭 */
  TESTSUITE_CREATE_START: 'testsuite_create_start',
  /** 링크 복사 */
  LINK_COPY: 'project_link_copy',
  /** 차트 클릭 */
  CHART_INTERACTION: 'chart_interaction',
  /** 상태 카드 클릭 */
  STATUS_FILTER_CLICK: 'status_filter_click',
  /** 하단 네비게이션 */
  BOTTOM_NAV_CLICK: 'bottom_nav_click',
  /** 빈 상태 CTA */
  EMPTY_STATE_CTA: 'empty_state_cta_click',
} as const;

// ─── Test Case ───────────────────────────────────────────────────
export const TESTCASE_EVENTS = {
  /** 목록 데이터 로드 완료 */
  LIST_VIEW: 'testcase_list_view',
  /** 목록 아이템 클릭 */
  ITEM_CLICK: 'testcase_item_click',
  /** 생성 버튼 클릭 */
  CREATE_START: 'testcase_create_start',
  /** 생성 완료 */
  CREATE_COMPLETE: 'testcase_create_complete',
  /** 수정 완료 */
  UPDATE: 'testcase_update',
  /** 삭제 완료 */
  DELETE: 'testcase_delete',
  /** 상태 변경 */
  STATUS_CHANGE: 'testcase_status_change',
  /** 상세 데이터 로드 */
  DETAIL_VIEW: 'testcase_detail_view',
  /** 필터 변경 */
  FILTER_CHANGE: 'testcase_filter_change',
  /** 검색 */
  SEARCH: 'testcase_search',
  /** 정렬 변경 */
  SORT_CHANGE: 'testcase_sort_change',
  /** 스텝 추가 */
  STEP_ADD: 'testcase_step_add',
  /** 스텝 삭제 */
  STEP_REMOVE: 'testcase_step_remove',
} as const;

// ─── 전체 이벤트 합치기 (필요 시) ─────────────────────────────────
export const GA_EVENTS = {
  LANDING: LANDING_EVENTS,
  PROJECT_CREATE: PROJECT_CREATE_EVENTS,
  PROJECT_SEARCH: PROJECT_SEARCH_EVENTS,
  ACCESS: ACCESS_EVENTS,
  DASHBOARD: DASHBOARD_EVENTS,
  TESTCASE: TESTCASE_EVENTS,
} as const;
