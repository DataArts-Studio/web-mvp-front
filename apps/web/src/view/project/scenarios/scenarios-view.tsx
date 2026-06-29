'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import {
  type ScenarioFeatureListItem,
  scenarioFeaturesQueryOptions,
} from '@/entities/test-scenario';
import { RequirementAnalysisModal } from '@/features/ai-requirement-analysis';
import { SCENARIO_STATUS_META } from '@/features/scenario-management';
import { ActionToolbar } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { CalendarDays, FileText, FolderTree, ListChecks, Plus, Sparkles } from 'lucide-react';

import { NewFeatureModal } from './_components/new-feature-modal';

const STATUS_ORDER = ['CONFIRMED', 'REVIEW', 'DRAFT'] as const;

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '수동';

export const ScenarioFeaturesView = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure();
  const { isOpen: isAiOpen, onOpen: onAiOpen, onClose: onAiClose } = useDisclosure();
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
    data: featuresData,
    isLoading: isLoadingFeatures,
    isError: isFeaturesError,
  } = useQuery({
    ...scenarioFeaturesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const allFeatures = useMemo<ScenarioFeatureListItem[]>(
    () => (featuresData?.success ? featuresData.data : []),
    [featuresData]
  );

  const features = useMemo<ScenarioFeatureListItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allFeatures;
    return allFeatures.filter(
      (f) => f.title.toLowerCase().includes(q) || f.summary.toLowerCase().includes(q)
    );
  }, [allFeatures, searchQuery]);

  const statusTotals = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        count: allFeatures.reduce((sum, feature) => sum + feature.statusCounts[status], 0),
      })),
    [allFeatures]
  );
  const totalScenarioCount = allFeatures.reduce((sum, feature) => sum + feature.scenarioCount, 0);
  const latestFeature = allFeatures.find((feature) => !feature.isManual) ?? allFeatures[0];

  const hrefFor = (f: ScenarioFeatureListItem) =>
    `/projects/${slug}/scenarios/${f.isManual ? 'manual' : f.id}`;

  if (!hydrated || isLoadingProject || isLoadingFeatures) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1280px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="rounded-3 h-24 w-full" />
            ))}
          </div>
          <Skeleton className="rounded-3 hidden h-72 w-full lg:block" />
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  // 기능 목록 조회 실패를 "기능 없음"으로 위장하지 않고 에러 폴백으로 표시.
  if (isFeaturesError || (featuresData && !featuresData.success)) {
    return <ProjectErrorFallback />;
  }

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1280px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-5 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex flex-col gap-1.5">
        <p className="typo-caption text-primary">시나리오</p>
        <h1 className="typo-title-heading text-text-1">시나리오 관리</h1>
        <p className="typo-body1-normal text-text-3 max-w-2xl">
          기능별 시나리오와 상태를 확인하고 테스트 스위트로 넘길 항목을 정리합니다.
        </p>
      </header>

      <ActionToolbar.Root ariaLabel="기능 목록 컨트롤">
        <ActionToolbar.Group>
          <ActionToolbar.Search
            placeholder="기능 이름·요약으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </ActionToolbar.Group>
        <div className="flex shrink-0 items-center gap-2">
          <ActionToolbar.Action
            size="small"
            type="button"
            variant="ghost"
            onClick={onAiOpen}
            disabled={!projectId}
          >
            <Sparkles className="h-4 w-4" />
            <span className="leading-none">요구사항 정리</span>
          </ActionToolbar.Action>
          <ActionToolbar.Action
            size="small"
            type="button"
            variant="solid"
            onClick={onNewOpen}
            disabled={!projectId}
          >
            <Plus className="h-4 w-4" />
            <span className="leading-none">새 기능</span>
          </ActionToolbar.Action>
        </div>
      </ActionToolbar.Root>

      <section className="col-span-6 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="border-line-2 bg-bg-2 rounded-3 flex min-h-0 flex-col overflow-hidden border">
          <div className="border-line-2 flex items-center justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h2 className="typo-body1-heading text-text-1">기능별 시나리오</h2>
              <p className="typo-label-normal text-text-3 mt-0.5">
                {searchQuery.trim()
                  ? `검색 결과 ${features.length}개 / 전체 ${allFeatures.length}개`
                  : `전체 ${allFeatures.length}개 기능 · 시나리오 ${totalScenarioCount}개`}
              </p>
            </div>
            <span className="typo-caption bg-bg-3 text-text-3 shrink-0 rounded-full px-2 py-1">
              상태별 관리
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {features.length === 0 ? (
              <div className="grid h-full min-h-[360px] overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="flex min-w-0 flex-col justify-center px-8 py-10">
                  <div className="bg-bg-3 text-primary border-line-2 rounded-3 flex h-11 w-11 items-center justify-center border">
                    <FolderTree className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  {searchQuery.trim() ? (
                    <>
                      <h3 className="typo-h2-heading text-text-1 mt-5">검색 결과가 없습니다.</h3>
                      <p className="typo-body2-normal text-text-3 mt-2 max-w-xl">
                        기능 이름이나 요약에 포함된 다른 키워드로 다시 검색해보세요.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="typo-h2-heading text-text-1 mt-5">
                        아직 등록된 기능이 없습니다.
                      </h3>
                      <p className="typo-body2-normal text-text-3 mt-2 max-w-xl">
                        기능을 직접 추가하거나 정리된 요구사항에서 시나리오를 이어서 만들 수
                        있습니다.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={onNewOpen}
                          disabled={!projectId}
                          className="bg-primary hover:bg-primary/90 typo-label-heading rounded-2 inline-flex h-9 items-center justify-center gap-2 px-4 text-white transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />새 기능
                        </button>
                        <button
                          type="button"
                          onClick={onAiOpen}
                          disabled={!projectId}
                          className="border-line-2 bg-bg-3 hover:bg-bg-1 typo-label-heading text-text-2 rounded-2 inline-flex h-9 items-center justify-center gap-2 border px-4 transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          요구사항 정리
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="border-line-2 bg-bg-1/60 flex flex-col justify-center gap-4 border-t px-6 py-8 lg:border-t-0 lg:border-l">
                  <div>
                    <p className="typo-label-heading text-text-2">검토할 항목</p>
                    <ul className="typo-label-normal text-text-4 mt-2 flex flex-col gap-1.5">
                      <li>기능별 시나리오 묶음</li>
                      <li>초안·검토·확정 상태</li>
                      <li>스위트로 묶을 대상</li>
                    </ul>
                  </div>
                  <div className="border-line-2 border-t pt-4">
                    <p className="typo-label-heading text-text-2">연결되는 작업</p>
                    <p className="typo-label-normal text-text-4 mt-1">
                      검토가 끝난 시나리오는 테스트 스위트에서 바로 사용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-full">
                <div className="border-line-2 text-text-4 grid grid-cols-[minmax(0,1fr)_7rem_12rem_6rem] gap-4 border-b px-5 py-2.5 text-xs max-lg:hidden">
                  <span>기능</span>
                  <span>시나리오</span>
                  <span>상태</span>
                  <span>생성</span>
                </div>
                <div className="divide-line-2 divide-y">
                  {features.map((f) => (
                    <Link
                      key={f.id ?? 'manual'}
                      href={hrefFor(f)}
                      className="group hover:bg-bg-3 grid gap-3 px-5 py-4 transition-colors lg:grid-cols-[minmax(0,1fr)_7rem_12rem_6rem] lg:items-center lg:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                            className="text-primary h-4 w-4 shrink-0"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          <h3 className="typo-body1-heading text-text-1 group-hover:text-primary truncate">
                            {f.title}
                          </h3>
                          {f.isManual && (
                            <span className="typo-caption bg-bg-3 text-text-3 shrink-0 rounded-full px-2 py-0.5">
                              수동
                            </span>
                          )}
                        </div>
                        {f.summary && (
                          <p className="typo-body2-normal text-text-3 mt-1.5 line-clamp-2 whitespace-pre-line lg:line-clamp-1">
                            {f.summary}
                          </p>
                        )}
                        <div className="text-text-4 mt-2 flex flex-wrap gap-x-3 gap-y-1 lg:hidden">
                          <span className="typo-label-normal">시나리오 {f.scenarioCount}개</span>
                          {STATUS_ORDER.filter((s) => f.statusCounts[s] > 0).map((s) => (
                            <span key={s} className="typo-label-normal">
                              {SCENARIO_STATUS_META[s].label} {f.statusCounts[s]}
                            </span>
                          ))}
                          <span className="typo-label-normal">{formatDate(f.createdAt)}</span>
                        </div>
                      </div>
                      <span className="typo-label-normal text-text-3 hidden lg:flex lg:items-center lg:gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                        {f.scenarioCount}
                      </span>
                      <div className="hidden flex-wrap gap-1.5 lg:flex">
                        {STATUS_ORDER.filter((s) => f.statusCounts[s] > 0).map((s) => (
                          <span
                            key={s}
                            className={`typo-caption rounded-full px-2 py-0.5 ${SCENARIO_STATUS_META[s].cls}`}
                          >
                            {SCENARIO_STATUS_META[s].label} {f.statusCounts[s]}
                          </span>
                        ))}
                      </div>
                      <span className="typo-label-normal text-text-4 hidden lg:flex lg:items-center lg:gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDate(f.createdAt)}
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
            <h2 className="typo-body1-heading text-text-1">상태별 개수</h2>
            <div className="mt-4 flex flex-col gap-2">
              {statusTotals.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between gap-3">
                  <span
                    className={`typo-caption rounded-full px-2 py-0.5 ${SCENARIO_STATUS_META[status].cls}`}
                  >
                    {SCENARIO_STATUS_META[status].label}
                  </span>
                  <span className="typo-label-heading text-text-1">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-line-2 bg-bg-2 rounded-3 border p-4">
            <h2 className="typo-body1-heading text-text-1">검토 기준</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {[
                ['1', '범위', '기능 안에서 검증할 행동을 확인합니다.'],
                ['2', '상태', '초안과 검토 완료 항목을 구분합니다.'],
                ['3', '실행', '스위트에 넣을 시나리오만 남깁니다.'],
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

          <div className="border-primary/20 bg-primary/5 rounded-3 border p-4">
            <h2 className="typo-body1-heading text-text-1">최근 작업</h2>
            <p className="typo-body2-normal text-text-3 mt-2">
              {latestFeature
                ? `${latestFeature.title} 기능에서 정리 중인 시나리오를 확인하세요.`
                : '기능을 먼저 등록하면 시나리오를 추가할 수 있습니다.'}
            </p>
            {latestFeature ? (
              <Link
                href={hrefFor(latestFeature)}
                className="typo-label-heading text-primary mt-3 inline-flex"
              >
                기능 열기
              </Link>
            ) : (
              <button
                type="button"
                onClick={onNewOpen}
                disabled={!projectId}
                className="typo-label-heading text-primary mt-3 inline-flex disabled:opacity-50"
              >
                새 기능 만들기
              </button>
            )}
          </div>
        </aside>
      </section>

      {isNewOpen && projectId && (
        <NewFeatureModal
          projectId={projectId}
          onClose={onNewClose}
          onCreated={(featureId) => {
            onNewClose();
            router.push(`/projects/${slug}/scenarios/${featureId}`);
          }}
        />
      )}
      {isAiOpen && projectId && (
        <RequirementAnalysisModal projectId={projectId} onClose={onAiClose} />
      )}
    </MainContainer>
  );
};
