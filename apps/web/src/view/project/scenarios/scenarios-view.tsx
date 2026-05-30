'use client';

import { useCallback, useId, useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import {
  type ScenarioListItem,
  type ScenarioStatus,
  deleteScenario,
  generateSuiteFromScenario,
  reorderScenarios,
  scenariosQueryOptions,
  updateScenario,
} from '@/entities/test-scenario';
import { arrayMove } from '@/features/reorder';
import { ScenarioFormModal } from '@/features/scenario-management';
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
import { ListChecks } from 'lucide-react';
import { toast } from 'sonner';

import { ScenarioRow } from './_components/scenario-row';
import {
  ScenariosToolbar,
  type StatusFilter,
  type TypeFilter,
} from './_components/scenarios-toolbar';
import { SortableScenarioRow } from './_components/sortable-scenario-row';

export const ScenariosView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const dndId = useId();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [editing, setEditing] = useState<ScenarioListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [analysisFilter, setAnalysisFilter] = useState('all');

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(slug)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: scenariosData, isLoading: isLoadingScenarios } = useQuery({
    ...scenariosQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const allScenarios = useMemo<ScenarioListItem[]>(
    () => (scenariosData?.success ? scenariosData.data : []),
    [scenariosData]
  );

  const analysisOptions = useMemo(() => {
    const map = new Map<string, string>();
    allScenarios.forEach((s) => {
      if (s.requirementAnalysisId && s.analysisTitle) {
        map.set(s.requirementAnalysisId, s.analysisTitle);
      }
    });
    return [...map.entries()].map(([id, title]) => ({ id, title }));
  }, [allScenarios]);

  const isFiltering =
    !!searchQuery.trim() ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    analysisFilter !== 'all';

  const filtered = useMemo<ScenarioListItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    return allScenarios.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (analysisFilter === 'manual' && s.requirementAnalysisId) return false;
      if (analysisFilter !== 'all' && analysisFilter !== 'manual') {
        if (s.requirementAnalysisId !== analysisFilter) return false;
      }
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [allScenarios, searchQuery, typeFilter, statusFilter, analysisFilter]);

  // 드래그 재정렬용 로컬 순서. 서버 데이터가 바뀌면 렌더 중 리셋(effect setState 회피).
  const [localItems, setLocalItems] = useState<ScenarioListItem[] | null>(null);
  const [prevScenarios, setPrevScenarios] = useState(allScenarios);
  if (prevScenarios !== allScenarios) {
    setPrevScenarios(allScenarios);
    setLocalItems(null);
  }

  const displayItems = isFiltering ? filtered : (localItems ?? allScenarios);

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
      const current = localItems ?? allScenarios;
      const oldIndex = current.findIndex((s) => s.id === active.id);
      const newIndex = current.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(current, oldIndex, newIndex);
      setLocalItems(reordered);
      reorderMutation.mutate(reordered.map((s, idx) => ({ id: s.id, sortOrder: idx + 1 })));
    },
    [localItems, allScenarios, reorderMutation]
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScenarioStatus }) =>
      updateScenario({ projectId: projectId!, id, status }),
    onSuccess: (result) => {
      if (!result.success) toast.error(Object.values(result.errors).flat().join(', '));
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
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
        toast.success('시나리오에서 스위트를 생성했습니다.');
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

  if (isLoadingProject || isLoadingScenarios) {
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

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-4 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex flex-col gap-1">
        <h1 className="typo-title-heading">시나리오 관리</h1>
        <p className="typo-body1-normal text-text-3">
          요구사항에서 도출한 테스트 시나리오를 작성·수정하고 스위트로 파생합니다.
        </p>
      </header>

      <ScenariosToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        analysisFilter={analysisFilter}
        onAnalysisChange={setAnalysisFilter}
        analysisOptions={analysisOptions}
        onNew={onCreateOpen}
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
                      요구사항 분석에서 생성하거나 직접 추가해보세요.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3 border-line-2 bg-bg-2 border">
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
                  <div className="divide-line-2 divide-y">
                    {displayItems.map((scenario) => (
                      <SortableScenarioRow
                        key={scenario.id}
                        id={scenario.id}
                        disabled={isFiltering}
                      >
                        <ScenarioRow
                          scenario={scenario}
                          busy={pendingId === scenario.id}
                          onEdit={setEditing}
                          onStatusChange={(s, status) =>
                            statusMutation.mutate({ id: s.id, status })
                          }
                          onGenerateSuite={(s) => generateSuiteMutation.mutate(s.id)}
                          onDelete={handleDelete}
                        />
                      </SortableScenarioRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </section>

      {isCreateOpen && projectId && (
        <ScenarioFormModal
          projectId={projectId}
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
