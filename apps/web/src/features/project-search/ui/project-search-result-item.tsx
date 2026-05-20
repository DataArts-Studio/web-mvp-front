'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { PROJECT_SEARCH_EVENTS, track } from '@/shared/lib/analytics';
import { DSButton } from '@testea/ui';

import type { ProjectSearchResult } from '../model/types';

interface ProjectSearchResultItemProps {
  project: ProjectSearchResult;
  onNavigate?: () => void;
}

export const ProjectSearchResultItem = ({ project, onNavigate }: ProjectSearchResultItemProps) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);

  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(project.createdAt);

  const handleClick = () => {
    track(PROJECT_SEARCH_EVENTS.RESULT_CLICK, {
      project_name: project.projectName,
      slug: project.slug,
    });
    setIsNavigating(true);
    onNavigate?.();
    router.push(`/projects/${encodeURIComponent(project.slug)}/access`);
  };

  return (
    <div className="border-line-2 bg-bg-2 hover:border-primary flex flex-col gap-2 rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-body1 text-text-1 font-medium">{project.projectName}</h3>
          <p className="text-body3 text-text-2">
            생성일: {formattedDate}
            {project.ownerName && <span className="ml-2">| 소유자: {project.ownerName}</span>}
          </p>
        </div>
        <DSButton
          variant="ghost"
          size="small"
          type="button"
          onClick={handleClick}
          disabled={isNavigating}
          className="shrink-0"
        >
          {isNavigating ? '이동 중...' : '접속하기 →'}
        </DSButton>
      </div>
    </div>
  );
};
