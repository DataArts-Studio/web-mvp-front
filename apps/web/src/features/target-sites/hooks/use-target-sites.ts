'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTargetSite,
  deleteTargetSite,
  listTargetSites,
  updateTargetSite,
} from '../api/server-actions';
import type {
  CreateTargetSiteInput,
  DeleteTargetSiteInput,
  UpdateTargetSiteInput,
} from '../model/schema';

export const targetSiteKeys = {
  all: ['target-sites'] as const,
  list: (projectId: string) => [...targetSiteKeys.all, projectId] as const,
};

export const useTargetSites = (projectId: string | undefined) =>
  useQuery({
    queryKey: targetSiteKeys.list(projectId ?? ''),
    queryFn: () => listTargetSites(projectId as string),
    enabled: !!projectId,
  });

export const useCreateTargetSite = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTargetSiteInput) => createTargetSite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: targetSiteKeys.list(projectId) }),
  });
};

export const useUpdateTargetSite = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTargetSiteInput) => updateTargetSite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: targetSiteKeys.list(projectId) }),
  });
};

export const useDeleteTargetSite = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTargetSiteInput) => deleteTargetSite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: targetSiteKeys.list(projectId) }),
  });
};
