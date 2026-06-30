'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { Milestone, MilestoneCard, MilestoneWithStats } from '@/entities/milestone';
import { projectIdQueryOptions } from '@/entities/project';
import { MilestoneCreateForm, milestonesQueryOptions } from '@/features/milestones-create';
import { MilestoneEditForm } from '@/features/milestones-edit';
import { MILESTONE_EVENTS, track } from '@/shared/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, Pagination, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { Plus, Search } from 'lucide-react';

const PAGE_SIZE = 5;

export const MilestonesView = () => {
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

    return milestonesData.filter((milestone: MilestoneWithStats) => {
      return (
        milestone.title.toLowerCase().includes(searchLower) ||
        (milestone.description?.toLowerCase().includes(searchLower) ?? false)
      );
    });
  }, [milestonesData, searchQuery]);

  const totalItems = filteredMilestones.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedMilestones = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMilestones.slice(start, start + PAGE_SIZE);
  }, [filteredMilestones, currentPage]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
  };

  const handleCloseEdit = () => {
    setEditingMilestone(null);
  };

  React.useEffect(() => {
    if (milestonesResult?.success) {
      track(MILESTONE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [milestonesResult?.success, projectId]);

  if (isLoadingProject || isLoadingMilestones) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-[420px]" />
        </header>
        <div className="border-line-2 col-span-6 flex items-center justify-between gap-4 border-b pb-4">
          <Skeleton className="rounded-1 h-9 max-w-md flex-1" />
          <Skeleton className="rounded-1 h-9 w-36" />
        </div>
        <section className="col-span-6 flex min-h-[520px] flex-col overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-line-2 grid grid-cols-1 gap-3 border-b px-1 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:gap-6"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-72" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_1fr] gap-x-5 gap-y-5 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="typo-title-heading">마일스톤 & 테스트 진행 현황</h1>
          <p className="typo-body1-normal text-text-3">
            마일스톤별 테스트 범위, 진행률, 실행 이력을 한 화면에서 확인하세요.
          </p>
        </div>
      </header>

      <section
        aria-label="마일스톤 목록"
        className="col-span-6 flex min-h-0 flex-col overflow-hidden"
      >
        <div className="border-line-2 flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="typo-body2-heading text-text-1">마일스톤 목록</h2>
            <p className="typo-caption-normal text-text-4">
              {totalItems} / {milestonesData.length}
              {searchQuery.trim() ? ` · "${searchQuery.trim()}"` : ''}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
            <label className="relative min-w-0 flex-1 lg:max-w-md">
              <span className="sr-only">마일스톤 이름 또는 키워드로 검색</span>
              <Search
                aria-hidden="true"
                className="text-text-4 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                strokeWidth={1.8}
              />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="마일스톤 이름 또는 키워드로 검색"
                className="typo-body2-normal border-line-2 bg-bg-2 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary h-9 w-full border pr-3 pl-9 transition-colors outline-none focus:ring-1"
              />
            </label>
            <button
              type="button"
              onClick={() => onOpen()}
              className="typo-body2-heading bg-primary hover:bg-primary/90 inline-flex h-9 shrink-0 items-center justify-center gap-2 px-3 text-white transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              마일스톤 생성
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {milestonesData.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="typo-body2-heading text-text-1">등록된 마일스톤이 없습니다.</p>
                <p className="typo-body2-normal text-text-3 max-w-md">
                  새로운 마일스톤을 생성하여 테스트 관리를 시작해보세요.
                </p>
              </div>
            ) : filteredMilestones.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="typo-body2-heading text-text-1">검색 결과가 없습니다.</p>
                <p className="typo-body2-normal text-text-3 max-w-md">
                  다른 검색어를 시도해보세요.
                </p>
              </div>
            ) : (
              paginatedMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  href={`/projects/${params.slug}/milestones/${milestone.id}`}
                  projectSlug={params.slug as string}
                  milestone={milestone}
                  onEdit={() => handleEdit(milestone)}
                />
              ))
            )}
          </div>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="border-line-2 border-t"
        />
      </section>
      {isOpen && projectId && <MilestoneCreateForm onClose={onClose} projectId={projectId} />}
      {editingMilestone && (
        <MilestoneEditForm milestone={editingMilestone} onClose={handleCloseEdit} />
      )}
    </MainContainer>
  );
};
