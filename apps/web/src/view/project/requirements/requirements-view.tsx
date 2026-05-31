'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import type { RequirementAnalysisListItem } from '@/entities/requirement-analysis';
import { requirementAnalysesQueryOptions } from '@/entities/requirement-analysis';
import { RequirementAnalysisModal } from '@/features/ai-requirement-analysis';
import { ActionToolbar } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { FileSearch, FolderTree, ListChecks, Plus } from 'lucide-react';

const LANGUAGE_LABEL: Record<string, string> = {
  ko: '한국어',
  en: 'English',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

export const RequirementsView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');

  // 클라이언트 hydration 완료 전까지 서버와 동일 출력(스켈레톤) 보장 → SSR↔CSR 미스매치 방지
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration detection requires effect
  useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(slug)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const {
    data: analysesData,
    isLoading: isLoadingAnalyses,
    isError: isAnalysesError,
  } = useQuery({
    ...requirementAnalysesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const analyses = useMemo<RequirementAnalysisListItem[]>(() => {
    if (!analysesData?.success) return [];
    const items = analysesData.data;
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    );
  }, [analysesData, searchQuery]);

  if (!hydrated || isLoadingProject || isLoadingAnalyses) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-3 h-24 w-full" />
          ))}
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  // 요구사항 목록 조회 실패를 "요구사항 없음"으로 위장하지 않고 에러 폴백으로 표시.
  if (isAnalysesError || (analysesData && !analysesData.success)) {
    return <ProjectErrorFallback />;
  }

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-4 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex flex-col gap-1">
        <h1 className="typo-title-heading">요구사항 생성</h1>
        <p className="typo-body1-normal text-text-3">
          요구사항을 입력하면 AI가 요구사항 분석서와 테스트 시나리오를 만들어줍니다.
        </p>
      </header>

      <ActionToolbar.Root ariaLabel="요구사항 분석 컨트롤">
        <ActionToolbar.Group>
          <ActionToolbar.Search
            placeholder="제목·요약으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </ActionToolbar.Group>
        <ActionToolbar.Action
          size="small"
          type="button"
          variant="solid"
          onClick={onOpen}
          disabled={!projectId}
        >
          <Plus className="h-4 w-4" />
          <span className="leading-none">새 요구사항 분석</span>
        </ActionToolbar.Action>
      </ActionToolbar.Root>

      <section className="col-span-6 flex min-h-0 flex-col">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {analyses.length === 0 ? (
            <div className="rounded-3 border-line-2 bg-bg-2/50 flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <FileSearch className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                {searchQuery.trim() ? (
                  <>
                    <p className="typo-h3-heading text-text-1">검색 결과가 없습니다.</p>
                    <p className="typo-body2-normal text-text-3">
                      다른 키워드로 다시 검색해보세요.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="typo-h3-heading text-text-1">
                      아직 생성한 요구사항 분석이 없습니다.
                    </p>
                    <p className="typo-body2-normal text-text-3">
                      요구사항을 입력해 분석서와 테스트 시나리오를 만들어보세요.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            analyses.map((a) => (
              <Link
                key={a.id}
                href={`/projects/${slug}/scenarios/${a.id}`}
                className="rounded-3 border-line-2 bg-bg-2 hover:border-primary/40 flex flex-col gap-2.5 border px-5 py-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="typo-body1-heading text-text-1 truncate">{a.title}</h3>
                    {a.summary && (
                      <p className="typo-body2-normal text-text-3 mt-1 line-clamp-2 whitespace-pre-line">
                        {a.summary}
                      </p>
                    )}
                  </div>
                  <span className="typo-label-normal text-text-4 shrink-0">
                    {formatDate(a.createdAt)}
                  </span>
                </div>
                <div className="text-text-3 flex flex-wrap items-center gap-4">
                  <span className="typo-label-normal flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" />
                    기능 요구사항 {a.functionalCount}
                  </span>
                  <span className="typo-label-normal flex items-center gap-1.5">
                    <FolderTree className="h-3.5 w-3.5" />
                    시나리오 {a.scenarioCount} · 스위트 {a.savedSuiteCount}개 저장
                  </span>
                  <span className="typo-label-normal bg-bg-3 rounded-full px-2 py-0.5">
                    {LANGUAGE_LABEL[a.language] ?? a.language}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {isOpen && projectId && <RequirementAnalysisModal projectId={projectId} onClose={onClose} />}
    </MainContainer>
  );
};
