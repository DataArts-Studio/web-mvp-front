'use client';
import React, { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { MilestoneCard, MilestoneWithStats, Milestone } from '@/entities/milestone';
import { projectIdQueryOptions } from '@/entities/project';
import { MilestoneCreateForm, milestonesQueryOptions } from '@/features/milestones-create';
import { MilestoneEditForm } from '@/features/milestones-edit';
import { dashboardQueryOptions } from '@/features/dashboard';
import { MainContainer } from '@/shared/lib/primitives';
import { useDisclosure } from '@/shared/hooks';
import { ActionToolbar } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';

// 필터 옵션과 상태값 매핑
const FILTER_OPTIONS = ['전체', '진행 중', '완료', '예정'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const FILTER_TO_STATUS: Record<FilterOption, string | null> = {
  '전체': null,
  '진행 중': 'inProgress',
  '완료': 'done',
  '예정': 'planned',
};

export const MilestonesView = () => {
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // 필터링 상태
  const [statusFilter, setStatusFilter] = useState<FilterOption>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // slug → projectId를 가벼운 쿼리로 빠르게 획득 (워터폴 제거)
  const { data: projectIdData } = useQuery(projectIdQueryOptions(params.slug as string));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(dashboardQueryOptions.stats(params.slug as string));
  const { data: milestonesResult, isLoading: isLoadingMilestones } = useQuery({
    ...milestonesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const milestonesData = milestonesResult?.success ? milestonesResult.data : [];

  // 필터링된 마일스톤 데이터
  const filteredMilestones = useMemo(() => {
    return milestonesData.filter((milestone: Milestone) => {
      // 상태 필터
      const statusMatch = statusFilter === '전체' || milestone.progressStatus === FILTER_TO_STATUS[statusFilter];

      // 검색어 필터 (제목, 설명에서 검색)
      const searchLower = searchQuery.toLowerCase().trim();
      const searchMatch = !searchLower ||
        milestone.title.toLowerCase().includes(searchLower) ||
        (milestone.description?.toLowerCase().includes(searchLower) ?? false);

      return statusMatch && searchMatch;
    });
  }, [milestonesData, statusFilter, searchQuery]);

  // 필터 변경 핸들러
  const handleFilterChange = (value: string) => {
    setStatusFilter(value as FilterOption);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
  };

  const handleCloseEdit = () => {
    setEditingMilestone(null);
  };
  // 마일스톤 목록 View 이벤트
  React.useEffect(() => {
    if (milestonesResult?.success) {
      track(MILESTONE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [milestonesResult?.success, projectId]);

  // 로딩 상태 — 스켈레톤 UI
  if (isLoadingProject || isLoadingMilestones) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* Header skeleton */}
        <header className="col-span-6 flex flex-col gap-2">
          <div className="h-8 w-72 animate-pulse rounded bg-bg-3" />
          <div className="h-5 w-[420px] animate-pulse rounded bg-bg-3" />
        </header>
        {/* Toolbar skeleton */}
        <div className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 flex-1 max-w-md animate-pulse rounded-2 border border-line-2 bg-bg-2" />
            <div className="h-10 w-28 animate-pulse rounded-2 border border-line-2 bg-bg-2" />
          </div>
          <div className="h-9 w-40 animate-pulse rounded-2 bg-bg-3" />
        </div>
        {/* Milestone card skeletons */}
        <section className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-5 border-l-4 border-l-bg-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
              {/* Left: title + badge + description + date */}
              <div className="flex w-full flex-col gap-2.5 md:w-[35%]">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-36 animate-pulse rounded bg-bg-3" />
                  <div className="h-6 w-14 animate-pulse rounded-full bg-bg-3" />
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-bg-3" />
                <div className="h-4 w-44 animate-pulse rounded bg-bg-3" />
              </div>
              {/* Middle: progress bar */}
              <div className="flex w-full flex-col gap-2 md:w-[30%]">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-10 animate-pulse rounded bg-bg-3" />
                  <div className="h-6 w-12 animate-pulse rounded bg-bg-3" />
                </div>
                <div className="h-2.5 w-full animate-pulse rounded-full bg-bg-3" />
                <div className="flex justify-between">
                  <div className="h-3 w-24 animate-pulse rounded bg-bg-3" />
                  <div className="h-3 w-16 animate-pulse rounded bg-bg-3" />
                </div>
              </div>
              {/* Right: stat cards */}
              <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="bg-bg-3/50 flex flex-col items-center rounded-xl px-4 py-2 gap-1">
                    <div className="h-5 w-6 animate-pulse rounded bg-bg-3" />
                    <div className="h-3 w-8 animate-pulse rounded bg-bg-3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  // 에러 상태
  if (!dashboardData?.success) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
      </MainContainer>
    );
  }

  return (
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex w-full items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="typo-title-heading">마일스톤 & 테스트 진행 현황</h1>
            <p className="typo-body1-normal text-text-3">
              스프레드시트 복사 대신, 마일스톤별 테스트 케이스와 실행 결과를 한 화면에서 확인하세요.
            </p>
          </div>
        </header>
        <ActionToolbar.Root ariaLabel="마일스톤 컨트롤">
          <ActionToolbar.Group>
            <ActionToolbar.Search
              placeholder="마일스톤 이름 또는 키워드로 검색"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <ActionToolbar.Filter
              options={[...FILTER_OPTIONS]}
              currentValue={statusFilter}
              onChange={handleFilterChange}
            />
          </ActionToolbar.Group>
          <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => onOpen()}>
            마일스톤 생성하기
          </ActionToolbar.Action>
        </ActionToolbar.Root>
        {/* 마일스톤 리스트 */}
        <section aria-label="마일스톤 목록" className="col-span-6 flex flex-col gap-3">
          {/* 필터 결과 카운트 */}
          {milestonesData.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="typo-body2-normal text-text-3">
                {statusFilter === '전체' && !searchQuery
                  ? `총 ${milestonesData.length}개의 마일스톤`
                  : `${filteredMilestones.length}개의 결과`}
              </p>
              {(statusFilter !== '전체' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('전체');
                    setSearchQuery('');
                  }}
                  className="typo-label-normal text-text-3 hover:text-primary transition-colors"
                >
                  필터 초기화
                </button>
              )}
            </div>
          )}

          {milestonesData.length === 0 ? (
            // 원본 데이터가 없는 경우
            <div className="rounded-3 border-line-2 bg-bg-2/50 col-span-6 flex min-h-[200px] flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <FolderOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="typo-h3-heading text-text-1">등록된 마일스톤이 없습니다.</p>
                <p className="typo-body2-normal text-text-3">
                  새로운 마일스톤을 생성하여 테스트 관리를 시작해보세요.
                </p>
              </div>
            </div>
          ) : filteredMilestones.length === 0 ? (
            // 필터 결과가 없는 경우
            <div className="rounded-3 border-line-2 bg-bg-2/50 col-span-6 flex min-h-[200px] flex-col items-center justify-center gap-4 border-2 border-dashed py-16 text-center">
              <div className="flex flex-col gap-1">
                <p className="typo-h3-heading text-text-1">검색 결과가 없습니다.</p>
                <p className="typo-body2-normal text-text-3">
                  다른 검색어나 필터를 시도해보세요.
                </p>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('전체');
                  setSearchQuery('');
                }}
                className="typo-body2-normal text-primary hover:underline"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            filteredMilestones.map((milestone: Milestone) => {
              const milestoneWithStats: MilestoneWithStats = {
                ...milestone,
                totalCases: 0,
                completedCases: 0,
                progressRate: 0,
                runCount: 0,
              };
              return (
                <Link
                  key={milestone.id}
                  href={`/projects/${params.slug}/milestones/${milestone.id}`}
                >
                  <MilestoneCard milestone={milestoneWithStats} onEdit={() => handleEdit(milestone)} />
                </Link>
              );
            })
          )}
        </section>
        {isOpen && projectId && <MilestoneCreateForm onClose={onClose} projectId={projectId} />}
        {editingMilestone && <MilestoneEditForm milestone={editingMilestone} onClose={handleCloseEdit} />}
      </MainContainer>
  );
};
