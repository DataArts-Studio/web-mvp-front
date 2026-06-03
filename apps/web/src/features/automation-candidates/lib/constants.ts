/**
 * FDD-TR13 자동화 후보 식별 엔진 - 임계값 상수.
 *
 * 후보 판정 기준은 모두 여기 한 곳에서 관리한다. 튜닝 시 이 파일만 수정.
 */

/** 반복 빈도 임계: 서로 다른 테스트 실행(test_run) 회수가 이 값 이상이면 빈도 신호 충족. */
export const MIN_DISTINCT_RUNS = 3;

/** 결과 안정성 임계: pass율(0~1)이 이 값 이상이면 안정 신호 충족. */
export const MIN_PASS_RATE = 0.8;

/** 최근성 임계: 마지막 실행이 이 일수 이내이면 최근 신호 충족. */
export const RECENCY_DAYS = 30;

/**
 * 플래키 게이트 임계.
 *
 * pass 와 fail 이 둘 다 존재하면서 pass율이 이 값 미만이면 "플래키"로 보고
 * 점수가 높아도 후보에서 제외, 별도 flaky 그룹으로 내린다.
 * (자동화하면 매 실행마다 깨질 확률이 높아 자동화 ROI 가 낮은 케이스)
 */
export const FLAKY_PASS_RATE_CEILING = 0.8;
