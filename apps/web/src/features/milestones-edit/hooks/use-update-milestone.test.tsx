import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateMilestone } from './use-update-milestone';

const mockUpdateMilestone = vi.fn();

vi.mock('@/entities/milestone', () => ({
  updateMilestone: (...args: unknown[]) => mockUpdateMilestone(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const input = {
  id: 'milestone-1',
  title: '10월 릴리스',
  description: '',
  startDate: '',
  endDate: '',
};

describe('useUpdateMilestone 실패 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('서버 액션이 실패 결과를 돌려주면 서버 메시지로 reject 한다', async () => {
    mockUpdateMilestone.mockResolvedValue({
      success: false,
      errors: { _milestone: ['접근 권한이 없습니다.'] },
    });
    const { result } = renderHook(() => useUpdateMilestone(), { wrapper });

    await expect(result.current.mutateAsync(input)).rejects.toThrow('접근 권한이 없습니다.');
  });

  it('실패 결과에 메시지가 없으면 기본 문구로 reject 한다', async () => {
    mockUpdateMilestone.mockResolvedValue({ success: false, errors: {} });
    const { result } = renderHook(() => useUpdateMilestone(), { wrapper });

    await expect(result.current.mutateAsync(input)).rejects.toThrow(
      '마일스톤 수정에 실패했습니다.'
    );
  });

  it('성공하면 결과를 그대로 돌려준다', async () => {
    const success = { success: true, data: { id: 'milestone-1' } };
    mockUpdateMilestone.mockResolvedValue(success);
    const { result } = renderHook(() => useUpdateMilestone(), { wrapper });

    await expect(result.current.mutateAsync(input)).resolves.toEqual(success);
  });
});
