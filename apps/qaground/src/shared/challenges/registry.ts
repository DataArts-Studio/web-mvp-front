/**
 * 챌린지 레지스트리 (MVP).
 *
 * - 아직 DB 없이 정적 정의로 시작한다. 폐루프(제출→러너→채점)가 증명되면
 *   exercises 스키마로 옮긴다(FDD-QG05/QG09).
 * - sandboxSlug 가 가리키는 `/sandbox/[slug]` 가 실제 테스트 대상 페이지다.
 */

export type ChallengeTrack = 'automation' | 'manual' | 'api' | 'performance' | 'accessibility';
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
  | 'performance'
  | 'accessibility'
  | 'fundamentals';

export interface ChallengeSelector {
  name: string;
  testid: string;
  desc: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiSchemaType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';

export interface ApiSchemaField {
  path: string;
  type: ApiSchemaType;
  required?: boolean;
  desc?: string;
}

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  /** 인증(토큰) 필요 여부. */
  auth?: boolean;
  desc: string;
  query?: ApiSchemaField[];
  body?: ApiSchemaField[];
  response?: ApiSchemaField[];
  responseExample?: unknown;
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
  /** 제출 통과 후 결과 페이지에서 보여줄 모범 풀이/리뷰 콘텐츠. */
  modelSolution?: {
    approach: string[];
    code?: string;
    notes?: string[];
  };
  /** 학습 UX: 예상 풀이 시간(분). */
  estimatedMinutes?: number;
  /** 학습 UX: 먼저 풀면 좋은 챌린지 slug 목록. */
  prerequisites?: string[];
  /** 학습 UX: 완료 후 추천할 챌린지 slug 목록. */
  recommendedNext?: string[];
}

export const TRACK_LABEL: Record<ChallengeTrack, string> = {
  automation: 'Automation',
  manual: 'Manual',
  api: 'API',
  performance: 'Performance',
  accessibility: 'Accessibility',
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
  performance: '성능',
  accessibility: '접근성',
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
  'performance',
  'accessibility',
  'fundamentals',
];

