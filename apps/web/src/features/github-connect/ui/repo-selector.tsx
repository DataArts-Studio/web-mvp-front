'use client';

import React from 'react';

import type { GithubConnection, GithubRepo } from '@/entities/github-connection';
import type { ActionResult } from '@/shared/types';
import { type UseMutationResult } from '@tanstack/react-query';
import { DSButton } from '@testea/ui';
import { cn } from '@testea/util';
import { Loader2 } from 'lucide-react';

type RepoSelectorProps = {
  repos: GithubRepo[];
  repoSearch: string;
  onRepoSearchChange: (value: string) => void;
  loadingRepos: boolean;
  selectRepoMutation: UseMutationResult<
    ActionResult<{ connection: GithubConnection }>,
    Error,
    string,
    unknown
  >;
  onCancel: () => void;
};

export const RepoSelector = ({
  repos,
  repoSearch,
  onRepoSearchChange,
  loadingRepos,
  selectRepoMutation,
  onCancel,
}: RepoSelectorProps) => {
  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="저장소 검색..."
        value={repoSearch}
        onChange={(e) => onRepoSearchChange(e.target.value)}
        className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-2 border-line-2 focus:border-primary border px-3 py-2 focus:outline-none"
        autoFocus
      />
      <div className="flex max-h-[240px] flex-col gap-1 overflow-y-auto">
        {loadingRepos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-text-3 h-5 w-5 animate-spin" />
          </div>
        ) : filteredRepos.length === 0 ? (
          <p className="typo-body2-normal text-text-3 py-4 text-center">
            저장소를 찾을 수 없습니다.
          </p>
        ) : (
          filteredRepos.map((repo) => (
            <button
              key={repo.id}
              type="button"
              onClick={() => selectRepoMutation.mutate(repo.full_name)}
              disabled={selectRepoMutation.isPending}
              className={cn(
                'rounded-2 hover:bg-bg-3 flex items-center justify-between px-3 py-2.5 text-left transition-colors',
                selectRepoMutation.isPending && 'opacity-50'
              )}
            >
              <div className="flex flex-col">
                <span className="typo-body2-heading text-text-1">{repo.name}</span>
                <span className="typo-caption text-text-3">{repo.full_name}</span>
              </div>
              {repo.private && (
                <span className="typo-caption rounded-full bg-yellow-500/10 px-2 py-0.5 text-yellow-400">
                  Private
                </span>
              )}
            </button>
          ))
        )}
      </div>
      <div className="flex justify-end">
        <DSButton variant="ghost" size="small" onClick={onCancel}>
          취소
        </DSButton>
      </div>
    </div>
  );
};
