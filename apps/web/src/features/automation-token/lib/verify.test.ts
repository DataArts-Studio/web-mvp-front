import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateAutomationToken } from './token';
import { verifyAutomationTokenFromRequest } from './verify';

vi.mock('server-only', () => ({}));

// @testea/db mock: getDatabase() 의 select/update 체인을 통제
const mockLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

const mockUpdateWhere = vi.fn(() => Promise.resolve());
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

vi.mock('@testea/db', () => ({
  getDatabase: () => ({ select: mockSelect, update: mockUpdate }),
  projectAutomationTokens: {
    project_id: { name: 'project_id' },
    token_hash: { name: 'token_hash' },
    token_prefix: { name: 'token_prefix' },
    last_used_at: { name: 'last_used_at' },
  },
}));

function makeRequest(headers: Record<string, string>): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers,
  });
}

describe('verifyAutomationTokenFromRequest', () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockSelectWhere.mockClear();
    mockSelectFrom.mockClear();
    mockSelect.mockClear();
    mockUpdate.mockClear();
    mockUpdateSet.mockClear();
    mockUpdateWhere.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Authorization 헤더가 없으면 null', async () => {
    const result = await verifyAutomationTokenFromRequest(makeRequest({}));
    expect(result).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Bearer 형식이 아니면 null', async () => {
    const result = await verifyAutomationTokenFromRequest(
      makeRequest({ authorization: 'Token abc' })
    );
    expect(result).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('토큰 prefix 가 testea_pk_ 가 아니면 null', async () => {
    const result = await verifyAutomationTokenFromRequest(
      makeRequest({ authorization: 'Bearer notatesteatoken_abcdef' })
    );
    expect(result).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('형식은 맞지만 DB 매칭 row 가 없으면 null', async () => {
    mockLimit.mockResolvedValueOnce([]);
    const { plaintext } = generateAutomationToken();
    const result = await verifyAutomationTokenFromRequest(
      makeRequest({ authorization: `Bearer ${plaintext}` })
    );
    expect(result).toBeNull();
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('DB 매칭 성공 시 projectId·prefix 반환 + last_used_at 갱신', async () => {
    const { plaintext, prefix } = generateAutomationToken();
    mockLimit.mockResolvedValueOnce([
      {
        project_id: 'proj-1',
        token_prefix: prefix,
        token_hash: 'whatever',
      },
    ]);

    const result = await verifyAutomationTokenFromRequest(
      makeRequest({ authorization: `Bearer ${plaintext}` })
    );

    expect(result).toEqual({ projectId: 'proj-1', tokenPrefix: prefix });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ last_used_at: expect.any(Date) })
    );
  });

  it('대소문자 무시 헤더 (Authorization) 도 인식', async () => {
    const { plaintext, prefix } = generateAutomationToken();
    mockLimit.mockResolvedValueOnce([
      { project_id: 'proj-2', token_prefix: prefix, token_hash: 'h' },
    ]);

    const result = await verifyAutomationTokenFromRequest(
      makeRequest({ Authorization: `Bearer ${plaintext}` })
    );

    expect(result?.projectId).toBe('proj-2');
  });
});
