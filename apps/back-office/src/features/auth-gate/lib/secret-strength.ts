/** 공유키 권장 최소 길이. 짧아도 막지는 않고(운영 잠김 방지) 한 번만 경고한다. */
export const MIN_SECRET_LENGTH = 32;
let weakSecretWarned = false;

/** 공유키가 권장 길이보다 짧으면 프로세스당 한 번 경고한다. */
export function warnIfWeakSecret(secret: string): void {
  // 서로게이트 쌍(이모지 등)도 한 글자로 센다.
  if (weakSecretWarned || Array.from(secret).length >= MIN_SECRET_LENGTH) return;
  weakSecretWarned = true;
  console.warn(
    `[auth-gate] BACKOFFICE_ADMIN_SECRET 이 ${MIN_SECRET_LENGTH}자보다 짧습니다. 더 긴 무작위 키로 교체하세요.`
  );
}
