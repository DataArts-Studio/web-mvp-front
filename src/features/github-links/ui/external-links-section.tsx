'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Github, GitPullRequest, CircleDot, ExternalLink, Plus, Loader2, AlertCircle } from 'lucide-react';

import { externalLinksQueryOptions, githubQueryKeys, githubConnectionQueryOptions } from '@/entities/github-connection';
import { createGithubIssue } from '@/entities/github-connection/api/server-actions';
import { cn } from '@/shared/utils';

type Props = {
  testCaseId: string;
  projectId: string;
  testCaseName: string;
  displayId: number | null;
  resultStatus?: string;
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-green-500/10 text-green-400' },
  closed: { label: 'Closed', cls: 'bg-red-500/10 text-red-400' },
  merged: { label: 'Merged', cls: 'bg-purple-500/10 text-purple-400' },
};

export const ExternalLinksSection = ({ testCaseId, projectId, testCaseName, displayId, resultStatus }: Props) => {
  const queryClient = useQueryClient();
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');

  const { data: connectionData } = useQuery(githubConnectionQueryOptions(projectId));
  const isGithubConnected = connectionData?.success && !!connectionData.data?.repoFullName;

  const { data: linksData, isLoading } = useQuery({
    ...externalLinksQueryOptions(testCaseId),
    enabled: !!isGithubConnected,
  });

  const links = linksData?.success ? linksData.data : [];

  const createIssueMutation = useMutation({
    mutationFn: () => createGithubIssue({
      testCaseId,
      title: issueTitle || `[Testea] TC-${displayId} ${testCaseName} 실패`,
      body: issueBody || undefined,
    }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('GitHub Issue가 생성되었습니다.');
        setShowIssueForm(false);
        setIssueTitle('');
        setIssueBody('');
        queryClient.invalidateQueries({ queryKey: githubQueryKeys.externalLinks(testCaseId) });
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    },
  });

  if (!isGithubConnected) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="typo-label-heading text-text-2 flex items-center gap-1.5">
          <Github className="h-3.5 w-3.5" />
          GitHub 연결
        </h3>
        {resultStatus === 'fail' && !showIssueForm && (
          <button
            type="button"
            onClick={() => {
              setIssueTitle(`[Testea] TC-${displayId} ${testCaseName} 실패`);
              setShowIssueForm(true);
            }}
            className="typo-caption text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <AlertCircle className="h-3 w-3" />
            Issue 생성
          </button>
        )}
      </div>

      {/* 링크 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-text-4" />
        </div>
      ) : links.length > 0 ? (
        <div className="flex flex-col gap-1">
          {links.map((link) => {
            const status = statusConfig[link.status ?? ''] ?? { label: link.status, cls: 'bg-text-4/10 text-text-3' };
            const isPR = link.linkType === 'github_pr';

            return (
              <a
                key={link.id}
                href={link.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 rounded-2 px-3 py-2 hover:bg-bg-3 transition-colors"
              >
                {isPR ? (
                  <GitPullRequest className="h-4 w-4 text-text-3 shrink-0" />
                ) : (
                  <CircleDot className="h-4 w-4 text-text-3 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="typo-caption text-text-1 truncate">
                    {link.title || `#${link.externalId}`}
                  </p>
                  <p className="typo-caption text-text-4">
                    #{link.externalId} · {link.repoFullName}
                  </p>
                </div>
                <span className={cn('typo-caption rounded-full px-1.5 py-0.5 shrink-0', status.cls)}>
                  {status.label}
                </span>
                <ExternalLink className="h-3 w-3 text-text-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            );
          })}
        </div>
      ) : (
        <p className="typo-caption text-text-4 py-2">연결된 PR/Issue가 없습니다.</p>
      )}

      {/* Issue 생성 폼 */}
      {showIssueForm && (
        <div className="rounded-2 border border-line-2 bg-bg-1 p-3 flex flex-col gap-2 mt-1">
          <input
            type="text"
            placeholder="Issue 제목"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            className="typo-body2-normal bg-transparent text-text-1 placeholder:text-text-4 focus:outline-none border-b border-line-2 pb-2"
            autoFocus
          />
          <textarea
            placeholder="설명 (선택)"
            value={issueBody}
            onChange={(e) => setIssueBody(e.target.value)}
            rows={3}
            className="typo-caption bg-transparent text-text-1 placeholder:text-text-4 focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowIssueForm(false); setIssueTitle(''); setIssueBody(''); }}
              className="typo-caption text-text-3 hover:text-text-1 px-2 py-1"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => createIssueMutation.mutate()}
              disabled={!issueTitle.trim() || createIssueMutation.isPending}
              className="typo-caption bg-red-500/10 text-red-400 rounded-2 px-3 py-1 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              {createIssueMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Issue 생성'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
