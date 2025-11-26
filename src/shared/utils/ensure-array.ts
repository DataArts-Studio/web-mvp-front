/**
 * 입력값이 배열이면 그대로 반환하<br/>
 * 단일 값이면 배열로 감싸서 반환<br/>
 * null/undefined면 빈 배열을 반환합니다.
 * @example
 * ensureArray('hello')   // ['hello']
 * ensureArray(['hello']) // ['hello']
 * ensureArray(undefined) // []
 */
export const ensureArray = <T,>(value: T | T[] | undefined | null): T[] => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}