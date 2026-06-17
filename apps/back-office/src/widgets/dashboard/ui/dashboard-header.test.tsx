import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHeader } from './dashboard-header';

describe('DashboardHeader', () => {
  it('내부 스펙 코드 [BO02]를 노출하지 않는다', () => {
    render(<DashboardHeader />);
    expect(screen.queryByText(/\[BO02\]/)).toBeNull();
  });

  it('내보내기 버튼은 (미구현이므로) 비활성이다', () => {
    render(<DashboardHeader />);
    expect(screen.getByRole('button', { name: '내보내기' })).toBeDisabled();
  });

  it('하드코딩된 "n분 전" 갱신 문구를 렌더하지 않는다', () => {
    render(<DashboardHeader />);
    expect(screen.queryByText(/분 전/)).toBeNull();
  });
});
