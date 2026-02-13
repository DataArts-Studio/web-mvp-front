'use server';
import * as Sentry from '@sentry/nextjs';
import { CreateMilestoneSchema } from '@/entities/milestone';
import { getDatabase, milestones } from '@/shared/lib/db';
import { z } from 'zod';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/db';

type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const createMilestoneAction = async (input: CreateMilestoneInput) => {
  const validation = CreateMilestoneSchema.safeParse(input);

  if (!validation.success) {
    return { success: false, errors: validation.error.flatten() as FlatErrors };
  }

  const { project_id } = validation.data;

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
    const [newMilestone] = await db.insert(milestones).values(validation.data).returning();
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