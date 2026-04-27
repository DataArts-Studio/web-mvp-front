'use client';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CreateMilestone, CreateMilestoneSchema, addTestCasesToMilestone, addTestSuitesToMilestone } from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { DSButton, LoadingSpinner, CaseSelectionPanel, SuiteSelectionPanel } from '@testea/ui';
import { FormField } from '@testea/ui';
import { cn } from '@/shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMilestone } from '@/features/milestones-create';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';
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
  const allCases = casesResult?.success ? casesResult.data ?? [] : [];

  // 테스트 스위트 조회
  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestoneCreate', projectId],
    queryFn: () => getTestSuites({ projectId }),
  });
  const allSuites = suitesResult?.success ? suitesResult.data ?? [] : [];

  const {
    register,
    handleSubmit,
    control,
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
      <div className="bg-bg-2 shadow-4 relative max-h-[90vh] w-[700px] overflow-hidden rounded-xl" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-2/80 backdrop-blur-sm">
            <LoadingSpinner size="md" text="마일스톤을 생성하고 있어요" />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[90vh] flex-col" noValidate>
          <input type="hidden" {...register('projectId')} />

          {/* Header */}
          <div className="border-line-1 border-b p-8 pb-6">
            <h2 className="text-primary text-3xl">마일스톤을 만들어 볼까요?</h2>
            <p className="mt-2 text-base text-neutral-400">
              프로젝트의 중요한 목표 지점을 설정하고 한곳에서 관리해요.
            </p>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 pt-6">
            <div className="flex flex-col gap-6">
              <FormField.Root className="flex flex-col gap-2">
                <FormField.Label className="text-text-1 font-medium">
                  마일스톤 이름 <span className="text-primary">*</span>
                </FormField.Label>
                <FormField.Control
                  placeholder="마일스톤 이름을 입력해 주세요."
                  type="text"
                  maxLength={50}
                  disabled={isLoading}
                  {...register('title')}
                  className={cn(
                    'h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary',
                    errors.title && 'border-system-red focus:border-system-red',
                  )}
                />
                {errors.title && (
                  <span className="text-system-red mt-1 text-sm">{errors.title.message}</span>
                )}
              </FormField.Root>

              <FormField.Root className="flex flex-col gap-2">
                <FormField.Label className="text-text-1 font-medium">설명 (선택)</FormField.Label>
                <FormField.Control
                  placeholder="이 마일스톤에 대한 간략한 설명을 입력해주세요."
                  type="text"
                  maxLength={500}
                  disabled={isLoading}
                  {...register('description')}
                  className={cn(
                    'h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary',
                    errors.description && 'border-system-red focus:border-system-red',
                  )}
                />
                {errors.description && (
                  <span className="text-system-red mt-1 text-sm">{errors.description.message}</span>
                )}
              </FormField.Root>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-text-1 font-medium">시작일</label>
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
                  <label className="text-text-1 font-medium">종료일</label>
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
                onToggleExpand={() => setExpandedSection(expandedSection === 'cases' ? null : 'cases')}
              />

              {/* 테스트 스위트 선택 */}
              <SuiteSelectionPanel
                allSuites={allSuites}
                selectedSuiteIds={selectedSuiteIds}
                onToggleSuite={toggleSuite}
                isExpanded={expandedSection === 'suites'}
                onToggleExpand={() => setExpandedSection(expandedSection === 'suites' ? null : 'suites')}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-line-1 flex gap-3 border-t p-8 pt-6">
            <DSButton
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isLoading}
              onClick={handleAbandon}
            >
              취소
            </DSButton>
            <DSButton
              type="submit"
              variant="solid"
              className="w-full"
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
