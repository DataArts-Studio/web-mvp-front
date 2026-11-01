'use client';

import { type ActionResult } from '@/shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { approveCaseSpec, getCaseSpec, revokeCaseSpecApproval } from '../api/case-spec-actions';

/** 자동 실행 spec 검수(#187) 조회·승인·승인 해제. */

interface CaseSpecKey {
  projectId: string | undefined;
  caseId: string;
  targetSiteId: string;
}

export const caseSpecKeys = {
  all: ['case-spec'] as const,
  detail: ({ projectId, caseId, targetSiteId }: CaseSpecKey) =>
    [...caseSpecKeys.all, projectId ?? '', caseId, targetSiteId] as const,
};

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.success) {
    throw new Error(result.errors._general?.[0] ?? '요청을 처리하지 못했습니다.');
  }
  return result.data;
}

export const useCaseSpec = (key: CaseSpecKey) =>
  useQuery({
    queryKey: caseSpecKeys.detail(key),
    queryFn: async () =>
      unwrap(
        await getCaseSpec({
          projectId: key.projectId as string,
          caseId: key.caseId,
          targetSiteId: key.targetSiteId,
        })
      ),
    enabled: !!key.projectId && !!key.caseId && !!key.targetSiteId,
  });

export const useApproveCaseSpec = (key: CaseSpecKey) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (spec: string) =>
      unwrap(
        await approveCaseSpec({
          projectId: key.projectId as string,
          caseId: key.caseId,
          targetSiteId: key.targetSiteId,
          spec,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: caseSpecKeys.detail(key) }),
  });
};

export const useRevokeCaseSpecApproval = (key: CaseSpecKey) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      unwrap(
        await revokeCaseSpecApproval({
          projectId: key.projectId as string,
          caseId: key.caseId,
          targetSiteId: key.targetSiteId,
        })
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: caseSpecKeys.detail(key) }),
  });
};
