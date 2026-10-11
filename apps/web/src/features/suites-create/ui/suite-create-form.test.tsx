import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SuiteCreateForm } from './suite-create-form';

const mockCreateTestSuite = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/entities', () => ({
  createTestSuite: (...args: unknown[]) => mockCreateTestSuite(...args),
}));
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));
vi.mock('@/shared/lib/analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/analytics')>()),
  track: vi.fn(),
}));

// 번역은 키를 그대로 돌려주고, messages.* 코드만 알려진 키로 취급한다.
vi.mock('next-intl', () => ({
  useTranslations: () =>
    Object.assign((key: string) => key, {
      has: (key: string) => key === 'messages.ACCESS_DENIED',
    }),
}));

const PROJECT_ID = '0192f5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5b';

const renderForm = (onClose = vi.fn()) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <SuiteCreateForm projectId={PROJECT_ID} onClose={onClose} />
    </QueryClientProvider>
  );

const submitWithTitle = (title: string) => {
  fireEvent.change(screen.getByPlaceholderText('ui.namePlaceholder'), {
    target: { value: title },
  });
  fireEvent.click(screen.getByRole('button', { name: 'ui.create' }));
};

describe('SuiteCreateForm 실패 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('서버가 실패를 돌려주면 모달을 닫지 않고 입력을 유지한 채 오류 토스트를 띄운다', async () => {
    mockCreateTestSuite.mockResolvedValue({
      success: false,
      errors: { _testSuite: ['ACCESS_DENIED'] },
    });
    const onClose = vi.fn();
    renderForm(onClose);

    submitWithTitle('결제 스위트');

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('messages.ACCESS_DENIED'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('ui.namePlaceholder')).toHaveValue('결제 스위트');
  });

  it('생성이 성공하면 모달을 닫는다', async () => {
    mockCreateTestSuite.mockResolvedValue({ success: true, data: { id: 'suite-1' } });
    const onClose = vi.fn();
    renderForm(onClose);

    submitWithTitle('결제 스위트');

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
