'use client';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CreateMilestone, CreateMilestoneSchema, addTestCasesToMilestone, addTestSuitesToMilestone } from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { DSButton, FormField, LoadingSpinner, cn } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMilestone } from '@/features';
import { useQuery } from '@tanstack/react-query';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';
import { Check, ChevronDown, ChevronUp, FolderOpen, ListChecks, Search } from 'lucide-react';
import { DateDropdownSelect } from './date-dropdown-select';

interface MilestoneCreateFormProps {
  projectId: string;
  onClose?: () => void;
}

export const MilestoneCreateForm = ({ projectId, onClose }: MilestoneCreateFormProps) => {
  const { mutateAsync, isPending } = useCreateMilestone();
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<Set<string>>(new Set());
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [suiteSearchQuery, setSuiteSearchQuery] = useState('');
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
              {isLoading ? '생성 중...' : '생성'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
