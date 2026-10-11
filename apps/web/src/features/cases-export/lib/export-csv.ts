import { getTestCasesForExport } from '@/entities/test-case/api/server-actions';
import { CASE_CSV_COLUMNS, stepsToCsvText } from '@/entities/test-case/model/csv-columns';
import type { TestCase } from '@/entities/test-case/model/types';
import { formatDateKR } from '@testea/util';
import { toast } from 'sonner';

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = [
  CASE_CSV_COLUMNS.caseKey,
  CASE_CSV_COLUMNS.title,
  CASE_CSV_COLUMNS.testType,
  CASE_CSV_COLUMNS.tags,
  CASE_CSV_COLUMNS.preCondition,
  CASE_CSV_COLUMNS.steps,
  CASE_CSV_COLUMNS.expectedResult,
  CASE_CSV_COLUMNS.resultStatus,
  CASE_CSV_COLUMNS.suite,
  CASE_CSV_COLUMNS.createdAt,
  CASE_CSV_COLUMNS.updatedAt,
];

/**
 * 케이스 목록을 CSV 문자열로 만든다. 사전조건·단계·기대결과까지 담아
 * 같은 파일을 가져오기로 되돌릴 수 있게 한다 (#382).
 */
export function buildTestCasesCsv(
  testCases: TestCase[],
  suiteTitles: ReadonlyMap<string, string>
): string {
  const rows = testCases.map((tc) => [
    tc.caseKey,
    tc.title,
    tc.testType || '',
    (tc.tags || []).join(', '),
    tc.preCondition || '',
    stepsToCsvText(tc.testSteps || ''),
    tc.expectedResult || '',
    tc.resultStatus || '',
    tc.testSuiteId ? (suiteTitles.get(tc.testSuiteId) ?? '') : '',
    formatDateKR(tc.createdAt, ''),
    formatDateKR(tc.updatedAt, ''),
  ]);

  return [
    CSV_HEADERS.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\n');
}

/**
 * 현재 필터(스위트·검색·정렬)에 맞는 케이스 전체를 받아 CSV 로 내려받는다.
 * 화면에 보이는 한 페이지만이 아니라 필터 결과 전부를 내보낸다 (#382). 내보낸 건수를 돌려준다.
 */
export async function exportFilteredTestCases({
  projectId,
  filters,
  suiteTitles,
  projectName,
}: {
  projectId: string;
  filters: { sort?: string; search?: string; suiteId?: string };
  suiteTitles: ReadonlyMap<string, string>;
  projectName: string;
}): Promise<number> {
  const result = await getTestCasesForExport({ project_id: projectId, ...filters }).catch(
    () => null
  );
  if (!result?.success) {
    toast.error('CSV 내보내기에 실패했습니다. 다시 시도해주세요.');
    return 0;
  }
  exportTestCasesToCSV(result.data, suiteTitles, projectName);
  return result.data.length;
}

export function exportTestCasesToCSV(
  testCases: TestCase[],
  suiteTitles: ReadonlyMap<string, string>,
  projectName: string
): void {
  if (!testCases.length) {
    toast.warning('내보낼 테스트 케이스가 없습니다.');
    return;
  }

  try {
    const csvContent = buildTestCasesCsv(testCases, suiteTitles);

    // BOM for Korean Excel compatibility
    const BOM = '﻿';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `${projectName}_test-cases_${date}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);

    toast.success(`${testCases.length}건의 테스트 케이스를 CSV로 내보냈습니다.`);
  } catch {
    toast.error('CSV 내보내기에 실패했습니다. 다시 시도해주세요.');
  }
}
