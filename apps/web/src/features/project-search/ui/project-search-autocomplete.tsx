'use client';

import React from 'react';
import Link from 'next/link';
import type { ProjectSearchResult } from '../model/types';

interface ProjectSearchAutocompleteProps {
  suggestions: ProjectSearchResult[];
  isLoading: boolean;
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (project: ProjectSearchResult) => void;
  onMouseEnter: (index: number) => void;
}

export const ProjectSearchAutocomplete = ({
  suggestions,
  isLoading,
  isVisible,
  selectedIndex,
  onSelect,
  onMouseEnter,
}: ProjectSearchAutocompleteProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-line-1 bg-bg-2 shadow-lg">
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-body2 text-text-3">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          검색 중...
        </div>
      ) : suggestions.length > 0 ? (
        <ul className="max-h-60 overflow-y-auto">
          {suggestions.map((project, index) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.slug}/access`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(project);
                }}
                onMouseEnter={() => onMouseEnter(index)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                  selectedIndex === index
                    ? 'bg-bg-3 text-primary'
                    : 'text-text-1 hover:bg-bg-3'
                }`}
              >
                <span className="text-lg">📁</span>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-body2 font-medium">
                    {project.projectName}
                  </p>
                  {project.ownerName && (
                    <p className="truncate text-body3 text-text-3">
                      {project.ownerName}
                    </p>
                  )}
                </div>
                <span className="text-body3 text-text-3">↵</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-3 text-body2 text-text-3">
          일치하는 프로젝트가 없습니다
        </div>
      )}
    </div>
  );
};
