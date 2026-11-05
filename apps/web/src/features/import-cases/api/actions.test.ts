import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importTestCases } from './actions';

const PROJECT_ID = '019c388f-7380-7468-bdbe-579b90481738';
const SUITE_ID = '019c388f-7380-7468-bdbe-579b90481739';

const { db, insertedRows, batchShouldFail, failingNames } = vi.hoisted(() => {
  const insertedRows: Array<Record<string, unknown>> = [];
  const state = { batchShouldFail: { value: false }, failingNames: new Set<string>() };
  const db: Record<string, unknown> = {
    select: vi.fn(() => ({
      from: () => ({ where: () => Promise.resolve([{ max: 0 }]) }),
    })),
    insert: vi.fn(() => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        const list = Array.isArray(values) ? values : [values];
        const fail = Array.isArray(values)
          ? state.batchShouldFail.value
          : state.failingNames.has(String(list[0].name));
        const run = () => {
          if (fail) return Promise.reject(new Error('insert failed'));
          insertedRows.push(...list);
          return Promise.resolve(list);
        };
        return {
          returning: run,
          then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
            run().then(resolve, reject),
        };
      },
    })),
  };
  db.transaction = vi.fn((cb: (tx: typeof db) => unknown) => cb(db));
  return { db, insertedRows, ...state };
});

vi.mock('@testea/db', () => ({
  getDatabase: () => db,
  testCases: {
    id: 'id',
    display_id: 'display_id',
    sort_order: 'sort_order',
    project_id: 'project_id',
    lifecycle_status: 'lifecycle_status',
  },
}));
vi.mock('@/entities/test-case/api/case-number-lock', () => ({
  lockCaseNumbers: vi.fn(async () => undefined),
  toCaseKey: (displayId: number) => `TC-${String(displayId).padStart(3, '0')}`,
}));
const { recordCreatedCases } = vi.hoisted(() => ({
  recordCreatedCases: vi.fn(async () => undefined),
}));
vi.mock('@/entities/test-case/api/record-created-cases', () => ({ recordCreatedCases }));
vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn(async () => true) }));
vi.mock('@/access/lib/project-scope', () => ({ belongsToProject: vi.fn(async () => true) }));
vi.mock('@/shared/lib/storage/check-storage-limit', () => ({
  checkStorageLimit: vi.fn(async () => null),
}));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: { cases: [] }, invalidateCache: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

describe('importTestCases 행별 결과 (#382)', () => {
  beforeEach(() => {
    insertedRows.length = 0;
    batchShouldFail.value = false;
    failingNames.clear();
    recordCreatedCases.mockClear();
  });

  it('가져온 케이스도 v1 버전·실행 동기화를 공용 함수로 남긴다 (#391)', async () => {
    await importTestCases({
      projectId: PROJECT_ID,
      suiteId: SUITE_ID,
      rows: [
        { row: 2, name: '첫 케이스' },
        { row: 3, name: '두 번째' },
      ],
    });

    expect(recordCreatedCases).toHaveBeenCalledTimes(1);
    const [, rows, summary] = recordCreatedCases.mock.calls[0] as unknown as [
      unknown,
      Array<Record<string, unknown>>,
      string,
    ];
    expect(rows.map((r) => r.name)).toEqual(['첫 케이스', '두 번째']);
    expect(rows.every((r) => r.test_suite_id === SUITE_ID)).toBe(true);
    expect(summary).toBe('CSV 가져오기로 생성');
  });

  it('잘못된 행이 있어도 나머지 행은 가져오고 잘못된 행 번호를 알려 준다', async () => {
    const result = await importTestCases({
      projectId: PROJECT_ID,
      suiteId: SUITE_ID,
      rows: [
        { row: 2, name: '첫 케이스', steps: '1. 열기\n2. 닫기' },
        { row: 3, name: '' },
        { row: 4, name: '세 번째' },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.success).toBe(2);
    expect(result.data.errors).toEqual([{ row: 3, message: '이름은 필수입니다' }]);
    expect(insertedRows.map((r) => r.name)).toEqual(['첫 케이스', '세 번째']);
    // 번호 목록 단계는 저장 형식(JSON 배열)으로 바뀐다.
    expect(insertedRows[0].steps).toBe(JSON.stringify(['열기', '닫기']));
  });

  it('한 번에 넣기가 실패하면 행마다 다시 넣고 실패한 행만 오류로 남긴다', async () => {
    batchShouldFail.value = true;
    failingNames.add('깨진 행');

    const result = await importTestCases({
      projectId: PROJECT_ID,
      suiteId: SUITE_ID,
      rows: [
        { row: 2, name: '정상 1' },
        { row: 3, name: '깨진 행' },
        { row: 4, name: '정상 2' },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.success).toBe(2);
    expect(result.data.errors).toEqual([{ row: 3, message: '저장하지 못했습니다.' }]);
    // 실패한 행이 케이스 번호를 차지하지 않는다.
    expect(insertedRows.map((r) => r.case_key)).toEqual(['TC-001', 'TC-002']);
    // 실제로 들어간 행만 버전·실행 동기화 대상이 된다.
    const [, rows] = recordCreatedCases.mock.calls[0] as unknown as [
      unknown,
      Array<Record<string, unknown>>,
    ];
    expect(rows.map((r) => r.name)).toEqual(['정상 1', '정상 2']);
  });
});
