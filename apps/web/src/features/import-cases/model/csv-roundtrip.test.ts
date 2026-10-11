import { csvTextToSteps } from '@/entities/test-case/model/csv-columns';
import type { TestCase } from '@/entities/test-case/model/types';
import { buildTestCasesCsv } from '@/features/cases-export/lib/export-csv';
import Papa from 'papaparse';
import { describe, expect, it, vi } from 'vitest';

import { detectFormat, getAutoMapping } from './format-detector';
import { buildImportPayload, mergeImportResult } from './import-report';
import { validateRows } from './validator';

vi.mock('@/entities/test-case/api/server-actions', () => ({ getTestCasesForExport: vi.fn() }));

const makeCase = (n: number): TestCase => ({
  id: `case-${n}`,
  projectId: 'project-1',
  testSuiteId: 'suite-1',
  sectionId: null,
  displayId: n,
  caseKey: `TC-${String(n).padStart(3, '0')}`,
  title: `로그인 케이스 ${n}, "따옴표" 포함`,
  testType: 'functional',
  tags: ['login', `tag-${n}`],
  preCondition: `회원 ${n} 이 가입돼 있다`,
  testSteps: JSON.stringify(['아이디 입력', '비밀번호 입력', '로그인 클릭']),
  expectedResult: `대시보드로 이동한다\n환영 문구 ${n}`,
  sortOrder: n,
  resultStatus: 'pass',
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-02T00:00:00Z'),
  archivedAt: null,
  lifecycleStatus: 'ACTIVE',
});

describe('CSV 내보내기 → 가져오기 왕복 (#382)', () => {
  const cases = Array.from({ length: 30 }, (_, i) => makeCase(i + 1));
  const csv = buildTestCasesCsv(cases, new Map([['suite-1', '로그인']]));
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields ?? [];

  it('30건 전부를 사전조건·단계·기대결과까지 담아 내보낸다', () => {
    expect(parsed.data).toHaveLength(30);
    expect(headers).toEqual(
      expect.arrayContaining(['제목', '사전조건', '단계', '기대결과', '태그', '테스트 유형'])
    );
    expect(parsed.data[0]['단계']).toBe('1. 아이디 입력\n2. 비밀번호 입력\n3. 로그인 클릭');
    expect(parsed.data[0]['스위트']).toBe('로그인');
  });

  it('내보낸 파일은 Testea 형식으로 자동 매핑되고 모든 행이 원래 값으로 돌아온다', () => {
    const format = detectFormat(headers);
    expect(format).toBe('testea');

    const mapping = getAutoMapping(headers, format);
    expect(mapping).toEqual({
      name: '제목',
      testType: '테스트 유형',
      tags: '태그',
      preCondition: '사전조건',
      steps: '단계',
      expectedResult: '기대결과',
    });

    const payload = buildImportPayload(validateRows(parsed.data, mapping));
    expect(payload).toHaveLength(30);
    payload.forEach((row, i) => {
      const original = cases[i];
      expect(row.row).toBe(i + 2);
      expect(row.name).toBe(original.title);
      expect(row.testType).toBe(original.testType);
      expect(row.tags).toEqual(original.tags);
      expect(row.preCondition).toBe(original.preCondition);
      expect(row.expectedResult).toBe(original.expectedResult);
      expect(csvTextToSteps(row.steps ?? '')).toBe(original.testSteps);
    });
  });
});

describe('가져오기 행별 결과 합치기', () => {
  it('빈 행은 건너뜀, 미리보기 검증 실패와 서버 오류는 행 번호와 함께 오류로 모은다', () => {
    const validated = validateRows(
      [{ 제목: '정상' }, { 제목: '' }, { 제목: 'x'.repeat(201) }, { 제목: '서버 실패' }],
      { name: '제목' }
    );

    const merged = mergeImportResult(
      {
        total: 2,
        success: 1,
        failed: 1,
        skipped: 0,
        errors: [{ row: 5, message: '저장하지 못했습니다.' }],
      },
      validated
    );

    expect(merged.total).toBe(4);
    expect(merged.success).toBe(1);
    expect(merged.skipped).toBe(1);
    expect(merged.errors).toEqual([
      { row: 4, message: '이름이 200자를 초과합니다' },
      { row: 5, message: '저장하지 못했습니다.' },
    ]);
    expect(merged.failed).toBe(2);
  });
});
