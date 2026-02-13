'use client';

import React from 'react';
import { Dialog } from '@/shared/lib/primitives';
import { searchProjects } from '../api/server-action';
import type { ProjectSearchResult, SearchModalStatus } from '../model/types';
import { ProjectSearchForm } from './project-search-form';
import { ProjectSearchResultList } from './project-search-result-list';

interface ProjectSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSearchModal = ({ isOpen, onClose }: ProjectSearchModalProps) => {
  const [status, setStatus] = React.useState<SearchModalStatus>('idle');
  const [results, setResults] = React.useState<ProjectSearchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = async (keyword: string) => {
    setStatus('searching');
    setError(null);

    const response = await searchProjects(keyword);

    if (response.success) {
      setResults(response.data);
      setStatus(response.data.length > 0 ? 'success' : 'empty');
    } else {
      setError(response.error);
      setStatus('error');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setResults([]);
    setError(null);
    onClose();
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[1000] bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line-2 bg-bg-1 p-6 shadow-lg"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 id="search-modal-title" className="text-h3 font-semibold text-text-1">
            내 프로젝트 찾기
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-bg-3 hover:text-text-1"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search Form */}
        <ProjectSearchForm onSearch={handleSearch} isSearching={status === 'searching'} />

        {/* Divider */}
        {status !== 'idle' && <hr className="my-4 border-line-2" />}

        {/* Results */}
        <ProjectSearchResultList
          status={status}
          results={results}
          error={error}
          onNavigate={handleClose}
        />
      </div>
    </>
  );
};
