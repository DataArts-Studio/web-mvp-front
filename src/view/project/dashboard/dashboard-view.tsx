'use client';
import React, { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { TestCaseDetailForm } from '@/features/cases-create';
import { testCasesQueryOptions } from '@/features/cases-list';
import { dashboardQueryOptions } from '@/features/dashboard';
import { SuiteCreateForm } from '@/features/suites-create';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { useDisclosure } from '@/shared/hooks';
import { DSButton } from '@/shared/ui';
import { Aside } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronRight, Clock, FileText, FolderOpen, Plus, Settings, Share2 } from 'lucide-react';

type ModalType = 'case' | 'suite';

export const ProjectDashboardView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const [isCopied, setIsCopied] = useState(false);

  const {
    data: dashboardData,
    isLoading,
  } = useQuery({
    ...dashboardQueryOptions.stats(slug),
    enabled: !!slug,
  });

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: testCasesData } = useQuery({
    ...testCasesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testCases = testCasesData?.success ? testCasesData.data : [];
  const testSuites = dashboardData?.success ? dashboardData.data.testSuites : [];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('링크 복사 실패:', err);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-text-3">로딩 중...</div>
        </MainContainer>
      </Container>
    );
  }

  // 에러 상태
  if (!dashboardData?.success) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
        </MainContainer>
      </Container>
    );
  }

  const { project, recentActivities } = dashboardData.data;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* Header */}
        <header className="border-line-2 col-span-6 flex flex-col gap-1 border-b pb-6">
          <h1 className="typo-h1-heading text-text-1">대시보드</h1>
          <p className="typo-body2-normal text-text-2">
            클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 만들어보세요.
          </p>
        </header>

        {/* 프로젝트 정보 + 최근 활동 카드 */}
        <section className="col-span-6 grid grid-cols-6 gap-5">
          {/* 내 프로젝트 정보 카드 */}
          <div className="rounded-3 border-line-2 bg-bg-2 col-span-2 flex flex-col gap-4 border p-5">
            <span className="typo-body2-heading text-text-3">내 프로젝트 정보</span>

            <div className="rounded-2 bg-bg-3 flex flex-col items-center justify-center gap-2 p-4">
              <div className="flex items-center gap-2">
                <span className="typo-body2-heading text-primary truncate max-w-[200px]">
                  {project.name}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  title="링크 복사"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </button>
              </div>
              <span className="typo-caption text-text-3">
                {new Date(project.created_at).toLocaleDateString('ko-KR')} 생성됨
              </span>
            </div>

            <div className="flex justify-end">
              <DSButton variant="text" className="text-text-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>환경설정</span>
              </DSButton>
            </div>
          </div>

          {/* 최근 활동 카드 */}
          <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5">
            <span className="typo-body2-heading text-text-3">최근 활동</span>

            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <Clock className="text-text-3 h-8 w-8" />
                <p className="typo-body2-normal text-text-3">최근 활동이 없습니다.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentActivities.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                    <span className="typo-body2-normal text-text-1 flex-1 truncate">
                      {item.title}
                    </span>
                    <span className="typo-caption text-text-3">
                      {item.created_at}일 전
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 테스트 케이스 섹션 */}
        <section className="col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href={`/projects/${slug}/cases`} className="flex items-center gap-2 group">
              <h2 className="typo-h2-heading text-text-1">테스트 케이스</h2>
              <span className="typo-body2-normal text-text-3">({testCases.length})</span>
              <ChevronRight className="text-text-3 group-hover:text-text-1 h-5 w-5 transition-colors" />
            </Link>
            {testCases.length > 0 && (
              <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={() => onOpen('case')}>
                <Plus className="h-4 w-4" />
                <span>추가</span>
              </DSButton>
            )}
          </div>

          {testCases.length === 0 ? (
            /* 빈 상태 카드 */
            <div className="rounded-3 border-line-2 bg-bg-2 border-2 border-dashed flex flex-col items-center justify-center gap-6 py-16">
              <Image
                src="/teacup/tea-cup-not-found.svg"
                width={200}
                height={255}
                alt="테스트 케이스 없음"
              />

              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="typo-h3-heading text-text-1">테스트 케이스를 생성해보세요!</h3>
                <p className="typo-body2-normal text-text-3">
                  아직 생성된 테스트 케이스가 없습니다.
                  <br />
                  테스트 케이스를 만들면 여기에서 빠르게 확인할 수 있어요.
                </p>
              </div>

              <DSButton variant="solid" className="flex items-center gap-2" onClick={() => onOpen('case')}>
                <Plus className="h-4 w-4" />
                <span>테스트 케이스 만들기</span>
              </DSButton>
            </div>
          ) : (
            /* 테스트 케이스 목록 */
            <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
              {testCases.slice(0, 5).map((testCase) => (
                <Link
                  key={testCase.id}
                  href={`/projects/${slug}/cases`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-bg-3 transition-colors"
                >
                  <div className="bg-primary/10 text-primary rounded-2 flex h-10 w-10 items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="typo-caption text-text-3">{testCase.caseKey}</span>
                    <span className="typo-body2-heading text-text-1 truncate">{testCase.title}</span>
                  </div>
                  <span className="typo-caption text-text-3 shrink-0">
                    {new Date(testCase.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              ))}
              {testCases.length > 5 && (
                <Link
                  href={`/projects/${slug}/cases`}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-primary hover:bg-bg-3 transition-colors"
                >
                  <span className="typo-body2-heading">전체 보기 ({testCases.length}개)</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </section>

        {/* 테스트 스위트 섹션 */}
        <section className="col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href={`/projects/${slug}/suites`} className="flex items-center gap-2 group">
              <h2 className="typo-h2-heading text-text-1">테스트 스위트</h2>
              <span className="typo-body2-normal text-text-3">({testSuites.length})</span>
              <ChevronRight className="text-text-3 group-hover:text-text-1 h-5 w-5 transition-colors" />
            </Link>
            {testSuites.length > 0 && (
              <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={() => onOpen('suite')}>
                <Plus className="h-4 w-4" />
                <span>추가</span>
              </DSButton>
            )}
          </div>

          {testSuites.length === 0 ? (
            /* 빈 상태 카드 */
            <div className="rounded-3 border-line-2 bg-bg-2/50 border-2 border-dashed flex flex-col items-center justify-center gap-4 py-12">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <FolderOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="typo-h3-heading text-text-1">테스트 스위트를 생성해보세요!</h3>
                <p className="typo-body2-normal text-text-3">
                  아직 생성된 테스트 스위트가 없습니다.
                  <br />
                  테스트 스위트로, 테스트 케이스를 더 쉽게 관리해보세요!
                </p>
              </div>

              <DSButton variant="solid" className="flex items-center gap-2" onClick={() => onOpen('suite')}>
                <Plus className="h-4 w-4" />
                <span>테스트 스위트 만들기</span>
              </DSButton>
            </div>
          ) : (
            /* 테스트 스위트 목록 */
            <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
              {testSuites.slice(0, 5).map((suite) => (
                <Link
                  key={suite.id}
                  href={`/projects/${slug}/suites/${suite.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-bg-3 transition-colors"
                >
                  <div className="bg-system-blue/10 text-system-blue rounded-2 flex h-10 w-10 items-center justify-center shrink-0">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="typo-body2-heading text-text-1 truncate">{suite.name}</span>
                    <span className="typo-caption text-text-3">
                      {suite.description || '설명 없음'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="typo-caption text-text-3 bg-bg-3 px-2 py-1 rounded-1">
                      케이스 {suite.case_count}개
                    </span>
                  </div>
                </Link>
              ))}
              {testSuites.length > 5 && (
                <Link
                  href={`/projects/${slug}/suites`}
                  className="flex items-center justify-center gap-2 px-5 py-3 text-primary hover:bg-bg-3 transition-colors"
                >
                  <span className="typo-body2-heading">전체 보기 ({testSuites.length}개)</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </section>
      </MainContainer>

      {/* Modals */}
      {isActiveType('case') && projectId && (
        <TestCaseDetailForm projectId={projectId} onClose={onClose} />
      )}
      {isActiveType('suite') && projectId && (
        <SuiteCreateForm projectId={projectId} onClose={onClose} />
      )}
    </Container>
  );
};
