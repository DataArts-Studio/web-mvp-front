'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { automationStatusEnum, getDatabase, testCases } from '@testea/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import type { SetAutomationStatusInput, SetAutomationStatusResult } from '../types';

const schema = z.object({
  caseId: z.string().uuid(),
  status: z.enum(automationStatusEnum),
});

/**
 * 케이스의 automation_status 를 전이한다 (manual ↔ candidate ↔ automated).
 *
 * 가드: caseId → project_id 조회 후 requireProjectAccess.
 * 입력 검증: zod (caseId UUID, status enum).
 */
export async function setAutomationStatus(
  input: SetAutomationStatusInput
): Promise<ActionResult<SetAutomationStatusResult>> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        errors: { _general: ['입력값이 올바르지 않습니다.'] },
      };
    }
    const { caseId, status } = parsed.data;

    const db = getDatabase();

    // 권한 확인: case -> project_id.
    const [row] = await db
      .select({ projectId: testCases.project_id })
      .from(testCases)
      .where(eq(testCases.id, caseId))
      .limit(1);

    if (!row?.projectId) {
      return { success: false, errors: { _general: ['케이스를 찾을 수 없습니다.'] } };
    }
    if (!(await requireProjectAccess(row.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const [updated] = await db
      .update(testCases)
      .set({ automation_status: status, updated_at: new Date() })
      .where(eq(testCases.id, caseId))
      .returning({
        caseId: testCases.id,
        automationStatus: testCases.automation_status,
      });

    if (!updated) {
      return { success: false, errors: { _general: ['상태 변경에 실패했습니다.'] } };
    }

    return {
      success: true,
      data: { caseId: updated.caseId, automationStatus: updated.automationStatus },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'setAutomationStatus' } });
    return {
      success: false,
      errors: { _general: ['자동화 상태 변경 중 오류가 발생했습니다.'] },
    };
  }
}
