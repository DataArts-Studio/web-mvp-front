/**
 * 구간 타이밍 계측. 최적화 판단(콜드스타트 vs spawn vs chromium 중 누가 지배적인지)을
 * 추측이 아니라 실측으로 내리기 위한 도구다.
 *
 * 환경변수 RUNNER_TIMING_LOG=1 일 때만 동작한다. 미설정이면 mark/flush 는 무비용 no-op 이라
 * 운영 핫패스에 켜둔 채로 둬도 부담이 없다. 산출은 stdout 한 줄 JSON (Fly 로그 grep 용).
 */

const TIMING_ENABLED =
  process.env.RUNNER_TIMING_LOG === '1' || process.env.RUNNER_TIMING_LOG === 'true';

interface Mark {
  /** 구간 이름. */
  name: string;
  /** 타이머 시작 이후 누적 ms. */
  sinceStartMs: number;
  /** 직전 mark 이후 경과 ms (이 구간 자체에 든 시간). */
  deltaMs: number;
}

export interface Timer {
  /** 한 구간이 끝난 지점을 찍는다. delta 가 그 구간에 든 시간. */
  mark(name: string): void;
  /** 누적 결과를 stdout 한 줄 JSON 으로 내보낸다. extra 로 status 등 맥락을 덧붙인다. */
  flush(extra?: Record<string, unknown>): void;
}

const NOOP_TIMER: Timer = {
  mark() {},
  flush() {},
};

/**
 * label 로 식별되는 타이머를 만든다. RUNNER_TIMING_LOG 미설정이면 no-op 타이머를 돌려준다.
 * Date.now() 기준 — 러너는 일반 Node 런타임이라 사용 가능하다.
 */
export function createTimer(label: string): Timer {
  if (!TIMING_ENABLED) return NOOP_TIMER;

  const start = Date.now();
  let last = start;
  const marks: Mark[] = [];

  return {
    mark(name: string) {
      const now = Date.now();
      marks.push({ name, sinceStartMs: now - start, deltaMs: now - last });
      last = now;
    },
    flush(extra?: Record<string, unknown>) {
      const totalMs = Date.now() - start;
      console.log(JSON.stringify({ timing: label, totalMs, marks, ...extra }));
    },
  };
}
