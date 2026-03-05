'use client';
import React, { useState, useEffect, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';
import { useDisclosure } from '@/shared/hooks/use-disclosure';
import { DSButton } from '@/shared/ui/ds-button';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronRight, Clock, FileText, FolderOpen, Play, Plus, Share2 } from 'lucide-react';
import { TestRunDropdown } from './test-run-dropdown';
import dynamic from 'next/dynamic';
import { KPICards, type KPIData } from '@/widgets/project/ui/kpi-cards';
import { TestStatusChart, type TestStatusData } from '@/widgets/project/ui/test-status-chart';
import { track, DASHBOARD_EVENTS } from '@/shared/lib/analytics';
import { formatDateKR, formatRelativeTime } from '@/shared/utils/date-format';
const MilestoneGanttChart = dynamic(
  () => import('@/widgets/project/ui/milestone-gantt-chart').then(mod => ({ default: mod.MilestoneGanttChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-[16px] p-6 h-[300px] animate-pulse" /> }
);
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

function useInViewOnce(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

export const ProjectDashboardContent = ({ projectId: serverProjectId }: ProjectDashboardContentProps) => {
  const params = useParams();
  const slug = params.slug as string;
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const [isCopied, setIsCopied] = useState(false);

  // 클라이언트 hydration 완료 전까지 전체 페이지 스켈레톤 표시
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const gantt = useInViewOnce();
  const casesSection = useInViewOnce();
  const suitesSection = useInViewOnce();

  const {
    data: dashboardData,
    isLoading,
  } = useQuery({
    ...dashboardQueryOptions.stats(slug),
    enabled: !!slug,
  });

  // 서버에서 전달된 projectId 우선 사용, 없으면 dashboardData에서 추출
  const projectId = serverProjectId ?? (dashboardData?.success ? dashboardData.data.project.id : undefined);

  const { data: storageData } = useQuery({
    ...dashboardQueryOptions.storageInfo(projectId!),
    enabled: !!projectId,
  });

  const { data: testCasesData, isLoading: isTestCasesLoading } = useQuery({
    ...testCasesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testCases = testCasesData?.success ? testCasesData.data.items : [];
  const totalCasesCount = testCasesData?.success ? testCasesData.data.pagination.totalItems : 0;
  const testSuites = dashboardData?.success ? dashboardData.data.testSuites : [];

  // 테스트 실행 목록 조회
  const { data: testRunsData, isLoading: isTestRunsLoading } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns = testRunsData?.success ? testRunsData.data : [];

  // 테스트 실행 선택 상태
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // 대시보드 View 이벤트
  useEffect(() => {
    if (dashboardData?.success) {
      track(DASHBOARD_EVENTS.VIEW, { project_id: slug });
    }
  }, [dashboardData?.success, slug]);

  // 자동 선택: IN_PROGRESS > NOT_STARTED > 최신 COMPLETED
  useEffect(() => {
    if (testRuns.length > 0 && !selectedRunId) {
      const inProgress = testRuns.find((r) => r.status === 'IN_PROGRESS');
      const notStarted = testRuns.find((r) => r.status === 'NOT_STARTED');
      const best = inProgress || notStarted || testRuns[0];
      if (best) setSelectedRunId(best.id);
    }
  }, [testRuns, selectedRunId]);

  const selectedRun = testRuns.find((r) => r.id === selectedRunId);

  // 차트 데이터: 선택된 실행이 있을 때만 표시
  const testStatusData: TestStatusData = React.useMemo(() => {
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

  useEffect(() => {
    if (testRuns.length > 0 && !milestoneRunId) {
      const inProgress = testRuns.find((r) => r.status === 'IN_PROGRESS');
      const notStarted = testRuns.find((r) => r.status === 'NOT_STARTED');
      const best = inProgress || notStarted || testRuns[0];
      if (best) setMilestoneRunId(best.id);
    }
  }, [testRuns, milestoneRunId]);

  // 마일스톤 조회 (선택된 실행 기준)
  const { data: milestonesData } = useQuery({
    ...dashboardQueryOptions.milestones(projectId!, milestoneRunId ?? undefined),
    enabled: !!projectId,
  });

  const dashboardMilestones = milestonesData?.success ? milestonesData.data : [];

  // KPI 데이터 계산
  const kpiData: KPIData = React.useMemo(() => ({
    totalCases: totalCasesCount,
    testSuites: testSuites.length,
    ...testStatusData,
  }), [totalCasesCount, testSuites.length, testStatusData]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      track(DASHBOARD_EVENTS.LINK_COPY, { project_id: slug });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
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

  return (
    <>
        {/* KPI 카드 섹션 */}
        <section className="col-span-6" data-tour="kpi-cards">
          {showSkeleton ? (
            <div className="grid grid-cols-5 gap-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-bg-2 rounded-3 border border-line-2 p-5 flex flex-col gap-2">
                  <div className="bg-bg-3 h-4 w-20 rounded" />
                  <div className="bg-bg-3 h-8 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <KPICards data={kpiData} />
          )}
        </section>

        {/* 프로젝트 정보 + 저장 용량 + 최근 활동 카드 */}
        <section className="col-span-6 grid grid-cols-6 gap-5">
          {showSkeleton ? (
            <>
              <div className="col-span-2 flex flex-col gap-5 animate-pulse">
                <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
                  <div className="bg-bg-3 h-4 w-28 rounded" />
                  <div className="rounded-2 bg-bg-3 h-20" />
                </div>
                <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
                  <div className="bg-bg-3 h-4 w-20 rounded" />
                  <div className="bg-bg-3 h-2 w-full rounded-full" />
                </div>
              </div>
              <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5 animate-pulse">
                <div className="bg-bg-3 h-4 w-20 rounded" />
                <div className="flex flex-col gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="bg-bg-3 h-1.5 w-1.5 rounded-full" />
                      <div className="bg-bg-3 h-4 flex-1 rounded" />
                      <div className="bg-bg-3 h-3 w-12 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
          <>
          {/* 왼쪽: 프로젝트 정보 + 저장 용량 (세로 배치) */}
          <div className="col-span-2 flex flex-col gap-5">
            {/* 내 프로젝트 정보 카드 */}
            <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5" data-tour="project-info">
              <span className="typo-body2-heading text-text-3">내 프로젝트 정보</span>

              <div className="rounded-2 bg-bg-3 flex flex-col items-center justify-center gap-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="typo-body2-heading text-primary truncate max-w-[200px]">
                    {project?.name}
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
                  {project && formatDateKR(project.created_at)} 생성됨
                </span>
              </div>
            </div>

            {/* 저장 용량 카드 */}
            {storageData?.success && (() => {
              const { usedBytes, maxBytes, usedPercent } = storageData.data;
              const formatBytes = (bytes: number) => {
                if (bytes < 1024) return `${bytes}B`;
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
                return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
              };
              const barColor = usedPercent >= 95 ? 'bg-red-500' : usedPercent >= 80 ? 'bg-amber-500' : 'bg-primary';
              const textColor = usedPercent >= 95 ? 'text-red-500' : usedPercent >= 80 ? 'text-amber-500' : 'text-primary';

              return (
                <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5" data-tour="storage-info">
                  <span className="typo-body2-heading text-text-3">저장 용량</span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`typo-caption font-medium ${textColor}`}>
                        {formatBytes(usedBytes)} / {formatBytes(maxBytes)}
                      </span>
                      <span className={`typo-caption ${textColor}`}>
                        {usedPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-3">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(usedPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 최근 활동 카드 */}
          <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5" data-tour="recent-activity">
            <span className="typo-body2-heading text-text-3">최근 활동</span>

            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 flex-1">
                <Clock className="text-text-3 h-8 w-8" />
                <p className="typo-body2-normal text-text-3">최근 활동이 없습니다.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentActivities.slice(0, 7).map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                    <span className="typo-body2-normal text-text-1 flex-1 truncate">
                      {item.title}
                    </span>
                    <span className="typo-caption text-text-3">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </>
          )}
        </section>

        {/* 테스트 현황 차트 섹션 */}
        <section className="col-span-6 flex flex-col gap-4" data-tour="test-status-chart">
          <div className="flex items-center justify-between">
            <h2 className="typo-h2-heading text-text-1">테스트 현황</h2>
            {/* 테스트 실행 선택 드롭다운 */}
            <TestRunDropdown
              testRuns={testRuns}
              selectedRunId={selectedRunId}
              onSelect={setSelectedRunId}
              slug={slug}
              selectedRunName={selectedRun?.name}
            />
          </div>
          {showSkeleton ? (
            <div className="bg-bg-2 rounded-[16px] p-6 animate-pulse">
              <div className="flex items-stretch gap-10">
                <div className="flex basis-[70%] flex-col items-center gap-4">
                  <div className="bg-bg-3 rounded-full h-[280px] w-[280px]" />
                  <div className="bg-bg-3 h-10 w-40 rounded self-start" />
                </div>
                <div className="flex basis-[30%] flex-col justify-center gap-5 p-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="bg-bg-3 h-9 w-9 rounded-[16px] shrink-0" />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="bg-bg-3 h-4 w-24 rounded" />
                        <div className="bg-bg-3 h-3 w-16 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : testRuns.length === 0 ? (
            <div className="rounded-3 border-line-2 bg-bg-2/50 border-2 border-dashed flex flex-col items-center justify-center gap-4 py-12">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Play className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="typo-h3-heading text-text-1">첫 번째 테스트를 실행해보세요!</h3>
                <p className="typo-body2-normal text-text-3">
                  테스트를 실행하면 결과 차트와 마일스톤 진행 현황을 확인할 수 있어요.
                </p>
              </div>
              <Link href={`/projects/${slug}/runs/create`}>
                <DSButton variant="solid" className="flex items-center gap-2">
                  <span>테스트 실행 하기</span>
                </DSButton>
              </Link>
            </div>
          ) : (
            <>
              <TestStatusChart data={testStatusData} />
              <div ref={gantt.ref}>
                {gantt.visible ? (
                  <MilestoneGanttChart
                    milestones={dashboardMilestones}
                    testRuns={testRuns}
                    selectedRunId={milestoneRunId}
                    onRunChange={setMilestoneRunId}
                  />
                ) : (
                  <div className="bg-bg-2 rounded-[16px] p-6 h-[300px] animate-pulse" />
                )}
              </div>
            </>
          )}
        </section>

        {/* 테스트 케이스 섹션 — 뷰포트 진입 시 렌더 */}
        <section ref={casesSection.ref} className="col-span-6 flex flex-col gap-4" data-tour="test-cases">
          {(casesSection.visible && !showSkeleton) ? (
            <>
              <div className="flex items-center justify-between">
                <Link href={`/projects/${slug}/cases`} className="flex items-center gap-2 group">
                  <h2 className="typo-h2-heading text-text-1">테스트 케이스</h2>
                  <span className="typo-body2-normal text-text-3">({totalCasesCount})</span>
                  <ChevronRight className="text-text-3 group-hover:text-text-1 h-5 w-5 transition-colors" />
                </Link>
                {totalCasesCount > 0 && (
                  <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={() => { track(DASHBOARD_EVENTS.TESTCASE_CREATE_START, { project_id: slug }); onOpen('case'); }}>
                    <Plus className="h-4 w-4" />
                    <span>추가</span>
                  </DSButton>
                )}
              </div>

              {totalCasesCount === 0 ? (
                <div className="rounded-3 border-line-2 bg-bg-2 border-2 border-dashed flex flex-col items-center justify-center gap-6 py-16">
                  <Image
                    src="/teacup/tea-cup-not-found.svg"
                    width={200}
                    height={255}
                    alt="테스트 케이스 없음"
                    loading="lazy"
                    priority={false}
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h3 className="typo-h3-heading text-text-1">테스트 케이스를 생성해보세요!</h3>
                    <p className="typo-body2-normal text-text-3">
                      아직 생성된 테스트 케이스가 없습니다.
                      <br />
                      테스트 케이스를 만들면 여기에서 빠르게 확인할 수 있어요.
                    </p>
                  </div>
                  <DSButton variant="solid" className="flex items-center gap-2" onClick={() => { track(DASHBOARD_EVENTS.TESTCASE_CREATE_START, { project_id: slug }); onOpen('case'); }}>
                    <Plus className="h-4 w-4" />
                    <span>테스트 케이스 만들기</span>
                  </DSButton>
                </div>
              ) : (
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
                        {formatDateKR(testCase.createdAt)}
                      </span>
                    </Link>
                  ))}
                  {totalCasesCount > 5 && (
                    <Link
                      href={`/projects/${slug}/cases`}
                      className="flex items-center justify-center gap-2 px-5 py-3 text-primary hover:bg-bg-3 transition-colors"
                    >
                      <span className="typo-body2-heading">전체 보기 ({totalCasesCount}개)</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-bg-3 h-6 w-32 rounded" />
                  <div className="bg-bg-3 h-5 w-8 rounded" />
                </div>
              </div>
              <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="bg-bg-3 h-10 w-10 rounded-[8px] shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="bg-bg-3 h-3 w-16 rounded" />
                      <div className="bg-bg-3 h-4 w-48 rounded" />
                    </div>
                    <div className="bg-bg-3 h-3 w-20 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 테스트 스위트 섹션 — 뷰포트 진입 시 렌더 */}
        <section ref={suitesSection.ref} className="col-span-6 flex flex-col gap-4" data-tour="test-suites">
          {(suitesSection.visible && !showSkeleton) ? (
            <>
              <div className="flex items-center justify-between">
                <Link href={`/projects/${slug}/suites`} className="flex items-center gap-2 group">
                  <h2 className="typo-h2-heading text-text-1">테스트 스위트</h2>
                  <span className="typo-body2-normal text-text-3">({testSuites.length})</span>
                  <ChevronRight className="text-text-3 group-hover:text-text-1 h-5 w-5 transition-colors" />
                </Link>
                {testSuites.length > 0 && (
                  <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={() => { track(DASHBOARD_EVENTS.TESTSUITE_CREATE_START, { project_id: slug }); onOpen('suite'); }}>
                    <Plus className="h-4 w-4" />
                    <span>추가</span>
                  </DSButton>
                )}
              </div>

              {testSuites.length === 0 ? (
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
                  <DSButton variant="solid" className="flex items-center gap-2" onClick={() => { track(DASHBOARD_EVENTS.TESTSUITE_CREATE_START, { project_id: slug }); onOpen('suite'); }}>
                    <Plus className="h-4 w-4" />
                    <span>테스트 스위트 만들기</span>
                  </DSButton>
                </div>
              ) : (
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
            </>
          ) : (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-bg-3 h-6 w-32 rounded" />
                  <div className="bg-bg-3 h-5 w-8 rounded" />
                </div>
              </div>
              <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="bg-bg-3 h-10 w-10 rounded-[8px] shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="bg-bg-3 h-4 w-40 rounded" />
                      <div className="bg-bg-3 h-3 w-24 rounded" />
                    </div>
                    <div className="bg-bg-3 h-6 w-20 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
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
