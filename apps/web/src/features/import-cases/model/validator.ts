import type { ColumnMapping, ImportRowInput, ValidatedRow } from './schema';
import { importRowSchema } from './schema';

function transformRow(
  row: Record<string, string>,
  mapping: ColumnMapping,
): ImportRowInput {
  const tagsRaw = mapping.tags ? row[mapping.tags]?.trim() : undefined;
  return {
    name: row[mapping.name]?.trim() ?? '',
    testType: mapping.testType ? row[mapping.testType]?.trim() || undefined : undefined,
    tags: tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined,
    preCondition: mapping.preCondition
      ? row[mapping.preCondition]?.trim() || undefined
      : undefined,
    steps: mapping.steps ? row[mapping.steps]?.trim() || undefined : undefined,
    expectedResult: mapping.expectedResult
      ? row[mapping.expectedResult]?.trim() || undefined
      : undefined,
  };
}

function isEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => !v || !v.trim());
}

export function validateRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): ValidatedRow[] {
  return rows.map((row, index) => {
    if (isEmptyRow(row)) {
      return { index, data: row, mapped: null, isValid: false, errors: [] };
    }

    const mapped = transformRow(row, mapping);
    const result = importRowSchema.safeParse(mapped);

    if (result.success) {
      return { index, data: row, mapped, isValid: true, errors: [] };
    }

    const errors = result.error.issues.map((issue) => issue.message);
    return { index, data: row, mapped: null, isValid: false, errors };
  });
}
