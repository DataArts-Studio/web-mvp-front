'use client';
import React, { useRef } from 'react';

import { useParams } from 'next/navigation';

import { TestCaseCard, TestCaseCardType } from '@/entities/test-case';
import { TestCaseDetailForm, useCreateCase } from '@/features/cases-create';
import { testCasesQueryOptions } from '@/features/cases-list';
import { dashboardStatsQueryOptions } from '@/features/dashboard';
import { Container, DSButton, Input, MainContainer } from '@/shared';
import { useDisclosure } from '@/shared/hooks';
import { TestCaseSideView } from '@/view/project/cases/test-case-side-view';
import { ActionToolbar, Aside, TestTable } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Filter, Plus } from 'lucide-react';

const TABLE_HEADERS = [
  { id: 'id', label: 'ID', colSpan: 'col-span-2' },
  { id: 'title', label: '제목', colSpan: 'col-span-4' },
  { id: 'status', label: '상태', colSpan: 'col-span-2', textAlign: 'text-center' },
  { id: 'updatedAt', label: '최종 수정', colSpan: 'col-span-3', textAlign: 'text-center' },
  { id: 'actions', label: '메뉴', colSpan: 'col-span-1', textAlign: 'text-right' },
] as const;

type ModalType = 'create' | 'detail';

export const TestCasesView = () => {
  const params = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const { mutate, isPending } = useCreateCase();

  const { data: dashboardData } = useQuery(
    dashboardStatsQueryOptions(params.slug as string),
  );

  const projectId = dashboardData?.success ? dashboardData.data.project.id : '';

  const { data: testCasesData } = useQuery({
    ...testCasesQueryOptions(projectId),
    enabled: !!projectId,
  });

  const testCases: TestCaseCardType[] = testCasesData?.success
    ? testCasesData.data.map((item) => ({
        ...item,
        suiteTitle: '',
        status: 'untested' as const,
        lastExecutedAt: null,
      }))
    : [];

  const handleCreateTestCase = () => {
    const title = inputRef.current?.value.trim();
    if (!title || isPending) return;

    mutate(
      { title, projectId },
      {
        onSuccess: () => {
          if (inputRef.current) inputRef.current.value = '';
        },
      },
    );
  };

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* Header */}
        <header className="border-line-2 col-span-6 flex flex-col gap-1 border-b pb-6">
          <h2 className="typo-h1-heading text-text-1">테스트 케이스 관리</h2>
          <p className="typo-body2-normal text-text-2">
            프로젝트의 모든 테스트 케이스를 조회하고 관리합니다.
          </p>
        </header>

        <ActionToolbar.Root
          ariaLabel="마일스톤 컨트롤"
          className="col-span-6 flex items-center justify-between gap-4 bg-transparent p-0"
        >
          <ActionToolbar.Group className="relative w-full max-w-md">
            <ActionToolbar.Search placeholder="테스트 케이스 제목을 입력해 주세요." />
            {/* Filter Dropdown Trigger */}
            <DSButton className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors">
              <Filter className="h-4 w-4" />
              <span>상태: All</span>
              <ChevronDown className="text-text-3 h-4 w-4" />
            </DSButton>
            {/* Sort Dropdown Trigger */}
            <DSButton className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors">
              <span>정렬: 최근 수정 순</span>
              <ChevronDown className="text-text-3 h-4 w-4" />
            </DSButton>
          </ActionToolbar.Group>
          <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => onOpen('create')} className='flex items-center gap-2'>
            <Plus className="h-4 w-4" />
            <span className='leading-none'>테스트 케이스 생성</span>
          </ActionToolbar.Action>
        </ActionToolbar.Root>

        {/* Test Case List Container */}
        <section className="rounded-4 border-line-2 bg-bg-2 shadow-1 col-span-6 overflow-hidden border">
          <TestTable.Root>
            <TestTable.Header headers={TABLE_HEADERS} />
            <TestTable.Row className="group border-line-2 bg-primary/5 hover:bg-primary/10 grid grid-cols-12 gap-4 border-b px-6 py-3 transition-colors">
              <div className="col-span-12 flex items-center gap-3">
                <div className="rounded-1 bg-primary/20 text-primary flex h-6 w-6 items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="새로운 테스트 케이스 이름을 입력하고 Enter를 누르세요..."
                  className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent focus:outline-none"
                  disabled={isPending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTestCase();
                    }
                  }}
                />
              </div>
            </TestTable.Row>
            {testCases.map((item) => (
              <TestTable.Row key={item.caseKey} onClick={() => onOpen('detail')}>
                <TestCaseCard testCase={item} />
              </TestTable.Row>
            ))}
            <TestTable.Pagination />
          </TestTable.Root>
        </section>
      </MainContainer>
      {isActiveType('create') && <TestCaseDetailForm projectId={projectId} onClose={onClose} />}
      {isActiveType('detail') && <TestCaseSideView onClose={onClose} />}
    </Container>
  );
};

