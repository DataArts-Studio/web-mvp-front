'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import {
  type ScenarioListItem,
  type ScenarioStatus,
  deleteScenario,
  generateSuiteFromScenario,
  reorderScenarios,
  scenarioFeaturesQueryOptions,
  scenariosQueryOptions,
  updateScenario,
} from '@/entities/test-scenario';
import { ScenarioAiGenerateModal } from '@/features/ai-generate-scenarios';
import { arrayMove } from '@/features/reorder';
import { SCENARIO_STATUS_META, ScenarioFormModal } from '@/features/scenario-management';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

import { ScenarioRow } from '../_components/scenario-row';
import {
  ScenariosToolbar,
  type StatusFilter,
  type TypeFilter,
} from '../_components/scenarios-toolbar';
import { SortableScenarioRow } from '../_components/sortable-scenario-row';

const STATUS_ORDER = ['CONFIRMED', 'REVIEW', 'DRAFT'] as const;

export const ScenarioFeatureDetailView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const featureId = params.featureId as string;
  const isManual = featureId === 'manual';
  const requirementAnalysisId = isManual ? null : featureId;
  const queryClient = useQueryClient();
  const dndId = useId();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isAiOpen, onOpen: onAiOpen, onClose: onAiClose } = useDisclosure();
  const [editing, setEditing] = useState<ScenarioListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  const filter = useMemo(
    () => (isManual ? { manual: true } : { requirementAnalysisId: featureId }),
    [isManual, featureId]
  );

  const {
    data: scenariosData,
    isLoading: isLoadingScenarios,
    isError: isScenariosError,
  } = useQuery({
    ...scenariosQueryOptions(projectId!, filter),
    enabled: !!projectId,
  });

  // 기능 제목/메타는 마스터 목록 쿼리에서 가져온다(시나리오 0개 기능도 제목 표시).
  const { data: featuresData } = useQuery({
    ...scenarioFeaturesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const feature = featuresData?.success
    ? featuresData.data.find((f) => (isManual ? f.isManual : f.id === featureId))
    : undefined;
  const featureTitle = isManual ? '수동 작성' : (feature?.title ?? '기능');

  const items = useMemo<ScenarioListItem[]>(
    () => (scenariosData?.success ? scenariosData.data : []),
    [scenariosData]
  );

  const filtered = useMemo<ScenarioListItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, typeFilter, statusFilter]);

  const isFiltering = !!searchQuery.trim() || typeFilter !== 'all' || statusFilter !== 'all';

  // 드래그 재정렬용 로컬 순서. 서버 데이터가 바뀌면 렌더 중 리셋.
  const [localItems, setLocalItems] = useState<ScenarioListItem[] | null>(null);
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setLocalItems(null);
  }

  const displayItems = isFiltering ? filtered : (localItems ?? items);

  const statusCounts = useMemo(() => {
    const c = { DRAFT: 0, REVIEW: 0, CONFIRMED: 0 } as Record<ScenarioStatus, number>;
    items.forEach((s) => {
      c[s.status] += 1;
    });
    return c;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; sortOrder: number }[]) =>
      reorderScenarios({ projectId: projectId!, orders }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(Object.values(result.errors).flat().join(', '));
        setLocalItems(null);
      }
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['scenarioFeatures'] });
    },
    onError: () => {
      toast.error('순서 변경에 실패했습니다.');
      setLocalItems(null);
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const current = localItems ?? items;
      const oldIndex = current.findIndex((s) => s.id === active.id);
      const newIndex = current.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(current, oldIndex, newIndex);
      // 기능 내 시나리오가 점유한 sort_order 슬롯을 새 순서대로 재배정.
      const slots = current
        .map((s) => s.sortOrder)
        .slice()
        .sort((a, b) => a - b);
      setLocalItems(reordered.map((s, idx) => ({ ...s, sortOrder: slots[idx] })));
      reorderMutation.mutate(reordered.map((s, idx) => ({ id: s.id, sortOrder: slots[idx] })));
    },
    [localItems, items, reorderMutation]
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScenarioStatus }) =>
      updateScenario({ projectId: projectId!, id, status }),
    onSuccess: (result) => {
      if (!result.success) toast.error(Object.values(result.errors).flat().join(', '));
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['scenarioFeatures'] });
    },
    onError: () => toast.error('상태 변경에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScenario(projectId!, id),
    onMutate: (id) => setPendingId(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('시나리오를 삭제했습니다.');
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        queryClient.invalidateQueries({ queryKey: ['scenarioFeatures'] });
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: () => toast.error('삭제에 실패했습니다.'),
    onSettled: () => setPendingId(null),
  });

  const generateSuiteMutation = useMutation({
    mutationFn: (id: string) => generateSuiteFromScenario(projectId!, id),
    onMutate: (id) => setPendingId(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message ?? '시나리오에서 스위트를 생성했습니다.');
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        queryClient.invalidateQueries({ queryKey: ['testSuites'] });
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: () => toast.error('스위트 생성에 실패했습니다.'),
    onSettled: () => setPendingId(null),
  });

  const handleDelete = useCallback(
    (scenario: ScenarioListItem) => {
      if (!window.confirm(`'${scenario.name}' 시나리오를 삭제할까요?`)) return;
      deleteMutation.mutate(scenario.id);
    },
    [deleteMutation]
  );

  if (!hydrated || isLoadingProject || isLoadingScenarios) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-3 h-20 w-full" />
          ))}
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  // 시나리오 조회 실패를 "데이터 없음"으로 위장하지 않고 에러 폴백으로 표시.
  if (isScenariosError || (scenariosData && !scenariosData.success)) {
    return <ProjectErrorFallback />;
  }

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-4 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex flex-col gap-1">
        <Link
          href={`/projects/${slug}/scenarios`}
          className="typo-caption text-text-3 hover:text-text-1 flex w-fit items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          기능 목록
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="typo-title-heading">{featureTitle}</h1>
          <span className="typo-body2-normal text-text-3 flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" />
            {items.length}개
          </span>
          {STATUS_ORDER.filter((s) => statusCounts[s] > 0).map((s) => (
            <span
              key={s}
              className={`typo-caption rounded-full px-2 py-0.5 ${SCENARIO_STATUS_META[s].cls}`}
            >
              {SCENARIO_STATUS_META[s].label} {statusCounts[s]}
            </span>
          ))}
        </div>
      </header>

      <ScenariosToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        analysisFilter="all"
        onAnalysisChange={() => undefined}
        analysisOptions={[]}
        onNew={onCreateOpen}
        onAiGenerate={onAiOpen}
        disabled={!projectId}
      />

      <section className="col-span-6 flex min-h-0 flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {displayItems.length === 0 ? (
            <div className="rounded-3 border-line-2 bg-bg-2/50 flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <ListChecks className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                {isFiltering ? (
                  <>
                    <p className="typo-h3-heading text-text-1">조건에 맞는 시나리오가 없습니다.</p>
                    <p className="typo-body2-normal text-text-3">
                      필터를 바꾸거나 다른 키워드로 검색해보세요.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="typo-h3-heading text-text-1">아직 시나리오가 없습니다.</p>
                    <p className="typo-body2-normal text-text-3">
                      이 기능에 시나리오를 추가하거나 AI로 생성해보세요.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3 border-line-2 bg-bg-2 divide-line-2 divide-y border">
              <DndContext
                id={dndId}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayItems.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {displayItems.map((scenario) => (
                    <SortableScenarioRow key={scenario.id} id={scenario.id} disabled={isFiltering}>
                      <ScenarioRow
                        scenario={scenario}
                        busy={pendingId === scenario.id}
                        onEdit={setEditing}
                        onStatusChange={(s, status) => statusMutation.mutate({ id: s.id, status })}
                        onGenerateSuite={(s) => generateSuiteMutation.mutate(s.id)}
                        onDelete={handleDelete}
                      />
                    </SortableScenarioRow>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </section>

      {isAiOpen && projectId && (
        <ScenarioAiGenerateModal
          projectId={projectId}
          requirementAnalysisId={requirementAnalysisId}
          onClose={onAiClose}
        />
      )}
      {isCreateOpen && projectId && (
        <ScenarioFormModal
          projectId={projectId}
          requirementAnalysisId={requirementAnalysisId}
          onClose={onCreateClose}
          onSaved={() => undefined}
        />
      )}
      {editing && projectId && (
        <ScenarioFormModal
          projectId={projectId}
          scenario={editing}
          onClose={() => setEditing(null)}
          onSaved={() => undefined}
        />
      )}
    </MainContainer>
  );
};
