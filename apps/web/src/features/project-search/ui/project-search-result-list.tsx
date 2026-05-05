'use client';

import React from 'react';
import type { ProjectSearchResult, SearchModalStatus } from '../model/types';
import { ProjectSearchResultItem } from './project-search-result-item';

interface ProjectSearchResultListProps {
  status: SearchModalStatus;
  results: ProjectSearchResult[];
  error: string | null;
  onNavigate?: () => void;
}

const LoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <span className="ml-2 text-body2 text-text-2">검색 중...</span>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-line-2 bg-bg-2 py-8">
    <p className="text-body1 font-medium text-text-1">검색 결과가 없습니다</p>
    <ul className="list-disc pl-5 text-body3 text-text-2">
      <li>프로젝트명을 다시 확인해주세요</li>
      <li>프로젝트가 삭제되었을 수 있습니다</li>
    </ul>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-system-red bg-bg-2 py-8">
    <p className="text-body1 font-medium text-system-red">{error}</p>
  </div>
);

export const ProjectSearchResultList = ({
  status,
  results,
  error,
  onNavigate,
}: ProjectSearchResultListProps) => {
  if (status === 'idle') {
    return null;
  }

  if (status === 'searching') {
    return <LoadingState />;
  }

  if (status === 'error' && error) {
    return <ErrorState error={error} />;
  }

  if (status === 'empty') {
    return <EmptyState />;
  }

  if (status === 'success' && results.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body2 text-text-2">검색 결과 ({results.length}건)</p>
        <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
          {results.map((project) => (
            <ProjectSearchResultItem key={project.id} project={project} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    );
  }

  return null;
};
