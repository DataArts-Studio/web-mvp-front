'use client';
import React, { useState } from 'react';

import { useParams } from 'next/navigation';

import { TEST_SUITES_RICH_MOCK as SUITES, TestSuiteCard } from '@/entities/test-suite';
import { SuiteCard } from '@/entities/test-suite/ui/suite-card';
import { dashboardStatsQueryOptions } from '@/features';
import { SuiteCreateForm } from '@/features/suites-create';
import { Container, MainContainer } from '@/shared';
import { useDisclosure } from '@/shared/hooks';
import { ActionToolbar, Aside } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { TestSuiteSideView } from './test-suite-side-view';

export const TestSuitesView = () => {
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSuite, setSelectedSuite] = useState<TestSuiteCard | null>(null);
  const { data: dashboardData } = useQuery(dashboardStatsQueryOptions(params.slug as string));
  const projectId = dashboardData?.success ? dashboardData.data.project.id : '';

  const handleSuiteClick = (suite: TestSuiteCard) => {
    setSelectedSuite(suite);
  };

  const handleSideViewClose = () => {
    setSelectedSuite(null);
  };

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* 헤더 영역 */}
        <header className="col-span-6 flex w-full items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="typo-title-heading">테스트 스위트 관리</h1>
            <p className="typo-body1-normal text-text-3">
              흩어진 테스트 케이스를 기능·시나리오 단위 스위트로 묶어 관리하고, 문서 복사 없이 같은
              스위트를 반복 실행하세요.
            </p>
          </div>
        </header>
        <ActionToolbar.Root ariaLabel="테스트 스위트 컨트롤">
          <ActionToolbar.Group>
            <ActionToolbar.Search placeholder="스위트 이름 또는 키워드로 검색" />
            <ActionToolbar.Filter
              options={['전체', '기능별', '시나리오']}
              currentValue={'전체'}
              onChange={() => '기능별'}
            />
          </ActionToolbar.Group>
          <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => onOpen()}>
            테스트 스위트 생성하기
          </ActionToolbar.Action>
        </ActionToolbar.Root>
        {/* 테스트 스위트 리스트 */}
        <section aria-label="테스트 스위트 리스트" className="col-span-6 flex flex-col gap-3">
          {SUITES.map((suite) => (
            <div
              key={suite.id}
              onClick={() => handleSuiteClick(suite)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSuiteClick(suite);
                }
              }}
            >
              <SuiteCard suite={suite} />
            </div>
          ))}
        </section>
        {isOpen && <SuiteCreateForm onClose={onClose} projectId={projectId} />}
        {selectedSuite && (
          <TestSuiteSideView suite={selectedSuite} onClose={handleSideViewClose} />
        )}
      </MainContainer>
    </Container>
  );
};
