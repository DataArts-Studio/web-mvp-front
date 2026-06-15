import type { ResourceUsage, SystemStatus } from '@/entities/admin-dashboard';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CostSystemSection } from './cost-system-section';

const systemStatuses: SystemStatus[] = [['Uptime', '99.9%']];

describe('CostSystemSection 진행률 보정', () => {
  it('100을 초과하는 사용률은 100으로 보정한다', () => {
    const resourceUsages: ResourceUsage[] = [
      { label: 'CPU', value: '150%', percent: 150, color: 'bg-red-600' },
    ];

    render(<CostSystemSection resourceUsages={resourceUsages} systemStatuses={systemStatuses} />);

    const bar = screen.getByRole('progressbar', { name: 'CPU 사용률' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.querySelector('div')).toHaveStyle({ width: '100%' });
  });

  it('음수 사용률은 0으로 보정한다', () => {
    const resourceUsages: ResourceUsage[] = [
      { label: 'CPU', value: '-10%', percent: -10, color: 'bg-red-600' },
    ];

    render(<CostSystemSection resourceUsages={resourceUsages} systemStatuses={systemStatuses} />);

    const bar = screen.getByRole('progressbar', { name: 'CPU 사용률' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar.querySelector('div')).toHaveStyle({ width: '0%' });
  });
});
