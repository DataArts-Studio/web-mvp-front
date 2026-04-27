'use client';
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Milestone, addTestCasesToMilestone, addTestSuitesToMilestone, removeTestCaseFromMilestone, removeTestSuiteFromMilestone } from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { DSButton, FormField, LoadingSpinner, CaseSelectionPanel, SuiteSelectionPanel, cn } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMilestone } from '../hooks';
import { UpdateMilestone, UpdateMilestoneSchema } from '../model';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';

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
  const { mutate, isPending } = useUpdateMilestone();
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
  const allCases = casesResult?.success ? casesResult.data ?? [] : [];

  // 테스트 스위트 조회
  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestoneEdit', milestone.projectId],
    queryFn: () => getTestSuites({ projectId: milestone.projectId }),
  });
  const allSuites = suitesResult?.success ? suitesResult.data ?? [] : [];

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

  const onSubmit = async (data: UpdateMilestone) => {
    setIsSubmitting(true);
    try {
      // 마일스톤 정보 업데이트
      mutate(data, {
        onSuccess: async () => {
          track(MILESTONE_EVENTS.UPDATE, { milestone_id: milestone.id });
          // 케이스 변경 처리
          const casesToAdd = Array.from(selectedCaseIds).filter((id) => !initialCaseIds.has(id));
          const casesToRemove = Array.from(initialCaseIds).filter((id) => !selectedCaseIds.has(id));

          // 스위트 변경 처리
          const suitesToAdd = Array.from(selectedSuiteIds).filter((id) => !initialSuiteIds.has(id));
          const suitesToRemove = Array.from(initialSuiteIds).filter((id) => !selectedSuiteIds.has(id));

          // 케이스 추가/삭제
          if (casesToAdd.length > 0) {
            await addTestCasesToMilestone(milestone.id, casesToAdd);
          }
          for (const caseId of casesToRemove) {
            await removeTestCaseFromMilestone(milestone.id, caseId);
          }

          // 스위트 추가/삭제
          if (suitesToAdd.length > 0) {
            await addTestSuitesToMilestone(milestone.id, suitesToAdd);
          }
          for (const suiteId of suitesToRemove) {
            await removeTestSuiteFromMilestone(milestone.id, suiteId);
          }

          // 쿼리 무효화
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['milestone', milestone.id], refetchType: 'all' }),
            queryClient.invalidateQueries({ queryKey: ['milestones'], refetchType: 'all' }),
            queryClient.invalidateQueries({ queryKey: ['testSuites'], refetchType: 'all' }),
            queryClient.invalidateQueries({ queryKey: ['testCases'], refetchType: 'all' }),
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          ]);

          onClose?.();
        },
        onError: () => {
          track(MILESTONE_EVENTS.UPDATE_FAIL, { milestone_id: milestone.id });
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isPending || isSubmitting;

  const handleAbandon = () => {
    track(MILESTONE_EVENTS.UPDATE_ABANDON, { milestone_id: milestone.id });
    onClose?.();
  };

  return (
    <section
      id="edit-milestone"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <div className="bg-bg-2 shadow-4 relative max-h-[90vh] w-[700px] overflow-hidden rounded-xl" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-2/80 backdrop-blur-sm">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField.Root className="flex flex-col gap-2">
                  <FormField.Label className="text-text-1 font-medium">시작일시</FormField.Label>
                  <FormField.Control
                    type="datetime-local"
                    disabled={isLoading}
                    {...register('startDate')}
                    className="h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary"
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
                    className="h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary"
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
              {isLoading ? '수정 중...' : '수정'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
