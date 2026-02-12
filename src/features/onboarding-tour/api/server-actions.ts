'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, projectPreferences } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { and, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';

type OnboardingStatus = {
  completed: boolean;
  completedAt?: string;
  lastStep?: number;
};

/**
 * 프로젝트의 온보딩 투어 완료 상태를 조회합니다.
 */
export const getOnboardingStatus = async (
  projectId: string,
): Promise<ActionResult<OnboardingStatus>> => {
  try {
    const db = getDatabase();

    const [row] = await db
      .select()
      .from(projectPreferences)
      .where(
        and(
          eq(projectPreferences.project_id, projectId),
          eq(projectPreferences.key, 'onboarding_completed'),
        ),
      );

    if (!row) {
      return { success: true, data: { completed: false } };
    }

    const value = row.value as { completed: boolean; completedAt?: string; lastStep?: number };
    return { success: true, data: value };
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    Sentry.captureException(error, { extra: { action: 'getOnboardingStatus' } });
    return {
      success: false,
      errors: { _onboarding: ['온보딩 상태를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 온보딩 투어를 완료 처리합니다.
 */
export const completeOnboardingTour = async (
  projectId: string,
  lastStep: number,
): Promise<ActionResult<OnboardingStatus>> => {
  try {
    const hasAccess = await requireProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false, errors: { _onboarding: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const now = new Date();
    const value = {
      completed: true,
      completedAt: now.toISOString(),
      lastStep,
    };

    await db
      .insert(projectPreferences)
      .values({
        id: uuidv7(),
        project_id: projectId,
        key: 'onboarding_completed',
        value,
        created_at: now,
        updated_at: now,
      })
      .onConflictDoUpdate({
        target: [projectPreferences.project_id, projectPreferences.key],
        set: {
          value,
          updated_at: now,
        },
      });

    return {
      success: true,
      data: value,
      message: '온보딩 투어가 완료되었습니다.',
    };
  } catch (error) {
    console.error('Error completing onboarding tour:', error);
    Sentry.captureException(error, { extra: { action: 'completeOnboardingTour' } });
    return {
      success: false,
      errors: { _onboarding: ['온보딩 완료 처리 중 오류가 발생했습니다.'] },
    };
  }
};
