'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Github } from 'lucide-react';

import { githubConnectionQueryOptions, githubQueryKeys } from '@/entities/github-connection';
import type { GithubRepo } from '@/entities/github-connection';
import {
  connectGithub,
  disconnectGithub,
  getGithubRepos,
  selectGithubRepo,
} from '@/entities/github-connection/api/server-actions';
import { DSButton, SettingsCard } from '@/shared/ui';

import { ConnectedRepoInfo } from './connected-repo-info';
import { RepoSelector } from './repo-selector';

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

      const result = await connectGithub({ projectId, code: event.data.code });
      if (!result.success) {
        toast.error(Object.values(result.errors).flat().join(', '));
        return;
      }

      toast.success('GitHub 인증 완료! 저장소를 선택해주세요.');
      invalidate();
      setShowRepoSelect(true);
      setLoadingRepos(true);
      try {
        const reposResult = await getGithubRepos(projectId);
        if (reposResult.success) {
          setRepos(reposResult.data);
        } else {
          toast.error(Object.values(reposResult.errors).flat().join(', '));
        }
      } finally {
        setLoadingRepos(false);
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
        toast.error(Object.values(result.errors).flat().join(', '));
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

  if (isLoading) return <SettingsCard.LoadingSkeleton />;

  return (
    <SettingsCard.Root>
      <SettingsCard.Header
        icon={<Github className="h-5 w-5" />}
        title="GitHub 연동"
        description="저장소를 연결하여 PR ↔ TC 자동 링크, 테스트 결과 코멘트를 사용합니다."
      />
      <SettingsCard.Divider />
      <SettingsCard.Body>
        {isConnected ? (
          <ConnectedRepoInfo
            repoFullName={connection.repoFullName!}
            disconnectMutation={disconnectMutation}
          />
        ) : showRepoSelect ? (
          <RepoSelector
            repos={repos}
            repoSearch={repoSearch}
            onRepoSearchChange={setRepoSearch}
            loadingRepos={loadingRepos}
            selectRepoMutation={selectRepoMutation}
            onCancel={() => setShowRepoSelect(false)}
          />
        ) : (
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
      </SettingsCard.Body>
    </SettingsCard.Root>
  );
};
