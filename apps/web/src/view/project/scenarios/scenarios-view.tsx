'use client';

import { useMemo, useState } from 'react';

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
import { FolderTree, ListChecks, Plus, Sparkles } from 'lucide-react';

import { NewFeatureModal } from './_components/new-feature-modal';

const STATUS_ORDER = ['CONFIRMED', 'REVIEW', 'DRAFT'] as const;

export const ScenarioFeaturesView = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure();
  const { isOpen: isAiOpen, onOpen: onAiOpen, onClose: onAiClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(slug)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: featuresData, isLoading: isLoadingFeatures } = useQuery({
    ...scenarioFeaturesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const features = useMemo<ScenarioFeatureListItem[]>(() => {
    if (!featuresData?.success) return [];
    const items = featuresData.data;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => f.title.toLowerCase().includes(q));
  }, [featuresData, searchQuery]);

  const hrefFor = (f: ScenarioFeatureListItem) =>
    `/projects/${slug}/scenarios/${f.isManual ? 'manual' : f.id}`;

  if (isLoadingProject || isLoadingFeatures) {
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

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-4 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex flex-col gap-1">
        <h1 className="typo-title-heading">시나리오 관리</h1>
        <p className="typo-body1-normal text-text-3">
          기능(요구사항)별로 테스트 시나리오를 작성·관리합니다. 기능을 선택해 시나리오를 추가하세요.
        </p>
      </header>

      <ActionToolbar.Root ariaLabel="기능 목록 컨트롤">
        <ActionToolbar.Group>
          <ActionToolbar.Search
            placeholder="기능 이름으로 검색"
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
            <span className="leading-none">AI 요구사항 분석</span>
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

      <section className="col-span-6 flex min-h-0 flex-col">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {features.length === 0 ? (
            <div className="rounded-3 border-line-2 bg-bg-2/50 flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <FolderTree className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                {searchQuery.trim() ? (
                  <>
                    <p className="typo-h3-heading text-text-1">검색 결과가 없습니다.</p>
                    <p className="typo-body2-normal text-text-3">다른 키워드로 검색해보세요.</p>
                  </>
                ) : (
                  <>
                    <p className="typo-h3-heading text-text-1">아직 기능이 없습니다.</p>
                    <p className="typo-body2-normal text-text-3">
                      새 기능을 만들거나 AI 요구사항 분석으로 시작해보세요.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            features.map((f) => (
              <Link
                key={f.id ?? 'manual'}
                href={hrefFor(f)}
                className="rounded-3 border-line-2 bg-bg-2 hover:border-primary/40 flex flex-col gap-2.5 border px-5 py-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="typo-body1-heading text-text-1 truncate">{f.title}</h3>
                    {f.summary && (
                      <p className="typo-body2-normal text-text-3 mt-1 line-clamp-2 whitespace-pre-line">
                        {f.summary}
                      </p>
                    )}
                  </div>
                  {f.isManual && (
                    <span className="typo-caption text-text-4 bg-bg-3 shrink-0 rounded-full px-2 py-0.5">
                      수동
                    </span>
                  )}
                </div>
                <div className="text-text-3 flex flex-wrap items-center gap-3">
                  <span className="typo-label-normal flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" />
                    시나리오 {f.scenarioCount}개
                  </span>
                  {STATUS_ORDER.filter((s) => f.statusCounts[s] > 0).map((s) => (
                    <span
                      key={s}
                      className={`typo-caption rounded-full px-2 py-0.5 ${SCENARIO_STATUS_META[s].cls}`}
                    >
                      {SCENARIO_STATUS_META[s].label} {f.statusCounts[s]}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          )}
        </div>
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
