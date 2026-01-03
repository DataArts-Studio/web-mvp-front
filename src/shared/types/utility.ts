export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; errors: Record<string, string[]>; message?: string };
