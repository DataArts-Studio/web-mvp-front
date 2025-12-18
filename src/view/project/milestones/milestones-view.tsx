'use client';
import React from 'react';
import { Container, DSButton, MainContainer } from '@/shared';
import { Aside } from '@/widgets';
import { Calendar, CheckCircle, ListChecks, PlayCircle } from 'lucide-react';
import { MilestoneCreateForm } from '@/features';
import { useDisclosure } from '@/shared/hooks';
import { MilestoneToolBar } from '@/widgets/milestone/ui/milestone-tool-bar';

export const MilestonesView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 py-8 max-w-[1200px] mx-auto px-10">
        {/* 헤더 영역 */}
        <header className="col-span-6 flex w-full items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="typo-title-heading">마일스톤 & 테스트 진행 현황</h1>
            <p className="typo-body1-normal text-text-3">
              스프레드시트 복사 대신, 마일스톤별 테스트 케이스와 실행 결과를 한 화면에서 확인하세요.
            </p>
          </div>
          <DSButton type='button' variant='solid' onClick={onOpen}>마일스톤 생성하기</DSButton>
        </header>
        <MilestoneToolBar/>
        {/* 마일스톤 리스트 */}
        <section aria-label="마일스톤 목록" className="col-span-6 flex flex-col gap-3">
          {/* 카드 1 */}


          {/* 카드 2 */}
          <article className="bg-bg-2 shadow-1 flex w-full flex-col gap-4 rounded-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:w-[40%]">
              <div className="flex items-center gap-3">
                <h2 className="typo-h2-heading">v1.1 베타</h2>
                <span className="typo-label-heading rounded-full bg-amber-500/20 px-3 py-1 text-amber-300">
                  진행중
                </span>
              </div>
              <p className="typo-body2-normal text-text-2">
                사용자 피드백 기반 개선 항목을 베타 환경에서 검증.
              </p>
              <div className="flex items-center gap-1.5 text-label-normal text-text-3">
                <Calendar className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>2024-12-28 ~ 2025-01-10</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-[30%]">
              <div className="flex items-center justify-between text-label-normal text-text-3">
                <span>진행률</span>
                <span className="typo-body2-heading text-primary">42%</span>
              </div>
              <div className="bg-bg-3 h-1.5 w-full rounded-full">
                <div className="bg-primary h-full w-[42%] rounded-full" />
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 text-label-normal text-text-3 md:w-[30%] md:items-end">
              <div className="flex items-center gap-1.5 md:justify-end">
                <ListChecks className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>테스트 케이스 28개</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <CheckCircle className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>12개 완료</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <PlayCircle className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>실행 1회</span>
              </div>
            </div>
          </article>

          {/* 카드 3 */}
          <article className="bg-bg-2 shadow-1 flex w-full flex-col gap-4 rounded-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:w-[40%]">
              <div className="flex items-center gap-3">
                <h2 className="typo-h2-heading">버그 수정 스프린트</h2>
                <span className="typo-label-heading rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">
                  완료
                </span>
              </div>
              <p className="typo-body2-normal text-text-2">
                릴리즈 전 발견된 크리티컬 이슈를 집중적으로 해결한 스프린트.
              </p>
              <div className="flex items-center gap-1.5 text-label-normal text-text-3">
                <Calendar className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>2024-12-01 ~ 2024-12-10</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-[30%]">
              <div className="flex items-center justify-between text-label-normal text-text-3">
                <span>진행률</span>
                <span className="typo-body2-heading text-primary">100%</span>
              </div>
              <div className="bg-bg-3 h-1.5 w-full rounded-full">
                <div className="bg-primary h-full w-full rounded-full" />
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 text-label-normal text-text-3 md:w-[30%] md:items-end">
              <div className="flex items-center gap-1.5 md:justify-end">
                <ListChecks className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>테스트 케이스 15개</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <CheckCircle className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>15개 완료</span>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end">
                <PlayCircle className="h-4 w-4 text-text-3" strokeWidth={1.5} />
                <span>실행 2회</span>
              </div>
            </div>
          </article>
        </section>
        {isOpen && <MilestoneCreateForm onClose={onClose}/>}
      </MainContainer>
    </Container>
  );
};
