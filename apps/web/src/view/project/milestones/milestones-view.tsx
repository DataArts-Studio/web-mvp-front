'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { Milestone, MilestoneWithStats } from '@/entities/milestone';
import { projectIdQueryOptions } from '@/entities/project';
import { MilestoneCreateForm, milestonesQueryOptions } from '@/features/milestones-create';
import { MilestoneEditForm } from '@/features/milestones-edit';
import { MILESTONE_EVENTS, track } from '@/shared/lib/analytics';
import { todayDateOnly } from '@/shared/lib/date-only';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import { ChevronDown, Plus, Search } from 'lucide-react';

import {
  type MilestoneListTab,
  type MilestonePhase,
  PHASE_ORDER,
  groupMilestones,
} from './_components/milestone-list-model';
import { MILESTONE_ROW_GRID, MilestoneListRow } from './_components/milestone-list-row';

const PHASE_LABEL: Record<MilestonePhase, string> = {
  inProgress: '진행 중',
  planned: '예정',
  done: '완료',
};

const TABS: { value: MilestoneListTab; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'inProgress', label: PHASE_LABEL.inProgress },
  { value: 'planned', label: PHASE_LABEL.planned },
  { value: 'done', label: PHASE_LABEL.done },
];

export const MilestonesView = () => {
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MilestoneListTab>('all');
  const [collapsed, setCollapsed] = useState<Record<MilestonePhase, boolean>>({
    inProgress: false,
    planned: false,
    done: false,
  });

  // 묶음·남은 날은 오늘 날짜에 달려 있어 서버와 어긋나지 않게 마운트 뒤에 그린다
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 로컬 날짜를 1회 확정. SSR↔CSR 미스매치 방지용
    setToday(todayDateOnly());
  }, []);

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(params.slug as string)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;
  const { data: milestonesResult, isLoading: isLoadingMilestones } = useQuery({
    ...milestonesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const milestonesData: MilestoneWithStats[] = useMemo(
    () => (milestonesResult?.success ? milestonesResult.data : []),
    [milestonesResult]
  );

  const filteredMilestones = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return milestonesData;
    return milestonesData.filter(
      (milestone) =>
        milestone.title.toLowerCase().includes(searchLower) ||
        (milestone.description?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [milestonesData, searchQuery]);

  const groups = useMemo(
    () => (today ? groupMilestones(filteredMilestones, today) : null),
    [filteredMilestones, today]
  );

  React.useEffect(() => {
    if (milestonesResult?.success) {
      track(MILESTONE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [milestonesResult?.success, projectId]);

  if (!groups || !today || isLoadingProject || isLoadingMilestones) {
    return (
      <MainContainer className="flex h-screen w-full flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-[350px] max-w-[50%]" />
        </header>
        <div className="border-line-2 flex gap-3 border-b px-4 pb-2.5 md:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
        <div className="flex flex-col px-4 pt-4 md:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-line-2 flex items-center gap-4 border-b px-2.5 py-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-6 w-[250px] lg:block" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  const tabCount = (tab: MilestoneListTab) =>
    tab === 'all' ? filteredMilestones.length : groups[tab].length;
  const visiblePhases = activeTab === 'all' ? PHASE_ORDER : [activeTab];
  const visibleCount = visiblePhases.reduce((sum, phase) => sum + groups[phase].length, 0);
  const isSearching = searchQuery.trim() !== '';

  return (
    <MainContainer className="flex h-screen w-full flex-1 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white">마일스톤</h1>
          <p className="text-[13px] tracking-[-0.02em] text-white/40">
            릴리스 단위로 테스트 진행 현황과 일정을 추적합니다
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="border-line-2 bg-bg-2 focus-within:border-primary/60 flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[6px] border px-3 sm:w-[240px] sm:flex-none">
            <span className="sr-only">마일스톤 검색</span>
            <Search className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="마일스톤 이름 검색"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/40"
            />
          </label>
          <button
            type="button"
            onClick={() => onOpen()}
            className="bg-primary hover:bg-primary/90 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 text-[14px] font-medium whitespace-nowrap text-white"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />새 마일스톤
          </button>
        </div>
      </header>

      <div className="border-line-2 flex flex-wrap items-center gap-2 border-b px-4 md:px-8">
        <div role="tablist" aria-label="마일스톤 상태" className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[14px] whitespace-nowrap',
                  active
                    ? 'border-primary font-bold text-white'
                    : 'border-transparent font-medium text-white/40 hover:text-white/70'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-[4px] px-2 py-0.5 text-[11px] font-medium',
                    active ? 'bg-primary/15 text-primary' : 'bg-white/[0.06] text-white'
                  )}
                >
                  {tabCount(tab.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section
        aria-label="마일스톤 목록"
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8 md:px-8"
      >
        {visibleCount === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="typo-body2-heading text-text-1">
              {milestonesData.length === 0
                ? '등록된 마일스톤이 없습니다.'
                : isSearching
                  ? '검색 결과가 없습니다.'
                  : `${PHASE_LABEL[activeTab as MilestonePhase]} 마일스톤이 없습니다.`}
            </p>
            {(milestonesData.length === 0 || isSearching) && (
              <p className="typo-body2-normal text-text-3 max-w-md">
                {isSearching
                  ? '다른 검색어를 시도해보세요.'
                  : '새로운 마일스톤을 생성하여 테스트 관리를 시작해보세요.'}
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className={cn(
                'hidden px-2.5 pb-2 text-[11px] text-white/40 lg:grid',
                MILESTONE_ROW_GRID
              )}
            >
              <span>마일스톤</span>
              <span>상태</span>
              <span>진행</span>
              <span />
              <span>범위</span>
              <span className="text-right">목표일</span>
            </div>
            {visiblePhases.map((phase) => {
              const items = groups[phase];
              if (items.length === 0) return null;
              const isCollapsed = collapsed[phase];
              const listId = `milestone-group-${phase}`;
              return (
                <div key={phase}>
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    aria-controls={listId}
                    onClick={() => setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }))}
                    className="flex w-full items-center gap-2 rounded-[4px] bg-white/[0.04] px-2.5 py-[7px] text-[12px] font-medium hover:bg-white/[0.06]"
                  >
                    <ChevronDown
                      className={cn(
                        'h-2.5 w-2.5 text-white/60 transition-transform',
                        isCollapsed && '-rotate-90'
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-white/75">{PHASE_LABEL[phase]}</span>
                    <span className="text-white/35">{items.length}</span>
                  </button>
                  {!isCollapsed && (
                    <ul id={listId}>
                      {items.map((milestone) => (
                        <MilestoneListRow
                          key={milestone.id}
                          milestone={milestone}
                          today={today}
                          href={`/projects/${params.slug}/milestones/${milestone.id}`}
                          projectSlug={params.slug as string}
                          onEdit={() => setEditingMilestone(milestone)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </>
        )}
      </section>
      {isOpen && projectId && <MilestoneCreateForm onClose={onClose} projectId={projectId} />}
      {editingMilestone && (
        <MilestoneEditForm milestone={editingMilestone} onClose={() => setEditingMilestone(null)} />
      )}
    </MainContainer>
  );
};
