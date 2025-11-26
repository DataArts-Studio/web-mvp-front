/*
 * 선택적(Optional) 콜백 함수 등에 유용<br/>
 * 아무 동작도 하지 않는 함수
 */
export const noop = () => {};

/**
 * 지정된 시간(ms)만큼 대기하는 비동기 함수입니다.
 *
 * @param ms - 대기할 시간 (밀리초 단위)
 * @example await sleep(1000); // 1초 대기
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 숫자가 최소값과 최대값 범위를 벗어나지 않도록 제한합니다.
 * (입력값이 최소값보다 작으면 최소값을, 최대값보다 크면 최대값을 반환)
 *
 * @param value - 제한할 입력 값
 * @param min - 허용 가능한 최소값
 * @param max - 허용 가능한 최대값
 */
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * 문자열 기반의 data 속성을 조건부로 설정
 *
 * @param condition - data 속성을 활성화할지 결정하는 조건값 (true면 속성 포함, false/null/undefined면 속성 제거)
 */
export const dataAttr = (condition: boolean | undefined | null) => (condition ? '' : undefined);