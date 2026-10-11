/**
 * 서버 액션 실패 코드를 사용자 문구로 바꾼다.
 *
 * 훅은 서버 액션의 `errors` 를 `join(', ')` 한 문자열로 Error 를 던진다. 각 코드를
 * `<namespace>.messages.<CODE>` 로 번역하고, 번역이 없는 값(이미 한국어 문장 등)은
 * 그대로 둔다. 비어 있으면 fallback 을 쓴다. 클라이언트 전용 헬퍼.
 */
type Translator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export const translateErrorCodes = (t: Translator, message: string, fallback: string): string => {
  const text = message
    .split(', ')
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => (t.has(`messages.${code}`) ? t(`messages.${code}`) : code))
    .join(', ');
  return text || fallback;
};

/** 서버 액션 결과의 errors 객체를 훅이 던질 Error 메시지로 합친다. */
export const joinActionErrors = (errors: Record<string, string[]> | undefined): string =>
  Object.values(errors ?? {})
    .flat()
    .join(', ');
