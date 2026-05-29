'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAutomationTokenStatus,
  issueAutomationToken,
  revokeAutomationToken,
} from '../api/server-actions';

const tokenKey = (projectId: string) => ['automation-token', projectId] as const;

export const useAutomationTokenStatus = (projectId: string | undefined) =>
  useQuery({
    queryKey: tokenKey(projectId ?? ''),
    queryFn: () => getAutomationTokenStatus(projectId as string),
    enabled: !!projectId,
  });

export const useIssueAutomationToken = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => issueAutomationToken(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenKey(projectId) }),
  });
};

export const useRevokeAutomationToken = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => revokeAutomationToken(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tokenKey(projectId) }),
  });
};
