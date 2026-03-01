import { z } from 'zod';

// ── Column Mapping ──────────────────────────────────────────────
export const columnMappingSchema = z.object({
  name: z.string().min(1, '이름 필드 매핑은 필수입니다'),
  testType: z.string().optional(),
  tags: z.string().optional(),
  preCondition: z.string().optional(),
  steps: z.string().optional(),
  expectedResult: z.string().optional(),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;

// ── Import Row ──────────────────────────────────────────────────
export const importRowSchema = z.object({
  name: z
    .string()
    .min(1, '이름은 필수입니다')
    .max(200, '이름이 200자를 초과합니다'),
  testType: z.string().max(50).optional(),
  tags: z
    .array(z.string().max(20, '태그는 20자 이내'))
    .optional(),
  preCondition: z.string().optional(),
  steps: z.string().optional(),
  expectedResult: z.string().optional(),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

// ── Import Request ──────────────────────────────────────────────
export const importRequestSchema = z.object({
  projectId: z.string().uuid(),
  suiteId: z.string().uuid(),
  rows: z
    .array(importRowSchema)
    .min(1, '가져올 데이터가 없습니다')
    .max(2000, '최대 2,000건까지 가져올 수 있습니다'),
});

export type ImportRequestInput = z.infer<typeof importRequestSchema>;

// ── Parse Result ────────────────────────────────────────────────
export type DetectedFormat = 'testrail' | 'qase' | 'generic';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  detectedFormat: DetectedFormat;
}

// ── Validated Row ───────────────────────────────────────────────
export interface ValidatedRow {
  index: number;
  data: Record<string, string>;
  mapped: ImportRowInput | null;
  isValid: boolean;
  errors: string[];
}

// ── Import Result ───────────────────────────────────────────────
export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}
