'use client';
import React, { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { MilestoneCard, MilestoneWithStats, Milestone } from '@/entities/milestone';
import { projectIdQueryOptions } from '@/entities/project';
import { MilestoneCreateForm, milestonesQueryOptions } from '@/features/milestones-create';
import { MilestoneEditForm } from '@/features/milestones-edit';
import { MainContainer } from '@testea/ui';
import { useDisclosure } from '@testea/lib';
import { ActionToolbar } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';
import { Skeleton, Pagination, ProjectErrorFallback } from '@testea/ui';

// 필터 옵션과 상태값 매핑
const FILTER_OPTIONS = ['전체', '진행 중', '완료', '예정'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];
const PAGE_SIZE = 5;

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
  const [currentPage, setCurrentPage] = useState(1);

  // slug → projectId를 가벼운 쿼리로 빠르게 획득 (워터폴 제거)
  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(projectIdQueryOptions(params.slug as string));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;
  const { data: milestonesResult, isLoading: isLoadingMilestones } = useQuery({
    ...milestonesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const milestonesData: MilestoneWithStats[] = useMemo(() => milestonesResult?.success ? milestonesResult.data : [], [milestonesResult]);

  // 필터링된 마일스톤 데이터
  const filteredMilestones = useMemo(() => {
    return milestonesData.filter((milestone: MilestoneWithStats) => {
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

  // 페이지네이션 계산
  const totalItems = filteredMilestones.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedMilestones = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMilestones.slice(start, start + PAGE_SIZE);
  }, [filteredMilestones, currentPage]);

  // 필터 변경 핸들러
  const handleFilterChange = (value: string) => {
    setStatusFilter(value as FilterOption);
    setCurrentPage(1);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-[420px]" />
        </header>
        <div className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-10 flex-1 max-w-md rounded-2 border border-line-2 bg-bg-2" />
            <Skeleton className="h-10 w-28 rounded-2 border border-line-2 bg-bg-2" />
          </div>
          <Skeleton className="h-9 w-40 rounded-2" />
        </div>
        <section className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-5 border-l-4 border-l-bg-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-2.5 md:w-[35%]">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-44" />
              </div>
              <div className="flex w-full flex-col gap-2 md:w-[30%]">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="bg-bg-3/50 flex flex-col items-center rounded-xl px-4 py-2 gap-1">
                    <Skeleton className="h-5 w-6" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-8 overflow-hidden px-10 py-8">
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
        <section aria-label="마일스톤 목록" className="col-span-6 flex min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto flex flex-col gap-3">
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
                      setCurrentPage(1);
                    }}
                    className="typo-label-normal text-text-3 hover:text-primary transition-colors"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}

            {milestonesData.length === 0 ? (
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
                    setCurrentPage(1);
                  }}
                  className="typo-body2-normal text-primary hover:underline"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              paginatedMilestones.map((milestone) => (
                  <Link
                    key={milestone.id}
                    href={`/projects/${params.slug}/milestones/${milestone.id}`}
                  >
                    <MilestoneCard milestone={milestone} onEdit={() => handleEdit(milestone)} />
                  </Link>
              ))
            )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </section>
        {isOpen && projectId && <MilestoneCreateForm onClose={onClose} projectId={projectId} />}
        {editingMilestone && <MilestoneEditForm milestone={editingMilestone} onClose={handleCloseEdit} />}
      </MainContainer>
  );
};
