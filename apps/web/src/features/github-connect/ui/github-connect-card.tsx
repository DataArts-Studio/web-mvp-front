'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { githubConnectionQueryOptions, githubQueryKeys } from '@/entities/github-connection';
import type { GithubRepo } from '@/entities/github-connection';
import {
  connectGithub,
  disconnectGithub,
  getGithubRepos,
  selectGithubRepo,
  startGithubOAuth,
} from '@/entities/github-connection/api/server-actions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DSButton, SettingsCard } from '@testea/ui';
import { Github } from 'lucide-react';
import { toast } from 'sonner';

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

  // 이 카드가 연 OAuth 팝업. 메시지는 이 창에서 온 것만 받는다.
  const popupRef = useRef<Window | null>(null);

  // OAuth 메시지 수신
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // 다른 오리진(공격자 페이지)이 이 창에 보낸 가짜 결과를 무시한다.
      if (event.origin !== window.location.origin) return;
      if (!popupRef.current || event.source !== popupRef.current) return;
      if (event.data?.type !== 'github-oauth') return;
      popupRef.current = null;

      if (!event.data.success) {
        toast.error(event.data.error || 'GitHub 인증에 실패했습니다.');
        return;
      }
      // 콜백이 state 쿠키에서 꺼낸 프로젝트가 이 화면의 프로젝트여야 한다.
      if (event.data.projectId !== projectId) return;

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

  const handleOAuthStart = async () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.error('GitHub Client ID가 설정되지 않았습니다.');
      return;
    }
    // 서버 응답을 기다린 뒤 열면 클릭 맥락이 끊겨 팝업이 차단되므로, 빈 창을 먼저 연다.
    const popup = window.open('', 'github-oauth', 'width=600,height=700,left=200,top=100');
    if (!popup) {
      toast.error('팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해주세요.');
      return;
    }

    const started = await startGithubOAuth(projectId);
    if (!started.success) {
      popup.close();
      toast.error(Object.values(started.errors).flat().join(', '));
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/api/auth/github/callback`,
      scope: 'repo',
      state: started.data.state,
    });
    popupRef.current = popup;
    popup.location.href = `https://github.com/login/oauth/authorize?${params}`;
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
