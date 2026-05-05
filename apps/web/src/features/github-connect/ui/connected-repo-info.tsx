'use client';

import React from 'react';
import { type UseMutationResult } from '@tanstack/react-query';
import { Link2, Unlink, Loader2, ExternalLink } from 'lucide-react';

import { DSButton } from '@testea/ui';

type ConnectedRepoInfoProps = {
  repoFullName: string;
  disconnectMutation: UseMutationResult<any, Error, void, unknown>;
};

export const ConnectedRepoInfo = ({
  repoFullName,
  disconnectMutation,
}: ConnectedRepoInfoProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
          <Link2 className="h-4 w-4 text-green-400" />
        </div>
        <div className="flex flex-col">
          <span className="typo-body2-heading text-text-1">{repoFullName}</span>
          <span className="typo-caption text-text-3">연결됨</span>
        </div>
        <a
          href={`https://github.com/${repoFullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-4 hover:text-text-2 transition-colors ml-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <DSButton
        variant="ghost"
        size="small"
        onClick={() => disconnectMutation.mutate()}
        disabled={disconnectMutation.isPending}
        className="text-red-400 hover:text-red-300"
      >
        {disconnectMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="flex items-center gap-1.5">
            <Unlink className="h-3.5 w-3.5" />
            연결 해제
          </span>
        )}
      </DSButton>
    </div>
  );
};
