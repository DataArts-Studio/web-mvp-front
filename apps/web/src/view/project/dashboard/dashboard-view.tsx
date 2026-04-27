'use client';
import React, { useState, useEffect, useMemo } from 'react';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';
import { useDisclosure } from '@testea/lib';
import { useInViewOnce } from '@testea/lib';
import { useQuery } from '@tanstack/react-query';
import { track, DASHBOARD_EVENTS } from '@/shared/lib/analytics';
import type { TestStatusData } from '@/widgets/project/ui/test-status-chart';
import { KPISkeleton, InfoSkeleton, CardListSkeleton } from './dashboard-skeletons';
import { TestCasesSection, TestSuitesSection } from './dashboard-sections';
import { ProjectInfoCard, StorageCard } from './_components/dashboard-info-cards';
import { DashboardRecentActivity } from './_components/dashboard-recent-activity';
import { DashboardChartSection } from './_components/dashboard-chart-section';
import { KPICards, type KPIData } from '@/widgets/project/ui/kpi-cards';

const TestCaseDetailForm = dynamic(
  () => import('@/features/cases-create').then(mod => ({ default: mod.TestCaseDetailForm })),
);
const SuiteCreateForm = dynamic(
  () => import('@/features/suites-create').then(mod => ({ default: mod.SuiteCreateForm })),
);

type ModalType = 'case' | 'suite';

type ProjectDashboardContentProps = {
  projectId?: string;
};

