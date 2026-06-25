/**
 * 챌린지 레지스트리 (MVP).
 *
 * - 아직 DB 없이 정적 정의로 시작한다. 폐루프(제출→러너→채점)가 증명되면
 *   exercises 스키마로 옮긴다(FDD-QG05/QG09).
 * - sandboxSlug 가 가리키는 `/sandbox/[slug]` 가 실제 테스트 대상 페이지다.
 */

export type ChallengeTrack = 'automation' | 'manual' | 'api';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
/** 주제 카테고리. 트랙(테스트 방식)과 별개인 도메인 축. */
export type ChallengeCategory =
  | 'auth'
  | 'forms'
  | 'data'
  | 'interaction'
  | 'async'
  | 'fundamentals';

export interface ChallengeSelector {
  name: string;
  testid: string;
  desc: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  /** 인증(토큰) 필요 여부. */
  auth?: boolean;
  desc: string;
}

export interface Challenge {
  slug: string;
  title: string;
  track: ChallengeTrack;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  tools: string[];
  summary: string;
  /** 요구사항: 이 항목들을 검증하는 테스트를 작성한다. */
  requirement: string[];
  /** UI 트랙: 테스트 대상 샌드박스 경로 슬러그 (`/sandbox/[sandboxSlug]`). */
  sandboxSlug?: string;
  /** UI 트랙: 학습자가 참고할 안정적 셀렉터. */
  selectors?: ChallengeSelector[];
  /** API 트랙: 엔드포인트 베이스 경로 (예: `/api/practice`). */
  apiBase?: string;
  /** API 트랙: 연습 대상 엔드포인트 목록. */
  endpoints?: ApiEndpoint[];
  /** API 트랙: 데모 계정·토큰 등 안내. */
  apiNote?: string;
  /** Manual(버그 찾기): 리포트 제출 후 공개할 정답(의도적으로 심은 결함) 목록. */
  knownDefects?: { title: string; detail: string }[];
  /** Manual(테스트 케이스 작성): 제출 후 공개할 모범 답안(핵심 케이스) 목록. */
  modelTestCases?: { title: string; detail: string }[];
  /** Automation 코드 채점: 코드 에디터 초기 Playwright 스펙 템플릿. */
  starterSpec?: string;
}

export const TRACK_LABEL: Record<ChallengeTrack, string> = {
  automation: 'Automation',
  manual: 'Manual',
  api: 'API',
};

export const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  easy: '입문',
  medium: '중급',
  hard: '고급',
};

export const CATEGORY_LABEL: Record<ChallengeCategory, string> = {
  auth: '인증',
  forms: '폼',
  data: '데이터',
  interaction: '상호작용',
  async: '비동기',
  fundamentals: '테스팅 기초',
};

/** 목록에 카테고리를 노출할 순서. */
export const CATEGORY_ORDER: ChallengeCategory[] = [
  'auth',
  'forms',
  'data',
  'interaction',
  'async',
  'fundamentals',
];

