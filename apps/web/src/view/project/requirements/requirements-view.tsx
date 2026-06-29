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
import {
  CalendarDays,
  FileSearch,
  FileText,
  FolderTree,
  Languages,
  ListChecks,
  Plus,
  Sparkles,
} from 'lucide-react';

const LANGUAGE_LABEL: Record<string, string> = {
  ko: '한국어',
  en: 'English',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

const statItems = (analyses: RequirementAnalysisListItem[]) => {
  const functionalCount = analyses.reduce((sum, item) => sum + item.functionalCount, 0);
  const scenarioCount = analyses.reduce((sum, item) => sum + item.scenarioCount, 0);
  const savedSuiteCount = analyses.reduce((sum, item) => sum + item.savedSuiteCount, 0);

  return [
    { label: '분석서', value: analyses.length, icon: FileText },
    { label: '기능 요구사항', value: functionalCount, icon: ListChecks },
    { label: '시나리오', value: scenarioCount, icon: FolderTree },
    { label: '저장된 스위트', value: savedSuiteCount, icon: Sparkles },
  ];
};

export const RequirementsView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');

  // 클라이언트 hydration 완료 전까지 서버와 동일 출력(스켈레톤) 보장 → SSR↔CSR 미스매치 방지
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 hydration 완료 표시로 SSR↔CSR 미스매치 방지. mount-once 1회성이라 cascading render 비용 없음
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

  const allAnalyses = useMemo<RequirementAnalysisListItem[]>(
    () => (analysesData?.success ? analysesData.data : []),
    [analysesData]
  );

  const analyses = useMemo<RequirementAnalysisListItem[]>(() => {
    if (!searchQuery.trim()) return allAnalyses;
    const q = searchQuery.toLowerCase();
    return allAnalyses.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    );
  }, [allAnalyses, searchQuery]);

  const stats = useMemo(() => statItems(allAnalyses), [allAnalyses]);
  const latestAnalysis = allAnalyses[0];
  const languageCount = useMemo(
    () =>
      allAnalyses.reduce<Record<string, number>>((acc, item) => {
        acc[item.language] = (acc[item.language] ?? 0) + 1;
        return acc;
      }, {}),
    [allAnalyses]
  );

  if (!hydrated || isLoadingProject || isLoadingAnalyses) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1280px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="rounded-3 h-28 w-full" />
            ))}
          </div>
          <Skeleton className="rounded-3 hidden h-80 w-full lg:block" />
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
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1280px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-5 overflow-hidden px-10 py-8">
      <header className="col-span-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="typo-caption text-primary">AI 요구사항 분석</p>
          <h1 className="typo-title-heading text-text-1">요구사항 생성</h1>
          <p className="typo-body1-normal text-text-3 max-w-2xl">
            요구사항을 입력하면 분석서, 기능 요구사항, 테스트 시나리오를 생성하고 후속 작업으로
            연결합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[30rem]">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="border-line-2 bg-bg-2 rounded-3 border px-3 py-2.5">
                <div className="text-text-3 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="typo-caption truncate">{item.label}</span>
                </div>
                <p className="typo-h3-heading text-text-1 mt-1">{item.value}</p>
              </div>
            );
          })}
        </div>
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

      <section className="col-span-6 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-0 flex-col">
          <div className="border-line-2 bg-bg-2 rounded-3 mb-3 flex items-center justify-between border px-4 py-3">
            <div>
              <h2 className="typo-body1-heading text-text-1">분석서 목록</h2>
              <p className="typo-label-normal text-text-3 mt-0.5">
                {searchQuery.trim()
                  ? `검색 결과 ${analyses.length}개 / 전체 ${allAnalyses.length}개`
                  : `전체 ${allAnalyses.length}개 분석서`}
              </p>
            </div>
            <span className="typo-caption bg-bg-3 text-text-3 rounded-full px-2 py-1">최신순</span>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {analyses.length === 0 ? (
              <div className="rounded-3 border-line-2 bg-bg-2/50 flex h-full min-h-[320px] flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
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
                  className="group rounded-3 border-line-2 bg-bg-2 hover:border-primary/40 hover:bg-bg-3 flex flex-col gap-3 border px-5 py-4 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-bg-3 text-primary border-line-2 rounded-3 flex h-10 w-10 shrink-0 items-center justify-center border">
                      <FileText className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="typo-body1-heading text-text-1 group-hover:text-primary truncate">
                          {a.title}
                        </h3>
                        <span className="typo-caption bg-bg-3 text-text-3 rounded-full px-2 py-0.5">
                          {LANGUAGE_LABEL[a.language] ?? a.language}
                        </span>
                      </div>
                      {a.summary && (
                        <p className="typo-body2-normal text-text-3 mt-1.5 line-clamp-2 whitespace-pre-line">
                          {a.summary}
                        </p>
                      )}
                    </div>
                    <span className="typo-label-normal text-text-4 hidden shrink-0 sm:block">
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                  <div className="text-text-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-14">
                    <span className="typo-label-normal flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" />
                      기능 요구사항 {a.functionalCount}
                    </span>
                    <span className="typo-label-normal flex items-center gap-1.5">
                      <FolderTree className="h-3.5 w-3.5" />
                      시나리오 {a.scenarioCount}
                    </span>
                    <span className="typo-label-normal flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      스위트 {a.savedSuiteCount}개 저장
                    </span>
                    <span className="typo-label-normal text-text-4 flex items-center gap-1.5 sm:hidden">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
          <div className="border-line-2 bg-bg-2 rounded-3 border p-4">
            <h2 className="typo-body1-heading text-text-1">작업 흐름</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {[
                ['1', '요구사항 입력', '문서나 기능 설명을 분석합니다.'],
                ['2', '시나리오 검토', '생성된 시나리오를 기능별로 정리합니다.'],
                ['3', '스위트 저장', '실행 가능한 테스트 묶음으로 전환합니다.'],
              ].map(([step, title, desc]) => (
                <li key={step} className="flex gap-3">
                  <span className="bg-bg-3 text-text-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
                    {step}
                  </span>
                  <span className="min-w-0">
                    <span className="typo-label-heading text-text-2 block">{title}</span>
                    <span className="typo-label-normal text-text-4 mt-0.5 block">{desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-line-2 bg-bg-2 rounded-3 border p-4">
            <div className="flex items-center gap-2">
              <Languages className="text-text-3 h-4 w-4" />
              <h2 className="typo-body1-heading text-text-1">언어 구성</h2>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {Object.keys(languageCount).length === 0 ? (
                <p className="typo-label-normal text-text-4">아직 분석서가 없습니다.</p>
              ) : (
                Object.entries(languageCount).map(([language, count]) => (
                  <div key={language} className="flex items-center justify-between gap-3">
                    <span className="typo-label-normal text-text-3">
                      {LANGUAGE_LABEL[language] ?? language}
                    </span>
                    <span className="typo-label-heading text-text-1">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-3 border p-4">
            <h2 className="typo-body1-heading text-text-1">다음 추천 작업</h2>
            <p className="typo-body2-normal text-text-3 mt-2">
              {latestAnalysis
                ? `${latestAnalysis.title} 분석서의 시나리오를 확인하고 테스트 스위트로 저장하세요.`
                : '첫 요구사항 분석서를 생성해 테스트 설계 흐름을 시작하세요.'}
            </p>
            {latestAnalysis ? (
              <Link
                href={`/projects/${slug}/scenarios/${latestAnalysis.id}`}
                className="typo-label-heading text-primary mt-3 inline-flex"
              >
                최신 분석서 열기
              </Link>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                disabled={!projectId}
                className="typo-label-heading text-primary mt-3 inline-flex disabled:opacity-50"
              >
                새 분석 시작
              </button>
            )}
          </div>
        </aside>
      </section>

      {isOpen && projectId && <RequirementAnalysisModal projectId={projectId} onClose={onClose} />}
    </MainContainer>
  );
};
