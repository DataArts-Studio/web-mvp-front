'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

import {
  type StoredCaseSpec,
  approveSpec,
  findCaseSpec,
  revokeSpecApproval,
} from './case-spec-store';

/**
 * 자동 실행 spec 검수(#187). 자동 실행 모달에서 저장된 spec 을 보고, 고쳐서 승인하거나
 * 승인을 푼다. 승인된 spec 이 있으면 runAutomatedTest 가 생성 없이 그 spec 을 실행한다.
 *
 * 케이스·대상 ID 는 따로 소속을 조회하지 않는다. 저장소 쿼리가 인가된 project_id 를
 * 조건으로 걸고, 행의 project_id 는 소속을 검증한 실행 경로에서만 들어가기 때문이다.
 */

const KeySchema = z.object({
  projectId: z.string().uuid(),
  caseId: z.string().uuid(),
  targetSiteId: z.string().uuid(),
});

/** 러너 요청 본문을 과하게 키우지 않는 선. 생성 spec 은 보통 수 KB 다. */
const MAX_SPEC_LENGTH = 50_000;

const ApproveSchema = KeySchema.extend({
  spec: z
    .string()
    .trim()
    .min(1, '코드를 입력해주세요.')
    .max(MAX_SPEC_LENGTH, '코드가 너무 깁니다.')
    .refine((spec) => spec.includes('@playwright/test'), {
      message: "'@playwright/test' 를 불러오는 Playwright 테스트 코드여야 합니다.",
    }),
});

type CaseSpecKeyInput = z.input<typeof KeySchema>;

export async function getCaseSpec(
  input: CaseSpecKeyInput
): Promise<ActionResult<StoredCaseSpec | null>> {
  const parsed = KeySchema.safeParse(input);
  if (!parsed.success || !(await canAccess('project', parsed.data.projectId))) {
    return ACCESS_DENIED;
  }
  try {
    return { success: true, data: await findCaseSpec(parsed.data) };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getCaseSpec' } });
    return { success: false, errors: { _general: ['저장된 코드를 불러오지 못했습니다.'] } };
  }
}

export async function approveCaseSpec(
  input: z.input<typeof ApproveSchema>
): Promise<ActionResult<{ approved: true }>> {
  const keyParsed = KeySchema.safeParse(input);
  if (!keyParsed.success || !(await canAccess('project', keyParsed.data.projectId))) {
    return ACCESS_DENIED;
  }
  const parsed = ApproveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: { _general: [parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.'] },
    };
  }
  try {
    if (!(await approveSpec(parsed.data))) {
      return {
        success: false,
        errors: { _general: ['승인할 코드가 없습니다. 먼저 자동 실행을 해주세요.'] },
      };
    }
    return { success: true, data: { approved: true } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'approveCaseSpec' } });
    return {
      success: false,
      errors: { _general: ['승인하지 못했습니다. 잠시 후 다시 시도해주세요.'] },
    };
  }
}

export async function revokeCaseSpecApproval(
  input: CaseSpecKeyInput
): Promise<ActionResult<{ revoked: true }>> {
  const parsed = KeySchema.safeParse(input);
  if (!parsed.success || !(await canAccess('project', parsed.data.projectId))) {
    return ACCESS_DENIED;
  }
  try {
    if (!(await revokeSpecApproval(parsed.data))) {
      return { success: false, errors: { _general: ['승인된 코드가 없습니다.'] } };
    }
    return { success: true, data: { revoked: true } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'revokeCaseSpecApproval' } });
    return {
      success: false,
      errors: { _general: ['승인을 해제하지 못했습니다. 잠시 후 다시 시도해주세요.'] },
    };
  }
}
