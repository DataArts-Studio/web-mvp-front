import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AddSuitesToMilestoneModal } from './add-suites-to-milestone-modal';

vi.mock('@/entities/milestone/api', () => ({
  addTestSuitesToMilestone: vi.fn(),
}));

const suites = [
  { id: 'suite-1', title: '로그인', description: '로그인 흐름' },
  { id: 'suite-2', title: '결제' },
] as React.ComponentProps<typeof AddSuitesToMilestoneModal>['availableSuites'];

const renderModal = (onClose = vi.fn()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AddSuitesToMilestoneModal
        milestoneId="ms-1"
        milestoneName="v1.0"
        availableSuites={suites}
        onClose={onClose}
      />
    </QueryClientProvider>
  );

describe('선택 모달 접근성', () => {
  it('제목으로 이름 붙은 dialog 와 이름 있는 닫기·검색·전체 선택 컨트롤을 제공한다', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: '테스트 스위트 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: '스위트 이름, 설명으로 검색...' })
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '전체 선택' })).toBeInTheDocument();
  });

  it('항목 체크박스는 항목 내용으로 이름이 붙고, 체크박스를 눌러도 한 번만 토글된다', () => {
    renderModal();

    const item = screen.getByRole('checkbox', { name: /로그인/ });
    expect(item).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('1개 선택됨')).toBeInTheDocument();

    // 행 텍스트를 눌러도 한 번만 토글된다
    fireEvent.click(screen.getByText('결제'));
    expect(screen.getByRole('checkbox', { name: /결제/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('2개 선택됨')).toBeInTheDocument();
  });

  it('Escape 로 닫힌다', () => {
    const onClose = vi.fn();
    renderModal(onClose);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
