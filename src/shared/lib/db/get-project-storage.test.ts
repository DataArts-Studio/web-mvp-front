import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecute = vi.fn();

vi.mock('./drizzle', () => ({
  getDatabase: vi.fn(() => ({
    execute: mockExecute,
  })),
}));

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

import { getProjectStorageBytes } from './get-project-storage';

describe('getProjectStorageBytes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DB에서 반환된 total 값을 숫자로 반환한다', async () => {
    mockExecute.mockResolvedValue([{ total: '12345' }]);

    const result = await getProjectStorageBytes('project-123');

    expect(result).toBe(12345);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('total이 숫자인 경우 그대로 반환한다', async () => {
    mockExecute.mockResolvedValue([{ total: 67890 }]);

    const result = await getProjectStorageBytes('project-123');

    expect(result).toBe(67890);
  });

  it('결과가 빈 배열이면 0을 반환한다', async () => {
    mockExecute.mockResolvedValue([]);

    const result = await getProjectStorageBytes('project-123');

    expect(result).toBe(0);
  });

  it('total이 0이면 0을 반환한다', async () => {
    mockExecute.mockResolvedValue([{ total: '0' }]);

    const result = await getProjectStorageBytes('project-123');

    expect(result).toBe(0);
  });
});
