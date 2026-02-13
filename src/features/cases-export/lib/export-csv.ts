import type { TestCaseCardType } from '@/entities/test-case';
import { formatDateKR } from '@/shared/utils/date-format';
import { toast } from 'sonner';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = [
  '케이스 키',
  '제목',
  '테스트 유형',
  '태그',
  '사전 조건',
  '테스트 단계',
  '기대 결과',
  '결과 상태',
  '스위트',
  '생성일',
  '수정일',
] as const;

export function exportTestCasesToCSV(testCases: TestCaseCardType[], projectName: string): void {
  if (!testCases.length) {
    toast.warning('내보낼 테스트 케이스가 없습니다.');
    return;
  }

  try {
    const rows = testCases.map((tc) => [
      tc.caseKey,
      tc.title,
      tc.testType || '',
      (tc.tags || []).join(', '),
      tc.preCondition || '',
      tc.testSteps || '',
      tc.expectedResult || '',
      tc.resultStatus || '',
      tc.suiteTitle || '',
      formatDateKR(tc.createdAt, ''),
      formatDateKR(tc.updatedAt, ''),
    ]);

    const csvContent = [
      CSV_HEADERS.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\n');

    // BOM for Korean Excel compatibility
    const BOM = '\uFEFF';
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
