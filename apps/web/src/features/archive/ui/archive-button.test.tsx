import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArchiveButton } from './archive-button';

const mockArchiveAction = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/features/archive/model/archive-actions', () => ({
  archiveAction: (...args: unknown[]) => mockArchiveAction(...args),
}));
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));
vi.mock('@/shared/lib/analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/analytics')>()),
  track: vi.fn(),
}));

const renderButton = (onSuccess = vi.fn()) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <ArchiveButton targetType="suite" targetId="suite-1" onSuccess={onSuccess} />
    </QueryClientProvider>
  );

const openAndConfirm = () => {
  fireEvent.click(screen.getByRole('button', { name: /삭제/ }));
  const dialog = screen.getByRole('dialog');
  const confirm = Array.from(dialog.querySelectorAll('button')).find(
    (button) => button.textContent === '삭제'
  );
  fireEvent.click(confirm!);
};

describe('ArchiveButton 실패 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('삭제가 실패하면 다이얼로그를 열어 둔 채 오류 토스트를 띄운다', async () => {
    mockArchiveAction.mockResolvedValue({
      success: false,
      errors: { _testSuite: ['ARCHIVE_FAILED'] },
    });
    const onSuccess = vi.fn();
    renderButton(onSuccess);

    openAndConfirm();

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('테스트 스위트 삭제에 실패했습니다.')
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('삭제가 성공하면 다이얼로그를 닫고 onSuccess 를 호출한다', async () => {
    mockArchiveAction.mockResolvedValue({ success: true, data: { id: 'suite-1' } });
    const onSuccess = vi.fn();
    renderButton(onSuccess);

    openAndConfirm();

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
