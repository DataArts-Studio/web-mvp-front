/**
 * 서버 액션이 반환한 메시지 코드(UPPER_SNAKE)를 `cases.messages.<CODE>` 카탈로그로 번역한다.
 * 알 수 없는 코드는 `t.has` 가드로 원본 문자열을 그대로 폴백한다.
 *
 * 클라이언트 전용 헬퍼. `useTranslations('cases')` 로 얻은 `t` 를 주입해 사용한다.
 */
type Translator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/** 단일 코드 → 번역. 알 수 없는 코드는 원본 반환. */
export function translateCaseMessage(t: Translator, code: string): string {
  const key = `messages.${code}`;
  return t.has(key) ? t(key) : code;
}

/**
 * 콤마로 합쳐진 코드 목록(에러 메시지)을 각각 번역해 다시 합친다.
 * 서버 액션 결과의 `errors` 를 hooks 가 `join(', ')` 한 문자열을 받는다.
 */
export function translateCaseErrors(t: Translator, message: string): string {
  return message
    .split(', ')
    .map((code) => translateCaseMessage(t, code.trim()))
    .join(', ');
}
