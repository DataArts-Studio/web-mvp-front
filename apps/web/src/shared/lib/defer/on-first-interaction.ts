/** 사용자가 페이지를 실제로 쓰기 시작했다고 보는 입력. 스크롤도 포함한다. */
const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

/**
 * 첫 상호작용 또는 timeoutMs 가 지나면(먼저 오는 쪽) callback 을 한 번만 실행한다.
 *
 * 분석·녹화 스크립트처럼 첫 화면 표시에 필요 없는 무거운 작업을 늦추는 데 쓴다.
 * 모바일에서 첫 몇 초 동안 메인 스레드를 막아 스크롤·탭이 버벅이는 것을 줄인다.
 * timeoutMs 를 두는 이유: 아무것도 누르지 않고 읽기만 하는 방문도 결국 로드되게 하기 위해서다.
 *
 * @returns 실행 전에 취소하는 함수
 */
export const onFirstInteraction = (callback: () => void, timeoutMs: number): (() => void) => {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cancel();
    callback();
  };
  const timer = window.setTimeout(run, timeoutMs);
  const cancel = () => {
    window.clearTimeout(timer);
    for (const name of INTERACTION_EVENTS) window.removeEventListener(name, run);
  };
  for (const name of INTERACTION_EVENTS) {
    window.addEventListener(name, run, { once: true, passive: true });
  }
  return () => {
    done = true;
    cancel();
  };
};
