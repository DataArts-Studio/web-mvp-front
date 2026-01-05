'use client';
import React, { useState } from 'react';

import { useParams } from 'next/navigation';

import { MilestoneCard, MilestoneWithStats } from '@/entities/milestone';
import { MilestoneCreateForm, dashboardStatsQueryOptions, milestonesQueryOptions } from '@/features';
import { Container, MainContainer } from '@/shared';
import { useDisclosure } from '@/shared/hooks';
import { ActionToolbar, Aside } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { MilestoneSideView } from './milestone-side-view';

export const MilestonesView = () => {
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneWithStats | null>(null);
  const { data: dashboardData } = useQuery(dashboardStatsQueryOptions(params.slug as string));
  const projectId = dashboardData?.success ? dashboardData.data.project.id : '';
  const { data: milestonesResult } = useQuery(milestonesQueryOptions(projectId));
  const milestonesData = milestonesResult?.success ? milestonesResult.data : [];

  const handleMilestoneClick = (milestone: MilestoneWithStats) => {
    setSelectedMilestone(milestone);
  };

  const handleSideViewClose = () => {
    setSelectedMilestone(null);
  };
  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
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
            <ActionToolbar.Search placeholder="마일스톤 이름 또는 키워드로 검색" />
            <ActionToolbar.Filter
              options={['전체', '진행 중', '완료', '예정']}
              currentValue={'전체'}
              onChange={() => '진행 중'}
            />
          </ActionToolbar.Group>
          <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => onOpen()}>
            마일스톤 생성하기
          </ActionToolbar.Action>
        </ActionToolbar.Root>
        {/* 마일스톤 리스트 */}
        <section aria-label="마일스톤 목록" className="col-span-6 flex flex-col gap-3">
          {milestonesData.length === 0 ? (
            <div className="rounded-3 border-border-2 bg-bg-2/50 col-span-6 flex flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
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
          ) : (
            milestonesData.map((milestone) => {
              const milestoneWithStats: MilestoneWithStats = {
                ...milestone,
                totalCases: 0,
                completedCases: 0,
                progressRate: 0,
                runCount: 0,
              };
              return (
                <div
                  key={milestone.id}
                  onClick={() => handleMilestoneClick(milestoneWithStats)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleMilestoneClick(milestoneWithStats);
                    }
                  }}
                >
                  <MilestoneCard milestone={milestoneWithStats} />
                </div>
              );
            })
          )}
        </section>
        {isOpen && <MilestoneCreateForm onClose={onClose} projectId={projectId} />}
        {selectedMilestone && (
          <MilestoneSideView milestone={selectedMilestone} onClose={handleSideViewClose} />
        )}
      </MainContainer>
    </Container>
  );
};
