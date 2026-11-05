import { unprotectCsvFormula } from '@/entities/test-case/model/csv-columns';

import type { ColumnMapping, DetectedFormat, ImportRowInput, ValidatedRow } from './schema';
import { importRowSchema } from './schema';

function transformRow(
  row: Record<string, string>,
  mapping: ColumnMapping,
  format: DetectedFormat
): ImportRowInput {
  // Testea 에서 내보낸 파일은 수식 방지용 작은따옴표를 붙여 두었으므로 떼고 읽는다.
  const read = (column: string | undefined) => {
    const value = column ? row[column]?.trim() : undefined;
    if (value === undefined) return undefined;
    return format === 'testea' ? unprotectCsvFormula(value).trim() : value;
  };
  const tagsRaw = read(mapping.tags);
  return {
    name: read(mapping.name) ?? '',
    testType: read(mapping.testType) || undefined,
    tags: tagsRaw
      ? tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    preCondition: read(mapping.preCondition) || undefined,
    steps: read(mapping.steps) || undefined,
    expectedResult: read(mapping.expectedResult) || undefined,
  };
}

function isEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => !v || !v.trim());
}

export function validateRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  format: DetectedFormat = 'generic'
): ValidatedRow[] {
  return rows.map((row, index) => {
    if (isEmptyRow(row)) {
      return { index, data: row, mapped: null, isValid: false, errors: [] };
    }

    const mapped = transformRow(row, mapping, format);
    const result = importRowSchema.safeParse(mapped);

    if (result.success) {
      return { index, data: row, mapped, isValid: true, errors: [] };
    }

    const errors = result.error.issues.map((issue) => issue.message);
    return { index, data: row, mapped: null, isValid: false, errors };
  });
}
