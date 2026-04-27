import React from 'react';

/**
 * 두 개의 이벤트 핸들러를 합성<br/>
 * 기본 동작이 방지(preventDefault)된 경우
 * 두 번째 핸들러의 실행을 건너뛸 수 있음.

 * @param originalHandler - 외부(사용자)에서 전달받은 핸들러 (먼저 실행됨)
 * @param ourHandler - 내부(라이브러리)에서 정의한 핸들러 (나중에 실행됨)
 * @param options - 옵션 객체
 * @param options.checkDefaultPrevented - true일 경우 originalHandler에서 preventDefault()가 호출되면 ourHandler를 실행하지 않음
 */
export const composeEventHandlers = <E extends React.SyntheticEvent>(
  originalHandler?: ((e: E) => void) | undefined,
  ourHandler?: (e: E) => void,
  options?: { checkDefaultPrevented?: boolean }
) => {
  return (e: E) => {
    // 사용자 핸들러 먼저 실행
    originalHandler?.(e);

    // checkDefaultPrevented 옵션이 켜져있고
    // 사용자가 preventDefault()를 했다면
    // 내부 핸들러는 실행하지 않고 종료
    if (options?.checkDefaultPrevented && e.defaultPrevented)  return;

    // 내부 핸들러 실행
    ourHandler?.(e);
  }
};
