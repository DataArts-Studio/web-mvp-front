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
const createSignedUrls = vi.fn();
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
  createSignedUrls.mockImplementation(async (paths: string[]) => ({
    data: paths.map((path) => ({ path, signedUrl: `https://signed.example/${path}`, error: null })),
    error: null,
  }));
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    storage: { from: vi.fn(() => ({ upload, createSignedUrls })) },
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
      expect(result.data.url).toBe(`https://signed.example/${PROJECT_A}/${CASE_ID}/evidence.txt`);
      expect(result.data.url).not.toContain('/object/public/');
    }
    expect(upload).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: PROJECT_A, test_case_id: CASE_ID })
    );
  });

  it('저장 뒤 서명 URL 발급만 실패하면 업로드는 성공으로 돌려준다.', async () => {
    createSignedUrls.mockResolvedValue({ data: null, error: new Error('sign failed') });
    const result = await uploadAttachment(attachmentForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ id: 'attachment-id', url: '' });
    }
    expect(upload).toHaveBeenCalledOnce();
  });
});

describe('첨부 업로드의 파일 형식 확인', () => {
  function formWith(file: File) {
    const form = attachmentForm();
    form.set('file', file);
    return form;
  }

  it('이미지로 주장했지만 바이트가 다르면 업로드하지 않는다.', async () => {
    const spoofed = new File(['<html><script>alert(1)</script></html>'], 'x.png', {
      type: 'image/png',
    });
    expect(await uploadAttachment(formWith(spoofed))).toEqual({
      success: false,
      errors: { _attachment: ['파일 내용이 형식과 일치하지 않습니다.'] },
    });
    expect(upload).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('SVG 는 형식 단계에서 거부한다.', async () => {
    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'x.svg', {
      type: 'image/svg+xml',
    });
    expect(await uploadAttachment(formWith(svg))).toEqual({
      success: false,
      errors: { _attachment: ['지원하지 않는 파일 형식입니다.'] },
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it('시그니처가 맞는 PNG 는 확인된 타입으로 저장한다.', async () => {
    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])],
      'shot.png',
      { type: 'image/png' }
    );
    expect((await uploadAttachment(formWith(png))).success).toBe(true);
    expect(upload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/png' })
    );
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ file_type: 'image/png' }));
  });
});
