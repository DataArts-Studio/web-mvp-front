import type { ImportResult, NumberedImportRow, ValidatedRow } from './schema';

/**
 * 결과에 보여 줄 행 번호. 스프레드시트에서 연 것과 같도록 머리글 행을 1행으로 센다.
 * 데이터 첫 행(index 0)이 2행이다.
 */
export const toSheetRowNumber = (index: number) => index + 2;

/** 가져오기 가능한 행만 원본 행 번호와 함께 서버로 보낸다. */
export function buildImportPayload(validatedRows: ValidatedRow[]): NumberedImportRow[] {
  return validatedRows
    .filter((r) => r.isValid && r.mapped)
    .map((r) => ({ ...r.mapped!, row: toSheetRowNumber(r.index) }));
}

/**
 * 서버 결과에 미리보기 단계에서 걸러진 행(빈 행 = 건너뜀, 검증 실패 = 오류)을 합쳐
 * 파일 전체 기준의 행별 결과를 만든다 (#382).
 */
export function mergeImportResult(
  server: ImportResult,
  validatedRows: ValidatedRow[]
): ImportResult {
  const clientErrors = validatedRows
    .filter((r) => !r.isValid && r.errors.length > 0)
    .map((r) => ({ row: toSheetRowNumber(r.index), message: r.errors.join(', ') }));
  const skipped = validatedRows.filter((r) => !r.isValid && r.errors.length === 0).length;
  const errors = [...clientErrors, ...server.errors].sort((a, b) => a.row - b.row);

  return {
    total: validatedRows.length,
    success: server.success,
    failed: errors.length,
    skipped,
    errors,
  };
}
