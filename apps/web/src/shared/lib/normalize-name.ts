/**
 * 사용자가 입력한 이름(프로젝트·스위트·케이스·마일스톤 등)을 저장 전에 정규화한다.
 *
 * 클라이언트 스키마를 거치지 않고 서버 액션이 직접 호출될 수 있으므로, 서버 액션은
 * 길이 검사 전에 반드시 이 함수로 앞뒤 공백을 제거해야 한다. 공백만 있는 이름이
 * 길이 검사를 통과해 빈 이름으로 저장되는 것을 막는다 (#374).
 */
export const normalizeName = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/** 정규화한 이름이 비어 있지 않고 최대 길이 이내면 이름을, 아니면 null 을 돌려준다. */
export const toValidName = (value: unknown, maxLength: number): string | null => {
  const result = validateName(value, maxLength);
  return result.ok ? result.name : null;
};

export type NameValidation =
  | { ok: true; name: string }
  | { ok: false; reason: 'empty' | 'too_long' };

/** toValidName 과 같지만, 실패 이유(빈 이름·길이 초과)를 구분해 돌려준다 (#412). */
export const validateName = (value: unknown, maxLength: number): NameValidation => {
  const name = normalizeName(value);
  if (name.length === 0) return { ok: false, reason: 'empty' };
  if (name.length > maxLength) return { ok: false, reason: 'too_long' };
  return { ok: true, name };
};

/**
 * 이름 뒤에 접미사(예: " (복사)")를 붙이되, 결과가 최대 길이를 넘지 않게 앞 이름을 자른다 (#412).
 * 글자(코드 포인트) 단위로 자르므로 이모지 같은 문자가 반으로 갈라지지 않는다.
 */
export const withSuffix = (name: string, suffix: string, maxLength: number): string => {
  const base = Array.from(name);
  while (base.length > 0 && base.join('').length + suffix.length > maxLength) base.pop();
  return `${base.join('').trimEnd()}${suffix}`;
};
