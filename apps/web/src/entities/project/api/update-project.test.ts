import {
  createMockProjectRow,
  mockDb,
  mockGetDatabase,
  resetMockDb,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateProject } from './server-actions';

vi.mock('@testea/db', () => ({
  getDatabase: mockGetDatabase,
  projects: { id: 'id', name: 'name' },
}));

/** update().set() 에 넘어간 값을 꺼낸다. */
const lastSetData = () => {
  const update = mockDb.update.mock.results.at(-1)?.value;
  return update?.set.mock.calls.at(-1)?.[0];
};

describe('updateProject', () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('이름의 앞뒤 공백을 지우고 연속 공백을 하나로 줄여 저장한다', async () => {
    setMockUpdateReturn(createMockProjectRow({ id: 'p1' }));

    const result = await updateProject('p1', { name: '  Test   Project  ' });

    expect(result.success).toBe(true);
    expect(lastSetData()).toEqual(expect.objectContaining({ name: 'Test Project' }));
  });

  it('공백만 있는 이름은 저장하지 않고 거부한다', async () => {
    const result = await updateProject('p1', { name: '   ' });

    expect(result.success).toBe(false);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
