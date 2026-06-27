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
  | 'commerce'
  | 'fintech'
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
  /** 코드 채점: 코드 에디터 초기 Playwright 스펙 템플릿. */
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
  commerce: '커머스',
  fintech: '핀테크',
  fundamentals: '테스팅 기초',
};

/** 목록에 카테고리를 노출할 순서. */
export const CATEGORY_ORDER: ChallengeCategory[] = [
  'auth',
  'forms',
  'data',
  'interaction',
  'async',
  'commerce',
  'fintech',
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
      '유효한 자격증명(tester / qaground123)으로 로그인하면 성공 메시지가 노출되고 에러는 없는지 검증한다.',
      '잘못된 자격증명으로는 에러가 노출되고 성공 메시지가 나오지 않는지 검증한다.',
      '아이디·비밀번호 중 하나만 비웠을 때와 둘 다 비웠을 때 각각 필수 입력 에러가 나는지 검증한다.',
      '에러 상태에서 올바른 값으로 다시 로그인하면 에러가 사라지고 성공하는지 검증한다.',
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
      '이메일 형식을 여러 잘못된 입력으로 거부하고 올바른 형식만 통과하는지 검증한다.',
      '비밀번호 길이 경계를 검증한다: 7자는 거부되고 정확히 8자부터 통과해야 한다.',
      '비밀번호와 확인이 다를 때 확인 에러가 나고, 같을 때 통과하는지 검증한다.',
      '여러 필드가 동시에 무효일 때 각 에러가 함께 노출되고, 모두 유효해야만 가입되는지 검증한다.',
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
      '이름 길이 경계를 검증한다: 1자·2자·20자·21자에서 2~20자만 통과하고 나머지는 에러가 나는지 확인한다.',
      '전화 형식을 여러 잘못된 입력(자릿수 부족·초과, 하이픈 위치 변경)으로 거부하고 010-0000-0000만 통과하는지 검증한다.',
      '나이 경계를 검증한다: 13·14·120·121과 숫자가 아닌 값에서 14~120 정수만 통과하는지 확인한다.',
      '여러 필드가 동시에 무효일 때 각 에러가 한 번에 모두 노출되는지 검증한다.',
      '하나라도 무효이면 성공 메시지가 나오지 않고, 모든 필드가 유효해야만 등록되는지 검증한다.',
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
      '검색 결과를 정밀 검증한다: 특정 검색어의 일치 행 수·내용이 정확하고, 없는 검색어는 0행이 되는지 확인한다.',
      '정렬 토글을 검증한다: 한 번 클릭 시 오름차순 첫 행, 다시 클릭 시 내림차순 첫 행이 기대값과 일치하는지 확인한다.',
      '검색과 정렬을 조합했을 때 필터된 집합 안에서 정렬 순서가 올바른지 검증한다.',
      '페이지 경계를 검증한다: 첫 페이지에서 이전이 막히고, 마지막 페이지에서 다음이 멈추며, 페이지 표시가 정확한지 확인한다.',
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
      '불러오기 전에는 스피너와 콘텐츠가 모두 없는지 초기 상태를 검증한다.',
      '불러오기 클릭 직후 스피너가 보이고 콘텐츠는 아직 없는지 검증한다.',
      '로딩 완료 후 스피너가 사라지고 콘텐츠가 나타나는지 적절한 대기로 검증한다(고정 시간 sleep 금지).',
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
      '초기에는 모달이 닫혀 있는지 검증한다.',
      '열기 → 취소 시 모달이 닫히고 결과 메시지가 없는지 검증한다.',
      '열기 → 삭제(확인) 시 모달이 닫히고 완료 메시지가 노출되는지 검증한다.',
      '취소와 확인의 결과가 서로 다른지(취소=결과 없음, 확인=완료) 대조 검증한다.',
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
      '드롭 전 상태를 검증한다: 드래그 항목이 존재하고 배치 결과 메시지는 아직 없는지 확인한다.',
      '드롭존에 정확히 배치하면 완료 메시지가 노출되고 드래그 항목이 사라지는지 검증한다.',
      '드롭존이 아닌 영역에 놓으면 배치가 일어나지 않고 상태가 그대로인지 검증한다.',
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
      '파일 선택 전에는 파일 이름과 업로드 결과가 모두 없는지 초기 상태를 검증한다.',
      '파일을 선택하면 선택한 파일 이름이 정확히 표시되는지 검증한다.',
      '업로드 클릭 후 완료 메시지가 노출되는지 검증한다.',
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
      '초기 상태를 검증한다: 로그인 전에는 세션 상태·만료 배너가 모두 보이지 않는지 확인한다.',
      '로그인 → 만료 → 재로그인 상태 전이를 순서대로 검증하고, 각 단계에서 이전 상태 요소가 사라지는지 확인한다.',
      '만료 배너가 보이는 동안에는 세션 상태 메시지가 동시에 보이지 않는지(상호 배타) 검증한다.',
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
      '초기 항목 수가 정확히 10개인지 검증한다.',
      '더 불러오기 클릭 시 로딩이 나타났다 사라지고, 그 후 항목이 정확히 20개로 누적되는지 검증한다.',
      '최대치까지 반복하면 항목이 정확히 30개이고, 더 불러오기 버튼이 사라지며 마지막 안내가 보이는지 검증한다.',
      '로딩 중 더 불러오기를 중복 클릭해도 항목이 한 번만 증가하는지(중복 방지) 검증한다.',
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
      '1단계 검증을 다중 케이스로 확인한다: 이름만 무효, 이메일만 무효, 둘 다 무효일 때 각 에러가 정확히 노출되고 다음으로 못 넘어가는지 확인한다.',
      '유효 입력으로 2단계 진입 시 확인 화면의 이름·이메일이 입력값과 정확히 일치하는지 검증한다.',
      '2단계에서 이전으로 1단계 복귀 시 입력값이 유지되고 다시 진행 가능한지 검증한다.',
      '제출 후 3단계 완료가 표시되고, 단계 표시가 1/3 → 2/3 → 3/3 으로 정확히 바뀌는지 검증한다.',
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
      '트리거 전에는 토스트가 없는지 확인한다.',
      '저장하기 클릭 직후 토스트가 나타나는지 검증한다.',
      '약 2초 후 토스트가 자동으로 사라지는지 사라짐까지 대기해 검증한다.',
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
      '초기 활성 탭(개요)의 콘텐츠가 보이고 개요 탭이 활성 상태인지 검증한다.',
      '사양·리뷰 탭을 클릭하면 패널 콘텐츠가 해당 탭 내용으로 정확히 바뀌는지 검증한다.',
      '선택한 탭만 활성(aria-selected=true)이고 나머지는 비활성인지 검증한다.',
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
      '이메일 상태가 입력 즉시(제출 없이) 형식에 따라 유효/오류로 바뀌는지 검증한다.',
      '비밀번호 강도 경계를 검증한다: 7자(약함)·8자(보통)·12자(강함) 전환이 정확한지 확인한다.',
      '제출 버튼 활성 조건을 검증한다: 이메일만 유효하거나 비번만 유효하면 비활성이고, 둘 다 유효해야 활성인지 확인한다.',
      '유효 상태에서 한 필드를 다시 무효로 만들면 제출 버튼이 즉시 비활성으로 돌아가는지 검증한다.',
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
      '초기 상태를 검증한다: 달력이 닫혀 있고 선택 날짜 표시가 없는지 확인한다.',
      '입력 클릭으로 달력을 열고, 날짜 선택 시 입력값이 정확한 날짜로 채워지며 달력이 닫히는지 검증한다.',
      '다른 날짜를 다시 선택하면 입력값이 갱신되는지, 입력을 다시 눌러 달력을 토글로 닫을 수 있는지 검증한다.',
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
    slug: 'cart-checkout',
    title: '장바구니 체크아웃',
    track: 'automation',
    category: 'commerce',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '수량 변경에 따라 소계·배송비·쿠폰 할인이 연쇄로 합계에 반영되는 장바구니를 검증하세요. 재고 한도와 쿠폰 최소 금액 규칙이 얽혀 있습니다.',
    requirement: [
      '마우스 1개 기준 소계 20,000원·배송비 3,000원·합계 23,000원이 정확한 숫자로 표시되는지 검증한다(부분 문자열이 아니라 정확한 금액).',
      '키보드를 재고 한도(3개)까지 늘린 뒤 증가 버튼을 한 번 더 눌러도 수량이 3에서 멈추는지(한도 초과 불가) 검증한다.',
      '배송비 경계 전환을 검증한다: 소계 49,999원 이하는 3,000원, 정확히 50,000원부터 무료가 되어야 한다(경계 양쪽을 모두 단언).',
      '쿠폰 최소 금액 경계를 검증한다: 소계 19,999원에서는 SAVE10이 거부되고 정확히 20,000원에서 적용되어야 한다.',
      '쿠폰 적용 후 수량을 줄여 소계가 최소 금액 아래로 내려가면 할인이 무효화되어 합계에서 빠지는지 검증한다(상태 재계산).',
      '무료 배송과 쿠폰 할인이 동시 적용될 때 합계 = 소계 − 할인(배송비 0)이 정확한지 검증한다.',
      '빈 코드와 잘못된 코드를 각각 적용했을 때 에러가 노출되고 할인이 적용되지 않는지(합계 불변) 검증한다.',
    ],
    sandboxSlug: 'cart-checkout',
    selectors: [
      { name: '마우스 수량 증가', testid: 'inc-mouse', desc: '무선 마우스 수량 +' },
      { name: '마우스 수량 감소', testid: 'dec-mouse', desc: '무선 마우스 수량 −' },
      { name: '마우스 수량', testid: 'qty-mouse', desc: '무선 마우스 수량 표시' },
      { name: '키보드 수량 증가', testid: 'inc-keyboard', desc: '키보드 수량 +' },
      { name: '키보드 수량 감소', testid: 'dec-keyboard', desc: '키보드 수량 −' },
      { name: '키보드 수량', testid: 'qty-keyboard', desc: '키보드 수량 표시' },
      { name: '쿠폰 입력', testid: 'coupon-input', desc: '쿠폰 코드 입력' },
      { name: '쿠폰 적용', testid: 'apply-coupon', desc: '쿠폰 적용 버튼' },
      { name: '쿠폰 에러', testid: 'coupon-error', desc: '쿠폰 검증 실패 시' },
      { name: '소계', testid: 'subtotal', desc: '상품 소계' },
      { name: '배송비', testid: 'shipping', desc: '배송비 (무료/3,000)' },
      { name: '할인', testid: 'discount', desc: '쿠폰 할인액' },
      { name: '합계', testid: 'total', desc: '최종 결제 금액' },
      { name: '결제 버튼', testid: 'checkout-btn', desc: '결제하기' },
    ],
  },
  {
    slug: 'money-transfer',
    title: '계좌 송금',
    track: 'automation',
    category: 'fintech',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '계좌 형식·금액 한도·잔액(수수료 포함) 검증을 거쳐 확인 단계 후 송금하는 흐름을 검증하세요.',
    requirement: [
      '계좌 형식 검증: 자릿수가 부족·초과하거나 하이픈 위치가 다른 입력을 모두 거부하고, 정확히 000-00-000000 패턴만 통과하는지 여러 케이스로 검증한다.',
      '1회 한도 경계를 검증한다: 1,000,000원은 통과하고 1,000,001원은 한도 초과로 거부되어야 한다.',
      '잔액 경계(수수료 포함)를 검증한다: 잔액 1,000,000원·수수료 500원 기준 999,500원은 통과하고 999,501원은 잔액 부족으로 거부되어야 한다.',
      '확인 단계의 출금 합계 = 금액 + 수수료가 정확한지 검증한다(예: 100,000원 입력 시 출금 합계 100,500원).',
      '확인 단계에서 이전을 눌러 폼으로 돌아가도 계좌·금액 입력값이 유지되는지 검증한다.',
      '확인 송금 후 완료 메시지에 송금 금액이 정확히 표시되는지 검증한다.',
    ],
    sandboxSlug: 'money-transfer',
    selectors: [
      { name: '계좌 입력', testid: 'account', desc: '받는 계좌번호' },
      { name: '금액 입력', testid: 'amount', desc: '송금 금액' },
      { name: '계좌 에러', testid: 'account-error', desc: '계좌 형식 오류 시' },
      { name: '금액 에러', testid: 'amount-error', desc: '금액 검증 실패 시' },
      { name: '잔액', testid: 'balance', desc: '현재 잔액' },
      { name: '수수료', testid: 'fee', desc: '송금 수수료' },
      { name: '송금 버튼', testid: 'transfer-btn', desc: '확인 단계로 이동' },
      { name: '확인 합계', testid: 'confirm-total', desc: '확인 단계 출금 합계' },
      { name: '확인 송금', testid: 'confirm-btn', desc: '최종 송금 버튼' },
      { name: '이전 버튼', testid: 'back-btn', desc: '폼으로 돌아가기' },
      { name: '완료 메시지', testid: 'transfer-success', desc: '송금 완료 시' },
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
  {
    slug: 'page-navigation',
    title: '페이지 전환 내비게이션',
    track: 'automation',
    category: 'interaction',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary:
      '내비게이션으로 페이지를 전환하고 뒤로가기로 직전 페이지로 돌아가는 동작을 검증하는 테스트를 작성하세요.',
    requirement: [
      '각 내비 링크를 클릭하면 page-title 이 해당 페이지 제목으로 바뀌는지 검증한다.',
      '여러 페이지를 이동한 뒤 뒤로가기를 누르면 직전 페이지로 돌아가는지 검증한다.',
      '첫 페이지(대시보드)에서는 뒤로가기 버튼이 비활성(disabled)인지 검증한다.',
      '연속 이동·뒤로가기 후 page-title 이 방문 이력과 일치하는지 검증한다.',
    ],
    sandboxSlug: 'page-navigation',
    selectors: [
      { name: '대시보드 메뉴', testid: 'nav-dashboard', desc: '대시보드로 이동' },
      { name: '주문 메뉴', testid: 'nav-orders', desc: '주문으로 이동' },
      { name: '설정 메뉴', testid: 'nav-settings', desc: '설정으로 이동' },
      { name: '현재 페이지 제목', testid: 'page-title', desc: '현재 페이지 제목' },
      { name: '뒤로가기', testid: 'back-button', desc: '직전 페이지로 이동' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내비게이션으로 페이지를 전환한다', async ({ page }) => {
  await page.goto('/');
  // TODO: nav-orders 를 클릭해 page-title 이 '주문' 인지 검증한 뒤,
  //       back-button 으로 직전 페이지로 돌아가는지 확인하세요.
});
`,
  },
  {
    slug: 'token-storage',
    title: '토큰 저장·세션 유지',
    track: 'automation',
    category: 'auth',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '로그인 성공 시 토큰이 localStorage 에 저장되고 로그아웃 시 제거되는지 검증하는 테스트를 작성하세요.',
    requirement: [
      '유효한 자격증명(tester / qaground123)으로 로그인하면 localStorage 키 qaground_token 에 토큰이 저장되는지 검증한다.',
      '로그인 성공 시 화면이 로그인됨 상태(token-status)로 바뀌고 토큰 값(token-value)이 노출되는지 검증한다.',
      '잘못된 자격증명으로는 토큰이 저장되지 않고 에러가 노출되는지 검증한다.',
      '로그아웃하면 localStorage 의 토큰이 제거되고 로그아웃 상태로 돌아가는지 검증한다.',
    ],
    sandboxSlug: 'token-storage',
    selectors: [
      { name: '아이디 입력', testid: 'token-username', desc: '아이디 입력 필드' },
      { name: '비밀번호 입력', testid: 'token-password', desc: '비밀번호 입력 필드' },
      { name: '로그인 버튼', testid: 'token-login', desc: '제출 버튼' },
      { name: '인증 상태', testid: 'token-status', desc: '로그인됨/로그아웃됨 표시' },
      { name: '토큰 값', testid: 'token-value', desc: '저장된 토큰 노출' },
      { name: '로그아웃 버튼', testid: 'token-logout', desc: '토큰 제거' },
      { name: '에러 메시지', testid: 'token-error', desc: '인증 실패 시 노출' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('로그인하면 토큰이 저장된다', async ({ page }) => {
  await page.goto('/');
  // TODO: token-username·token-password 를 채우고 token-login 을 클릭한 뒤,
  //       localStorage 의 qaground_token 을 page.evaluate 로 읽어 검증하세요.
  //       예: await page.evaluate(() => localStorage.getItem('qaground_token'))
});
`,
  },
  {
    slug: 'route-guard',
    title: '라우트 가드(접근 제어)',
    track: 'automation',
    category: 'auth',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '미인증 사용자의 보호 페이지 접근을 차단하고 로그인 후 진입시키는 접근 제어 흐름을 검증하는 테스트를 작성하세요.',
    requirement: [
      '미인증 상태에서 보호 페이지 접근을 시도하면 로그인 화면으로 리다이렉트되고 안내(guard-redirect-notice)가 노출되는지 검증한다.',
      '올바른 자격증명(tester / qaground123)으로 로그인하면 보호 페이지 내용(guard-protected-view)이 보이는지 검증한다.',
      '인증된 뒤에는 보호 페이지 링크로 바로 접근되는지 검증한다.',
      '로그아웃하면 보호 페이지 접근이 다시 차단되는지 검증한다.',
    ],
    sandboxSlug: 'route-guard',
    selectors: [
      { name: '보호 페이지 링크', testid: 'guard-protected-link', desc: '보호 페이지 접근 시도' },
      { name: '아이디 입력', testid: 'guard-username', desc: '아이디 입력 필드' },
      { name: '비밀번호 입력', testid: 'guard-password', desc: '비밀번호 입력 필드' },
      { name: '로그인 버튼', testid: 'guard-login-submit', desc: '제출 버튼' },
      { name: '리다이렉트 안내', testid: 'guard-redirect-notice', desc: '미인증 접근 시 노출' },
      { name: '보호 페이지', testid: 'guard-protected-view', desc: '인증 후 보이는 내용' },
      { name: '로그아웃 버튼', testid: 'guard-logout', desc: '인증 해제' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('미인증 접근은 차단되고 로그인 후 진입된다', async ({ page }) => {
  await page.goto('/');
  // TODO: guard-protected-link 클릭 시 guard-redirect-notice 가 보이는지 확인하고,
  //       로그인 후 guard-protected-view 가 보이는지 검증하세요.
});
`,
  },
  {
    slug: 'form-autosave',
    title: '폼 임시저장·복원',
    track: 'automation',
    category: 'forms',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '입력을 localStorage 에 자동 저장하고 재방문 시 복원하며 초기화/제출로 비우는 동작을 검증하는 테스트를 작성하세요.',
    requirement: [
      '제목·내용을 입력하면 localStorage 키 qaground_draft 에 저장되고 저장 상태(draft-status)가 노출되는지 검증한다.',
      '입력 후 페이지를 새로고침(page.reload)해도 입력값이 복원되는지 검증한다.',
      '초기화(draft-clear)를 누르면 입력과 localStorage 의 draft 가 모두 비워지는지 검증한다.',
      '제출(draft-submit)하면 draft 가 제거되고 제출 상태가 되는지 검증한다.',
    ],
    sandboxSlug: 'form-autosave',
    selectors: [
      { name: '제목 입력', testid: 'draft-title', desc: '제목 입력 필드' },
      { name: '내용 입력', testid: 'draft-body', desc: '내용 입력 영역' },
      { name: '저장 상태', testid: 'draft-status', desc: '임시저장/복원/초기화 표시' },
      { name: '초기화 버튼', testid: 'draft-clear', desc: '입력·draft 비우기' },
      { name: '제출 버튼', testid: 'draft-submit', desc: '제출 후 draft 제거' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('입력이 임시저장되고 새로고침 후 복원된다', async ({ page }) => {
  await page.goto('/');
  // TODO: draft-title·draft-body 를 입력하고 page.reload() 후에도
  //       값이 남아있는지 검증하세요. (localStorage 키: qaground_draft)
});
`,
  },
  {
    slug: 'checkout-flow',
    title: '주문 결제 E2E',
    track: 'automation',
    category: 'commerce',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '상품 선택부터 장바구니·배송 정보·결제수단·주문 완료까지 이어지는 전체 결제 여정을 검증하는 테스트를 작성하세요.',
    requirement: [
      '상품을 담으면 cart-count 가 증가하고 장바구니 단계로 이동할 수 있는지 검증한다.',
      '빈 장바구니에서는 장바구니 단계로 넘어갈 수 없는지(go-cart 비활성) 검증한다.',
      '배송 정보를 비운 채 진행하면 에러(shipping-error)가 나고 결제로 넘어가지 못하는지 검증한다.',
      '배송 정보를 모두 채우면 결제 단계로 넘어가는지 검증한다.',
      '결제수단을 선택하고 주문하면 주문 완료(order-complete)와 주문번호(order-number)가 노출되는지 검증한다.',
    ],
    sandboxSlug: 'checkout-flow',
    selectors: [
      { name: '마우스 담기', testid: 'add-mouse', desc: '무선 마우스 담기' },
      { name: '키보드 담기', testid: 'add-keyboard', desc: '기계식 키보드 담기' },
      { name: '장바구니 개수', testid: 'cart-count', desc: '담긴 수량 배지' },
      { name: '장바구니로', testid: 'go-cart', desc: '장바구니 단계로 이동' },
      { name: '배송 정보로', testid: 'go-shipping', desc: '배송 단계로 이동' },
      { name: '받는 사람', testid: 'ship-name', desc: '수령인 입력' },
      { name: '주소', testid: 'ship-address', desc: '주소 입력' },
      { name: '연락처', testid: 'ship-phone', desc: '연락처 입력' },
      { name: '배송 에러', testid: 'shipping-error', desc: '배송 정보 누락 시' },
      { name: '결제수단으로', testid: 'go-payment', desc: '결제 단계로 이동' },
      { name: '카드 결제', testid: 'pay-card', desc: '신용카드 선택' },
      { name: '주문하기', testid: 'place-order', desc: '주문 확정' },
      { name: '주문 완료', testid: 'order-complete', desc: '완료 화면' },
      { name: '주문번호', testid: 'order-number', desc: '발급된 주문번호' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('상품 선택부터 주문 완료까지 진행한다', async ({ page }) => {
  await page.goto('/');
  // TODO: add-mouse 로 담고 go-cart→go-shipping 으로 진행한 뒤,
  //       배송 정보를 채우고 pay-card 선택 후 place-order 로 주문을 완료해
  //       order-complete 가 보이는지 검증하세요.
});
`,
  },
  {
    slug: 'product-catalog',
    title: '상품 필터·정렬',
    track: 'automation',
    category: 'commerce',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '카테고리 필터·가격 정렬·검색으로 상품 목록을 좁히는 동작을 검증하는 테스트를 작성하세요.',
    requirement: [
      '카테고리 필터를 선택하면 해당 카테고리 상품만 남고 result-count 가 맞는지 검증한다.',
      '검색어를 입력하면 이름에 포함된 상품만 노출되는지 검증한다.',
      '가격 낮은순/높은순 정렬 시 첫 상품(product-item)이 바뀌는지 검증한다.',
      '필터와 검색을 함께 적용했을 때 결과가 교집합으로 좁혀지는지 검증한다.',
      '결과가 없으면 빈 상태(empty-state)가 노출되는지 검증한다.',
    ],
    sandboxSlug: 'product-catalog',
    selectors: [
      { name: '전체 필터', testid: 'filter-all', desc: '모든 카테고리' },
      { name: '전자 필터', testid: 'filter-electronics', desc: '전자 카테고리' },
      { name: '의류 필터', testid: 'filter-clothing', desc: '의류 카테고리' },
      { name: '도서 필터', testid: 'filter-books', desc: '도서 카테고리' },
      { name: '낮은순 정렬', testid: 'sort-asc', desc: '가격 오름차순' },
      { name: '높은순 정렬', testid: 'sort-desc', desc: '가격 내림차순' },
      { name: '검색 입력', testid: 'search-input', desc: '상품 이름 검색' },
      { name: '결과 개수', testid: 'result-count', desc: '필터 결과 수' },
      { name: '상품 항목', testid: 'product-item', desc: '목록의 각 상품' },
      { name: '빈 상태', testid: 'empty-state', desc: '결과 없음 안내' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('필터와 검색으로 목록을 좁힌다', async ({ page }) => {
  await page.goto('/');
  // TODO: filter-electronics 를 선택하고 result-count·product-item 수를 검증한 뒤,
  //       search-input 으로 더 좁히거나 sort-desc 로 정렬 순서를 확인하세요.
});
`,
  },
  {
    slug: 'product-options',
    title: '상품 옵션 선택',
    track: 'automation',
    category: 'commerce',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary: '사이즈·색상 옵션을 모두 선택해야 담기에 성공하는 필수 옵션 검증 테스트를 작성하세요.',
    requirement: [
      '옵션을 선택하지 않고 담기를 누르면 에러(option-error)가 나고 담기지 않는지 검증한다.',
      '사이즈만 선택하고 담아도 여전히 에러가 나는지 검증한다.',
      '사이즈·색상을 모두 선택하면 담기가 성공하고 확인(added-confirm)이 노출되는지 검증한다.',
      '선택한 옵션이 요약(selected-summary)에 정확히 반영되는지 검증한다.',
    ],
    sandboxSlug: 'product-options',
    selectors: [
      { name: '사이즈 S', testid: 'size-s', desc: 'S 사이즈' },
      { name: '사이즈 M', testid: 'size-m', desc: 'M 사이즈' },
      { name: '사이즈 L', testid: 'size-l', desc: 'L 사이즈' },
      { name: '블랙', testid: 'color-black', desc: '블랙 색상' },
      { name: '화이트', testid: 'color-white', desc: '화이트 색상' },
      { name: '담기', testid: 'add-to-cart', desc: '장바구니 담기' },
      { name: '옵션 에러', testid: 'option-error', desc: '옵션 미선택 시' },
      { name: '담기 확인', testid: 'added-confirm', desc: '담기 성공 시' },
      { name: '선택 요약', testid: 'selected-summary', desc: '선택한 옵션 표시' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('옵션을 모두 선택해야 담긴다', async ({ page }) => {
  await page.goto('/');
  // TODO: 옵션 없이 add-to-cart 시 option-error 를 확인하고,
  //       size-m·color-black 선택 후 담으면 added-confirm 이 보이는지 검증하세요.
});
`,
  },
  {
    slug: 'wishlist',
    title: '위시리스트 토글',
    track: 'automation',
    category: 'commerce',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary: '상품별 찜 토글과 개수 배지 갱신을 검증하는 테스트를 작성하세요.',
    requirement: [
      '찜 버튼을 누르면 찜 상태(aria-pressed=true)가 되고 wish-count 가 증가하는지 검증한다.',
      '다시 누르면 찜이 해제되고 wish-count 가 감소하는지 검증한다.',
      '여러 상품을 찜하면 wish-count 가 정확히 합산되는지 검증한다.',
      '모두 해제하면 wish-count 가 0이 되는지 검증한다.',
    ],
    sandboxSlug: 'wishlist',
    selectors: [
      { name: '상품1 찜', testid: 'wish-1', desc: '무선 마우스 찜 토글' },
      { name: '상품2 찜', testid: 'wish-2', desc: '기계식 키보드 찜 토글' },
      { name: '상품3 찜', testid: 'wish-3', desc: '4K 모니터 찜 토글' },
      { name: '찜 개수', testid: 'wish-count', desc: '찜한 상품 수 배지' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('찜을 토글하면 개수가 갱신된다', async ({ page }) => {
  await page.goto('/');
  // TODO: wish-1 을 눌러 aria-pressed 와 wish-count 증가를 확인하고,
  //       다시 눌러 해제되며 count 가 감소하는지 검증하세요.
});
`,
  },
  {
    slug: 'seat-booking',
    title: '콘서트 좌석 예매',
    track: 'automation',
    category: 'commerce',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '소규모 콘서트 예매 페이지가 오픈됐는데 "예매가 이상하다"는 제보가 쏟아진다. 아래 명세를 분석해, 페이지가 명세대로 동작하는지 검증하는 자동화 테스트를 작성하라. 어떤 케이스(경계·엣지)가 필요한지는 직접 판단해야 한다. [명세] 좌석은 A1~A5·B1~B5(10석)이고 A3·B2 는 이미 매진이다. 매진 좌석은 고를 수 없고, 한 사람은 최대 4석까지 선택할 수 있다(초과 시 경고). 좌석당 50,000원이며 선택 수와 총액이 표시된다. 1석 이상 골라야 예매할 수 있고, 예매하면 고른 좌석이 매진으로 바뀌며 예매번호가 나온다.',
    requirement: [
      '매진 좌석은 선택되지 않는다.',
      '최대 선택 수를 넘기면 더 선택되지 않고 경고가 노출된다.',
      '선택한 좌석 수와 총액이 정확히 반영된다.',
      '아무 좌석도 고르지 않으면 예매하기가 비활성이다.',
      '예매하면 고른 좌석이 매진 처리되고 예매번호가 노출된다.',
    ],
    sandboxSlug: 'seat-booking',
    selectors: [
      { name: '좌석 버튼', testid: 'seat-A1', desc: '좌석 A1 (각 좌석은 seat-<좌석명>)' },
      { name: '매진 좌석', testid: 'seat-A3', desc: '시작부터 매진된 좌석(비활성)' },
      { name: '선택 수', testid: 'select-count', desc: '선택한 좌석 수' },
      { name: '총액', testid: 'total-price', desc: '선택 좌석 총액' },
      { name: '초과 경고', testid: 'max-warning', desc: '최대 선택 초과 시' },
      { name: '예매 버튼', testid: 'book-button', desc: '예매하기' },
      { name: '예매 완료', testid: 'booking-complete', desc: '예매 완료 영역' },
      { name: '예매번호', testid: 'booking-number', desc: '발급된 예매번호' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/seat-booking');
  // 명세를 분석해 필요한 케이스를 직접 설계하세요.
});
`,
  },
  {
    slug: 'points-settlement',
    title: '포인트 정산',
    track: 'automation',
    category: 'fintech',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '쇼핑몰 결제 화면에 "포인트 적립·결제액이 안 맞다"는 제보가 들어왔다. 아래 정산 규칙을 분석해, 화면이 규칙대로 계산하는지 검증하는 자동화 테스트를 작성하라. 경계값·예외는 직접 도출해야 한다. [규칙] 회원 등급 적립률은 일반 1%·실버 2%·골드 5%. 포인트는 최소 1,000p 부터 사용 가능하고(미만이면 미적용), 주문 금액의 50%까지만 쓸 수 있다(초과 시 미적용). 잘못된 포인트 입력은 에러를 띄우고 계산에 반영하지 않는다. 최종 결제액 = 주문금액 − 사용포인트, 적립 예정 = (주문금액 − 사용포인트) × 등급 적립률(원 단위 내림).',
    requirement: [
      '등급별 적립률이 (주문금액 − 사용포인트)에 정확히 적용된다.',
      '포인트 최소 사용 금액(1,000p) 경계가 지켜진다.',
      '포인트는 주문 금액의 50%를 초과해 쓸 수 없다.',
      '최종 결제액 = 주문금액 − 사용포인트로 정확히 계산된다.',
      '잘못된 포인트 입력 시 에러가 나고 적립·결제액에 반영되지 않는다.',
    ],
    sandboxSlug: 'points-settlement',
    selectors: [
      { name: '주문 금액', testid: 'order-amount', desc: '주문 금액 입력' },
      { name: '일반 등급', testid: 'grade-normal', desc: '일반(1%)' },
      { name: '실버 등급', testid: 'grade-silver', desc: '실버(2%)' },
      { name: '골드 등급', testid: 'grade-gold', desc: '골드(5%)' },
      { name: '사용 포인트', testid: 'use-points', desc: '사용 포인트 입력' },
      { name: '최종 결제액', testid: 'final-amount', desc: '결제 금액' },
      { name: '적립 예정', testid: 'earned-points', desc: '적립 예정 포인트' },
      { name: '포인트 에러', testid: 'point-error', desc: '포인트 검증 실패 시' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/points-settlement');
  // 규칙을 분석해 필요한 케이스를 직접 설계하세요.
});
`,
  },
  {
    slug: 'order-cancel',
    title: '주문 취소 처리',
    track: 'automation',
    category: 'commerce',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '쇼핑몰 운영팀에 "주문 취소가 상태마다 다르게 동작해 헷갈린다"는 제보가 들어왔다. 아래 정책을 분석해, 주문 상태에 따라 취소가 올바르게 처리되는지 검증하는 자동화 테스트를 작성하라. 어떤 상태·전이 케이스가 필요한지는 직접 판단해야 한다. [정책] 주문 상태는 결제완료·배송준비중·배송중·배송완료가 있다. 결제완료·배송준비중에서만 취소할 수 있고, 취소하면 전액(50,000원) 환불되며 상태가 취소됨으로 바뀐다. 배송중·배송완료에서는 취소할 수 없고 안내가 노출된다. 이미 취소된 주문은 다시 취소할 수 없다. (현재 상태는 상단 버튼으로 바꿔 테스트할 수 있다.)',
    requirement: [
      '결제완료·배송준비중에서 취소하면 환불 완료와 환불액이 노출되고 상태가 취소됨으로 바뀐다.',
      '배송중·배송완료에서는 취소 버튼이 비활성이고 취소 불가 안내가 노출된다.',
      '취소 후에는 다시 취소할 수 없다.',
      '상태에 따라 현재 상태 표시가 정확히 갱신된다.',
    ],
    sandboxSlug: 'order-cancel',
    selectors: [
      { name: '상태=결제완료', testid: 'set-paid', desc: '주문을 결제완료로' },
      { name: '상태=배송준비중', testid: 'set-preparing', desc: '주문을 배송준비중으로' },
      { name: '상태=배송중', testid: 'set-shipping', desc: '주문을 배송중으로' },
      { name: '상태=배송완료', testid: 'set-delivered', desc: '주문을 배송완료로' },
      { name: '현재 상태', testid: 'order-status', desc: '주문 현재 상태' },
      { name: '취소 버튼', testid: 'cancel-button', desc: '주문 취소' },
      { name: '취소 불가 안내', testid: 'cancel-notice', desc: '취소 불가 상태 안내' },
      { name: '취소 결과', testid: 'cancel-result', desc: '취소·환불 완료 영역' },
      { name: '환불액', testid: 'refund-amount', desc: '환불 금액' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/order-cancel');
  // 정책을 분석해 상태별 취소 동작을 직접 검증하세요.
});
`,
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
