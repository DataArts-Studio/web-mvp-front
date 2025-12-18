'use client';
import React from 'react';

import { MilestoneCard, milestonesMock } from '@/entities/milestone';
import { MilestoneCreateForm } from '@/features';
import { Container, DSButton, MainContainer } from '@/shared';
import { useDisclosure } from '@/shared/hooks';
import { Aside } from '@/widgets';
import { MilestoneToolBar } from '@/widgets/milestone/ui/milestone-tool-bar';
import { FolderOpen } from 'lucide-react';

export const MilestonesView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const data = milestonesMock;
  // const data = [];
  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* 헤더 영역 */}
        <header className="col-span-6 flex w-full items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="typo-title-heading">마일스톤 & 테스트 진행 현황</h1>
            <p className="typo-body1-normal text-text-3">
              스프레드시트 복사 대신, 마일스톤별 테스트 케이스와 실행 결과를 한 화면에서 확인하세요.
            </p>
          </div>
          <DSButton type="button" variant="solid" onClick={onOpen}>
            마일스톤 생성하기
          </DSButton>
        </header>
        <MilestoneToolBar />
        {/* 마일스톤 리스트 */}
        <section aria-label="마일스톤 목록" className="col-span-6 flex flex-col gap-3">
          {data.length === 0 ? (
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
            data.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} />)
          )}
        </section>
        {isOpen && <MilestoneCreateForm onClose={onClose} />}
      </MainContainer>
    </Container>
  );
};
