import type { ColumnMapping, DetectedFormat } from './schema';

const TESTRAIL_HEADERS = [
  'ID', 'Title', 'Section', 'Type',
  'Priority', 'Steps', 'Expected Result',
];

const QASE_HEADERS = [
  'ID', 'Title', 'Suite', 'Status',
  'Priority', 'Type', 'Pre-conditions',
];

export function detectFormat(headers: string[]): DetectedFormat {
  const normalized = headers.map((h) => h.trim().toLowerCase());

  const testrailMatch = TESTRAIL_HEADERS.filter((h) =>
    normalized.includes(h.toLowerCase()),
  );
  const qaseMatch = QASE_HEADERS.filter((h) =>
    normalized.includes(h.toLowerCase()),
  );

  if (testrailMatch.length >= 4) return 'testrail';
  if (qaseMatch.length >= 4) return 'qase';
  return 'generic';
}

// ── Auto Mapping Rules ──────────────────────────────────────────
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

export function getAutoMapping(
  headers: string[],
  format: DetectedFormat,
): ColumnMapping {
  const mapping: ColumnMapping = { name: '' };

  if (format === 'generic') return mapping;

  const rules = format === 'testrail' ? TESTRAIL_MAPPING : QASE_MAPPING;

  for (const header of headers) {
    const key = header.trim().toLowerCase();
    const testeaField = rules[key];
    if (testeaField) {
      (mapping as Record<string, string>)[testeaField] = header;
    }
  }

  return mapping;
}
