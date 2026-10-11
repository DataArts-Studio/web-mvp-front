'use client';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  Milestone,
  addTestCasesToMilestone,
  addTestSuitesToMilestone,
  removeTestCaseFromMilestone,
  removeTestSuiteFromMilestone,
} from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import {
  CaseSelectionPanel,
  DSButton,
  FormField,
  LoadingSpinner,
  SuiteSelectionPanel,
  cn,
} from '@/shared';
import { MILESTONE_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUpdateMilestone } from '../hooks';
import { UpdateMilestone, UpdateMilestoneSchema } from '../model';

interface MilestoneEditFormProps {
  milestone: Milestone;
  onClose?: () => void;
}

const toDateTimeInputValue = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
};

export const MilestoneEditForm = ({ milestone, onClose }: MilestoneEditFormProps) => {
  const { mutateAsync, isPending } = useUpdateMilestone();
  const queryClient = useQueryClient();

  // 현재 연결된 케이스/스위트 ID
  const milestoneWithDetails = milestone as Milestone & {
    testCases?: Array<{ id: string }>;
    testSuites?: Array<{ id: string }>;
  };
  const initialCaseIds = useMemo(
    () => new Set((milestoneWithDetails.testCases || []).map((tc) => tc.id)),
    [milestoneWithDetails.testCases]
  );
  const initialSuiteIds = useMemo(
    () => new Set((milestoneWithDetails.testSuites || []).map((s) => s.id)),
    [milestoneWithDetails.testSuites]
  );

  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(initialCaseIds);
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<Set<string>>(initialSuiteIds);
  const [expandedSection, setExpandedSection] = useState<'cases' | 'suites' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 테스트 케이스 조회
  const { data: casesResult } = useQuery({
    queryKey: ['testCases', 'forMilestoneEdit', milestone.projectId],
    queryFn: () => getTestCases({ project_id: milestone.projectId }),
  });
  const allCases = casesResult?.success ? (casesResult.data ?? []) : [];

  // 테스트 스위트 조회
  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestoneEdit', milestone.projectId],
    queryFn: () => getTestSuites({ projectId: milestone.projectId }),
  });
  const allSuites = suitesResult?.success ? (suitesResult.data ?? []) : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMilestone>({
    resolver: zodResolver(UpdateMilestoneSchema),
    defaultValues: {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? '',
      startDate: toDateTimeInputValue(milestone.startDate),
      endDate: toDateTimeInputValue(milestone.endDate),
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

  // 마일스톤 수정과 범위 변경을 한 흐름에서 기다린다. 호출별 mutate 콜백은 async 반환값을
  // 기다리지 않아 범위 변경 중 예외가 묻히고 폼이 다시 제출될 수 있었다 (#371).
  const onSubmit = async (data: UpdateMilestone) => {
    setIsSubmitting(true);
    try {
      try {
        await mutateAsync(data);
      } catch (error) {
        track(MILESTONE_EVENTS.UPDATE_FAIL, { milestone_id: milestone.id });
        toast.error((error instanceof Error && error.message) || '마일스톤을 수정하지 못했습니다.');
        return;
      }
      track(MILESTONE_EVENTS.UPDATE, { milestone_id: milestone.id });

      const casesToAdd = Array.from(selectedCaseIds).filter((id) => !initialCaseIds.has(id));
      const casesToRemove = Array.from(initialCaseIds).filter((id) => !selectedCaseIds.has(id));
      const suitesToAdd = Array.from(selectedSuiteIds).filter((id) => !initialSuiteIds.has(id));
      const suitesToRemove = Array.from(initialSuiteIds).filter((id) => !selectedSuiteIds.has(id));

      // 케이스·스위트 범위 변경. 하나라도 실패하면 창을 닫지 않고 알린다.
      let scopeFailed = false;
      try {
        const scopeResults = [];
        if (casesToAdd.length > 0) {
          scopeResults.push(await addTestCasesToMilestone(milestone.id, casesToAdd));
        }
        for (const caseId of casesToRemove) {
          scopeResults.push(await removeTestCaseFromMilestone(milestone.id, caseId));
        }
        if (suitesToAdd.length > 0) {
          scopeResults.push(await addTestSuitesToMilestone(milestone.id, suitesToAdd));
        }
        for (const suiteId of suitesToRemove) {
          scopeResults.push(await removeTestSuiteFromMilestone(milestone.id, suiteId));
        }
        scopeFailed = scopeResults.some((result) => !result.success);
      } catch {
        scopeFailed = true;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['milestone', milestone.id],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({ queryKey: ['milestones'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['testSuites'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['testCases'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]).catch(() => {});

      if (scopeFailed) {
        toast.error('마일스톤 정보는 저장했지만 케이스·스위트 범위 일부를 저장하지 못했습니다.');
        return;
      }
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isPending || isSubmitting;

  const handleAbandon = () => {
    if (isLoading) return;
    track(MILESTONE_EVENTS.UPDATE_ABANDON, { milestone_id: milestone.id });
    onClose?.();
  };

  return (
    <section
      id="edit-milestone"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <div
        className="bg-bg-2 shadow-4 relative max-h-[90vh] w-[700px] overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <LoadingSpinner size="md" text="마일스톤을 수정하고 있어요" />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[90vh] flex-col" noValidate>
          <input type="hidden" {...register('id')} />

          {/* Header */}
          <div className="border-line-1 border-b p-8 pb-6">
            <h2 className="text-primary text-3xl">마일스톤 수정</h2>
            <p className="mt-2 text-base text-neutral-400">
              마일스톤의 정보와 포함된 케이스/스위트를 수정합니다.
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
                    'rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none',
                    errors.title && 'border-system-red focus:border-system-red'
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
                    'rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none',
                    errors.description && 'border-system-red focus:border-system-red'
                  )}
                />
                {errors.description && (
                  <span className="text-system-red mt-1 text-sm">{errors.description.message}</span>
                )}
              </FormField.Root>

              <div className="grid grid-cols-2 gap-4">
                <FormField.Root className="flex flex-col gap-2">
                  <FormField.Label className="text-text-1 font-medium">시작일시</FormField.Label>
                  <FormField.Control
                    type="datetime-local"
                    disabled={isLoading}
                    {...register('startDate')}
                    className="rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none"
                  />
                  {errors.startDate && (
                    <span className="text-system-red mt-1 text-sm">{errors.startDate.message}</span>
                  )}
                </FormField.Root>

                <FormField.Root className="flex flex-col gap-2">
                  <FormField.Label className="text-text-1 font-medium">종료일시</FormField.Label>
                  <FormField.Control
                    type="datetime-local"
                    disabled={isLoading}
                    {...register('endDate')}
                    className="rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none"
                  />
                  {errors.endDate && (
                    <span className="text-system-red mt-1 text-sm">{errors.endDate.message}</span>
                  )}
                </FormField.Root>
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
            <DSButton type="submit" variant="solid" className="w-full" disabled={isLoading}>
              {isLoading ? '수정 중...' : '수정'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
