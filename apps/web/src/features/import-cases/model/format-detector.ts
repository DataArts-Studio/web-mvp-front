import { CASE_CSV_COLUMNS } from '@/entities/test-case/model/csv-columns';

import type { ColumnMapping, DetectedFormat } from './schema';

// Testea 에서 내보낸 CSV. 제목과 함께 아래 열이 충분히 있으면 Testea 형식으로 본다 (#382).
const TESTEA_HEADERS: string[] = [
  CASE_CSV_COLUMNS.caseKey,
  CASE_CSV_COLUMNS.testType,
  CASE_CSV_COLUMNS.tags,
  CASE_CSV_COLUMNS.preCondition,
  CASE_CSV_COLUMNS.steps,
  CASE_CSV_COLUMNS.expectedResult,
];

const TESTRAIL_HEADERS = ['ID', 'Title', 'Section', 'Type', 'Priority', 'Steps', 'Expected Result'];

const QASE_HEADERS = ['ID', 'Title', 'Suite', 'Status', 'Priority', 'Type', 'Pre-conditions'];

export function detectFormat(headers: string[]): DetectedFormat {
  const trimmed = headers.map((h) => h.trim());
  const normalized = trimmed.map((h) => h.toLowerCase());

  const testeaMatch = TESTEA_HEADERS.filter((h) => trimmed.includes(h));
  const testrailMatch = TESTRAIL_HEADERS.filter((h) => normalized.includes(h.toLowerCase()));
  const qaseMatch = QASE_HEADERS.filter((h) => normalized.includes(h.toLowerCase()));

  if (trimmed.includes(CASE_CSV_COLUMNS.title) && testeaMatch.length >= 3) return 'testea';
  if (testrailMatch.length >= 4) return 'testrail';
  if (qaseMatch.length >= 4) return 'qase';
  return 'generic';
}

// ── Auto Mapping Rules ──────────────────────────────────────────
const TESTEA_MAPPING: Record<string, keyof ColumnMapping> = {
  [CASE_CSV_COLUMNS.title]: 'name',
  [CASE_CSV_COLUMNS.testType]: 'testType',
  [CASE_CSV_COLUMNS.tags]: 'tags',
  [CASE_CSV_COLUMNS.preCondition]: 'preCondition',
  [CASE_CSV_COLUMNS.steps]: 'steps',
  [CASE_CSV_COLUMNS.expectedResult]: 'expectedResult',
};

const TESTRAIL_MAPPING: Record<string, keyof ColumnMapping> = {
  title: 'name',
  type: 'testType',
  preconditions: 'preCondition',
  steps: 'steps',
  'expected result': 'expectedResult',
};

const QASE_MAPPING: Record<string, keyof ColumnMapping> = {
  title: 'name',
  type: 'testType',
  'pre-conditions': 'preCondition',
  steps: 'steps',
  'expected result': 'expectedResult',
  tags: 'tags',
};

export function getAutoMapping(headers: string[], format: DetectedFormat): ColumnMapping {
  const mapping: ColumnMapping = { name: '' };

  if (format === 'generic') return mapping;

  const rules =
    format === 'testea' ? TESTEA_MAPPING : format === 'testrail' ? TESTRAIL_MAPPING : QASE_MAPPING;

  for (const header of headers) {
    const key = format === 'testea' ? header.trim() : header.trim().toLowerCase();
    const testeaField = rules[key];
    if (testeaField) {
      (mapping as Record<string, string>)[testeaField] = header;
    }
  }

  return mapping;
}
