import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateSuite } from '../../suites-edit/hooks/use-update-suite';
import { useCreateSuite } from './use-create-suite';

const mockCreateTestSuite = vi.fn();
const mockUpdateTestSuite = vi.fn();

vi.mock('@/entities', () => ({
  createTestSuite: (...args: unknown[]) => mockCreateTestSuite(...args),
}));
vi.mock('@/entities/test-suite', () => ({
  updateTestSuite: (...args: unknown[]) => mockUpdateTestSuite(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const createInput = { projectId: 'project-1', title: '결제 스위트', description: '', sortOrder: 0 };
const updateInput = { id: 'suite-1', title: '결제 스위트', description: '' };

describe('스위트 생성·수정 훅의 실패 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('생성 서버 액션이 실패 결과를 돌려주면 오류 코드로 reject 한다', async () => {
    mockCreateTestSuite.mockResolvedValue({
      success: false,
      errors: { _testSuite: ['ACCESS_DENIED'] },
    });
    const { result } = renderHook(() => useCreateSuite(), { wrapper });

    await expect(result.current.mutateAsync(createInput)).rejects.toThrow('ACCESS_DENIED');
  });

  it('생성 실패 결과에 오류가 없으면 CREATE_FAILED 로 reject 한다', async () => {
    mockCreateTestSuite.mockResolvedValue({ success: false, errors: {} });
    const { result } = renderHook(() => useCreateSuite(), { wrapper });

    await expect(result.current.mutateAsync(createInput)).rejects.toThrow('CREATE_FAILED');
  });

  it('요청 자체가 실패하면 브라우저 원문 대신 CREATE_FAILED 로 reject 한다', async () => {
    mockCreateTestSuite.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useCreateSuite(), { wrapper });

    await expect(result.current.mutateAsync(createInput)).rejects.toThrow('CREATE_FAILED');
  });

  it('생성이 성공하면 결과를 그대로 돌려준다', async () => {
    const success = { success: true, data: { id: 'suite-1' } };
    mockCreateTestSuite.mockResolvedValue(success);
    const { result } = renderHook(() => useCreateSuite(), { wrapper });

    await expect(result.current.mutateAsync(createInput)).resolves.toEqual(success);
  });

  it('생성이 성공하면 목록 재조회가 끝나기를 기다리지 않고 바로 끝나고, 재조회는 시작한다', async () => {
    mockCreateTestSuite.mockResolvedValue({ success: true, data: { id: 'suite-1' } });
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    // 끝나지 않는 목록 조회: 재조회를 기다리면 mutateAsync 도 끝나지 않는다 (#444).
    const listKey = ['testSuites', 'list', 'project-1'];
    client.setQueryDefaults(listKey, { queryFn: () => new Promise(() => {}) });
    client.setQueryData(listKey, []);
    const { result } = renderHook(() => useCreateSuite(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    await expect(result.current.mutateAsync(createInput)).resolves.toMatchObject({
      success: true,
    });
    expect(client.getQueryState(listKey)?.fetchStatus).toBe('fetching');
  });

  it('수정 서버 액션이 실패 결과를 돌려주면 reject 한다', async () => {
    mockUpdateTestSuite.mockResolvedValue({ success: false, errors: {} });
    const { result } = renderHook(() => useUpdateSuite(), { wrapper });

    await expect(result.current.mutateAsync(updateInput)).rejects.toThrow('UPDATE_FAILED');
  });
});
