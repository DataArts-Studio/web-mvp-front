'use client';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import {
  CreateMilestone,
  CreateMilestoneSchema,
  addTestCasesToMilestone,
  addTestSuitesToMilestone,
} from '@/entities/milestone';
import { projectIdQueryOptions } from '@/entities/project';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { DateDropdownSelect, useCreateMilestone } from '@/features/milestones-create';
import { MILESTONE_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CaseSelectionPanel,
  DSButton,
  FormField,
  LoadingSpinner,
  MainContainer,
  ProjectErrorFallback,
  SuiteSelectionPanel,
} from '@testea/ui';
import { cn } from '@testea/util';
import { ArrowLeft, Check, Flag } from 'lucide-react';

const POINTS = ['기간으로 목표 지점 관리', '케이스·스위트 묶어 추적', '진행 현황 한눈에'];

export const MilestoneCreateView = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useCreateMilestone();
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<'cases' | 'suites' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(slug)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  // 테스트 케이스 조회
  const { data: casesResult } = useQuery({
    queryKey: ['testCases', 'forMilestoneCreate', projectId],
    queryFn: () => getTestCases({ project_id: projectId! }),
    enabled: !!projectId,
  });
  const allCases = casesResult?.success ? (casesResult.data ?? []) : [];

  // 테스트 스위트 조회
  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestoneCreate', projectId],
    queryFn: () => getTestSuites({ projectId: projectId! }),
    enabled: !!projectId,
  });
  const allSuites = suitesResult?.success ? (suitesResult.data ?? []) : [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMilestone>({
    resolver: zodResolver(CreateMilestoneSchema),
    defaultValues: {
      projectId,
      title: '',
      description: '',
      startDate: new Date(),
      endDate: null,
    },
  });

  // projectId 는 slug 조회 후 비동기로 채워지므로 폼 값과 동기화
  useEffect(() => {
    if (projectId) setValue('projectId', projectId);
  }, [projectId, setValue]);

  const titleLength = (watch('title') ?? '').length;
  const isLoading = isPending || isSubmitting;

  const toggleCase = (id: string) => {
    const newSet = new Set(selectedCaseIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCaseIds(newSet);
  };

  const toggleSuite = (id: string) => {
    const newSet = new Set(selectedSuiteIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSuiteIds(newSet);
  };

  const onSubmit = async (data: CreateMilestone) => {
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      const result = await mutateAsync({ ...data, projectId });

      if (result.success && result.data) {
        const milestoneId = result.data.id;

        if (selectedCaseIds.size > 0) {
          await addTestCasesToMilestone(milestoneId, Array.from(selectedCaseIds));
        }
        if (selectedSuiteIds.size > 0) {
          await addTestSuitesToMilestone(milestoneId, Array.from(selectedSuiteIds));
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['milestones'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['testCases'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['testSuites'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ]);

        track(MILESTONE_EVENTS.CREATE_COMPLETE, { project_id: projectId });
        router.push(`/projects/${slug}/milestones`);
      } else {
        track(MILESTONE_EVENTS.CREATE_FAIL, { project_id: projectId });
      }
    } catch {
      track(MILESTONE_EVENTS.CREATE_FAIL, { project_id: projectId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbandon = () => {
    track(MILESTONE_EVENTS.CREATE_ABANDON, { project_id: projectId });
    router.push(`/projects/${slug}/milestones`);
  };

  if (isLoadingProject) {
    return (
      <MainContainer className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  const inputClass = (hasError: boolean) =>
    cn(
      'rounded-5 border-line-2 bg-bg-2 text-text-1 placeholder:text-text-3 hover:border-line-3 focus:border-primary focus:ring-primary/15 h-11 w-full border px-4 text-sm transition-colors outline-none focus:ring-4',
      hasError && 'border-system-red focus:border-system-red focus:ring-system-red/15'
    );

  return (
    <MainContainer className="mx-auto flex h-screen w-full max-w-[1200px] flex-col overflow-hidden px-10 py-8">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-5 pb-6">
        <button
          type="button"
          onClick={handleAbandon}
          className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          마일스톤 목록
        </button>
        <div className="flex items-start gap-4">
          <div className="bg-primary/15 text-primary ring-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1">
            <Flag className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="typo-title-heading text-text-1">마일스톤 생성</h1>
            <p className="typo-body2-normal text-text-3">
              프로젝트의 중요한 목표 지점을 설정하고 한곳에서 관리하세요.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {POINTS.map((point) => (
                <li key={point} className="text-text-2 flex items-center gap-1.5 text-xs">
                  <span className="bg-primary/15 text-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <form
        id="milestone-create-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
        noValidate
      >
        <input type="hidden" {...register('projectId')} />

        <div className="-mx-1 flex-1 overflow-y-auto px-1 pt-1">
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 pb-6 lg:grid-cols-2">
            {/* Left: 기본 정보 */}
            <div className="flex flex-col gap-6">
              <FormField.Root className="flex flex-col gap-1.5">
                <FormField.Label className="text-text-1 flex items-center text-sm font-medium">
                  <span>
                    마일스톤 이름 <span className="text-primary">*</span>
                  </span>
                  <span className="text-text-3 ml-auto text-xs tabular-nums">{titleLength}/50</span>
                </FormField.Label>
                <FormField.Control
                  placeholder="마일스톤 이름을 입력해 주세요."
                  type="text"
                  maxLength={50}
                  disabled={isLoading}
                  {...register('title')}
                  className={inputClass(!!errors.title)}
                />
                {errors.title && (
                  <span className="text-system-red text-sm">{errors.title.message}</span>
                )}
              </FormField.Root>

              <FormField.Root className="flex flex-col gap-1.5">
                <FormField.Label className="text-text-1 text-sm font-medium">
                  설명 (선택)
                </FormField.Label>
                <textarea
                  placeholder="이 마일스톤에 대한 간략한 설명을 입력해주세요."
                  rows={4}
                  maxLength={500}
                  disabled={isLoading}
                  {...register('description')}
                  className={cn(
                    'rounded-5 border-line-2 bg-bg-2 text-text-1 placeholder:text-text-3 hover:border-line-3 focus:border-primary focus:ring-primary/15 min-h-[120px] w-full resize-none border px-4 py-3 text-sm leading-relaxed transition-colors outline-none focus:ring-4',
                    errors.description &&
                      'border-system-red focus:border-system-red focus:ring-system-red/15'
                  )}
                />
                {errors.description && (
                  <span className="text-system-red text-sm">{errors.description.message}</span>
                )}
              </FormField.Root>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-1 text-sm font-medium">시작일</label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DateDropdownSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  {errors.startDate && (
                    <span className="text-system-red text-sm">{errors.startDate.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-1 text-sm font-medium">종료일</label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DateDropdownSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  {errors.endDate && (
                    <span className="text-system-red text-sm">{errors.endDate.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: 케이스·스위트 추가 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-text-1 text-sm font-medium">테스트 케이스·스위트 추가</h2>
                <span className="text-text-3 text-xs">(선택)</span>
              </div>
              <CaseSelectionPanel
                allCases={allCases}
                selectedCaseIds={selectedCaseIds}
                onToggleCase={toggleCase}
                isExpanded={expandedSection === 'cases'}
                onToggleExpand={() =>
                  setExpandedSection(expandedSection === 'cases' ? null : 'cases')
                }
              />
              <SuiteSelectionPanel
                allSuites={allSuites}
                selectedSuiteIds={selectedSuiteIds}
                onToggleSuite={toggleSuite}
                isExpanded={expandedSection === 'suites'}
                onToggleExpand={() =>
                  setExpandedSection(expandedSection === 'suites' ? null : 'suites')
                }
              />
            </div>
          </div>
        </div>

        {/* Footer (하단 고정) */}
        <div className="border-line-2 flex shrink-0 items-center justify-end border-t pt-4">
          <DSButton
            type="submit"
            variant="solid"
            size="small"
            className="min-w-[112px]"
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '생성'}
          </DSButton>
        </div>
      </form>
    </MainContainer>
  );
};
