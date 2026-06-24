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
export type ChallengeCategory = 'auth' | 'forms' | 'data' | 'interaction' | 'async';

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
};

/** 목록에 카테고리를 노출할 순서. */
export const CATEGORY_ORDER: ChallengeCategory[] = [
  'auth',
  'forms',
  'data',
  'interaction',
  'async',
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
    category: 'forms',
    difficulty: 'medium',
    tools: ['Testea'],
    summary:
      '주문 폼에 의도적으로 심은 결함을 탐색적 테스트로 찾아내세요. 자동화가 아니라 직접 살펴보는 수동 테스트입니다.',
    requirement: [
      '합계 금액이 단가·수량·배송비와 맞는지 계산을 확인하세요.',
      '수량 입력에 0이나 음수 같은 비정상 값을 넣어 보세요.',
      '받는 사람을 비운 채로 주문이 완료되는지 확인하세요.',
      '발견한 결함을 재현 절차·기대 결과·실제 결과로 정리해 보세요.',
    ],
    sandboxSlug: 'order-form',
  },
  {
    slug: 'test-design-password-reset',
    title: '테스트 케이스 설계: 비밀번호 재설정',
    track: 'manual',
    category: 'auth',
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
