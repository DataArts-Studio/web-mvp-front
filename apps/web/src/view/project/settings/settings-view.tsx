'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';

import { dashboardQueryOptions } from '@/features/dashboard';
import { GithubConnectCard } from '@/features/github-connect';
import { AiConfigCard } from '@/features/ai-generate';
import { MainContainer } from '@testea/ui';
import { ProjectErrorFallback } from '@testea/ui';
import { formatDateKR } from '@/shared/utils/date-format';

import { SettingsLoadingSkeleton } from './_components/settings-loading-skeleton';
import { GeneralSettingsSection } from './_components/general-settings-section';
import { SecuritySection } from './_components/security-section';
import { StorageSection } from './_components/storage-section';
import { DangerZoneSection } from './_components/danger-zone-section';

// ─── Main View ───────────────────────────────────────────────────────────────

export const SettingsView = () => {
  const params = useParams();
  const slug = params.slug as string;

  const { data: dashboardData, isLoading } = useQuery({
    ...dashboardQueryOptions.stats(slug),
    enabled: !!slug,
  });

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: storageData } = useQuery({
    ...dashboardQueryOptions.storageInfo(projectId!),
    enabled: !!projectId,
  });

  if (isLoading) return <SettingsLoadingSkeleton />;
  if (!dashboardData?.success || !projectId) return <ProjectErrorFallback />;

  const { project } = dashboardData.data;

  return (
    <MainContainer className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-1 flex-col gap-10 px-10 py-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-4.5 w-4.5 text-primary" />
          </div>
          <h1 className="typo-h1-heading text-text-1">프로젝트 설정</h1>
        </div>
        <p className="typo-body2-normal text-text-3 ml-12">
          <span className="text-primary font-medium">{project.name}</span>
          <span className="text-text-4 mx-2">|</span>
          <span>{formatDateKR(project.created_at)} 생성</span>
        </p>
      </header>

      {/* Section 1: General */}
      <GeneralSettingsSection
        projectId={projectId}
        defaultName={project.name}
        defaultDescription={project.description}
        defaultOwnerName={project.ownerName}
      />

      {/* Section 2: Security */}
      <SecuritySection projectId={projectId} />

      {/* Section 3: AI Configuration */}
      <AiConfigCard projectId={projectId} />

      {/* Section 4: GitHub Integration */}
      <GithubConnectCard projectId={projectId} />

      {/* Section 5: Storage */}
      {storageData?.success && (
        <StorageSection
          usedBytes={storageData.data.usedBytes}
          maxBytes={storageData.data.maxBytes}
          usedPercent={storageData.data.usedPercent}
        />
      )}

      {/* Section 6: Danger Zone */}
      <DangerZoneSection projectId={projectId} projectName={project.name} />

      <div className="h-8" />
    </MainContainer>
  );
};
