import type { FunnelStep, StorageProject } from '@/entities/admin-dashboard';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdditionalAnalysisSection } from './additional-analysis-section';

describe('AdditionalAnalysisSection 진행률 보정', () => {
  it('퍼널 전환율(문자열 %)이 100을 넘으면 100으로 보정한다', () => {
    const funnel: FunnelStep[] = [['가입', '100', '150%', '']];

    render(<AdditionalAnalysisSection funnel={funnel} storageProjects={[]} />);

    const bar = screen.getByRole('progressbar', { name: '가입 전환율' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('div')).toHaveStyle({ width: '100%' });
  });

  it('스토리지 사용률이 100을 넘으면 100으로 보정한다', () => {
    const storageProjects: StorageProject[] = [['p1', '10GB', 150]];

    render(<AdditionalAnalysisSection funnel={[]} storageProjects={storageProjects} />);

    const bar = screen.getByRole('progressbar', { name: 'p1 스토리지 사용률' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('div')).toHaveStyle({ width: '100%' });
  });
});
