/**
 * 챌린지 레지스트리 (MVP).
 *
 * - 아직 DB 없이 정적 정의로 시작한다. 폐루프(제출→러너→채점)가 증명되면
 *   exercises 스키마로 옮긴다(FDD-QG05/QG09).
 * - sandboxSlug 가 가리키는 `/sandbox/[slug]` 가 실제 테스트 대상 페이지다.
 */

export type ChallengeTrack = 'automation' | 'manual' | 'api';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface ChallengeSelector {
  name: string;
  testid: string;
  desc: string;
}

export interface Challenge {
  slug: string;
  title: string;
  track: ChallengeTrack;
  difficulty: ChallengeDifficulty;
  tools: string[];
  summary: string;
  /** 요구사항: 이 항목들을 검증하는 테스트를 작성한다. */
  requirement: string[];
  /** 테스트 대상 샌드박스 경로 슬러그 (`/sandbox/[sandboxSlug]`). */
  sandboxSlug: string;
  /** 학습자가 참고할 안정적 셀렉터. */
  selectors: ChallengeSelector[];
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

export const CHALLENGES: Challenge[] = [
  {
    slug: 'login-basic',
    title: '로그인 폼 자동화',
    track: 'automation',
    difficulty: 'easy',
    tools: ['Playwright', 'Cypress', 'Selenium'],
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
];

export function getChallenge(slug: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.slug === slug);
}
