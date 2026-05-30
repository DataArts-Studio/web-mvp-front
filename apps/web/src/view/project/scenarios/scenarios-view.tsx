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
import { ScenarioAiGenerateModal } from '@/features/ai-generate-scenarios';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { ChevronsDownUp, ChevronsUpDown, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

import { ScenarioGroup } from './_components/scenario-group';
import {
  ScenariosToolbar,
  type StatusFilter,
  type TypeFilter,
} from './_components/scenarios-toolbar';

export const ScenariosView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const dndId = useId();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isAiOpen, onOpen: onAiOpen, onClose: onAiClose } = useDisclosure();
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

  // 출처 피쳐(요구사항 분석)별 그룹. 수동 작성은 별도 그룹. sort_order 기준 정렬 후 등장 순서로 묶는다.
  const groups = useMemo(() => {
    const sorted = [...displayItems].sort((a, b) => a.sortOrder - b.sortOrder);
    const map = new Map<
      string,
      { key: string; title: string; isManual: boolean; items: ScenarioListItem[] }
    >();
    for (const s of sorted) {
      const key = s.requirementAnalysisId ?? '__manual__';
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          title: s.analysisTitle ?? '수동 작성',
          isManual: !s.requirementAnalysisId,
          items: [],
        };
        map.set(key, g);
      }
      g.items.push(s);
    }
    return [...map.values()];
  }, [displayItems]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.key));
  const toggleAllGroups = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.key)));

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

  // 드래그는 같은 그룹 안에서만. 그룹이 점유한 sort_order 슬롯을 새 순서대로 재배정해
  // 다른 그룹의 순서를 건드리지 않는다.
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const current = localItems ?? allScenarios;
      const activeItem = current.find((s) => s.id === active.id);
      const overItem = current.find((s) => s.id === over.id);
      if (!activeItem || !overItem) return;
      const keyOf = (s: ScenarioListItem) => s.requirementAnalysisId ?? '__manual__';
      if (keyOf(activeItem) !== keyOf(overItem)) return; // 그룹 간 이동 금지

      const groupItems = current
        .filter((s) => keyOf(s) === keyOf(activeItem))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const oldIndex = groupItems.findIndex((s) => s.id === active.id);
      const newIndex = groupItems.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedGroup = arrayMove(groupItems, oldIndex, newIndex);
      const slots = groupItems.map((s) => s.sortOrder).sort((a, b) => a - b);
      const newSort = new Map(reorderedGroup.map((s, idx) => [s.id, slots[idx]]));

      setLocalItems(
        current.map((s) => (newSort.has(s.id) ? { ...s, sortOrder: newSort.get(s.id)! } : s))
      );
      reorderMutation.mutate(reorderedGroup.map((s, idx) => ({ id: s.id, sortOrder: slots[idx] })));
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
                      요구사항 분석에서 생성하거나 직접 추가해보세요.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="typo-caption text-text-4">
                  피쳐 {groups.length}개 · 시나리오 {displayItems.length}개
                </span>
                <button
                  type="button"
                  onClick={toggleAllGroups}
                  className="typo-caption text-text-3 hover:text-text-1 flex items-center gap-1 transition-colors"
                >
                  {allCollapsed ? (
                    <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {allCollapsed ? '모두 펼치기' : '모두 접기'}
                </button>
              </div>
              <div className="rounded-3 border-line-2 bg-bg-2 divide-line-2 divide-y border">
                <DndContext
                  id={dndId}
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  {groups.map((group) => (
                    <ScenarioGroup
                      key={group.key}
                      title={group.title}
                      isManual={group.isManual}
                      items={group.items}
                      collapsed={collapsed.has(group.key)}
                      onToggle={() => toggleGroup(group.key)}
                      dragDisabled={isFiltering}
                      pendingId={pendingId}
                      onEdit={setEditing}
                      onStatusChange={(s, status) => statusMutation.mutate({ id: s.id, status })}
                      onGenerateSuite={(s) => generateSuiteMutation.mutate(s.id)}
                      onDelete={handleDelete}
                    />
                  ))}
                </DndContext>
              </div>
            </div>
          )}
        </div>
      </section>

      {isAiOpen && projectId && (
        <ScenarioAiGenerateModal projectId={projectId} onClose={onAiClose} />
      )}
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
