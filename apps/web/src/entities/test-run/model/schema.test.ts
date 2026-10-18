import { describe, expect, it } from 'vitest';

import { CreateTestRunSchema, RUN_NAME_MAX_LENGTH } from './schema';

const base = {
  project_id: '00000000-0000-4000-8000-000000000001',
  milestone_id: '00000000-0000-4000-8000-000000000002',
};

describe('CreateTestRunSchema 실행 이름 길이 (#417)', () => {
  it(`${RUN_NAME_MAX_LENGTH}자까지 허용한다`, () => {
    expect(CreateTestRunSchema.safeParse({ ...base, name: 'a'.repeat(100) }).success).toBe(true);
  });

  it(`${RUN_NAME_MAX_LENGTH}자를 넘으면 거부한다`, () => {
    const result = CreateTestRunSchema.safeParse({ ...base, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('실행 이름은 100자를 초과할 수 없습니다.');
  });

  it('앞뒤 공백을 뺀 길이가 2자 미만이면 거부한다', () => {
    const result = CreateTestRunSchema.safeParse({ ...base, name: ' a ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('실행 이름은 최소 2자 이상이어야 합니다.');
  });

  it('2자 이름은 허용한다', () => {
    expect(CreateTestRunSchema.safeParse({ ...base, name: 'ab' }).success).toBe(true);
  });
});