export const ProjectDashboardContent = ({ projectId: serverProjectId }: ProjectDashboardContentProps) => {
  const params = useParams();
  const slug = params.slug as string;
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const [isCopied, setIsCopied] = useState(false);

  // 클라이언트 hydration 완료 전까지 전체 페이지 스켈레톤 표시
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration detection requires effect
  useEffect(() => { setHydrated(true); }, []);

  const { targetRef: ganttRef, visible: ganttVisible } = useInViewOnce();
  const { targetRef: casesRef, visible: casesVisible } = useInViewOnce();
  const { targetRef: suitesRef, visible: suitesVisible } = useInViewOnce();

  const { data: dashboardData, isLoading } = useQuery({
    ...dashboardQueryOptions.stats(slug),
    enabled: !!slug,
  });

  // 서버에서 전달된 projectId 우선 사용, 없으면 dashboardData에서 추출
  const projectId = serverProjectId ?? (dashboardData?.success ? dashboardData.data.project.id : undefined);

  const { data: storageData } = useQuery({
    ...dashboardQueryOptions.storageInfo(projectId!),
    enabled: !!projectId,
  });

  const { data: testCasesData } = useQuery({
    ...testCasesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testCases = testCasesData?.success ? testCasesData.data.items : [];
  const totalCasesCount = testCasesData?.success ? testCasesData.data.pagination.totalItems : 0;
  const testSuites = dashboardData?.success ? dashboardData.data.testSuites : [];

  // 테스트 실행 목록 조회
  const { data: testRunsData } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns = useMemo(() => testRunsData?.success ? testRunsData.data : [], [testRunsData]);

  // 자동 선택 기본값: IN_PROGRESS > NOT_STARTED > 최신
  const defaultRunId = useMemo(() => {
    if (testRuns.length === 0) return null;
    const inProgress = testRuns.find((r) => r.status === 'IN_PROGRESS');
    const notStarted = testRuns.find((r) => r.status === 'NOT_STARTED');
    return (inProgress || notStarted || testRuns[0])?.id ?? null;
  }, [testRuns]);

  // 테스트 실행 선택 상태
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const effectiveSelectedRunId = selectedRunId ?? defaultRunId;

  // 대시보드 View 이벤트
  useEffect(() => {
    if (dashboardData?.success) {
      track(DASHBOARD_EVENTS.VIEW, { project_id: slug });
    }
  }, [dashboardData?.success, slug]);

  const selectedRun = testRuns.find((r) => r.id === effectiveSelectedRunId);

  // 차트 데이터: 선택된 실행이 있을 때만 표시
  const testStatusData: TestStatusData = useMemo(() => {
    if (selectedRun) {
      return {
        pass: selectedRun.stats.pass,
        fail: selectedRun.stats.fail,
        blocked: selectedRun.stats.blocked,
        untested: selectedRun.stats.untested,
      };
    }
    return { pass: 0, fail: 0, blocked: 0, untested: 0 };
  }, [selectedRun]);

  // 마일스톤 Gantt용 테스트 실행 선택 (차트와 독립)
  const [milestoneRunId, setMilestoneRunId] = useState<string | null>(null);
  const effectiveMilestoneRunId = milestoneRunId ?? defaultRunId;

  // 마일스톤 조회 (선택된 실행 기준)
  const { data: milestonesData } = useQuery({
    ...dashboardQueryOptions.milestones(projectId!, effectiveMilestoneRunId ?? undefined),
    enabled: !!projectId,
  });

  const dashboardMilestones = milestonesData?.success ? milestonesData.data : [];

  // KPI 데이터 계산 - 실행 선택 시 실행 기준 totalCases 사용
  const kpiData: KPIData = useMemo(() => ({
    totalCases: selectedRun ? selectedRun.stats.totalCases : totalCasesCount,
    testSuites: testSuites.length,
    ...testStatusData,
  }), [selectedRun, totalCasesCount, testSuites.length, testStatusData]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      track(DASHBOARD_EVENTS.LINK_COPY, { project_id: slug });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
    }
  };

  // 전체 페이지 스켈레톤: hydration 미완료 또는 어떤 데이터든 로딩 중이면 전체 스켈레톤
  const showSkeleton = !hydrated || isLoading || !testRunsData || !testCasesData;

  // 에러 상태
  if (hydrated && !isLoading && !dashboardData?.success) {
    return (
      <div className="col-span-6 flex flex-1 items-center justify-center">
        <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const project = dashboardData?.success ? dashboardData.data.project : undefined;
  const recentActivities = dashboardData?.success ? dashboardData.data.recentActivities : [];

  const handleCreateCase = () => { track(DASHBOARD_EVENTS.TESTCASE_CREATE_START, { project_id: slug }); onOpen('case'); };
  const handleCreateSuite = () => { track(DASHBOARD_EVENTS.TESTSUITE_CREATE_START, { project_id: slug }); onOpen('suite'); };

  return (
    <>
      {/* KPI 카드 섹션 */}
      <section className="col-span-6" data-tour="kpi-cards">
        {showSkeleton ? <KPISkeleton /> : <KPICards data={kpiData} projectTotalCases={totalCasesCount} />}
      </section>

      {/* 프로젝트 정보 + 저장 용량 + 최근 활동 카드 */}
      <section className="col-span-6 grid grid-cols-6 gap-5">
        {showSkeleton ? <InfoSkeleton /> : (
        <>
          {/* 왼쪽: 프로젝트 정보 + 저장 용량 (세로 배치) */}
          <div className="col-span-2 flex flex-col gap-5">
            <ProjectInfoCard project={project} isCopied={isCopied} onCopyLink={handleCopyLink} />
            <StorageCard storageData={storageData} />
          </div>

          {/* 최근 활동 카드 */}
          <DashboardRecentActivity recentActivities={recentActivities} />
        </>
        )}
      </section>

      {/* 테스트 현황 차트 섹션 */}
      <DashboardChartSection
        slug={slug}
        showSkeleton={showSkeleton}
        testRuns={testRuns}
        testStatusData={testStatusData}
        effectiveSelectedRunId={effectiveSelectedRunId}
        selectedRunName={selectedRun?.name}
        onSelectRun={setSelectedRunId}
        ganttRef={ganttRef}
        ganttVisible={ganttVisible}
        dashboardMilestones={dashboardMilestones}
        effectiveMilestoneRunId={effectiveMilestoneRunId}
        onMilestoneRunChange={setMilestoneRunId}
      />

      {/* 테스트 케이스 섹션 */}
      <section ref={casesRef} className="col-span-6 flex flex-col gap-4" data-tour="test-cases">
        {(casesVisible && !showSkeleton)
          ? <TestCasesSection slug={slug} testCases={testCases} totalCount={totalCasesCount} onCreateCase={handleCreateCase} />
          : <CardListSkeleton />
        }
      </section>

      {/* 테스트 스위트 섹션 */}
      <section ref={suitesRef} className="col-span-6 flex flex-col gap-4" data-tour="test-suites">
        {(suitesVisible && !showSkeleton)
          ? <TestSuitesSection slug={slug} testSuites={testSuites} onCreateSuite={handleCreateSuite} />
          : <CardListSkeleton showBadge />
        }
      </section>

      {/* Modals */}
      {isActiveType('case') && projectId && (
        <TestCaseDetailForm projectId={projectId} onClose={onClose} />
      )}
      {isActiveType('suite') && projectId && (
        <SuiteCreateForm projectId={projectId} onClose={onClose} />
      )}
    </>
  );
};