export const CHALLENGES: Challenge[] = [
  {
    slug: 'login-basic',
    title: '로그인 폼 자동화',
    track: 'automation',
    category: 'auth',
    difficulty: 'easy',
    estimatedMinutes: 20,
    recommendedNext: ['signup-validation', 'test-design-password-reset'],
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
    modelSolution: {
      approach: [
        '성공 경로와 실패 경로를 별도 테스트로 분리해 원인을 빠르게 찾을 수 있게 한다.',
        '입력과 클릭 같은 사용자 행동은 await로 기다리고, 결과는 expect로 명시적으로 단언한다.',
        '에러 상태 이후 재로그인처럼 상태 전환이 있는 흐름은 이전 메시지가 사라지는지도 함께 확인한다.',
      ],
      notes: [
        '정상 로그인만 검증하면 실제 서비스에서 자주 깨지는 검증 메시지와 재시도 흐름을 놓친다.',
        'toHaveText는 요소가 기대 문구가 될 때까지 기다리므로 비동기 UI에 적합하다.',
      ],
    },
  },
  {
    slug: 'signup-validation',
    title: '회원가입 폼 검증',
    track: 'automation',
    category: 'forms',
    difficulty: 'easy',
    estimatedMinutes: 25,
    prerequisites: ['login-basic'],
    recommendedNext: ['profile-form', 'realtime-validation'],
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
    estimatedMinutes: 30,
    recommendedNext: ['wizard-form', 'cart-checkout'],
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
    estimatedMinutes: 35,
    prerequisites: ['signup-validation'],
    recommendedNext: ['cart-checkout'],
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
    estimatedMinutes: 45,
    prerequisites: ['data-table', 'wizard-form'],
    recommendedNext: ['test-case-coupon', 'rest-api-products'],
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
    estimatedMinutes: 35,
    prerequisites: ['login-basic'],
    recommendedNext: ['rest-api-auth-session', 'rest-api-product-crud-auth'],
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
        query: [
          { path: 'page', type: 'number', desc: '1부터 시작하는 페이지 번호' },
          { path: 'limit', type: 'number', desc: '페이지 크기' },
          { path: 'category', type: 'string', desc: '카테고리 필터' },
        ],
        response: [
          { path: 'data', type: 'array', required: true, desc: '상품 배열' },
          { path: 'data.0.id', type: 'number', required: true },
          { path: 'data.0.name', type: 'string', required: true },
          { path: 'data.0.category', type: 'string', required: true },
          { path: 'data.0.price', type: 'number', required: true },
          { path: 'data.0.inStock', type: 'boolean', required: true },
          { path: 'page', type: 'number', required: true },
          { path: 'limit', type: 'number', required: true },
          { path: 'total', type: 'number', required: true },
          { path: 'totalPages', type: 'number', required: true },
        ],
        responseExample: {
          data: [{ id: 1, name: '무선 키보드', category: '주변기기', price: 39000, inStock: true }],
          page: 1,
          limit: 5,
          total: 12,
          totalPages: 3,
        },
      },
      {
        method: 'GET',
        path: '/products/:id',
        desc: '상품 단건 (없으면 404)',
        response: [
          { path: 'id', type: 'number', required: true },
          { path: 'name', type: 'string', required: true },
          { path: 'category', type: 'string', required: true },
          { path: 'price', type: 'number', required: true },
          { path: 'inStock', type: 'boolean', required: true },
        ],
        responseExample: {
          id: 1,
          name: '무선 키보드',
          category: '주변기기',
          price: 39000,
          inStock: true,
        },
      },
      {
        method: 'POST',
        path: '/auth/login',
        desc: '로그인 → 토큰 (무효 시 401)',
        body: [
          { path: 'email', type: 'string', required: true },
          { path: 'password', type: 'string', required: true },
        ],
        response: [
          { path: 'token', type: 'string', required: true },
          { path: 'user.email', type: 'string', required: true },
        ],
        responseExample: { token: 'qaground-demo-token', user: { email: 'tester@qaground.dev' } },
      },
      {
        method: 'POST',
        path: '/products',
        auth: true,
        desc: '상품 생성 (검증 400 / 성공 201)',
        body: [
          { path: 'name', type: 'string', required: true },
          { path: 'price', type: 'number', required: true },
          { path: 'category', type: 'string' },
        ],
        response: [
          { path: 'id', type: 'number', required: true },
          { path: 'name', type: 'string', required: true },
          { path: 'category', type: 'string', required: true },
          { path: 'price', type: 'number', required: true },
          { path: 'inStock', type: 'boolean', required: true },
        ],
        responseExample: {
          id: 13,
          name: '테스트 상품',
          category: '기타',
          price: 12000,
          inStock: true,
        },
      },
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
    estimatedMinutes: 25,
    recommendedNext: ['test-design-password-reset'],
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
    estimatedMinutes: 30,
    prerequisites: ['login-basic'],
    recommendedNext: ['test-design-login-lockout', 'test-case-coupon'],
    tools: ['Testea'],
    summary:
      '비밀번호 재설정 기능의 테스트 케이스를 설계하세요. 정상·예외·경계 시나리오를 빠짐없이 도출하는 메뉴얼 테스트 연습입니다.',
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
    estimatedMinutes: 35,
    prerequisites: ['cart-checkout', 'test-design-password-reset'],
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
  {
    slug: 'test-design-login-lockout',
    title: '테스트 케이스 설계: 로그인 잠금 정책',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'medium',
    estimatedMinutes: 35,
    prerequisites: ['test-design-password-reset'],
    tools: ['Testea'],
    summary:
      '로그인 실패 잠금 정책의 테스트 케이스를 설계하세요. 실패 누적·잠금·해제·카운터 리셋을 경계값과 함께 빠짐없이 도출하는 연습입니다.',
    requirement: [
      '기능 규칙: 비밀번호를 5회 연속 틀리면 계정이 15분간 잠긴다. 잠금 중에는 올바른 비밀번호도 거부된다. 로그인에 한 번 성공하거나 15분이 지나면 실패 카운터가 0으로 리셋된다.',
      '정상 로그인, 4회 실패 후 5회째 성공, 5회 연속 실패 후 잠금, 잠금 중 올바른 비밀번호 거부를 각각 케이스로 도출하세요.',
      '경계값 분석을 적용하세요(실패 4회 vs 5회, 잠금 14분 59초 vs 15분 경과).',
      '각 케이스를 사전 조건·절차·기대 결과로 작성하세요.',
    ],
    modelTestCases: [
      { title: '정상 로그인', detail: '올바른 이메일·비밀번호로 한 번에 로그인에 성공한다.' },
      {
        title: '4회 실패 후 성공',
        detail:
          '4회 틀린 뒤 5번째에 올바른 비밀번호를 넣으면 로그인에 성공하고 실패 카운터가 0으로 리셋된다.',
      },
      {
        title: '5회 연속 실패 시 잠금',
        detail: '5회 연속으로 틀리면 계정이 잠기고 15분간 로그인이 차단된다.',
      },
      {
        title: '잠금 중 올바른 비밀번호 거부',
        detail: '잠금 상태에서는 올바른 비밀번호를 넣어도 거부되고 잠금 안내가 표시된다.',
      },
      {
        title: '15분 경과 후 해제',
        detail: '잠긴 뒤 15분이 지나면 잠금이 풀려 다시 로그인을 시도할 수 있다.',
      },
      { title: '경계값(실패 횟수)', detail: '실패 4회까지는 잠기지 않고, 정확히 5회째에 잠긴다.' },
      {
        title: '경계값(잠금 시간)',
        detail: '잠금 후 14분 59초에는 여전히 차단되고, 15분 00초부터 해제된다.',
      },
    ],
  },
  {
    slug: 'test-design-shipping-fee',
    title: '테스트 케이스 설계: 배송비 정책',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Testea'],
    summary:
      '주문 배송비 정책의 테스트 케이스를 설계하세요. 무료배송 임계값·도서산간 가산·조합을 경계값과 함께 도출하는 연습입니다.',
    requirement: [
      '기능 규칙: 기본 배송비는 3,000원이고 주문 금액 50,000원 이상이면 무료다. 도서산간 지역은 3,000원이 추가되며, 무료배송이어도 도서산간 가산은 적용된다.',
      '50,000원 미만/이상, 도서산간 가산, 무료배송과 도서산간이 겹치는 경우를 각각 케이스로 도출하세요.',
      '경계값 분석을 적용하세요(49,999원 vs 50,000원).',
      '각 케이스를 사전 조건·입력(주문 금액·지역)·기대 결과(최종 배송비)로 작성하세요.',
    ],
    modelTestCases: [
      { title: '기본 배송비', detail: '40,000원 일반 지역 주문은 배송비 3,000원이 부과된다.' },
      { title: '무료배송 임계값', detail: '정확히 50,000원 일반 지역 주문은 배송비가 0원이다.' },
      {
        title: '경계값(미달)',
        detail: '49,999원 일반 지역 주문은 무료배송 대상이 아니다(3,000원).',
      },
      {
        title: '도서산간 가산',
        detail: '40,000원 도서산간 주문은 기본 3,000원 + 가산 3,000원 = 6,000원이다.',
      },
      {
        title: '무료배송 + 도서산간',
        detail: '60,000원 도서산간 주문은 무료배송이지만 도서산간 가산 3,000원은 부과된다.',
      },
    ],
  },
  {
    slug: 'test-case-reservation-slot',
    title: '테스트 케이스 작성: 예약 시간대 선택',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'easy',
    tools: ['Testea'],
    summary:
      '시간대 예약 기능의 테스트 케이스를 작성하세요. 영업시간·마감·중복 예약 같은 정상·예외 흐름을 표로 정리하는 연습입니다.',
    requirement: [
      '기능 규칙: 예약은 10:00~20:00 사이 30분 단위 슬롯으로 한다. 현재 시각 이전 슬롯과 이미 예약된 슬롯은 선택할 수 없고, 잔여 1석인 슬롯은 마감 임박으로 표시된다.',
      '정상 예약, 지난 시간 슬롯, 이미 예약된 슬롯, 마감 임박 표시를 각각 케이스로 작성하세요.',
      '경계값을 분리하세요(10:00 첫 슬롯, 19:30 마지막 슬롯, 20:00 마감).',
      '각 케이스를 제목·사전조건·절차·기대 결과로 정리하세요.',
    ],
    modelTestCases: [
      {
        title: '정상 예약',
        detail: '영업시간 내 비어 있는 슬롯을 선택해 예약하면 예약이 완료된다.',
      },
      { title: '첫 슬롯 경계', detail: '10:00 첫 슬롯을 선택할 수 있다.' },
      {
        title: '마지막 슬롯 경계',
        detail: '19:30 슬롯은 선택 가능하고, 20:00 이후 슬롯은 제공되지 않는다.',
      },
      { title: '지난 시간 슬롯', detail: '현재 시각 이전 슬롯은 비활성화되어 선택할 수 없다.' },
      { title: '이미 예약된 슬롯', detail: '다른 사람이 예약을 마친 슬롯은 선택할 수 없다.' },
      { title: '마감 임박 표시', detail: '잔여 1석인 슬롯은 마감 임박으로 표시된다.' },
    ],
  },
  {
    slug: 'test-design-membership-grade',
    title: '테스트 케이스 설계: 회원 등급 산정',
    track: 'manual',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Testea'],
    summary:
      '구매액 기준 회원 등급 산정의 테스트 케이스를 설계하세요. 등급 구간의 경계값을 빠짐없이 도출하는 동등 분할·경계값 연습입니다.',
    requirement: [
      '기능 규칙: 최근 6개월 누적 구매액으로 등급을 정한다. 30만원 미만은 일반, 30만원 이상 100만원 미만은 실버, 100만원 이상은 골드다. 등급은 매월 1일 재산정된다.',
      '각 등급에 해당하는 케이스와 구간 경계값을 도출하세요.',
      '경계값 분석을 적용하세요(299,999 vs 300,000, 999,999 vs 1,000,000).',
      '재산정 시점(월 1회)과 구매액 0원 같은 예외도 케이스로 포함하세요.',
    ],
    modelTestCases: [
      { title: '일반 등급', detail: '누적 구매액 299,999원은 일반 등급이다.' },
      { title: '실버 하한 경계', detail: '정확히 300,000원은 실버 등급이다.' },
      { title: '실버 상한 경계', detail: '999,999원은 실버 등급이다.' },
      { title: '골드 경계', detail: '정확히 1,000,000원은 골드 등급이다.' },
      { title: '구매액 0원', detail: '구매 이력이 없으면(0원) 일반 등급이다.' },
      {
        title: '재산정 시점',
        detail: '구간을 넘는 구매를 해도 다음 달 1일 재산정 전에는 등급이 바뀌지 않는다.',
      },
    ],
  },
  {
    slug: 'todo-list',
    title: '할 일 관리(Todo) CRUD',
    track: 'automation',
    category: 'interaction',
    difficulty: 'easy',
    tools: ['Playwright'],
    summary:
      '할 일 관리 위젯의 기본 동작을 검증하는 자동화 테스트를 작성하라. 추가·완료·수정·삭제·필터·남은 개수가 명세대로 동작하는지 직접 케이스를 설계해야 한다. [명세] 입력 후 추가하면 목록에 생기고 입력창이 비워진다(공백만이면 추가 안 됨). 체크박스로 완료/미완료를 전환한다(완료는 취소선). 수정→저장으로 텍스트를 바꾸고, 삭제로 항목을 제거한다. 필터는 전체/미완료/완료이며, 남은 일 개수는 미완료 항목 수다.',
    requirement: [
      '할 일을 입력해 추가하면 목록에 나타나고 입력창이 비워진다. 공백만 입력하면 추가되지 않는다.',
      '체크박스로 완료/미완료를 토글하면 표시와 남은 개수가 갱신된다.',
      '항목을 수정·저장하면 텍스트가 바뀌고, 삭제하면 목록에서 사라진다.',
      '필터(전체/미완료/완료)에 따라 보이는 항목이 달라진다.',
    ],
    sandboxSlug: 'todo-list',
    selectors: [
      { name: '입력', testid: 'todo-input', desc: '할 일 입력' },
      { name: '추가', testid: 'todo-add', desc: '할 일 추가' },
      { name: '항목', testid: 'todo-item', desc: '할 일 항목' },
      { name: '완료 토글', testid: 'todo-toggle', desc: '완료 체크박스' },
      { name: '텍스트', testid: 'todo-text', desc: '할 일 텍스트' },
      { name: '수정', testid: 'todo-edit', desc: '수정 시작' },
      { name: '수정 입력', testid: 'todo-edit-input', desc: '수정 입력창' },
      { name: '저장', testid: 'todo-save', desc: '수정 저장' },
      { name: '삭제', testid: 'todo-delete', desc: '할 일 삭제' },
      { name: '필터-전체', testid: 'filter-all', desc: '전체 보기' },
      { name: '필터-미완료', testid: 'filter-active', desc: '미완료만' },
      { name: '필터-완료', testid: 'filter-done', desc: '완료만' },
      { name: '남은 개수', testid: 'remaining-count', desc: '남은(미완료) 개수' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/todo-list');
  // 명세를 분석해 추가·완료·수정·삭제·필터를 직접 검증하세요.
});
`,
  },
  {
    slug: 'post-board',
    title: '게시판 검색·페이지네이션',
    track: 'automation',
    category: 'data',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '게시판의 검색·필터·페이지네이션·글 작성을 검증하는 자동화 테스트를 작성하라. 어떤 경계·조합 케이스가 필요한지는 직접 판단해야 한다. [명세] 목록은 페이지당 5개씩 보이고 이전/다음과 "현재/전체" 페이지가 표시된다. 제목 검색은 부분 일치로 필터하며 결과 수와 페이지가 갱신된다. 카테고리(전체/공지/질문/자유) 필터가 있다. 글을 작성하면 목록 맨 위에 추가된다.',
    requirement: [
      '한 페이지에 5개씩 보이고, 다음/이전으로 페이지를 이동하면 목록과 페이지 표시가 갱신된다.',
      '제목 검색(부분 일치)으로 결과가 필터되고 결과 수가 갱신된다.',
      '카테고리 필터로 해당 카테고리 글만 보인다.',
      '글을 작성하면 목록 맨 위에 새 글이 추가된다.',
    ],
    sandboxSlug: 'post-board',
    selectors: [
      { name: '검색', testid: 'post-search', desc: '제목 검색' },
      { name: '카테고리 필터', testid: 'category-filter', desc: '카테고리 선택' },
      { name: '글 항목', testid: 'post-item', desc: '게시글 행' },
      { name: '글 제목', testid: 'post-title', desc: '게시글 제목' },
      { name: '결과 수', testid: 'result-count', desc: '검색 결과 수' },
      { name: '이전', testid: 'page-prev', desc: '이전 페이지' },
      { name: '다음', testid: 'page-next', desc: '다음 페이지' },
      { name: '페이지 표시', testid: 'page-indicator', desc: '현재/전체 페이지' },
      { name: '새 글 제목', testid: 'post-title-input', desc: '작성할 제목' },
      { name: '새 글 카테고리', testid: 'post-category', desc: '작성 카테고리' },
      { name: '작성', testid: 'post-submit', desc: '글 작성' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/post-board');
  // 검색·필터·페이지네이션·작성을 직접 검증하세요.
});
`,
  },
  {
    slug: 'chat-room',
    title: '실시간 채팅 메시지 전송',
    track: 'automation',
    category: 'async',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      '채팅 화면의 메시지 전송과 자동 응답을 검증하는 자동화 테스트를 작성하라. 비동기 응답을 어떻게 기다릴지, 어떤 케이스가 필요한지 직접 설계해야 한다. [명세] 메시지를 입력해 전송하면 내 메시지가 목록 끝에 추가되고 입력창이 비워진다. 공백만 입력하면 전송되지 않는다. 전송 후 잠시 뒤(약 0.7초) 상대(봇) 자동 응답이 목록에 추가된다. Enter 로도 전송된다.',
    requirement: [
      '메시지를 입력해 전송하면 내 메시지가 목록에 추가되고 입력창이 비워진다.',
      '공백만 입력하면 전송되지 않는다.',
      '전송 후 잠시 뒤 상대(봇)의 자동 응답이 목록에 추가된다(비동기 대기 필요).',
      'Enter 키로도 전송된다.',
    ],
    sandboxSlug: 'chat-room',
    selectors: [
      { name: '입력', testid: 'chat-input', desc: '메시지 입력' },
      { name: '전송', testid: 'chat-send', desc: '메시지 전송' },
      { name: '메시지 목록', testid: 'message-list', desc: '메시지 영역' },
      { name: '메시지', testid: 'message-item', desc: '개별 메시지' },
      { name: '봇 메시지', testid: 'bot-message', desc: '상대(봇) 응답' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/chat-room');
  // 메시지 전송·입력창 초기화·봇 자동 응답(비동기)을 직접 검증하세요.
});
`,
  },
  {
    slug: 'shop-order',
    title: '쇼핑몰 주문 전체 흐름(E2E)',
    track: 'automation',
    category: 'commerce',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '실제 쇼핑몰(qashop)에서 상품을 찾아 주문 완료까지 가는 전체 흐름을 검증하는 E2E 테스트를 작성하라. 어떤 단계·경계 케이스가 필요한지는 직접 설계해야 한다. [흐름] 상품목록(검색·카테고리·정렬) → 상세(옵션·수량) → 장바구니(수량·삭제·쿠폰·배송비) → 결제(폼 검증) → 주문완료(주문번호). [규칙] 품절 상품은 담기 불가, 옵션 있는 상품은 사이즈 선택 후 담기, 상품합계 50,000원 이상이면 무료배송, 쿠폰 SAVE10/WELCOME20만 유효, 전화번호는 010-0000-0000 형식.',
    requirement: [
      '상품을 검색·카테고리·정렬로 찾고, 장바구니 담기 후 상단 배지 수량이 갱신된다.',
      '옵션(사이즈) 있는 상품은 사이즈 선택 후에만 담기고, 품절 상품은 담을 수 없다.',
      '장바구니에서 수량 변경·삭제, 쿠폰 적용(SAVE10 등), 무료배송 임계값이 합계에 반영된다.',
      '결제 폼은 필수값·전화번호 형식을 검증하고, 통과하면 주문완료에 주문번호가 노출된다.',
    ],
    sandboxSlug: 'shop',
    selectors: [
      { name: '상품 검색', testid: 'search', desc: '상품명 검색' },
      { name: '정렬', testid: 'sort-select', desc: '가격 정렬' },
      { name: '카테고리(의류)', testid: 'cat-의류', desc: '카테고리 필터' },
      { name: '상품 카드', testid: 'product-card', desc: '상품 항목' },
      { name: '상품명', testid: 'product-name', desc: '상품 이름' },
      { name: '담기', testid: 'add-to-cart', desc: '목록에서 담기' },
      { name: '상세 보기', testid: 'view-detail', desc: '상품 상세' },
      { name: '품절 배지', testid: 'stock-badge', desc: '품절 표시' },
      { name: '상세 담기', testid: 'add-detail', desc: '상세에서 담기' },
      { name: '장바구니 버튼', testid: 'cart-button', desc: '장바구니 열기' },
      { name: '장바구니 수량', testid: 'cart-count', desc: '담긴 개수 배지' },
      { name: '장바구니 항목', testid: 'cart-item', desc: '장바구니 줄' },
      { name: '줄 삭제', testid: 'line-remove', desc: '항목 삭제' },
      { name: '쿠폰 입력', testid: 'coupon-input', desc: '쿠폰 코드' },
      { name: '쿠폰 적용', testid: 'coupon-apply', desc: '쿠폰 적용' },
      { name: '배송비', testid: 'shipping-fee', desc: '배송비' },
      { name: '결제예정액', testid: 'cart-total', desc: '합계' },
      { name: '주문하기', testid: 'checkout-button', desc: '결제 화면으로' },
      { name: '받는사람', testid: 'ship-name', desc: '수령인' },
      { name: '주소', testid: 'ship-address', desc: '배송지' },
      { name: '전화번호', testid: 'ship-phone', desc: '연락처' },
      { name: '결제하기', testid: 'place-order', desc: '주문 확정' },
      { name: '주문완료', testid: 'order-complete', desc: '완료 화면' },
      { name: '주문번호', testid: 'order-number', desc: '주문번호' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/shop');
  // 검색→담기→장바구니→결제→주문완료까지 직접 검증하세요.
});
`,
  },
  {
    slug: 'shop-cart',
    title: '쇼핑몰 장바구니 금액 계산',
    track: 'automation',
    category: 'commerce',
    difficulty: 'medium',
    tools: ['Playwright'],
    summary:
      'qashop 장바구니의 금액 계산(수량·쿠폰·배송비)을 검증하는 테스트를 작성하라. 경계값을 직접 도출해야 한다. [규칙] 배송비는 3,000원이고 상품합계 50,000원 이상이면 무료배송이다. 쿠폰 SAVE10은 10%, WELCOME20은 20% 할인이며 그 외 코드는 거부된다. 줄별 수량 증감·삭제가 합계에 즉시 반영된다.',
    requirement: [
      '수량을 늘리거나 줄이면 상품 합계와 결제 예정액이 정확히 갱신된다.',
      '상품합계 50,000원 미만은 배송비 3,000원, 이상은 무료배송이다(경계 확인).',
      '유효한 쿠폰(SAVE10/WELCOME20)은 할인이 적용되고, 잘못된 코드는 거부된다.',
      '항목을 삭제하면 합계에서 빠진다.',
    ],
    sandboxSlug: 'shop',
    selectors: [
      { name: '담기', testid: 'add-to-cart', desc: '상품 담기' },
      { name: '장바구니 버튼', testid: 'cart-button', desc: '장바구니 열기' },
      { name: '장바구니 항목', testid: 'cart-item', desc: '장바구니 줄' },
      { name: '줄 수량+', testid: 'line-plus', desc: '수량 증가' },
      { name: '줄 수량-', testid: 'line-minus', desc: '수량 감소' },
      { name: '줄 수량', testid: 'line-qty', desc: '줄 수량' },
      { name: '줄 삭제', testid: 'line-remove', desc: '항목 삭제' },
      { name: '쿠폰 입력', testid: 'coupon-input', desc: '쿠폰 코드' },
      { name: '쿠폰 적용', testid: 'coupon-apply', desc: '쿠폰 적용' },
      { name: '쿠폰 메시지', testid: 'coupon-msg', desc: '쿠폰 결과' },
      { name: '상품 합계', testid: 'subtotal', desc: '상품 합계' },
      { name: '할인', testid: 'discount', desc: '할인 금액' },
      { name: '배송비', testid: 'shipping-fee', desc: '배송비' },
      { name: '결제예정액', testid: 'cart-total', desc: '합계' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/shop');
  // 수량·쿠폰·무료배송 경계로 금액 계산을 직접 검증하세요.
});
`,
  },
  {
    slug: 'bank-transfer',
    title: '뱅킹 이체·거래내역',
    track: 'automation',
    category: 'fintech',
    difficulty: 'hard',
    tools: ['Playwright'],
    summary:
      '뱅킹 대시보드(qabank)에서 계좌 이체와 거래내역을 검증하는 테스트를 작성하라. 경계·예외 케이스는 직접 도출해야 한다. [규칙] 받는 계좌·예금주·금액은 필수이고 금액은 0보다 커야 한다. 출금액이 잔액보다 크면 "잔액 부족"으로 거부되고, 1회 이체 한도는 5,000,000원이다. 이체 성공 시 출금 계좌 잔액이 줄고 거래내역 맨 위에 출금 내역이 추가되며 출금 후 잔액이 표시된다. 거래내역은 전체/입금/출금 필터와 검색을 지원한다.',
    requirement: [
      '받는 계좌·예금주·금액이 비었거나 금액이 0이면 이체가 거부되고 항목별 안내가 노출된다.',
      '잔액보다 큰 금액, 1회 한도(5,000,000원) 초과는 각각 거부된다.',
      '정상 이체 시 잔액이 줄고 거래내역 맨 위에 출금 내역이 추가되며 출금 후 잔액이 표시된다.',
      '거래내역을 입금/출금 필터와 검색어로 거를 수 있다.',
    ],
    sandboxSlug: 'bank',
    selectors: [
      { name: '총 자산', testid: 'total-assets', desc: '총 자산 합계' },
      { name: '계좌 카드', testid: 'account-card', desc: '계좌 선택' },
      { name: '계좌 잔액', testid: 'account-balance', desc: '계좌 잔액' },
      { name: '거래내역 탭', testid: 'tab-history', desc: '거래내역 보기' },
      { name: '이체 탭', testid: 'tab-transfer', desc: '이체 화면' },
      { name: '입금 필터', testid: 'tx-filter-in', desc: '입금만' },
      { name: '출금 필터', testid: 'tx-filter-out', desc: '출금만' },
      { name: '내역 검색', testid: 'tx-search', desc: '거래 검색' },
      { name: '거래 항목', testid: 'tx-item', desc: '거래 행' },
      { name: '거래 금액', testid: 'tx-amount', desc: '거래 금액' },
      { name: '받는 은행', testid: 'transfer-bank', desc: '은행 선택' },
      { name: '받는 계좌', testid: 'transfer-account', desc: '받는 계좌번호' },
      { name: '받는 분', testid: 'transfer-name', desc: '예금주' },
      { name: '이체 금액', testid: 'transfer-amount', desc: '이체 금액' },
      { name: '이체하기', testid: 'transfer-submit', desc: '이체 실행' },
      { name: '금액 오류', testid: 'error-amount', desc: '잔액부족·한도 안내' },
      { name: '이체 완료', testid: 'transfer-success', desc: '이체 성공 영역' },
      { name: '출금 후 잔액', testid: 'balance-after', desc: '이체 후 잔액' },
    ],
    starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/sandbox/bank');
  // 이체 폼 검증(필수·잔액부족·한도)·정상 이체·거래내역 필터를 직접 검증하세요.
});
`,
  },
  {
    slug: 'rest-api-auth-session',
    title: '인증·세션 API: 토큰 만료와 갱신',
    track: 'api',
    category: 'auth',
    difficulty: 'medium',
    estimatedMinutes: 40,
    prerequisites: ['rest-api-products'],
    recommendedNext: ['rest-api-product-crud-auth'],
    tools: ['Postman'],
    summary:
      '로그인 후 보호된 /me API를 호출하고, 누락·만료·잘못된 토큰과 refresh token 갱신 경로를 검증하세요.',
    requirement: [
      '유효한 로그인은 token을 반환하고, 잘못된 자격증명은 401을 반환한다.',
      'GET /auth/me 는 유효한 Bearer 토큰에서 200과 사용자 정보를 반환한다.',
      '토큰이 없거나 expired-token 이면 각각 401과 에러 코드를 반환한다.',
      'POST /auth/refresh 는 유효한 refreshToken 에서 새 token을 반환하고, 잘못된 refreshToken 은 401을 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'POST', path: '/auth/login', desc: '로그인' },
      { method: 'GET', path: '/auth/me', auth: true, desc: '내 정보 조회' },
      { method: 'POST', path: '/auth/refresh', desc: '토큰 갱신' },
    ],
    apiNote:
      '데모 계정은 tester@qaground.dev / qaground123, refreshToken은 qaground-refresh-token 입니다. expired-token으로 만료 토큰 경로를 검증할 수 있습니다.',
  },
  {
    slug: 'rest-api-reservations',
    title: '예약 API: 슬롯 조회와 중복 방지',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '날짜별 예약 가능 슬롯을 조회하고, 만석 슬롯·잘못된 날짜·필수값 누락 같은 예약 API 경계 조건을 검증하세요.',
    requirement: [
      'GET /reservations/slots 는 YYYY-MM-DD 날짜에서 슬롯 목록과 available 값을 반환한다.',
      '날짜 형식이 없거나 잘못되면 400을 반환한다.',
      'POST /reservations 는 유효한 슬롯과 고객 정보에서 201 confirmed를 반환한다.',
      '만석 슬롯은 409, 없는 슬롯은 404, 잘못된 이메일이나 이름 누락은 400을 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/reservations/slots?date=2026-07-01', desc: '날짜별 슬롯 조회' },
      { method: 'POST', path: '/reservations', desc: '예약 생성 (400 / 404 / 409 / 201)' },
    ],
    apiNote:
      '예약 생성 예: { "slotId": "slot-0900", "name": "김테스터", "email": "tester@example.com" }. slot-1000은 만석이라 409를 반환합니다.',
  },
  {
    slug: 'rest-api-file-metadata',
    title: '파일 메타데이터 API: 형식·용량 검증',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'easy',
    tools: ['Postman'],
    summary:
      'JSON 기반 파일 메타데이터 업로드 API로 MIME type, 파일 크기, 단건 메타데이터 조회를 검증하세요.',
    requirement: [
      '허용 MIME(image/png, image/jpeg, application/pdf)과 5MB 이하 크기에서는 201 uploaded를 반환한다.',
      '허용되지 않은 MIME type은 415를 반환한다.',
      '5MB 초과 파일은 413과 maxSize를 반환한다.',
      'GET /files/:id 는 존재하는 파일에서 200, 없는 파일에서 404를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'POST', path: '/files', desc: '파일 메타데이터 업로드 (400 / 413 / 415 / 201)' },
      { method: 'GET', path: '/files/file-1001', desc: '파일 메타데이터 조회' },
    ],
    apiNote:
      '요청 본문 예: { "fileName": "report.pdf", "mimeType": "application/pdf", "size": 204800 }. 브라우저 내 API 테스터 특성상 multipart 대신 메타데이터 API로 연습합니다.',
  },
  {
    slug: 'rest-api-notifications',
    title: '알림 API: 읽음 처리와 unread count',
    track: 'api',
    category: 'async',
    difficulty: 'easy',
    tools: ['Postman'],
    summary:
      '알림 목록과 읽음 처리 API에서 unreadOnly 필터, unreadCount, 없는 알림 처리와 멱등적 PATCH 응답을 검증하세요.',
    requirement: [
      'GET /notifications 는 unreadCount와 전체 알림 목록을 반환한다.',
      'unreadOnly=true 는 읽지 않은 알림만 반환한다.',
      'PATCH /notifications/:id/read 는 존재하는 알림에서 200과 read=true를 반환한다.',
      '숫자가 아닌 ID는 400, 없는 ID는 404를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/notifications', desc: '알림 목록' },
      { method: 'GET', path: '/notifications?unreadOnly=true', desc: '읽지 않은 알림만' },
      { method: 'PATCH', path: '/notifications/301/read', desc: '읽음 처리' },
    ],
  },
  {
    slug: 'rest-api-rbac-admin',
    title: '권한 API: 관리자 전용 리포트',
    track: 'api',
    category: 'auth',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '관리자 전용 API에서 미인증 401, 일반 사용자 403, 관리자 200 경계를 구분해 검증하세요.',
    requirement: [
      'Authorization 헤더가 없으면 401을 반환한다.',
      '일반 토큰(qaground-demo-token)은 인증은 되었지만 관리자 권한이 없어 403을 반환한다.',
      '관리자 토큰(qaground-admin-token)은 200과 운영 리포트 데이터를 반환한다.',
      '401과 403을 같은 실패로 뭉개지 않고 각각 다른 의미로 단언한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [{ method: 'GET', path: '/admin/reports', auth: true, desc: '관리자 전용 리포트' }],
    apiNote:
      '일반 토큰은 qaground-demo-token, 관리자 토큰은 qaground-admin-token 입니다. 같은 엔드포인트를 토큰별로 반복 실행해 401/403/200을 비교하세요.',
  },
  {
    slug: 'rest-api-articles-search',
    title: '검색 API: 키워드·태그·정렬 조합',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Postman'],
    summary: '문서 검색 API에서 q, tag, sort, order 파라미터 조합과 total 메타데이터를 검증하세요.',
    requirement: [
      'q는 제목 부분검색으로 동작하고 total이 결과 수와 일치한다.',
      'tag=api 는 API 태그 문서만 반환한다.',
      'sort=views&order=desc 는 조회수 내림차순으로 정렬한다.',
      '검색어와 태그를 조합해도 결과 집합과 total이 일관된다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/articles?q=API', desc: '키워드 검색' },
      { method: 'GET', path: '/articles?tag=api&sort=views&order=desc', desc: '태그+정렬 조합' },
    ],
  },
  {
    slug: 'rest-api-webhook-signature',
    title: '웹훅 API: 서명 검증과 중복 이벤트',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'hard',
    tools: ['Postman'],
    summary: '결제 웹훅 수신 API에서 서명 헤더, payload 검증, 중복 eventId 처리를 검증하세요.',
    requirement: [
      'x-qaground-signature 헤더가 없거나 틀리면 401을 반환한다.',
      '유효 서명과 올바른 payload는 200과 ok=true를 반환한다.',
      '필수 필드 누락, 허용되지 않은 type, 0 이하 amount는 400을 반환한다.',
      'eventId=evt-duplicate 는 200과 duplicate=true를 반환해 멱등 처리 경로를 드러낸다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'POST', path: '/webhooks/payment', desc: '결제 웹훅 수신 (401 / 400 / 200)' },
    ],
    apiNote:
      '헤더 x-qaground-signature: test-signature 를 넣어야 합니다. 본문 예: { "eventId": "evt-100", "type": "payment.succeeded", "amount": 39000 }.',
  },
  {
    slug: 'rest-api-wallet-transfer',
    title: '지갑 API: 잔액과 송금 검증',
    track: 'api',
    category: 'fintech',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '지갑 잔액·거래내역 조회와 송금 API에서 금액 검증, 잔액 부족, 거래내역 필터를 검증하세요.',
    requirement: [
      'GET /wallet/transactions 는 balance, total, 거래내역 배열을 반환한다.',
      'type=deposit/withdrawal 필터가 적용되고 total이 결과 수와 일치한다.',
      '송금 금액은 양의 정수여야 하며 0·음수·누락은 400을 반환한다.',
      '잔액보다 큰 송금은 409 insufficient_balance를 반환하고, 정상 송금은 201과 balanceAfter를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/wallet/transactions?type=withdrawal', desc: '거래내역 필터' },
      { method: 'POST', path: '/wallet/transfer', desc: '송금 (400 / 409 / 201)' },
    ],
    apiNote: '송금 예: { "to": "bank-001", "amount": 12000 }. 현재 데모 잔액은 138000입니다.',
  },
  {
    slug: 'rest-api-content-moderation',
    title: '콘텐츠 API: 댓글·신고·금칙어',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '게시글 생성, 댓글 작성, 신고 API에서 금칙어, 삭제된 글 댓글 금지, 중복 신고 같은 콘텐츠 정책을 검증하세요.',
    requirement: [
      '게시글 목록은 삭제되지 않은 글만 반환한다.',
      '게시글 생성은 유효 제목에서 201, 짧은 제목은 400, 금칙어 포함은 422를 반환한다.',
      '댓글 작성은 존재하는 글에서 201, 삭제된 글에서 409, 없는 글에서 404를 반환한다.',
      '신고 생성은 정상 요청에서 201, 중복 신고 대상에서는 409를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/posts', desc: '게시글 목록' },
      { method: 'POST', path: '/posts', desc: '게시글 생성 (400 / 422 / 201)' },
      { method: 'POST', path: '/posts/701/comments', desc: '댓글 작성 (400 / 404 / 409 / 201)' },
      { method: 'POST', path: '/reports', desc: '신고 생성 (400 / 409 / 201)' },
    ],
  },
  {
    slug: 'rest-api-health-monitoring',
    title: '운영 API: 헬스체크와 장애 응답',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'easy',
    tools: ['Postman'],
    summary:
      '헬스체크 API에서 정상 상태와 degraded 상태의 HTTP status, JSON checks 필드를 검증하세요.',
    requirement: [
      'GET /health 는 200과 status=ok, database=ok, queue=ok를 반환한다.',
      'GET /health?mode=degraded 는 503과 status=degraded, queue=slow를 반환한다.',
      '운영 API 테스트에서는 HTTP 상태와 body 상태 필드를 함께 단언한다.',
      '503도 JSON body를 반환하므로 실패 응답 본문을 파싱해 검증한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/health', desc: '정상 헬스체크' },
      { method: 'GET', path: '/health?mode=degraded', desc: '장애 상태 헬스체크' },
    ],
  },
  {
    slug: 'rest-api-support-tickets',
    title: '고객지원 티켓 API: 필터·상태 변경',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '고객지원 티켓 API에서 상태·우선순위·담당자 필터, 티켓 생성 입력 검증, 보호된 상태 변경 API를 검증하세요. 실무 API 테스트에서 자주 만나는 목록 메타데이터와 권한 경계, 부분 수정(PATCH)을 함께 연습합니다.',
    requirement: [
      '티켓 목록은 page·limit 메타데이터를 포함하고, status·priority·assignee·q 필터가 조합되어 적용된다.',
      '단건 조회는 존재하는 ID에서 200과 티켓 객체를 반환하고, 없는 ID는 404, 숫자가 아닌 ID는 400을 반환한다.',
      '티켓 생성은 유효한 title·customerEmail·priority 에서 201과 open 상태 티켓을 반환하고, 잘못된 이메일·빈 제목은 400을 반환한다.',
      '상태 변경(PATCH)은 Authorization 헤더가 없으면 401을 반환하고, 정상 토큰과 유효한 status/assignee 에서 200을 반환한다.',
      'PATCH 본문이 비어 있거나 허용되지 않는 status 값이면 400을 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/tickets?status=open&priority=high', desc: '상태·우선순위 필터' },
      { method: 'GET', path: '/tickets?assignee=unassigned&q=로그인', desc: '미배정 티켓 검색' },
      { method: 'GET', path: '/tickets/501', desc: '티켓 단건 조회 (400 / 404 / 200)' },
      { method: 'POST', path: '/tickets', desc: '티켓 생성 (400 / 201)' },
      {
        method: 'PATCH',
        path: '/tickets/501',
        auth: true,
        desc: '상태·담당자 변경 (401 / 400 / 404 / 200)',
      },
    ],
    apiNote:
      'PATCH 는 Bearer qaground-demo-token 인증이 필요합니다. 생성 예: { "title": "비밀번호 재설정 문의", "customerEmail": "user@example.com", "priority": "high" }. 수정 예: { "status": "pending", "assignee": "support-a" }. assignee=unassigned 는 미배정 티켓만 반환합니다.',
  },
  {
    slug: 'rest-api-product-crud-auth',
    title: '상품 관리 API: 인증·CRUD 검증',
    track: 'api',
    category: 'commerce',
    difficulty: 'medium',
    estimatedMinutes: 50,
    prerequisites: ['rest-api-products', 'rest-api-auth-session'],
    tools: ['Postman'],
    summary:
      '로그인으로 토큰을 발급받고, 보호된 상품 생성·수정·삭제 API의 인증, 입력 검증, 상태 코드를 검증하세요. 성공 경로뿐 아니라 401·400·404·204 같은 API 경계 응답까지 함께 확인해야 합니다.',
    requirement: [
      'POST /auth/login 은 유효한 데모 계정으로 200과 token 을 반환하고, 잘못된 자격증명은 401 을 반환한다.',
      '보호된 상품 생성·수정·삭제 요청은 Authorization 헤더가 없으면 401 을 반환한다.',
      '정상 토큰으로 상품을 생성하면 201과 생성된 상품 객체를 반환하고, 필수값 누락·잘못된 price 는 400 을 반환한다.',
      '상품 수정은 존재하는 ID와 유효한 본문에서 200을 반환하고, 빈 본문·없는 ID·숫자가 아닌 ID는 각각 에러 상태를 반환한다.',
      '상품 삭제는 정상 토큰과 존재하는 ID에서 204 No Content 를 반환하고, 없는 ID는 404 를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'POST', path: '/auth/login', desc: '데모 계정 로그인 후 토큰 발급' },
      { method: 'POST', path: '/products', auth: true, desc: '상품 생성 (401 / 400 / 201)' },
      { method: 'PUT', path: '/products/1', auth: true, desc: '상품 수정 (401 / 400 / 404 / 200)' },
      { method: 'DELETE', path: '/products/1', auth: true, desc: '상품 삭제 (401 / 404 / 204)' },
    ],
    apiNote:
      '데모 계정은 tester@qaground.dev / qaground123 입니다. 로그인 응답의 token 또는 qaground-demo-token 을 Bearer 토큰으로 사용하세요. 상품 생성 예: { "name": "테스트 상품", "price": 12000, "category": "기타" }. 데모 API는 실제로 영속하지 않으므로 삭제·수정 후 목록 변경을 전제로 두지 마세요.',
  },
  {
    slug: 'rest-api-products-advanced',
    title: '상품 목록 API: 검색·정렬·필터',
    track: 'api',
    category: 'data',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '상품 목록 API의 검색(q)·정렬(sort/order)·재고 필터(inStock)·페이지네이션 경계를 검증하는 API 테스트를 작성하세요. 어떤 조합·경계를 확인할지는 직접 설계해야 합니다.',
    requirement: [
      'q 파라미터로 상품명을 부분검색하면 일치하는 항목만 오고, 메타데이터(total)도 그에 맞게 바뀐다.',
      'sort=price&order=asc/desc 로 가격 정렬되며, sort 가 없으면 기본(id) 순서다.',
      'inStock=true 면 재고 있는 상품만, inStock=false 면 품절 상품만 반환된다.',
      'page·limit 경계(마지막 페이지, limit 변경)에서 data 길이와 totalPages 가 올바르다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/products?q=키보드', desc: '상품명 검색' },
      { method: 'GET', path: '/products?sort=price&order=desc', desc: '가격 정렬' },
      { method: 'GET', path: '/products?inStock=true', desc: '재고 필터' },
      { method: 'GET', path: '/products?page=3&limit=5', desc: '페이지네이션 경계' },
    ],
    apiNote:
      '검색·정렬·필터는 조합할 수 있습니다. sort 는 price|name, order 기본은 asc 입니다. 응답 메타(total·totalPages)가 필터 결과와 일치하는지 확인하세요.',
  },
  {
    slug: 'rest-api-users',
    title: '사용자 API: 페이지네이션·단건 조회',
    track: 'api',
    category: 'data',
    difficulty: 'easy',
    tools: ['Postman'],
    summary:
      '사용자 목록 API의 페이지네이션 메타데이터와 단건 조회(존재·404·잘못된 ID)를 검증하세요.',
    requirement: [
      '사용자 목록은 page·limit 로 페이지네이션되고 total·totalPages·data 를 포함한다.',
      'limit 을 바꾸면 data 길이가 그에 맞게 달라진다.',
      'role·active 필터가 적용된다(예: role=admin, active=false).',
      '존재하는 ID 는 200과 사용자 객체, 없는 ID 는 404, 숫자가 아닌 ID 는 400 을 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/users?page=1&limit=5', desc: '사용자 목록' },
      { method: 'GET', path: '/users?role=admin', desc: '역할 필터' },
      { method: 'GET', path: '/users/2', desc: '단건 (없으면 404)' },
      { method: 'GET', path: '/users/abc', desc: '잘못된 ID → 400' },
    ],
  },
  {
    slug: 'rest-api-orders',
    title: '주문 생성 API: 입력 검증·합계',
    track: 'api',
    category: 'commerce',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '주문 생성 API의 입력 검증(필수·수량·가격)과 합계 계산, 단건 조회를 검증하세요. 견고한 자동화는 성공 경로뿐 아니라 검증 실패(400)도 확인합니다.',
    requirement: [
      'customer 가 없거나 items 가 없거나 빈 배열이면 400 을 반환한다.',
      'item 의 qty 가 0 이하이거나 price 가 0 이하면 400 을 반환한다.',
      '정상 요청은 201과 함께 total(= 각 item 의 qty×price 합계)을 정확히 계산해 반환한다.',
      '존재하는 주문 ID 는 200, 없는 ID 는 404 를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'POST', path: '/orders', desc: '주문 생성 (검증 400 / 성공 201)' },
      { method: 'GET', path: '/orders/1001', desc: '주문 단건 (없으면 404)' },
    ],
    apiNote:
      '요청 본문 예: { "customer": "홍길동", "items": [{ "name": "키보드", "qty": 2, "price": 39000 }] }. total 은 서버가 계산합니다. 빈 items·음수 수량 등 실패 케이스도 검증하세요.',
  },
  {
    slug: 'rest-api-status-basic',
    title: '상태 코드 API 입문: 200·404 검증',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'easy',
    tools: ['Postman'],
    summary:
      '상태 코드 시뮬레이터로 API 응답의 status code와 JSON 본문을 함께 검증하는 입문 챌린지입니다. 성공 응답과 실패 응답을 나란히 확인하며 기본 단언 흐름을 익히세요.',
    requirement: [
      'GET /status/200 은 HTTP 200과 본문 { status: 200, message: "OK" }를 반환한다.',
      'GET /status/404 는 HTTP 404와 본문 { status: 404, message: "Not Found" }를 반환한다.',
      'HTTP 상태 코드뿐 아니라 응답 JSON의 status·message 필드를 함께 단언한다.',
      '숫자가 아닌 상태 코드 요청은 400과 error 필드를 반환한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/status/200', desc: '성공 응답 기본 검증' },
      { method: 'GET', path: '/status/404', desc: 'Not Found 응답 검증' },
      { method: 'GET', path: '/status/abc', desc: '잘못된 코드 → 400' },
    ],
    apiNote:
      '처음에는 구조화된 단언으로 상태 코드와 JSON 필드를 검증해 보세요. 예: status == 200, message == OK. 이후 pm.test 스크립트로 같은 검증을 옮겨 보면 좋습니다.',
  },
  {
    slug: 'rest-api-errors',
    title: '에러 처리·상태 코드 검증',
    track: 'api',
    category: 'fundamentals',
    difficulty: 'medium',
    tools: ['Postman'],
    summary:
      '상태 코드 시뮬레이터로 다양한 4xx/5xx 응답과 에러 본문을 검증하세요. 실패 경로까지 단언하는 것이 견고한 API 자동화의 핵심입니다.',
    requirement: [
      '/status/:code 는 요청한 상태 코드로 응답한다(예: 404, 500, 503).',
      '2xx 가 아닌 응답에도 일관된 본문(status·message 필드)이 온다.',
      '범위를 벗어난 코드(예: 999)나 숫자가 아닌 코드는 400 을 반환한다.',
      '응답의 상태 코드와 본문을 모두 단언해 실패 경로를 검증한다.',
    ],
    apiBase: '/api/practice',
    endpoints: [
      { method: 'GET', path: '/status/404', desc: '404 응답' },
      { method: 'GET', path: '/status/500', desc: '500 응답' },
      { method: 'GET', path: '/status/503', desc: '503 응답' },
      { method: 'GET', path: '/status/999', desc: '범위 밖 → 400' },
    ],
    apiNote:
      '/status/:code 는 200~599 범위의 코드로 응답합니다. 자동화에서 에러 응답의 상태와 본문을 어떻게 단언할지 연습하세요.',
  },
  {
    slug: 'web-vitals-basic-audit',
    title: 'Core Web Vitals 성능 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'easy',
    tools: ['Lighthouse', 'DevTools'],
    summary:
      '랜딩 페이지를 기준으로 Core Web Vitals와 주요 리소스 병목을 점검하는 성능 테스트 계획을 작성하세요.',
    requirement: [
      'LCP, CLS, INP를 어떤 도구와 기준으로 측정할지 정의한다.',
      '모바일과 데스크톱을 분리해 측정하고, 네트워크/CPU 조건을 명시한다.',
      '이미지, 폰트, JavaScript 번들 등 주요 병목 후보를 확인하는 절차를 포함한다.',
      '성능 저하를 재현 가능한 리포트로 남기기 위한 증거(스크린샷, trace, 측정값)를 정의한다.',
    ],
    modelTestCases: [
      {
        title: 'Core Web Vitals 기준 측정',
        detail:
          'Lighthouse 또는 DevTools Performance로 모바일/데스크톱 각각 LCP·CLS·INP를 측정하고, 기준값과 실제값을 함께 기록한다.',
      },
      {
        title: '리소스 병목 분석',
        detail:
          'Network/Performance 탭에서 큰 이미지, render-blocking CSS, 과도한 JS 실행 시간을 확인하고 영향도를 정리한다.',
      },
      {
        title: '재현 가능한 증거 수집',
        detail:
          '측정 환경, URL, throttling 조건, trace 또는 Lighthouse 결과 파일, 개선 전후 비교 기준을 리포트에 포함한다.',
      },
    ],
  },
  {
    slug: 'api-response-time-slo',
    title: 'API 응답 시간 SLO 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'easy',
    tools: ['DevTools', 'k6'],
    summary:
      '상품 목록과 주문 생성 API를 기준으로 응답 시간 목표와 측정 방법을 정의하는 성능 테스트 케이스를 작성하세요.',
    requirement: [
      '목록 조회, 단건 조회, 생성 요청처럼 성격이 다른 엔드포인트를 구분해 측정 대상을 정의한다.',
      'p50, p95, p99 중 어떤 지표를 기준으로 볼지와 목표 응답 시간을 명시한다.',
      '콜드 스타트, 인증, 네트워크 변동처럼 측정값을 흔드는 조건을 통제하는 방법을 포함한다.',
      'SLO 초과 시 재현 절차와 서버/클라이언트 로그 확인 항목을 함께 정의한다.',
    ],
    modelTestCases: [
      {
        title: '엔드포인트별 응답 시간 기준',
        detail:
          'GET 목록, GET 단건, POST 생성 요청을 나누고 각 요청의 p95 목표값과 허용 오차를 명시한다.',
      },
      {
        title: '측정 조건 통제',
        detail:
          '동일한 환경, 반복 횟수, 인증 토큰, payload 크기, 워밍업 여부를 고정하고 결과를 비교한다.',
      },
      {
        title: '초과 시 분석 절차',
        detail:
          'SLO 초과 요청의 trace, 서버 로그, DB 쿼리 시간, 응답 payload 크기를 확인하는 후속 절차를 포함한다.',
      },
    ],
  },
  {
    slug: 'image-loading-performance',
    title: '이미지 로딩 성능 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'medium',
    tools: ['Lighthouse', 'Network'],
    summary:
      '상품 카드와 상세 화면의 이미지가 LCP와 네트워크 비용에 미치는 영향을 검증하는 성능 테스트 계획을 작성하세요.',
    requirement: [
      'LCP 후보 이미지가 무엇인지 식별하고 로딩 우선순위가 적절한지 확인한다.',
      '이미지 포맷, 크기, DPR, lazy loading 적용 여부를 검증하는 절차를 포함한다.',
      '느린 네트워크에서 placeholder, layout shift, 이미지 실패 상태를 함께 확인한다.',
      '개선 전후를 비교할 수 있도록 bytes, request 수, LCP 값을 증거로 남긴다.',
    ],
    modelTestCases: [
      {
        title: 'LCP 이미지 식별',
        detail:
          'Performance 또는 Lighthouse 결과에서 LCP element를 확인하고 preload/fetchpriority 적용 여부를 점검한다.',
      },
      {
        title: '이미지 최적화 검증',
        detail:
          '원본 크기 대비 렌더링 크기, WebP/AVIF 등 적절한 포맷, lazy loading 대상 분리를 확인한다.',
      },
      {
        title: '저속 네트워크 경험',
        detail:
          'Slow 4G 조건에서 레이아웃 밀림, 빈 이미지 영역, 로딩 실패 fallback이 사용성을 해치지 않는지 검증한다.',
      },
    ],
  },
  {
    slug: 'bundle-regression-budget',
    title: '번들 크기 회귀 예산 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'medium',
    tools: ['Bundle Analyzer', 'Lighthouse CI'],
    summary:
      '새 기능 추가 후 JavaScript 번들 크기와 초기 로딩 지표가 회귀하지 않았는지 확인하는 성능 게이트를 설계하세요.',
    requirement: [
      '초기 로딩에 포함되는 JS/CSS 번들 크기와 chunk 증가량 기준을 정의한다.',
      '동적 import, tree shaking, 중복 의존성 여부를 확인하는 분석 절차를 포함한다.',
      'PR 또는 배포 전 자동 확인할 수 있는 budget 기준과 실패 조건을 제안한다.',
      '회귀가 발생했을 때 어느 화면/기능이 원인인지 추적하는 방법을 포함한다.',
    ],
    modelTestCases: [
      {
        title: '번들 예산 기준',
        detail:
          'route별 initial JS와 total JS 예산을 정하고 기준 초과 시 실패하도록 Lighthouse CI 또는 analyzer 결과를 활용한다.',
      },
      {
        title: '의존성 증가 원인 분석',
        detail:
          '새 라이브러리 추가 시 중복 패키지, client boundary 확장, 불필요한 전역 import를 확인한다.',
      },
      {
        title: '회귀 추적 리포트',
        detail:
          '이전 main 빌드와 현재 빌드의 chunk diff, 영향 route, 사용자 지표 영향도를 함께 기록한다.',
      },
    ],
  },
  {
    slug: 'checkout-load-test-plan',
    title: '체크아웃 부하 테스트 설계',
    track: 'performance',
    category: 'performance',
    difficulty: 'hard',
    tools: ['k6', 'Grafana'],
    summary:
      '동시 주문 상황에서 체크아웃 API가 지연·실패·중복 주문 없이 동작하는지 검증하는 부하 테스트 계획을 작성하세요.',
    requirement: [
      '정상 주문, 재시도, 결제 실패 등 현실적인 사용자 시나리오와 비율을 정의한다.',
      '동시 사용자 수, ramp-up, duration, think time 같은 부하 모델을 명시한다.',
      '응답 시간, 오류율, 중복 주문, 재고 차감 정확성 등 관찰 지표를 정의한다.',
      '테스트 데이터 격리, 결제 모킹, 운영 영향 방지 전략을 포함한다.',
    ],
    modelTestCases: [
      {
        title: '현실적인 부하 모델',
        detail:
          '브라우징→장바구니→체크아웃 흐름과 실패/재시도 비율을 포함해 ramp-up과 peak 구간을 설계한다.',
      },
      {
        title: '성능과 정합성 지표',
        detail: 'p95 응답 시간, 5xx 비율, timeout, 중복 주문 수, 재고 음수 여부를 함께 관찰한다.',
      },
      {
        title: '안전한 실행 조건',
        detail:
          '스테이징 환경, 결제 모킹, 테스트 계정/상품 분리, 실행 시간 제한과 중단 조건을 명시한다.',
      },
    ],
  },
  {
    slug: 'screen-reader-form-audit',
    title: '스크린리더 폼 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'easy',
    tools: ['NVDA', 'VoiceOver', 'Accessibility Tree'],
    summary:
      '회원가입 폼에서 스크린리더 사용자가 입력 목적과 오류를 이해할 수 있는지 검증하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      '각 입력 필드의 accessible name이 화면 라벨과 일치하는지 확인한다.',
      '필수 여부, 도움말, 형식 안내가 보조기술에 전달되는지 검증한다.',
      '유효성 오류 발생 시 오류 메시지와 필드가 연결되어 읽히는지 확인한다.',
      '오류 수정 후 상태가 갱신되고 성공 메시지가 적절히 전달되는지 검증한다.',
    ],
    modelTestCases: [
      {
        title: '입력 필드 이름과 설명',
        detail:
          '이메일, 비밀번호, 확인 입력의 accessible name과 description을 접근성 트리 또는 스크린리더로 확인한다.',
      },
      {
        title: '오류 메시지 연결',
        detail:
          '잘못된 입력 후 aria-describedby 또는 동등한 방식으로 해당 필드의 오류가 읽히는지 확인한다.',
      },
      {
        title: '상태 변화 전달',
        detail:
          '오류가 사라지거나 제출 성공 시 사용자가 상태 변화를 인지할 수 있는 live region 또는 포커스 전략을 점검한다.',
      },
    ],
  },
  {
    slug: 'modal-focus-accessibility',
    title: '모달 포커스 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'medium',
    tools: ['Keyboard', 'Screen Reader'],
    summary:
      '삭제 확인 모달이 키보드와 보조기술 사용자에게 안전하게 동작하는지 검증하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      '모달이 열리면 포커스가 모달 내부의 적절한 요소로 이동하는지 확인한다.',
      'Tab 순환이 모달 내부에 갇히고 배경 요소로 빠져나가지 않는지 검증한다.',
      'Escape, 취소, 확인 동작 후 포커스가 호출 버튼으로 복귀하는지 확인한다.',
      'dialog 역할, 제목, 설명이 보조기술에 전달되는지 검증한다.',
    ],
    modelTestCases: [
      {
        title: '초기 포커스와 포커스 트랩',
        detail:
          '모달 오픈 시 취소 또는 제목으로 포커스가 이동하고 Tab/Shift+Tab이 모달 내부에서 순환하는지 확인한다.',
      },
      {
        title: '닫힘 후 포커스 복귀',
        detail:
          'Escape, 취소, 확인 각각에서 모달이 닫히고 포커스가 모달을 연 버튼으로 돌아오는지 검증한다.',
      },
      {
        title: '보조기술 정보',
        detail:
          'role=dialog, aria-modal, accessible name/description이 모달 목적과 위험성을 설명하는지 확인한다.',
      },
    ],
  },
  {
    slug: 'color-contrast-audit',
    title: '색 대비와 상태 표현 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'medium',
    tools: ['axe', 'Contrast Checker'],
    summary:
      '상태 배지, 버튼, 에러 메시지가 색에만 의존하지 않고 충분한 대비로 전달되는지 검증하는 접근성 테스트 계획을 작성하세요.',
    requirement: [
      '본문, 보조 텍스트, 버튼, 배지의 색 대비가 WCAG 기준을 만족하는지 확인한다.',
      '성공/실패/경고 상태가 색상 외 텍스트나 아이콘 등으로도 구분되는지 검증한다.',
      'hover, focus, disabled 상태에서도 의미와 대비가 유지되는지 확인한다.',
      '다크 모드 또는 고대비 설정에서 정보 손실이 없는지 점검한다.',
    ],
    modelTestCases: [
      {
        title: '텍스트와 UI 대비 측정',
        detail:
          '일반 텍스트 4.5:1, 큰 텍스트 3:1, UI 컴포넌트 3:1 기준으로 주요 색 조합을 측정한다.',
      },
      {
        title: '색상 단독 전달 방지',
        detail:
          '완료/실패/경고가 색상만이 아니라 텍스트, 아이콘, aria-label 등으로 구분되는지 확인한다.',
      },
      {
        title: '상태별 대비 유지',
        detail:
          'hover, focus, disabled, selected 상태에서 대비와 의미 전달이 유지되는지 스냅샷과 측정값으로 기록한다.',
      },
    ],
  },
  {
    slug: 'accessible-data-table-audit',
    title: '데이터 테이블 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'hard',
    tools: ['Screen Reader', 'Keyboard', 'axe'],
    summary:
      '검색·정렬·페이지네이션이 있는 데이터 테이블을 스크린리더와 키보드로 탐색 가능한지 검증하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      '테이블 헤더와 셀이 의미적으로 연결되어 행·열 맥락을 이해할 수 있는지 확인한다.',
      '정렬 가능한 컬럼의 현재 정렬 상태가 보조기술에 전달되는지 검증한다.',
      '검색과 페이지 이동 후 결과 수와 현재 페이지 상태가 사용자가 인지 가능하게 갱신되는지 확인한다.',
      '키보드만으로 검색, 정렬, 페이지 이동을 완료할 수 있는지 검증한다.',
    ],
    modelTestCases: [
      {
        title: '테이블 구조와 헤더 연결',
        detail:
          'th, scope, caption 또는 accessible name으로 테이블 목적과 각 셀의 열 맥락이 전달되는지 확인한다.',
      },
      {
        title: '정렬 상태 전달',
        detail:
          '정렬 버튼의 이름과 aria-sort 또는 동등한 상태 정보가 오름차순/내림차순 변화를 정확히 알리는지 검증한다.',
      },
      {
        title: '동적 결과 갱신',
        detail:
          '검색·페이지네이션 후 결과 수와 현재 페이지가 화면과 보조기술 모두에서 인지 가능하게 갱신되는지 확인한다.',
      },
    ],
  },
  {
    slug: 'third-party-script-performance',
    title: '서드파티 스크립트 성능 영향 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'medium',
    tools: ['Performance', 'Network', 'Lighthouse'],
    summary:
      '분석, 채팅, 광고 같은 서드파티 스크립트가 초기 로딩과 상호작용 지연에 미치는 영향을 검증하는 성능 테스트 계획을 작성하세요.',
    requirement: [
      '서드파티 스크립트별 요청 수, 전송량, main thread 점유 시간을 측정한다.',
      '스크립트 로딩 전략(async, defer, lazy load)이 초기 렌더링에 미치는 영향을 확인한다.',
      '서드파티 장애나 지연 상황에서도 핵심 기능이 사용 가능한지 검증한다.',
      '제거 또는 지연 로딩 전후의 LCP, INP, TBT 변화를 비교할 증거를 정의한다.',
    ],
    modelTestCases: [
      {
        title: '스크립트별 비용 분리',
        detail:
          'Network와 Performance 결과에서 서드파티 도메인별 요청 수, bytes, long task 기여도를 분리해 기록한다.',
      },
      {
        title: '로딩 전략 검증',
        detail:
          'async/defer/lazy load 적용 전후로 초기 렌더링과 상호작용 가능 시점이 개선되는지 비교한다.',
      },
      {
        title: '장애 내성 확인',
        detail:
          '서드파티 요청 실패 또는 지연을 시뮬레이션해 로그인, 탐색, 제출 같은 핵심 흐름이 막히지 않는지 확인한다.',
      },
    ],
  },
  {
    slug: 'cache-revalidation-performance',
    title: '캐시와 재검증 성능 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'medium',
    tools: ['Network', 'Headers', 'Lighthouse'],
    summary:
      '정적 자산과 API 응답의 캐시 정책이 반복 방문 성능과 데이터 신선도에 미치는 영향을 검증하는 테스트 케이스를 작성하세요.',
    requirement: [
      '정적 자산의 Cache-Control, ETag, immutable 정책이 의도와 맞는지 확인한다.',
      'API 응답 캐시가 stale 데이터와 과도한 재요청을 만들지 않는지 검증한다.',
      '첫 방문과 재방문에서 요청 수, 전송량, 로딩 시간을 비교한다.',
      '배포 후 자산 해시 변경과 오래된 캐시 무효화가 정상 동작하는지 확인한다.',
    ],
    modelTestCases: [
      {
        title: '정적 자산 캐시 정책',
        detail:
          'JS/CSS/이미지의 Cache-Control과 파일 해시를 확인해 장기 캐시와 배포 후 갱신이 양립하는지 검증한다.',
      },
      {
        title: 'API 재검증 동작',
        detail:
          '목록/상세 API가 필요한 순간에만 재검증되고 stale 데이터가 사용자에게 오래 노출되지 않는지 확인한다.',
      },
      {
        title: '첫 방문과 재방문 비교',
        detail:
          'Disable cache와 일반 캐시 상태를 비교해 request 수, transferred bytes, load event 시간을 기록한다.',
      },
    ],
  },
  {
    slug: 'mobile-interaction-latency',
    title: '모바일 상호작용 지연 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'hard',
    tools: ['Performance', 'CPU Throttling'],
    summary:
      '저사양 모바일 환경에서 검색, 필터, 입력 같은 상호작용이 지연 없이 반응하는지 검증하는 성능 테스트 계획을 작성하세요.',
    requirement: [
      'CPU throttling과 모바일 viewport 조건을 명시하고 반복 가능한 측정 환경을 정의한다.',
      '검색 입력, 필터 변경, 모달 열기처럼 사용자가 자주 하는 상호작용을 측정 대상으로 정한다.',
      'long task, scripting time, input delay를 관찰해 지연 원인을 분리한다.',
      'debounce, virtualization, memoization 등 개선 전후를 비교할 기준을 포함한다.',
    ],
    modelTestCases: [
      {
        title: '모바일 측정 조건',
        detail:
          '모바일 viewport, Slow 4G 또는 Fast 3G, 4x CPU throttling 등 재현 가능한 조건을 고정한다.',
      },
      {
        title: '상호작용별 지연 측정',
        detail:
          '검색 타이핑, 필터 변경, 모달 오픈에서 input delay와 long task 발생 여부를 trace로 확인한다.',
      },
      {
        title: '개선 전후 비교',
        detail:
          'debounce나 리스트 최적화 적용 전후의 scripting time, dropped frame, INP 추정값을 비교한다.',
      },
    ],
  },
  {
    slug: 'search-result-rendering-performance',
    title: '검색 결과 렌더링 성능 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'medium',
    tools: ['Performance', 'React Profiler'],
    summary:
      '검색 결과가 많아질 때 렌더링 비용과 스크롤 성능이 악화되지 않는지 검증하는 성능 테스트 케이스를 작성하세요.',
    requirement: [
      '결과 수가 적을 때와 많을 때 렌더링 시간과 프레임 드랍을 비교한다.',
      '검색어 변경 시 불필요한 전체 재렌더링이 발생하는지 확인한다.',
      '페이지네이션 또는 가상화가 필요한 임계점을 정의한다.',
      '빈 결과, 빠른 연속 입력, 긴 제목 같은 경계 조건을 포함한다.',
    ],
    modelTestCases: [
      {
        title: '결과 규모별 렌더링 비교',
        detail: '10개, 100개, 1000개 결과에서 commit time, scripting time, scroll FPS를 비교한다.',
      },
      {
        title: '불필요한 재렌더링 확인',
        detail: 'React Profiler로 검색 입력 시 변경되지 않은 카드/행까지 재렌더링되는지 확인한다.',
      },
      {
        title: '경계 조건 검증',
        detail:
          '빈 결과, 매우 긴 문자열, 빠른 연속 입력에서 UI 멈춤이나 레이아웃 흔들림이 없는지 확인한다.',
      },
    ],
  },
  {
    slug: 'landmark-skiplink-accessibility',
    title: '랜드마크와 본문 건너뛰기 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'easy',
    tools: ['Keyboard', 'Screen Reader'],
    summary:
      '반복되는 네비게이션을 건너뛰고 페이지 구조를 빠르게 파악할 수 있는지 검증하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      '키보드 사용자가 본문으로 바로 이동할 수 있는 skip link가 있는지 확인한다.',
      'header, nav, main, footer 같은 landmark가 의미 있게 구성되어 있는지 검증한다.',
      '페이지 제목과 h1이 현재 페이지 목적을 명확히 설명하는지 확인한다.',
      '스크린리더 landmark 목록에서 주요 영역이 중복이나 누락 없이 탐색되는지 확인한다.',
    ],
    modelTestCases: [
      {
        title: 'skip link 동작',
        detail:
          '첫 Tab에서 본문 건너뛰기 링크가 노출되고 Enter 후 main 영역으로 포커스가 이동하는지 확인한다.',
      },
      {
        title: '랜드마크 구조',
        detail:
          'nav, main, footer가 역할에 맞게 구성되고 중첩/중복 landmark가 혼란을 만들지 않는지 점검한다.',
      },
      {
        title: '제목 구조',
        detail:
          'document title, h1, 섹션 heading이 페이지 목적과 구조를 일관되게 전달하는지 확인한다.',
      },
    ],
  },
  {
    slug: 'live-region-notification-accessibility',
    title: '동적 알림 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'medium',
    tools: ['Screen Reader', 'Keyboard'],
    summary:
      '토스트, 저장 완료, 오류 배너처럼 동적으로 나타나는 메시지가 보조기술 사용자에게 적절히 전달되는지 검증하세요.',
    requirement: [
      '저장 완료, 오류, 로딩 완료 메시지가 스크린리더에 자동으로 전달되는지 확인한다.',
      '중요도에 따라 polite/assertive live region 사용이 적절한지 검증한다.',
      '알림이 너무 빨리 사라져 읽을 수 없는 문제가 없는지 확인한다.',
      '포커스를 강제로 빼앗지 않으면서도 사용자가 상태 변화를 인지할 수 있는지 확인한다.',
    ],
    modelTestCases: [
      {
        title: 'live region 발표',
        detail:
          '저장 성공과 실패 메시지가 aria-live 또는 role=status/alert로 스크린리더에 발표되는지 확인한다.',
      },
      {
        title: '알림 지속 시간',
        detail:
          '토스트가 사용자가 읽기에 충분한 시간 유지되고 hover/focus 시 사라지지 않는지 확인한다.',
      },
      {
        title: '포커스 유지',
        detail:
          '비치명적 알림은 현재 작업 포커스를 유지하고, 치명적 오류는 적절한 요약 영역으로 안내하는지 점검한다.',
      },
    ],
  },
  {
    slug: 'touch-target-accessibility',
    title: '모바일 터치 타깃 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'medium',
    tools: ['Mobile Viewport', 'axe'],
    summary:
      '모바일 화면에서 버튼, 링크, 체크박스 같은 조작 대상이 충분한 크기와 간격을 갖는지 검증하는 접근성 테스트 계획을 작성하세요.',
    requirement: [
      '주요 터치 타깃의 크기와 간격이 WCAG 권장 기준을 만족하는지 확인한다.',
      '작은 아이콘 버튼도 accessible name과 충분한 클릭 영역을 갖는지 검증한다.',
      '한 손 사용 또는 확대 상태에서 오작동 위험이 없는지 확인한다.',
      '가로/세로 화면과 작은 viewport에서 텍스트 겹침이나 타깃 중첩이 없는지 점검한다.',
    ],
    modelTestCases: [
      {
        title: '터치 타깃 크기 측정',
        detail:
          '버튼, 링크, 체크박스, 아이콘 버튼의 실제 hit area가 최소 권장 크기와 간격을 만족하는지 측정한다.',
      },
      {
        title: '아이콘 버튼 접근성',
        detail:
          '아이콘만 있는 버튼에 accessible name이 있고, 시각적 아이콘과 동작이 일치하는지 확인한다.',
      },
      {
        title: '작은 화면 회귀 확인',
        detail:
          '320px 폭과 확대 상태에서 텍스트/타깃 겹침, 인접 버튼 오탭 위험, 가로 스크롤 발생 여부를 확인한다.',
      },
    ],
  },
  {
    slug: 'reduced-motion-accessibility',
    title: '모션 민감 사용자 설정 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'hard',
    tools: ['prefers-reduced-motion', 'DevTools'],
    summary:
      '애니메이션과 전환 효과가 모션 민감 사용자에게 부담을 주지 않도록 reduced motion 설정을 검증하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      'prefers-reduced-motion 설정에서 큰 이동, 확대, 반복 애니메이션이 줄어드는지 확인한다.',
      '모션이 줄어도 상태 변화와 화면 전환 의미가 사라지지 않는지 검증한다.',
      '자동 재생, 깜박임, 반복 효과가 사용자의 제어 없이 지속되지 않는지 확인한다.',
      '기본 모션과 reduced motion 각각에서 핵심 작업 흐름이 동일하게 가능한지 확인한다.',
    ],
    modelTestCases: [
      {
        title: 'reduced motion 적용',
        detail:
          'OS 또는 DevTools에서 prefers-reduced-motion을 켠 뒤 페이지 전환, 모달, 리스트 등장 효과가 축소되는지 확인한다.',
      },
      {
        title: '의미 보존 확인',
        detail:
          '모션이 제거되어도 선택됨, 완료, 오류 같은 상태 변화가 텍스트나 스타일로 명확히 전달되는지 검증한다.',
      },
      {
        title: '반복/깜박임 제어',
        detail:
          '자동 재생 애니메이션, 깜박임, skeleton 효과가 과도하지 않고 멈춤 또는 축소 전략을 갖는지 확인한다.',
      },
    ],
  },
  {
    slug: 'font-loading-performance',
    title: '웹폰트 로딩 성능 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'easy',
    tools: ['Network', 'Lighthouse'],
    summary:
      '웹폰트가 렌더링 지연, 레이아웃 변화, 텍스트 표시 경험에 미치는 영향을 검증하는 성능 테스트 케이스를 작성하세요.',
    requirement: [
      '폰트 파일 크기, 요청 수, preload 적용 여부를 확인한다.',
      'font-display 전략이 FOIT/FOUT와 사용자 경험에 미치는 영향을 검증한다.',
      '폰트 로딩 전후 레이아웃 변화와 CLS 영향을 확인한다.',
      '서브셋, 가변 폰트, 시스템 폰트 fallback 개선 여부를 비교한다.',
    ],
    modelTestCases: [
      {
        title: '폰트 요청 비용 확인',
        detail:
          'Network 탭에서 폰트 파일 수, 크기, 캐시 여부, preload 적용 여부를 확인하고 초기 렌더링 영향도를 기록한다.',
      },
      {
        title: '텍스트 표시 전략 검증',
        detail:
          'font-display 설정에 따라 텍스트가 보이지 않는 시간이 발생하는지, fallback 전환이 과도하게 튀지 않는지 확인한다.',
      },
      {
        title: '레이아웃 변화 측정',
        detail:
          '웹폰트 적용 전후 텍스트 폭 변화로 CLS가 증가하는지 확인하고 fallback metric 조정 필요성을 정리한다.',
      },
    ],
  },
  {
    slug: 'memory-leak-performance',
    title: '장시간 사용 메모리 누수 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'hard',
    tools: ['Memory', 'Performance Monitor'],
    summary:
      '대시보드나 리스트 화면을 장시간 사용할 때 메모리 사용량이 계속 증가하지 않는지 검증하는 성능 테스트 계획을 작성하세요.',
    requirement: [
      '반복 탐색, 검색, 모달 열기/닫기 같은 장시간 사용 시나리오를 정의한다.',
      'heap snapshot, detached node, event listener 증가 여부를 확인한다.',
      '동일 작업 반복 후 메모리가 안정화되는지 또는 지속 증가하는지 측정한다.',
      '누수 의심 지점을 재현 가능한 최소 절차와 증거로 정리한다.',
    ],
    modelTestCases: [
      {
        title: '반복 사용 시나리오',
        detail:
          '목록 검색, 상세 진입, 모달 열기/닫기, 페이지 전환을 20회 이상 반복하는 측정 절차를 정의한다.',
      },
      {
        title: '메모리 증가 관찰',
        detail:
          'Performance Monitor와 heap snapshot으로 JS heap, DOM node, event listener 수가 반복 후 안정화되는지 확인한다.',
      },
      {
        title: '누수 증거 수집',
        detail:
          'detached DOM tree 또는 해제되지 않은 listener를 snapshot diff로 확인하고 재현 URL과 단계로 리포트한다.',
      },
    ],
  },
  {
    slug: 'server-rendering-ttfb-performance',
    title: '서버 렌더링 TTFB 점검',
    track: 'performance',
    category: 'performance',
    difficulty: 'medium',
    tools: ['Network', 'WebPageTest'],
    summary:
      'SSR/동적 페이지에서 서버 응답 지연이 초기 표시 성능에 미치는 영향을 검증하는 성능 테스트 케이스를 작성하세요.',
    requirement: [
      'TTFB, server timing, HTML 응답 크기와 초기 렌더링 관계를 측정한다.',
      '캐시 hit/miss, 로그인 여부, 지역 차이에 따른 응답 시간을 비교한다.',
      '느린 DB/API 의존성이 TTFB에 미치는 영향을 추적하는 절차를 포함한다.',
      'TTFB 회귀를 배포 전 감지할 기준과 알림 조건을 정의한다.',
    ],
    modelTestCases: [
      {
        title: 'TTFB 측정 기준',
        detail:
          '동일 URL에서 cache hit/miss, 로그인/비로그인, 지역 조건을 나누어 TTFB와 server timing을 기록한다.',
      },
      {
        title: '서버 병목 추적',
        detail:
          '느린 API 호출, DB 쿼리, 동기 작업이 HTML 응답 시작을 지연시키는지 로그와 trace로 확인한다.',
      },
      {
        title: '회귀 감지 기준',
        detail: '주요 동적 route의 p95 TTFB 예산과 이전 배포 대비 증가율 기준을 정의한다.',
      },
    ],
  },
  {
    slug: 'accessible-error-summary',
    title: '폼 오류 요약 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'medium',
    tools: ['Keyboard', 'Screen Reader'],
    summary:
      '여러 필드 오류가 동시에 발생했을 때 사용자가 오류 위치와 수정 방법을 빠르게 이해할 수 있는지 검증하세요.',
    requirement: [
      '제출 실패 시 오류 요약이 제공되고 각 오류가 해당 필드로 이동 가능한지 확인한다.',
      '오류 요약과 개별 필드 오류가 중복되더라도 혼란스럽지 않게 전달되는지 검증한다.',
      '키보드와 스크린리더 사용자가 첫 오류 또는 요약으로 안내되는지 확인한다.',
      '오류 수정 후 요약과 필드 상태가 정확히 갱신되는지 검증한다.',
    ],
    modelTestCases: [
      {
        title: '오류 요약 제공',
        detail:
          '필수값 누락 제출 후 페이지 상단 또는 폼 상단에 오류 요약이 표시되고 스크린리더가 인지 가능한지 확인한다.',
      },
      {
        title: '필드 이동 연결',
        detail:
          '요약의 각 오류 링크가 해당 입력 필드로 포커스를 이동시키고 필드 오류 메시지가 함께 읽히는지 검증한다.',
      },
      {
        title: '수정 후 상태 갱신',
        detail: '오류를 수정하면 요약 항목과 aria-invalid 상태가 제거되거나 갱신되는지 확인한다.',
      },
    ],
  },
  {
    slug: 'language-and-i18n-accessibility',
    title: '언어와 다국어 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'medium',
    tools: ['Screen Reader', 'HTML Validator'],
    summary:
      '한국어/영문이 섞인 화면에서 문서 언어와 부분 언어 표시가 올바르게 전달되는지 검증하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      'html lang 값이 페이지 기본 언어와 일치하는지 확인한다.',
      '다른 언어 문구, 코드, 약어가 필요한 경우 적절히 구분되는지 검증한다.',
      '날짜, 숫자, 통화, 단위가 지역화 규칙에 맞게 읽히는지 확인한다.',
      '언어 전환 또는 번역 누락이 스크린리더 이해를 방해하지 않는지 점검한다.',
    ],
    modelTestCases: [
      {
        title: '문서 기본 언어',
        detail:
          'html lang이 ko 또는 페이지 실제 기본 언어와 일치하고 스크린리더 발음이 과도하게 어긋나지 않는지 확인한다.',
      },
      {
        title: '부분 언어와 약어 처리',
        detail:
          '영문 제품명, 코드, 약어, 외국어 문구가 필요한 경우 lang 또는 설명으로 의미가 전달되는지 점검한다.',
      },
      {
        title: '지역화 포맷 확인',
        detail: '날짜, 시간, 가격, 단위가 사용자 지역과 문맥에 맞게 표시되고 읽히는지 확인한다.',
      },
    ],
  },
  {
    slug: 'accessible-empty-loading-states',
    title: '빈 상태와 로딩 상태 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'easy',
    tools: ['Screen Reader', 'Keyboard'],
    summary:
      '목록의 빈 상태, 로딩, 오류 상태가 시각 사용자와 보조기술 사용자 모두에게 명확히 전달되는지 검증하세요.',
    requirement: [
      '로딩 중 상태가 텍스트와 보조기술 모두에 전달되는지 확인한다.',
      '빈 상태에서 다음 행동이 무엇인지 명확히 안내되는지 검증한다.',
      '오류 상태가 재시도 방법과 함께 전달되는지 확인한다.',
      '로딩 완료 후 포커스와 읽기 순서가 예상치 못하게 이동하지 않는지 점검한다.',
    ],
    modelTestCases: [
      {
        title: '로딩 상태 전달',
        detail:
          '스피너만 보이는 상태를 피하고 role=status 또는 텍스트로 현재 로딩 중임이 전달되는지 확인한다.',
      },
      {
        title: '빈 상태 행동 안내',
        detail:
          '검색 결과 없음 또는 작성 글 없음 상태에서 원인과 다음 행동이 텍스트로 명확히 제공되는지 검증한다.',
      },
      {
        title: '오류와 재시도',
        detail:
          '데이터 로딩 실패 시 오류 원인, 재시도 버튼, 포커스 유지가 키보드/스크린리더 사용자에게 적절한지 확인한다.',
      },
    ],
  },
  {
    slug: 'keyboard-accessibility-audit',
    title: '키보드 접근성 점검',
    track: 'accessibility',
    category: 'accessibility',
    difficulty: 'easy',
    tools: ['Keyboard', 'Screen Reader', 'axe'],
    summary:
      '로그인/폼 화면을 기준으로 키보드 탐색, 포커스 표시, 라벨·에러 전달을 점검하는 접근성 테스트 케이스를 작성하세요.',
    requirement: [
      'Tab/Shift+Tab만으로 주요 입력, 버튼, 링크에 순서대로 접근 가능한지 검증한다.',
      '현재 포커스 위치가 시각적으로 명확히 보이는지 확인한다.',
      '입력 필드의 이름, 설명, 에러 메시지가 보조기술에 전달되는지 검증한다.',
      '색 대비와 아이콘 단독 정보 전달처럼 시각 의존 문제가 없는지 확인한다.',
    ],
    modelTestCases: [
      {
        title: '키보드 탐색 순서',
        detail:
          '마우스 없이 Tab/Shift+Tab으로 전체 컨트롤을 이동하며 포커스 순서가 화면 흐름과 일치하고 키보드 함정이 없는지 확인한다.',
      },
      {
        title: '폼 라벨과 에러 접근성',
        detail:
          '각 입력의 접근 가능한 이름과 에러 메시지 연결을 스크린리더 또는 브라우저 접근성 트리로 확인한다.',
      },
      {
        title: '시각 의존성 점검',
        detail:
          '포커스 링, 색 대비, 아이콘 버튼의 accessible name을 확인해 색상이나 아이콘만으로 의미가 전달되지 않게 검증한다.',
      },
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
