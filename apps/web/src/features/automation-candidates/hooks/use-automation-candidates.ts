'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAutomationCandidates } from '../api/get-automation-candidates';
import { getAutomationCoverage } from '../api/get-automation-coverage';
import { setAutomationStatus } from '../api/set-automation-status';
import type { SetAutomationStatusInput } from '../types';

export const automationCandidatesKeys = {
  all: ['automation-candidates'] as const,
  candidates: (projectId: string) => [...automationCandidatesKeys.all, 'list', projectId] as const,
  coverage: (projectId: string) =>
    [...automationCandidatesKeys.all, 'coverage', projectId] as const,
};

export const useAutomationCandidates = (projectId: string | undefined) =>
  useQuery({
    queryKey: automationCandidatesKeys.candidates(projectId ?? ''),
    queryFn: () => getAutomationCandidates(projectId as string),
    enabled: !!projectId,
  });

export const useAutomationCoverage = (projectId: string | undefined) =>
  useQuery({
    queryKey: automationCandidatesKeys.coverage(projectId ?? ''),
    queryFn: () => getAutomationCoverage(projectId as string),
    enabled: !!projectId,
  });

/**
 * automation_status 마킹.
 *
 * 상태가 바뀌면 후보 목록과 커버리지가 모두 변하므로 두 키 다 무효화한다.
 * caseId → projectId 를 호출부가 알고 있어야 정확한 무효화가 가능하므로 projectId 를 받는다.
 */
export const useSetAutomationStatus = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetAutomationStatusInput) => setAutomationStatus(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationCandidatesKeys.candidates(projectId) });
      qc.invalidateQueries({ queryKey: automationCandidatesKeys.coverage(projectId) });
    },
  });
};
