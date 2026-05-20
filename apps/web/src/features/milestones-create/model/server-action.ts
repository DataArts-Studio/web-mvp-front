'use server';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import type { FlatErrors } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, milestones } from '@testea/db';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

import { requireProjectAccess } from '../../../access/lib/require-access';
import { CreateMilestoneSchema } from '../../../entities/milestone';

type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const createMilestoneAction = async (input: CreateMilestoneInput) => {
  const validation = CreateMilestoneSchema.safeParse(input);

  if (!validation.success) {
    return { success: false, errors: validation.error.flatten() as FlatErrors };
  }

  const { projectId: project_id } = validation.data;

  // 접근 권한 확인
  const hasAccess = await requireProjectAccess(project_id);
  if (!hasAccess) {
    return {
      success: false,
      errors: { formErrors: ['접근 권한이 없습니다.'], fieldErrors: {} } as FlatErrors,
    };
  }

  const storageError = await checkStorageLimit(project_id);
  if (storageError) return storageError;

  try {
    const db = getDatabase();
    const now = new Date();
    const [newMilestone] = await db
      .insert(milestones)
      .values({
        id: uuidv7(),
        project_id: validation.data.projectId,
        name: validation.data.title,
        description: validation.data.description,
        start_date: validation.data.startDate?.toISOString(),
        end_date: validation.data.endDate?.toISOString(),
        // DB 컬럼에 DEFAULT now() 가 없어 drizzle 의 DEFAULT 키워드만으로는
        // NOT NULL 제약에서 막힌다. 값을 명시한다.
        created_at: now,
        updated_at: now,
      })
      .returning();
    return { success: true, milestone: newMilestone };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createMilestoneAction' } });
    return {
      success: false,
      errors: {
        formErrors: ['마일스톤 생성에 실패했습니다.'],
        fieldErrors: {},
      } as FlatErrors,
    };
  }
};
