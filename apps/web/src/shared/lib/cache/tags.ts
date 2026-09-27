import { revalidateTag, updateTag } from 'next/cache';

/**
 * 서버 컴포넌트 프리패치 캐시(prefetch.ts) 태그와, 도메인별로 함께 무효화할 태그 묶음.
 *
 * 태그는 프로젝트별이 아니라 도메인 전역이다. 넓게 무효화해도 다음 요청에서 다시 채울 뿐이라
 * 비용이 작으므로, 화면에 같이 드러나는 집계(대시보드·마일스톤 진행률 등)까지 묶어서 비운다.
 */
export const CACHE_TAGS = {
  project: 'project',
  testCases: 'test-cases',
  testSuites: 'test-suites',
  milestones: 'milestones',
  dashboard: 'dashboard',
  testRuns: 'test-runs',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

const T = CACHE_TAGS;

export const INVALIDATE = {
  /** 케이스 생성·수정·삭제·정렬. 마일스톤 통계에 케이스 수가 들어간다. */
  cases: [T.testCases, T.dashboard, T.milestones],
  /** 스위트 변경. 케이스 목록이 스위트 이름을 함께 보여준다. */
  suites: [T.testSuites, T.testCases, T.dashboard, T.milestones],
  milestones: [T.milestones, T.dashboard],
  /** 실행·케이스 실행 결과. 마일스톤 진행률에 실행 결과가 들어간다. */
  runs: [T.testRuns, T.dashboard, T.milestones],
  project: [T.project, T.dashboard],
  all: Object.values(T),
} as const satisfies Record<string, readonly CacheTag[]>;

/**
 * 서버 액션에서 mutation 성공 후 호출한다. updateTag 는 즉시 만료시켜, 같은 요청 흐름에서
 * 이어지는 렌더가 방금 쓴 데이터를 읽게 한다(read-your-own-writes).
 * 무효화 실패가 이미 끝난 mutation 을 실패로 만들지 않도록 예외를 삼킨다.
 */
export function invalidateCache(tags: readonly CacheTag[]): void {
  for (const tag of tags) {
    try {
      updateTag(tag);
    } catch (error) {
      console.error(`[cache] updateTag(${tag}) 실패`, error);
    }
  }
}

/** 라우트 핸들러용. updateTag 는 서버 액션 전용이라 즉시 만료 프로필로 revalidateTag 를 쓴다. */
export function invalidateCacheFromRoute(tags: readonly CacheTag[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (error) {
      console.error(`[cache] revalidateTag(${tag}) 실패`, error);
    }
  }
}
