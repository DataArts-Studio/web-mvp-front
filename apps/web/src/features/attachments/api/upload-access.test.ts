// @vitest-environment node
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import { createSupabaseServerClient, getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadAttachment } from './actions';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@/shared/lib/storage/check-storage-limit', () => ({ checkStorageLimit: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const PROJECT_B = '00000000-0000-4000-8000-000000000002';
const CASE_ID = '00000000-0000-4000-8000-000000000003';
const limit = vi.fn();
const upload = vi.fn();
const returning = vi.fn();
const values = vi.fn(() => ({ returning }));
const db = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Object.assign(Promise.resolve([]), { limit })),
    })),
  })),
  insert: vi.fn(() => ({ values })),
};

function attachmentForm() {
  const form = new FormData();
  form.set('file', new File(['test evidence'], 'evidence.txt', { type: 'text/plain' }));
  form.set('projectId', PROJECT_A);
  form.set('testCaseId', CASE_ID);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  vi.mocked(checkStorageLimit).mockResolvedValue(null);
  limit.mockResolvedValue([{ projectId: PROJECT_A }]);
  upload.mockResolvedValue({ error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    storage: { from: vi.fn(() => ({ upload })) },
  } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  returning.mockResolvedValue([
    {
      id: 'attachment-id',
      test_case_id: CASE_ID,
      project_id: PROJECT_A,
      file_name: 'evidence.txt',
      file_size: 13,
      file_type: 'text/plain',
      storage_path: `${PROJECT_A}/${CASE_ID}/evidence.txt`,
      created_at: new Date(),
    },
  ]);
});

describe('첨부 업로드의 프로젝트 경계', () => {
  it('무인증 요청은 케이스 조회와 업로드 전에 거부한다.', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect((await uploadAttachment(attachmentForm())).success).toBe(false);
    expect(db.select).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['다른 프로젝트의 케이스', [{ projectId: PROJECT_B }]],
    ['존재하지 않는 케이스', []],
  ])('%s에는 업로드하지 않는다.', async (_label, rows) => {
    limit.mockResolvedValue(rows);
    expect(await uploadAttachment(attachmentForm())).toEqual({
      success: false,
      errors: { _attachment: ['접근 권한이 없습니다.'] },
    });
    expect(requireProjectAccess).toHaveBeenCalledWith(PROJECT_A);
    expect(checkStorageLimit).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('같은 프로젝트의 정상 첨부는 기존 응답으로 저장한다.', async () => {
    const result = await uploadAttachment(attachmentForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ projectId: PROJECT_A, testCaseId: CASE_ID });
    }
    expect(upload).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: PROJECT_A, test_case_id: CASE_ID })
    );
  });
});
