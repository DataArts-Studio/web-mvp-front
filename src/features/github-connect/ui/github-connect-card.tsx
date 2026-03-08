'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Github, Link2, Unlink, Loader2, ExternalLink, ChevronDown } from 'lucide-react';

import { githubConnectionQueryOptions, githubQueryKeys } from '@/entities/github-connection';
import type { GithubRepo } from '@/entities/github-connection';
import {
  connectGithub,
  disconnectGithub,
  getGithubRepos,
  selectGithubRepo,
} from '@/entities/github-connection/api/server-actions';
import { DSButton } from '@/shared/ui';
import { cn } from '@/shared/utils';

type Props = {
  projectId: string;
};

export const GithubConnectCard = ({ projectId }: Props) => {
  const queryClient = useQueryClient();
  const [showRepoSelect, setShowRepoSelect] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);

  const { data: connectionData, isLoading } = useQuery(githubConnectionQueryOptions(projectId));
  const connection = connectionData?.success ? connectionData.data : null;
  const isConnected = !!connection?.repoFullName;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: githubQueryKeys.connection(projectId) });
  }, [queryClient, projectId]);

  // OAuth 메시지 수신
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== 'github-oauth') return;

      if (!event.data.success) {
        toast.error(event.data.error || 'GitHub 인증에 실패했습니다.');
        return;
      }

      // code 교환
      const result = await connectGithub({ projectId, code: event.data.code });
      if (result.success) {
        toast.success('GitHub 인증 완료! 저장소를 선택해주세요.');
        invalidate();
        // 저장소 목록 로드
        setShowRepoSelect(true);
        setLoadingRepos(true);
        const reposResult = await getGithubRepos(projectId);
        if (reposResult.success) {
          setRepos(reposResult.data);
        }
        setLoadingRepos(false);
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [projectId, invalidate]);

  const handleOAuthStart = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.error('GitHub Client ID가 설정되지 않았습니다.');
      return;
    }
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'repo';
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${projectId}`;

    window.open(url, 'github-oauth', 'width=600,height=700,left=200,top=100');
  };

  const selectRepoMutation = useMutation({
    mutationFn: (repoFullName: string) => selectGithubRepo({ projectId, repoFullName }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('저장소가 연결되었습니다!');
        setShowRepoSelect(false);
        invalidate();
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectGithub(projectId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('GitHub 연결이 해제되었습니다.');
        invalidate();
      }
    },
  });

  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="rounded-5 border-line-2 bg-bg-2 flex flex-col border p-6 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-bg-3" />
      </div>
    );
  }

  return (
    <section className="rounded-5 border-line-2 bg-bg-2 flex flex-col border transition-colors">
      <div className="p-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#24292e]/20">
            <Github className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="typo-h2-heading text-text-1">GitHub 연동</h2>
            <p className="typo-caption text-text-3">
              저장소를 연결하여 PR ↔ TC 자동 링크, 테스트 결과 코멘트를 사용합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line-2" />

      <div className="p-6 pt-5">
        {isConnected ? (
          /* 연결 완료 상태 */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <Link2 className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex flex-col">
                <span className="typo-body2-heading text-text-1">{connection.repoFullName}</span>
                <span className="typo-caption text-text-3">연결됨</span>
              </div>
              <a
                href={`https://github.com/${connection.repoFullName}`}
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
        ) : showRepoSelect ? (
          /* 저장소 선택 */
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="저장소 검색..."
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-2 border border-line-2 px-3 py-2 focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="max-h-[240px] overflow-y-auto flex flex-col gap-1">
              {loadingRepos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-text-3" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <p className="typo-body2-normal text-text-3 text-center py-4">저장소를 찾을 수 없습니다.</p>
              ) : (
                filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => selectRepoMutation.mutate(repo.full_name)}
                    disabled={selectRepoMutation.isPending}
                    className={cn(
                      'flex items-center justify-between rounded-2 px-3 py-2.5 text-left transition-colors hover:bg-bg-3',
                      selectRepoMutation.isPending && 'opacity-50',
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
              <DSButton
                variant="ghost"
                size="small"
                onClick={() => setShowRepoSelect(false)}
              >
                취소
              </DSButton>
            </div>
          </div>
        ) : (
          /* 미연결 상태 */
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="typo-body2-heading text-text-1">GitHub 저장소 연결</span>
              <span className="typo-caption text-text-3">
                OAuth로 GitHub에 인증하고 저장소를 선택합니다.
              </span>
            </div>
            <DSButton variant="solid" size="small" onClick={handleOAuthStart}>
              <span className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub 연결
              </span>
            </DSButton>
          </div>
        )}
      </div>
    </section>
  );
};
