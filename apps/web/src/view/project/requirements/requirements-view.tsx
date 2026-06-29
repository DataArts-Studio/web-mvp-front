'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import type { RequirementAnalysisListItem } from '@/entities/requirement-analysis';
import { requirementAnalysesQueryOptions } from '@/entities/requirement-analysis';
import { RequirementAnalysisModal } from '@/features/ai-requirement-analysis';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { DSButton, MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
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
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1280px] flex-1 grid-cols-6 grid-rows-[auto_1fr] gap-x-5 gap-y-5 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="typo-caption text-primary">요구사항 정리</p>
          <h1 className="typo-title-heading text-text-1 mt-1">요구사항 생성</h1>
          <p className="typo-body1-normal text-text-3 mt-1.5 max-w-2xl">
            요구사항 문서를 정리하고 기능 단위 시나리오로 이어지는 작업 목록을 관리합니다.
          </p>
        </div>
        <DSButton size="small" type="button" variant="solid" onClick={onOpen} disabled={!projectId}>
          <Plus className="h-4 w-4" />
          <span className="leading-none">새 요구사항 정리</span>
        </DSButton>
      </header>

      <section className="col-span-6 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="border-line-2 bg-bg-2 rounded-3 flex min-h-0 flex-col overflow-hidden border">
          <div className="border-line-2 flex flex-col gap-3 border-b px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="typo-body1-heading text-text-1">요구사항 정리</h2>
                <p className="typo-label-normal text-text-3 mt-0.5">
                  {searchQuery.trim()
                    ? `검색 결과 ${analyses.length}개 / 전체 ${allAnalyses.length}개`
                    : `전체 ${allAnalyses.length}개 분석`}
                </p>
              </div>
              <span className="typo-caption bg-bg-3 text-text-3 shrink-0 rounded-full px-2 py-1">
                최신순
              </span>
            </div>
            <div className="relative w-full max-w-2xl lg:max-w-3xl">
              <Search
                className="text-text-4 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목·요약으로 검색"
                className="border-line-2 bg-bg-1 typo-body2-normal text-text-1 placeholder:text-text-4 focus:border-primary h-9 w-full rounded-full border px-9 transition-colors outline-none"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {analyses.length === 0 ? (
              <div className="grid h-full min-h-[360px] overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="flex min-w-0 flex-col justify-center px-8 py-10">
                  <div className="bg-bg-3 text-primary border-line-2 rounded-3 flex h-11 w-11 items-center justify-center border">
                    <FileSearch className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  {searchQuery.trim() ? (
                    <>
                      <h3 className="typo-h2-heading text-text-1 mt-5">검색 결과가 없습니다.</h3>
                      <p className="typo-body2-normal text-text-3 mt-2 max-w-xl">
                        제목이나 요약에 포함된 다른 키워드로 다시 검색해보세요.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="typo-h2-heading text-text-1 mt-5">
                        아직 정리된 요구사항이 없습니다.
                      </h3>
                      <p className="typo-body2-normal text-text-3 mt-2 max-w-xl">
                        기능 설명이나 정책 문서를 등록하면 시나리오 설계에 필요한 기준을 남길 수
                        있습니다.
                      </p>
                      <button
                        type="button"
                        onClick={onOpen}
                        disabled={!projectId}
                        className="bg-primary hover:bg-primary/90 typo-label-heading rounded-2 mt-5 inline-flex h-9 w-fit items-center justify-center gap-2 px-4 text-white transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />새 요구사항 정리
                      </button>
                    </>
                  )}
                </div>
                <div className="border-line-2 bg-bg-1/60 flex flex-col justify-center gap-4 border-t px-6 py-8 lg:border-t-0 lg:border-l">
                  <div>
                    <p className="typo-label-heading text-text-2">입력하면 좋은 내용</p>
                    <ul className="typo-label-normal text-text-4 mt-2 flex flex-col gap-1.5">
                      <li>사용자 역할과 주요 행동</li>
                      <li>정상 흐름과 예외 조건</li>
                      <li>화면, API, 데이터 제약</li>
                    </ul>
                  </div>
                  <div className="border-line-2 border-t pt-4">
                    <p className="typo-label-heading text-text-2">연결되는 작업</p>
                    <p className="typo-label-normal text-text-4 mt-1">
                      정리한 요구사항은 시나리오 관리와 테스트 스위트 작성의 기준으로 사용됩니다.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-full">
                <div className="border-line-2 text-text-4 grid grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] gap-4 border-b px-5 py-2.5 text-xs max-lg:hidden">
                  <span>항목</span>
                  <span>요구사항</span>
                  <span>시나리오</span>
                  <span>생성일</span>
                </div>
                <div className="divide-line-2 divide-y">
                  {analyses.map((a) => (
                    <Link
                      key={a.id}
                      href={`/projects/${slug}/scenarios/${a.id}`}
                      className="group hover:bg-bg-3 grid gap-3 px-5 py-4 transition-colors lg:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] lg:items-center lg:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                            className="text-primary h-4 w-4 shrink-0"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          <h3 className="typo-body1-heading text-text-1 group-hover:text-primary truncate">
                            {a.title}
                          </h3>
                          <span className="typo-caption bg-bg-3 text-text-3 shrink-0 rounded-full px-2 py-0.5">
                            {LANGUAGE_LABEL[a.language] ?? a.language}
                          </span>
                        </div>
                        {a.summary && (
                          <p className="typo-body2-normal text-text-3 mt-1.5 line-clamp-2 whitespace-pre-line lg:line-clamp-1">
                            {a.summary}
                          </p>
                        )}
                        <div className="text-text-4 mt-2 flex flex-wrap gap-x-3 gap-y-1 lg:hidden">
                          <span className="typo-label-normal">
                            기능 요구사항 {a.functionalCount}
                          </span>
                          <span className="typo-label-normal">시나리오 {a.scenarioCount}</span>
                          <span className="typo-label-normal">
                            스위트 {a.savedSuiteCount}개 저장
                          </span>
                          <span className="typo-label-normal">{formatDate(a.createdAt)}</span>
                        </div>
                      </div>
                      <span className="typo-label-normal text-text-3 hidden lg:flex lg:items-center lg:gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                        {a.functionalCount}
                      </span>
                      <span className="typo-label-normal text-text-3 hidden lg:flex lg:items-center lg:gap-1.5">
                        <FolderTree className="h-3.5 w-3.5" aria-hidden="true" />
                        {a.scenarioCount}
                      </span>
                      <span className="typo-label-normal text-text-4 hidden lg:block">
                        {formatDate(a.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
          <div className="border-line-2 bg-bg-2 rounded-3 border p-4">
            <h2 className="typo-body1-heading text-text-1">검토 기준</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {[
                ['1', '범위', '기능에 포함되는 동작과 제외할 동작을 나눕니다.'],
                ['2', '예외', '실패 조건과 빈 값, 권한 차이를 확인합니다.'],
                ['3', '검증', '시나리오와 스위트로 옮길 기준을 남깁니다.'],
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
              <h2 className="typo-body1-heading text-text-1">문서 언어</h2>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {Object.keys(languageCount).length === 0 ? (
                <p className="typo-label-normal text-text-4">아직 정리된 문서가 없습니다.</p>
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
            <h2 className="typo-body1-heading text-text-1">최근 작업</h2>
            <p className="typo-body2-normal text-text-3 mt-2">
              {latestAnalysis
                ? `${latestAnalysis.title} 항목에서 이어진 시나리오를 확인하세요.`
                : '요구사항을 먼저 정리하면 시나리오 작성으로 이어갈 수 있습니다.'}
            </p>
            {latestAnalysis ? (
              <Link
                href={`/projects/${slug}/scenarios/${latestAnalysis.id}`}
                className="typo-label-heading text-primary mt-3 inline-flex"
              >
                최근 항목 열기
              </Link>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                disabled={!projectId}
                className="typo-label-heading text-primary mt-3 inline-flex disabled:opacity-50"
              >
                새 요구사항 정리
              </button>
            )}
          </div>
        </aside>
      </section>

      {isOpen && projectId && <RequirementAnalysisModal projectId={projectId} onClose={onClose} />}
    </MainContainer>
  );
};
