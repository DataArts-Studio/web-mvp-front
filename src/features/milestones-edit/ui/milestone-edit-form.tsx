'use client';
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Milestone, addTestCasesToMilestone, addTestSuitesToMilestone, removeTestCaseFromMilestone, removeTestSuiteFromMilestone } from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { DSButton, FormField, LoadingSpinner, cn } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMilestone } from '../hooks';
import { UpdateMilestone, UpdateMilestoneSchema } from '../model';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';
import { Check, ChevronDown, ChevronUp, FolderOpen, ListChecks, Search, X } from 'lucide-react';

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
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [suiteSearchQuery, setSuiteSearchQuery] = useState('');
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

  // 필터링
  const filteredCases = allCases.filter((tc) => {
    const search = caseSearchQuery.toLowerCase().trim();
    if (!search) return true;
    return tc.title.toLowerCase().includes(search) || tc.caseKey.toLowerCase().includes(search);
  });

  const filteredSuites = allSuites.filter((suite) => {
    const search = suiteSearchQuery.toLowerCase().trim();
    if (!search) return true;
    return suite.title.toLowerCase().includes(search) || suite.description?.toLowerCase().includes(search);
  });

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
              <div className="border-line-2 rounded-lg border">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'cases' ? null : 'cases')}
                  className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ListChecks className="text-primary h-5 w-5" />
                    <span className="text-text-1 font-medium">테스트 케이스</span>
                    {selectedCaseIds.size > 0 && (
                      <span className="bg-primary rounded-full px-2 py-0.5 text-xs text-white">
                        {selectedCaseIds.size}개 선택
                      </span>
                    )}
                  </div>
                  {expandedSection === 'cases' ? (
                    <ChevronUp className="text-text-3 h-5 w-5" />
                  ) : (
                    <ChevronDown className="text-text-3 h-5 w-5" />
                  )}
                </button>

                {expandedSection === 'cases' && (
                  <div className="border-line-2 border-t">
                    {/* 검색 */}
                    <div className="border-line-2 border-b px-4 py-2">
                      <div className="bg-bg-3 flex items-center gap-2 rounded-lg px-3 py-2">
                        <Search className="text-text-3 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="케이스 검색..."
                          value={caseSearchQuery}
                          onChange={(e) => setCaseSearchQuery(e.target.value)}
                          className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
                        />
                      </div>
                    </div>

                    {/* 리스트 */}
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredCases.length === 0 ? (
                        <div className="text-text-3 py-8 text-center text-sm">
                          {allCases.length === 0 ? '테스트 케이스가 없습니다.' : '검색 결과가 없습니다.'}
                        </div>
                      ) : (
                        filteredCases.map((tc) => (
                          <div
                            key={tc.id}
                            onClick={() => toggleCase(tc.id)}
                            className="hover:bg-bg-3 flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors"
                          >
                            <div
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                selectedCaseIds.has(tc.id)
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-line-2 bg-bg-3'
                              )}
                            >
                              {selectedCaseIds.has(tc.id) && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-primary shrink-0 font-mono text-xs">{tc.caseKey}</span>
                            <span className="text-text-1 truncate text-sm">{tc.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 테스트 스위트 선택 */}
              <div className="border-line-2 rounded-lg border">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'suites' ? null : 'suites')}
                  className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="text-primary h-5 w-5" />
                    <span className="text-text-1 font-medium">테스트 스위트</span>
                    {selectedSuiteIds.size > 0 && (
                      <span className="bg-primary rounded-full px-2 py-0.5 text-xs text-white">
                        {selectedSuiteIds.size}개 선택
                      </span>
                    )}
                  </div>
                  {expandedSection === 'suites' ? (
                    <ChevronUp className="text-text-3 h-5 w-5" />
                  ) : (
                    <ChevronDown className="text-text-3 h-5 w-5" />
                  )}
                </button>

                {expandedSection === 'suites' && (
                  <div className="border-line-2 border-t">
                    {/* 검색 */}
                    <div className="border-line-2 border-b px-4 py-2">
                      <div className="bg-bg-3 flex items-center gap-2 rounded-lg px-3 py-2">
                        <Search className="text-text-3 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="스위트 검색..."
                          value={suiteSearchQuery}
                          onChange={(e) => setSuiteSearchQuery(e.target.value)}
                          className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
                        />
                      </div>
                    </div>

                    {/* 리스트 */}
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredSuites.length === 0 ? (
                        <div className="text-text-3 py-8 text-center text-sm">
                          {allSuites.length === 0 ? '테스트 스위트가 없습니다.' : '검색 결과가 없습니다.'}
                        </div>
                      ) : (
                        filteredSuites.map((suite) => (
                          <div
                            key={suite.id}
                            onClick={() => toggleSuite(suite.id)}
                            className="hover:bg-bg-3 flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors"
                          >
                            <div
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                selectedSuiteIds.has(suite.id)
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-line-2 bg-bg-3'
                              )}
                            >
                              {selectedSuiteIds.has(suite.id) && <Check className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-text-1 truncate text-sm">{suite.title}</span>
                              {suite.description && (
                                <p className="text-text-3 truncate text-xs">{suite.description}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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
