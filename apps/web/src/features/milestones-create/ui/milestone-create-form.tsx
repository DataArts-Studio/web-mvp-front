'use client';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  CreateMilestone,
  CreateMilestoneSchema,
  addTestCasesToMilestone,
  addTestSuitesToMilestone,
} from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { useCreateMilestone } from '@/features/milestones-create';
import { MILESTONE_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CaseSelectionPanel, DSButton, LoadingSpinner, SuiteSelectionPanel } from '@testea/ui';
import { FormField } from '@testea/ui';
import { cn } from '@testea/util';
import { Check, Flag } from 'lucide-react';

import { DateDropdownSelect } from './date-dropdown-select';

interface MilestoneCreateFormProps {
  projectId: string;
  onClose?: () => void;
}

export const MilestoneCreateForm = ({ projectId, onClose }: MilestoneCreateFormProps) => {
  const { mutateAsync, isPending } = useCreateMilestone();
  const queryClient = useQueryClient();
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<'cases' | 'suites' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 테스트 케이스 조회
  const { data: casesResult } = useQuery({
    queryKey: ['testCases', 'forMilestoneCreate', projectId],
    queryFn: () => getTestCases({ project_id: projectId }),
  });
  const allCases = casesResult?.success ? (casesResult.data ?? []) : [];

  // 테스트 스위트 조회
  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestoneCreate', projectId],
    queryFn: () => getTestSuites({ projectId }),
  });
  const allSuites = suitesResult?.success ? (suitesResult.data ?? []) : [];

  const {
    register,
    handleSubmit,
    control,
    watch,
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
    setIsSubmitting(true);
    try {
      const result = await mutateAsync(data);

      if (result.success && result.data) {
        const milestoneId = result.data.id;

        // 선택된 케이스 추가
        if (selectedCaseIds.size > 0) {
          await addTestCasesToMilestone(milestoneId, Array.from(selectedCaseIds));
        }

        // 선택된 스위트 추가
        if (selectedSuiteIds.size > 0) {
          await addTestSuitesToMilestone(milestoneId, Array.from(selectedSuiteIds));
        }

        // 케이스/스위트 추가 후 쿼리 무효화
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['milestones'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['testCases'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['testSuites'], refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ]);

        track(MILESTONE_EVENTS.CREATE_COMPLETE, { project_id: projectId });
        onClose?.();
      } else {
        track(MILESTONE_EVENTS.CREATE_FAIL, { project_id: projectId });
      }
    } catch {
      track(MILESTONE_EVENTS.CREATE_FAIL, { project_id: projectId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isPending || isSubmitting;
  const titleLength = (watch('title') ?? '').length;

  const handleAbandon = () => {
    track(MILESTONE_EVENTS.CREATE_ABANDON, { project_id: projectId });
    onClose?.();
  };

  return (
    <section
      id="create-milestone"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <div
        className="bg-bg-2 shadow-4 border-line-2 relative max-h-[90vh] w-[700px] overflow-hidden rounded-2xl border"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-sm">
            <LoadingSpinner size="md" text="마일스톤을 생성하고 있어요" />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[90vh] flex-col" noValidate>
          <input type="hidden" {...register('projectId')} />

          {/* Hero header */}
          <header className="from-primary/12 via-bg-2 to-bg-2 relative shrink-0 overflow-hidden bg-gradient-to-b px-8 pt-8 pb-6">
            <div
              aria-hidden
              className="bg-primary/25 pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full blur-3xl"
            />
            <div className="relative flex items-start gap-4">
              <div className="bg-primary/15 text-primary ring-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1">
                <Flag className="h-5.5 w-5.5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 className="text-text-1 text-xl font-bold">마일스톤 생성</h2>
                <p className="text-text-3 mt-1 text-sm leading-relaxed">
                  프로젝트의 중요한 목표 지점을 설정하고 한곳에서 관리하세요.
                </p>
              </div>
            </div>
            <ul className="relative mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {['기간으로 목표 지점 관리', '케이스·스위트 묶어 추적', '진행 현황 한눈에'].map(
                (point) => (
                  <li key={point} className="text-text-2 flex items-center gap-1.5 text-xs">
                    <span className="bg-primary/15 text-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                      <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </span>
                    <span>{point}</span>
                  </li>
                )
              )}
            </ul>
          </header>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 pt-6">
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
                  className={cn(
                    'rounded-5 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-3 hover:border-line-3 focus:border-primary focus:ring-primary/15 h-11 w-full border px-4 text-sm transition-colors outline-none focus:ring-4',
                    errors.title &&
                      'border-system-red focus:border-system-red focus:ring-system-red/15'
                  )}
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
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                  {...register('description')}
                  className={cn(
                    'rounded-5 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-3 hover:border-line-3 focus:border-primary focus:ring-primary/15 min-h-[88px] w-full resize-none border px-4 py-3 text-sm leading-relaxed transition-colors outline-none focus:ring-4',
                    errors.description &&
                      'border-system-red focus:border-system-red focus:ring-system-red/15'
                  )}
                />
                {errors.description && (
                  <span className="text-system-red text-sm">{errors.description.message}</span>
                )}
              </FormField.Root>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
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
                    <span className="text-system-red mt-1 text-sm">{errors.startDate.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
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
                    <span className="text-system-red mt-1 text-sm">{errors.endDate.message}</span>
                  )}
                </div>
              </div>

              {/* 테스트 케이스 선택 */}
              <CaseSelectionPanel
                allCases={allCases}
                selectedCaseIds={selectedCaseIds}
                onToggleCase={toggleCase}
                isExpanded={expandedSection === 'cases'}
                onToggleExpand={() =>
                  setExpandedSection(expandedSection === 'cases' ? null : 'cases')
                }
              />

              {/* 테스트 스위트 선택 */}
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

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 px-8 pt-2 pb-8">
            <DSButton
              type="button"
              variant="text"
              size="small"
              disabled={isLoading}
              onClick={handleAbandon}
            >
              취소
            </DSButton>
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
      </div>
    </section>
  );
};