export const CHALLENGES: Challenge[] = [
  {
    slug: 'login-basic',
    title: '로그인 폼 자동화',
    track: 'automation',
    category: 'auth',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '유효·무효 자격증명에 따른 로그인 동작을 검증하는 자동화 테스트를 작성하세요.',
    requirement: [
      '유효한 자격증명(tester / qaground123)으로 로그인하면 환영 메시지가 보인다.',
      '잘못된 자격증명으로 로그인하면 에러 메시지가 보인다.',
      '아이디나 비밀번호를 비우고 제출하면 필수 입력 에러가 보인다.',
    ],
    sandboxSlug: 'login-basic',
    selectors: [
      { name: '아이디 입력', testid: 'username', desc: '아이디 입력 필드' },
      { name: '비밀번호 입력', testid: 'password', desc: '비밀번호 입력 필드' },
      { name: '로그인 버튼', testid: 'login-submit', desc: '제출 버튼' },
      { name: '성공 메시지', testid: 'login-success', desc: '로그인 성공 시 노출' },
      { name: '에러 메시지', testid: 'login-error', desc: '실패·검증 에러 시 노출' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('유효한 자격증명으로 로그인하면 환영 메시지가 보인다', async ({ page }) => {
  await page.goto('/');
  // TODO: username·password 를 채우고 로그인 버튼을 클릭한 뒤,
  //       login-success 가 보이는지 expect 로 검증하세요.
});
`,
  },
  {
    slug: 'signup-validation',
    title: '회원가입 폼 검증',
    track: 'automation',
    category: 'forms',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '이메일 형식, 비밀번호 규칙, 비밀번호 확인 일치를 검증하는 테스트를 작성하세요.',
    requirement: [
      '이메일 형식이 올바르지 않으면 이메일 에러가 보인다.',
      '비밀번호가 8자 미만이면 비밀번호 에러가 보인다.',
      '비밀번호 확인이 일치하지 않으면 확인 에러가 보인다.',
      '모든 필드가 유효하면 가입 완료 메시지가 보인다.',
    ],
    sandboxSlug: 'signup-validation',
    selectors: [
      { name: '이메일 입력', testid: 'email', desc: '이메일 입력 필드' },
      { name: '비밀번호 입력', testid: 'password', desc: '비밀번호 입력 필드' },
      { name: '비밀번호 확인', testid: 'confirm-password', desc: '비밀번호 확인 필드' },
      { name: '가입 버튼', testid: 'signup-submit', desc: '제출 버튼' },
      { name: '이메일 에러', testid: 'email-error', desc: '이메일 검증 실패 시 노출' },
      { name: '비밀번호 에러', testid: 'password-error', desc: '비밀번호 검증 실패 시 노출' },
      { name: '확인 에러', testid: 'confirm-error', desc: '비밀번호 불일치 시 노출' },
      { name: '성공 메시지', testid: 'signup-success', desc: '가입 완료 시 노출' },
    ],
  },
  {
    slug: 'profile-form',
    title: '프로필 등록 폼 다중 검증',
    track: 'automation',
    category: 'forms',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '이름 길이, 전화번호 형식, 나이 범위, 약관 동의 등 서로 다른 유형의 유효성 규칙을 검증하는 테스트를 작성하세요.',
    requirement: [
      '이름이 2자 미만이거나 20자를 초과하면 이름 에러가 보인다.',
      '전화번호가 010-0000-0000 형식이 아니면 전화 에러가 보인다.',
      '나이가 14 미만이거나 120 초과 또는 숫자가 아니면 나이 에러가 보인다.',
      '약관에 동의하지 않고 제출하면 약관 에러가 보인다.',
      '모든 필드가 유효하면 등록 완료 메시지가 보인다.',
    ],
    sandboxSlug: 'profile-form',
    selectors: [
      { name: '이름 입력', testid: 'name', desc: '이름 입력 필드' },
      { name: '전화 입력', testid: 'phone', desc: '전화번호 입력 필드' },
      { name: '나이 입력', testid: 'age', desc: '나이 입력 필드' },
      { name: '약관 동의', testid: 'terms', desc: '약관 동의 체크박스' },
      { name: '등록 버튼', testid: 'profile-submit', desc: '제출 버튼' },
      { name: '이름 에러', testid: 'name-error', desc: '이름 검증 실패 시 노출' },
      { name: '전화 에러', testid: 'phone-error', desc: '전화 검증 실패 시 노출' },
      { name: '나이 에러', testid: 'age-error', desc: '나이 검증 실패 시 노출' },
      { name: '약관 에러', testid: 'terms-error', desc: '약관 미동의 시 노출' },
      { name: '성공 메시지', testid: 'profile-success', desc: '등록 완료 시 노출' },
    ],
  },
  {
    slug: 'data-table',
    title: '데이터 테이블 검색·정렬·페이지네이션',
    track: 'automation',
    category: 'data',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary: '검색 필터, 컬럼 정렬, 페이지 이동이 있는 테이블을 검증하는 테스트를 작성하세요.',
    requirement: [
      '이름 검색어를 입력하면 일치하는 행만 보인다.',
      '이름 헤더를 클릭하면 오름차순·내림차순 정렬이 토글된다.',
      '다음·이전 버튼으로 페이지를 넘기고, 현재 페이지 표시가 갱신된다.',
    ],
    sandboxSlug: 'data-table',
    selectors: [
      { name: '검색 입력', testid: 'table-search', desc: '이름 검색 필드' },
      { name: '데이터 행', testid: 'table-row', desc: '각 데이터 행 (여러 개)' },
      { name: '이름 정렬', testid: 'sort-name', desc: '이름 컬럼 정렬 토글 버튼' },
      { name: '이전 페이지', testid: 'page-prev', desc: '이전 페이지 버튼' },
      { name: '다음 페이지', testid: 'page-next', desc: '다음 페이지 버튼' },
      { name: '페이지 표시', testid: 'page-indicator', desc: '현재 / 전체 페이지' },
    ],
  },
  {
    slug: 'async-load',
    title: '비동기 로딩과 대기',
    track: 'automation',
    category: 'async',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '지연 로딩되는 콘텐츠를 적절히 대기해 검증하는 테스트를 작성하세요.',
    requirement: [
      '불러오기 버튼을 누르면 로딩 스피너가 보인다.',
      '잠시 후 스피너가 사라지고 콘텐츠 목록이 나타난다.',
    ],
    sandboxSlug: 'async-load',
    selectors: [
      { name: '불러오기 버튼', testid: 'load-btn', desc: '로딩 시작 버튼' },
      { name: '로딩 스피너', testid: 'loading-spinner', desc: '로딩 중 노출' },
      { name: '콘텐츠 목록', testid: 'loaded-content', desc: '로딩 완료 후 노출' },
    ],
  },
  {
    slug: 'modal',
    title: '모달 다이얼로그 확인',
    track: 'automation',
    category: 'interaction',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '열기·확인·취소가 있는 모달의 흐름을 검증하는 테스트를 작성하세요.',
    requirement: [
      '열기 버튼을 누르면 모달이 나타난다.',
      '모달에서 취소를 누르면 모달이 닫히고 결과는 없다.',
      '모달에서 삭제(확인)를 누르면 모달이 닫히고 완료 메시지가 보인다.',
    ],
    sandboxSlug: 'modal',
    selectors: [
      { name: '모달 열기', testid: 'modal-open', desc: '모달 여는 버튼' },
      { name: '모달', testid: 'modal', desc: '모달 컨테이너' },
      { name: '확인 버튼', testid: 'modal-confirm', desc: '모달 확인(삭제) 버튼' },
      { name: '취소 버튼', testid: 'modal-cancel', desc: '모달 취소 버튼' },
      { name: '결과 메시지', testid: 'modal-result', desc: '확인 후 노출' },
    ],
  },
  {
    slug: 'drag-and-drop',
    title: '드래그앤드롭 배치',
    track: 'automation',
    category: 'interaction',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary: 'HTML5 드래그앤드롭으로 위젯을 드롭존에 배치하는 동작을 검증하는 테스트를 작성하세요.',
    requirement: [
      '위젯을 드롭존으로 끌어다 놓으면 배치 완료 메시지가 보인다.',
      '배치 후에는 드래그 가능한 위젯이 사라진다.',
    ],
    sandboxSlug: 'drag-and-drop',
    selectors: [
      { name: '드래그 항목', testid: 'drag-item', desc: '끌 수 있는 위젯' },
      { name: '드롭존', testid: 'drop-zone', desc: '놓는 영역' },
      { name: '배치 결과', testid: 'drop-result', desc: '배치 완료 시 노출' },
    ],
  },
  {
    slug: 'file-upload',
    title: '파일 업로드',
    track: 'automation',
    category: 'interaction',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '파일을 선택하고 업로드해 완료 상태를 검증하는 테스트를 작성하세요.',
    requirement: [
      '파일을 선택하면 선택한 파일 이름이 보인다.',
      '업로드 버튼을 누르면 업로드 완료 메시지가 보인다.',
    ],
    sandboxSlug: 'file-upload',
    selectors: [
      { name: '파일 입력', testid: 'file-input', desc: '파일 선택 input' },
      { name: '파일 이름', testid: 'file-name', desc: '선택한 파일 이름' },
      { name: '업로드 버튼', testid: 'upload-submit', desc: '업로드 제출 버튼' },
      { name: '업로드 결과', testid: 'upload-result', desc: '업로드 완료 시 노출' },
    ],
  },
  {
    slug: 'session-expiry',
    title: '세션 만료와 재로그인',
    track: 'automation',
    category: 'auth',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary: '로그인·세션 만료·재로그인으로 이어지는 상태 전이를 검증하는 테스트를 작성하세요.',
    requirement: [
      '로그인 버튼을 누르면 로그인 상태 메시지가 보인다.',
      '세션 만료를 시뮬레이트하면 만료 배너가 보인다.',
      '다시 로그인을 누르면 로그인 상태로 돌아온다.',
    ],
    sandboxSlug: 'session-expiry',
    selectors: [
      { name: '로그인 버튼', testid: 'login-btn', desc: '로그인 버튼' },
      { name: '세션 상태', testid: 'session-status', desc: '로그인 상태 메시지' },
      { name: '만료 버튼', testid: 'expire-btn', desc: '세션 만료 시뮬레이트' },
      { name: '만료 배너', testid: 'expired-banner', desc: '세션 만료 시 노출' },
      { name: '재로그인 버튼', testid: 'relogin-btn', desc: '다시 로그인 버튼' },
    ],
  },
  {
    slug: 'infinite-scroll',
    title: '무한 스크롤 더 불러오기',
    track: 'automation',
    category: 'async',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '더 불러오기로 항목이 비동기 추가되고 끝에 도달하면 멈추는 목록을 검증하는 테스트를 작성하세요.',
    requirement: [
      '처음에는 10개 항목이 보인다.',
      '더 불러오기를 누르면 로딩 표시 후 항목이 10개씩 추가된다.',
      '최대(30개)에 도달하면 더 불러오기 버튼이 사라지고 마지막 안내가 보인다.',
    ],
    sandboxSlug: 'infinite-scroll',
    selectors: [
      { name: '목록', testid: 'scroll-list', desc: '항목 목록 컨테이너' },
      { name: '항목', testid: 'list-item', desc: '각 목록 항목 (여러 개)' },
      { name: '로딩', testid: 'loading', desc: '불러오는 중 노출' },
      { name: '더 불러오기', testid: 'load-more', desc: '추가 로딩 버튼' },
      { name: '목록 끝', testid: 'list-end', desc: '마지막 도달 시 노출' },
    ],
  },
  {
    slug: 'wizard-form',
    title: '다단계 위저드 폼',
    track: 'automation',
    category: 'forms',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary: '단계별 검증·이동·이전 복귀가 있는 3단계 위저드 폼을 검증하는 테스트를 작성하세요.',
    requirement: [
      '1단계에서 이름·이메일이 유효하지 않으면 에러가 보이고 다음 단계로 넘어가지 않는다.',
      '유효하면 2단계 확인 화면에 입력한 값이 보인다.',
      '이전을 누르면 1단계로 돌아간다.',
      '제출을 누르면 3단계 완료 메시지가 보인다.',
      '단계 표시가 현재 단계에 맞게 갱신된다.',
    ],
    sandboxSlug: 'wizard-form',
    selectors: [
      { name: '단계 표시', testid: 'step-indicator', desc: '현재 / 전체 단계' },
      { name: '이름 입력', testid: 'name', desc: '1단계 이름 필드' },
      { name: '이메일 입력', testid: 'email', desc: '1단계 이메일 필드' },
      { name: '이름 에러', testid: 'name-error', desc: '이름 검증 실패 시' },
      { name: '이메일 에러', testid: 'email-error', desc: '이메일 검증 실패 시' },
      { name: '다음 버튼', testid: 'next-btn', desc: '다음 단계' },
      { name: '확인 이름', testid: 'confirm-name', desc: '2단계 이름 확인' },
      { name: '확인 이메일', testid: 'confirm-email', desc: '2단계 이메일 확인' },
      { name: '이전 버튼', testid: 'prev-btn', desc: '이전 단계' },
      { name: '제출 버튼', testid: 'submit-btn', desc: '제출' },
      { name: '완료 메시지', testid: 'complete', desc: '3단계 완료 시' },
    ],
  },
  {
    slug: 'toast-notification',
    title: '토스트 자동 소멸',
    track: 'automation',
    category: 'async',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '액션 후 나타났다 잠시 뒤 사라지는 토스트를 검증하는 테스트를 작성하세요.',
    requirement: [
      '저장하기를 누르면 토스트가 나타난다.',
      '잠시(약 2초) 후 토스트가 자동으로 사라진다.',
    ],
    sandboxSlug: 'toast-notification',
    selectors: [
      { name: '저장 버튼', testid: 'show-toast', desc: '토스트를 띄우는 버튼' },
      { name: '토스트', testid: 'toast', desc: '나타났다 사라지는 알림' },
    ],
  },
  {
    slug: 'tabs',
    title: '탭 전환',
    track: 'automation',
    category: 'interaction',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary:
      '탭을 클릭하면 콘텐츠가 바뀌고 활성 탭이 표시되는 동작을 검증하는 테스트를 작성하세요.',
    requirement: [
      '탭(개요·사양·리뷰)을 클릭하면 해당 콘텐츠가 패널에 보인다.',
      '선택한 탭은 활성(aria-selected) 상태로 표시된다.',
    ],
    sandboxSlug: 'tabs',
    selectors: [
      { name: '개요 탭', testid: 'tab-overview', desc: '개요 탭' },
      { name: '사양 탭', testid: 'tab-specs', desc: '사양 탭' },
      { name: '리뷰 탭', testid: 'tab-reviews', desc: '리뷰 탭' },
      { name: '탭 패널', testid: 'tab-panel', desc: '활성 탭의 콘텐츠' },
    ],
  },
  {
    slug: 'realtime-validation',
    title: '실시간 인라인 검증',
    track: 'automation',
    category: 'forms',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '입력 즉시 이메일 형식·비밀번호 강도를 표시하고 둘 다 유효할 때만 제출이 활성화되는 폼을 검증하세요.',
    requirement: [
      '이메일을 입력하면 형식 유효 여부가 즉시 표시된다.',
      '비밀번호를 입력하면 강도(약함·보통·강함)가 표시된다.',
      '이메일 형식이 맞고 비밀번호가 8자 이상이면 제출 버튼이 활성화된다.',
      '둘 중 하나라도 유효하지 않으면 제출 버튼이 비활성화된다.',
    ],
    sandboxSlug: 'realtime-validation',
    selectors: [
      { name: '이메일 입력', testid: 'email', desc: '이메일 필드' },
      { name: '이메일 상태', testid: 'email-status', desc: '형식 유효 여부 즉시 표시' },
      { name: '비밀번호 입력', testid: 'password', desc: '비밀번호 필드' },
      { name: '비밀번호 강도', testid: 'password-strength', desc: '강도 표시' },
      { name: '제출 버튼', testid: 'submit', desc: '둘 다 유효할 때만 활성' },
    ],
  },
  {
    slug: 'date-picker',
    title: '날짜 선택기',
    track: 'automation',
    category: 'interaction',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '입력을 누르면 달력이 열리고 날짜를 고르면 입력에 반영되는 동작을 검증하는 테스트를 작성하세요.',
    requirement: [
      '날짜 입력을 누르면 달력이 열린다.',
      '달력에서 날짜를 선택하면 입력에 날짜가 반영되고 달력이 닫힌다.',
      '선택한 날짜가 표시된다.',
    ],
    sandboxSlug: 'date-picker',
    selectors: [
      { name: '날짜 입력', testid: 'date-input', desc: '클릭하면 달력 열림' },
      { name: '달력', testid: 'calendar', desc: '날짜 그리드' },
      { name: '날짜 셀', testid: 'day-cell', desc: '각 날짜 (여러 개)' },
      { name: '선택 날짜', testid: 'selected-date', desc: '선택 후 표시' },
    ],
  },
  {
    slug: 'rest-api-products',
    title: '상품 REST API 자동화',
    track: 'api',
    category: 'data',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '상품 REST API의 목록·조회·생성·삭제와 인증을 검증하는 API 테스트를 작성하세요. 브라우저가 아니라 HTTP 요청으로 검증합니다.',
    requirement: [
      '상품 목록은 page·limit 쿼리로 페이지네이션되고 total·totalPages 메타데이터를 포함한다.',
      '존재하지 않는 상품 ID 조회는 404를 반환한다.',
      '로그인은 유효 자격증명에 토큰을, 무효 자격증명에 401을 반환한다.',
      '상품 생성은 토큰이 없으면 401, 필수 필드 누락이면 400, 정상이면 201을 반환한다.',
      '상품 삭제는 토큰이 필요하며 정상 시 204를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      {
        method: 'GET',
        path: '/products?page=1&limit=5',
        desc: '상품 목록 (페이지네이션·category 필터)',
      },
      { method: 'GET', path: '/products/:id', desc: '상품 단건 (없으면 404)' },
      { method: 'POST', path: '/auth/login', desc: '로그인 → 토큰 (무효 시 401)' },
      { method: 'POST', path: '/products', auth: true, desc: '상품 생성 (검증 400 / 성공 201)' },
      { method: 'DELETE', path: '/products/:id', auth: true, desc: '상품 삭제 (204 / 404)' },
    ],
    apiNote:
      '데모 계정 tester@qaground.dev / qaground123 로 로그인해 토큰을 받고, 보호된 요청에 Authorization: Bearer <token> 헤더를 붙이세요.',
  },
  {
    slug: 'bug-hunt-order',
    title: '버그 찾기: 주문 폼',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Testea'],
    summary:
      '주문 폼에 의도적으로 심은 결함을 탐색적 테스트로 찾고, 결함 리포트를 작성해 제출하세요. 제출하면 정답과 피드백을 보여줍니다.',
    requirement: [
      '합계 금액이 단가·수량·배송비와 맞는지 계산을 확인하세요.',
      '수량 입력에 0이나 음수 같은 비정상 값을 넣어 보세요.',
      '받는 사람을 비운 채로 주문이 완료되는지 확인하세요.',
      '발견한 결함을 아래 양식(재현 절차·기대 결과·실제 결과)으로 작성해 제출하세요.',
    ],
    sandboxSlug: 'order-form',
    knownDefects: [
      {
        title: '합계가 배송비를 더하지 않음',
        detail:
          '합계가 단가 × 수량만 계산하고 배송비(3,000원)를 빠뜨린다. 수량 1일 때 15,000원이어야 하지만 12,000원으로 표시된다.',
      },
      {
        title: '수량에 0·음수 입력 허용',
        detail: '수량 입력에 최소값 제한이 없어 0이나 음수를 넣을 수 있고, 합계가 음수가 된다.',
      },
      {
        title: '받는 사람 필수 입력 검증 누락',
        detail: '받는 사람을 비운 채로도 주문하기가 성공한다. 필수 입력 검증이 없다.',
      },
    ],
  },
  {
    slug: 'test-design-password-reset',
    title: '테스트 케이스 설계: 비밀번호 재설정',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Testea'],
    summary:
      '비밀번호 재설정 기능의 테스트 케이스를 설계하세요. 정상·예외·경계 시나리오를 빠짐없이 도출하는 수동 테스트 연습입니다.',
    requirement: [
      '기능 규칙: 가입된 이메일로 재설정 링크를 발송하고, 링크는 24시간 동안만 유효하며, 새 비밀번호는 8자 이상이어야 한다.',
      '정상 흐름과 함께 만료된 링크, 이미 사용한 링크, 미가입 이메일, 비밀번호 규칙 위반을 케이스로 도출하세요.',
      '동등 분할과 경계값 분석을 적용해 입력 케이스를 정리하세요.',
      '각 케이스를 사전 조건·절차·기대 결과로 작성해 보세요.',
    ],
    modelTestCases: [
      {
        title: '정상 재설정',
        detail: '가입된 이메일로 링크를 받아 8자 이상 새 비밀번호로 설정하면 재설정에 성공한다.',
      },
      {
        title: '만료된 링크',
        detail: '발송 후 24시간이 지난 링크로 접근하면 만료되어 재설정이 거부된다.',
      },
      {
        title: '이미 사용한 링크',
        detail: '한 번 사용한 링크를 다시 쓰면 무효 처리되어 거부된다.',
      },
      {
        title: '미가입 이메일',
        detail:
          '가입되지 않은 이메일로 요청하면 계정 노출을 막기 위해 동일한 안내만 보이고 링크는 발송되지 않는다.',
      },
      { title: '비밀번호 규칙 위반', detail: '8자 미만(예: 7자) 새 비밀번호는 거부된다.' },
      {
        title: '경계값',
        detail:
          '정확히 8자 비밀번호는 통과한다. 링크 유효 시간도 24시간 직전·직후로 경계를 확인한다.',
      },
    ],
  },
  {
    slug: 'test-case-coupon',
    title: '테스트 케이스 작성: 할인 쿠폰',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'easy',
    tools: ['Testea'],
    summary:
      '할인 쿠폰 적용 기능의 테스트 케이스를 작성하세요. 정상·예외·경계 시나리오를 표로 정리하는 연습입니다.',
    requirement: [
      '기능 규칙: 정액(3,000원)·정률(10%) 쿠폰이 있고, 최소 주문 금액 20,000원 이상에서만 적용되며, 만료된 쿠폰과 중복 사용은 거부된다.',
      '유효한 쿠폰 적용, 최소 금액 미달, 만료 쿠폰, 존재하지 않는 코드, 중복 적용을 각각 케이스로 작성하세요.',
      '경계값(19,999원·20,000원)을 분리해 케이스를 만드세요.',
      '각 케이스를 제목·사전조건·절차·입력·기대 결과로 정리하세요.',
    ],
    modelTestCases: [
      {
        title: '유효한 정액 쿠폰',
        detail: '20,000원 이상 주문에 3,000원 쿠폰을 적용하면 3,000원이 할인된다.',
      },
      {
        title: '유효한 정률 쿠폰',
        detail: '20,000원 이상 주문에 10% 쿠폰을 적용하면 주문 금액의 10%가 할인된다.',
      },
      {
        title: '최소 금액 미달',
        detail: '19,999원 주문에 쿠폰을 적용하면 최소 주문 금액 미달로 거부된다.',
      },
      { title: '경계값(정확히 최소 금액)', detail: '정확히 20,000원 주문에는 쿠폰이 적용된다.' },
      { title: '만료된 쿠폰', detail: '만료된 쿠폰 코드는 적용되지 않고 만료 안내가 표시된다.' },
      { title: '존재하지 않는 코드', detail: '유효하지 않은 임의 코드는 거부된다.' },
      {
        title: '중복 적용',
        detail: '이미 쿠폰이 적용된 주문에 다른 쿠폰을 추가로 적용하면 중복 사용으로 거부된다.',
      },
    ],
  },
  {
    slug: 'exploratory-charter',
    title: '탐색적 테스트 차터 작성',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Testea'],
    summary:
      '주어진 기능의 탐색적 테스트 세션 차터를 작성하세요. 무엇을·왜·어떻게 탐색할지 한 세션 분량으로 설계하는 연습입니다.',
    requirement: [
      '대상 기능: 파일 업로드(형식·용량 제한, 진행률, 실패 재시도).',
      '탐색 목표(미션)와 다룰 영역, 제외할 영역을 정하세요.',
      '사용할 휴리스틱·아이디어(경계·중단·동시성 등)와 준비물(테스트 데이터)을 적으세요.',
      '세션 시간(예: 60분)과 기록 방법, 발견 시 후속 처리를 정하세요.',
    ],
  },
];

export function getChallenge(slug: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.slug === slug);
}

/** 카테고리 순서대로 묶은 챌린지 그룹 (빈 카테고리는 제외). */
export function challengesByCategory(): { category: ChallengeCategory; items: Challenge[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: CHALLENGES.filter((c) => c.category === category),
  })).filter((group) => group.items.length > 0);
}
