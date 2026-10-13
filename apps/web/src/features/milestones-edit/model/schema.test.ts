import { CreateMilestoneSchema } from '@/entities/milestone';
import { describe, expect, it } from 'vitest';

import { UpdateMilestoneSchema } from './index';

const PROJECT_ID = '019c388f-7380-7468-bdbe-579b90481738';

describe('마일스톤 날짜 폼 검증 (#381)', () => {
  it('생성: 종료일이 시작일보다 빠르면 종료일 필드에 오류를 낸다', () => {
    const result = CreateMilestoneSchema.safeParse({
      projectId: PROJECT_ID,
      title: '릴리스',
      startDate: '2026-10-10',
      endDate: '2026-10-01',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endDate']);
  });

  it('생성: 같은 날 시작·종료와 종료일 없음은 허용한다', () => {
    const base = { projectId: PROJECT_ID, title: '릴리스', startDate: '2026-10-10' };
    expect(CreateMilestoneSchema.safeParse({ ...base, endDate: '2026-10-10' }).success).toBe(true);
    expect(CreateMilestoneSchema.safeParse({ ...base, endDate: null }).success).toBe(true);
  });

  it('수정: 비운 날짜 입력은 허용하고 역전된 기간은 거부한다', () => {
    const base = { id: 'm1', title: '릴리스' };
    expect(UpdateMilestoneSchema.safeParse({ ...base, startDate: '', endDate: '' }).success).toBe(
      true
    );
    expect(
      UpdateMilestoneSchema.safeParse({ ...base, startDate: '2026-10-10', endDate: '2026-10-01' })
        .success
    ).toBe(false);
  });
});
