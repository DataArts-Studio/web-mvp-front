import type { FunnelStep, StorageProject, StorageSummary } from '@/entities/admin-dashboard';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdditionalAnalysisSection } from './additional-analysis-section';

const emptySummary: StorageSummary = { totalSize: '0 B', totalRows: '0' };

describe('AdditionalAnalysisSection 진행률 보정', () => {
  it('퍼널 전환율(percent)이 100을 넘으면 100으로 보정한다', () => {
    const funnel: FunnelStep[] = [
      { label: '가입', count: '100', rate: '150%', percent: 150, churn: '' },
    ];

    render(
      <AdditionalAnalysisSection
        funnel={funnel}
        storageProjects={[]}
        storageSummary={emptySummary}
      />
    );

    const bar = screen.getByRole('progressbar', { name: '가입 전환율' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('div')).toHaveStyle({ width: '100%' });
  });

  it('스토리지 사용률(percent)이 100을 넘으면 100으로 보정한다', () => {
    const storageProjects: StorageProject[] = [{ name: 'p1', usage: '10GB', percent: 150 }];

    render(
      <AdditionalAnalysisSection
        funnel={[]}
        storageProjects={storageProjects}
        storageSummary={emptySummary}
      />
    );

    const bar = screen.getByRole('progressbar', { name: 'p1 스토리지 사용률' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('div')).toHaveStyle({ width: '100%' });
  });
});
