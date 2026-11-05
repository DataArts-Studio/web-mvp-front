/**
 * Postgres 유니크 제약 위반(23505)인지 확인한다.
 * drizzle 은 드라이버 오류를 cause 로 감싸 던지므로 감싼 오류와 원래 오류를 모두 본다.
 */
export const isUniqueViolation = (error: unknown): boolean => {
  const codeOf = (value: unknown) =>
    typeof value === 'object' && value !== null && 'code' in value
      ? (value as { code?: unknown }).code
      : undefined;
  if (codeOf(error) === '23505') return true;
  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause?: unknown }).cause
      : undefined;
  return codeOf(cause) === '23505';
};
