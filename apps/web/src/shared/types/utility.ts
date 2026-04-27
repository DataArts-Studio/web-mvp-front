export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; errors: Record<string, string[]>; message?: string };

/** ActionResult의 실패 케이스만 추출한 타입 */
export type ActionFailure = Extract<ActionResult<never>, { success: false }>;

/** Zod safeParse .flatten() 결과 타입 */
export type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};
