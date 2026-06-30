'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { milestonesQueryOptions } from '@/entities/milestone';
import { dashboardQueryOptions } from '@/features/dashboard';
import { type CreateRunInput, useCreateRun } from '@/features/runs-create';
import { TESTRUN_EVENTS, track } from '@/shared/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, MainContainer } from '@testea/ui';
import { ArrowLeft, CheckCircle2, Flag, Info, Play, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface RunFormData {
  runName: string;
  description: string;
}

const progressStatusLabel: Record<string, string> = {
  planned: '계획',
  in_progress: '진행 중',
  completed: '완료',
  delayed: '지연',
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString();
};

export const RunCreateView = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectSlug = params.slug as string;
  const preselectedMilestoneId = searchParams.get('milestoneId');
  const { mutate, isPending } = useCreateRun();

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    preselectedMilestoneId
  );
  const [milestoneSearchTerm, setMilestoneSearchTerm] = useState('');

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(projectSlug)
  );
  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: milestonesData, isLoading: isLoadingMilestones } = useQuery({
    ...milestonesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const milestones = milestonesData?.success ? milestonesData.data : [];
  const selectedMilestone = milestones.find((milestone) => milestone.id === selectedMilestoneId);
  const normalizedMilestoneSearchTerm = milestoneSearchTerm.trim().toLowerCase();
  const filteredMilestones = normalizedMilestoneSearchTerm
    ? milestones.filter((milestone) => {
        const title = milestone.title.toLowerCase();
        const description = milestone.description?.toLowerCase() ?? '';
        return (
          title.includes(normalizedMilestoneSearchTerm) ||
          description.includes(normalizedMilestoneSearchTerm)
        );
      })
    : milestones;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RunFormData>({
    defaultValues: {
      runName: '',
      description: '',
    },
  });

  const onSubmit = (data: RunFormData) => {
    if (!projectId) {
      toast.warning('프로젝트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!selectedMilestoneId) {
      toast.warning('마일스톤을 선택해주세요.');
      return;
    }

    const input: CreateRunInput = {
      project_id: projectId,
      name: data.runName,
      description: data.description || undefined,
      milestone_id: selectedMilestoneId,
    };

    mutate(input, {
      onSuccess: () => {
        track(TESTRUN_EVENTS.CREATE_COMPLETE, { project_id: projectId });
        router.push(`/projects/${projectSlug}/runs`);
      },
      onError: (error) => {
        track(TESTRUN_EVENTS.CREATE_FAIL, { project_id: projectId });
        toast.error(error.message || '테스트 실행 생성에 실패했습니다.');
      },
    });
  };

  const handleCancel = () => {
    track(TESTRUN_EVENTS.CREATE_ABANDON, { project_id: projectId });
    router.back();
  };

  const isLoading = isLoadingProject || isLoadingMilestones;

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_1fr_auto] gap-x-5 gap-y-5 overflow-hidden px-10 py-8">
      <header className="border-line-2 col-span-6 flex items-start justify-between border-b pb-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleCancel}
            className="typo-caption-heading text-text-4 hover:text-text-1 mb-2 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            목록으로
          </button>
          <h2 className="typo-title-heading text-text-1">테스트 실행 생성</h2>
          <p className="typo-body2-normal text-text-2">
            마일스톤 기준으로 새 테스트 실행을 만들고 결과 기록을 시작합니다.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="col-span-6 flex min-h-0 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <form
          className="col-span-6 grid min-h-0 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[380px_minmax(0,1fr)]"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <aside className="flex min-h-0 flex-col">
            <div className="border-line-2 border-b pb-4">
              <p className="typo-caption-heading text-text-4 mb-1">SCOPE</p>
              <h3 className="typo-h3-heading text-text-1">마일스톤 선택</h3>
              <p className="typo-body2-normal text-text-3 mt-1">
                실행 범위가 될 마일스톤을 먼저 선택합니다.
              </p>
            </div>

            {milestones.length > 0 && (
              <div className="py-3">
                <label className="relative block">
                  <span className="sr-only">마일스톤 검색</span>
                  <Search
                    className="text-text-4 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={milestoneSearchTerm}
                    onChange={(event) => setMilestoneSearchTerm(event.target.value)}
                    placeholder="마일스톤 검색"
                    className="typo-body2-normal border-line-2 bg-bg-2 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary h-9 w-full border pr-9 pl-9 outline-none focus:ring-1"
                  />
                  {milestoneSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setMilestoneSearchTerm('')}
                      className="text-text-4 hover:text-text-1 absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                      aria-label="마일스톤 검색어 지우기"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </label>
                <p className="typo-caption-normal text-text-4 mt-2">
                  {filteredMilestones.length} / {milestones.length}개 마일스톤
                </p>
              </div>
            )}

            {milestones.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                <Flag className="text-text-4 h-6 w-6" aria-hidden="true" />
                <p className="typo-body2-heading text-text-1">선택할 마일스톤이 없습니다.</p>
                <p className="typo-body2-normal text-text-3">
                  먼저 마일스톤을 만든 뒤 테스트 실행을 생성할 수 있습니다.
                </p>
              </div>
            ) : filteredMilestones.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                <Search className="text-text-4 h-6 w-6" aria-hidden="true" />
                <p className="typo-body2-heading text-text-1">검색 결과가 없습니다.</p>
                <p className="typo-body2-normal text-text-3">
                  다른 이름이나 설명 키워드로 다시 검색해보세요.
                </p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col">
                  {filteredMilestones.map((milestone) => {
                    const isSelected = selectedMilestoneId === milestone.id;
                    const startDate = formatDate(milestone.startDate);
                    const endDate = formatDate(milestone.endDate);
                    const suiteCount = milestone.testSuites?.length ?? 0;

                    return (
                      <label
                        key={milestone.id}
                        htmlFor={`milestone-${milestone.id}`}
                        className={`border-line-2 hover:bg-bg-2 flex cursor-pointer gap-3 border-b py-3 transition-colors last:border-b-0 ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          id={`milestone-${milestone.id}`}
                          name="milestone"
                          value={milestone.id}
                          checked={isSelected}
                          onChange={() => setSelectedMilestoneId(milestone.id)}
                          className="accent-primary mt-1 h-4 w-4 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="typo-body2-heading text-text-1 truncate">
                              {milestone.title}
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                className="text-primary h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <div className="typo-caption-normal text-text-4 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{progressStatusLabel[milestone.progressStatus] ?? '계획'}</span>
                            <span aria-hidden="true">/</span>
                            <span>{suiteCount}개 스위트</span>
                            {(startDate || endDate) && (
                              <>
                                <span aria-hidden="true">/</span>
                                <span>
                                  {startDate ?? '-'} - {endDate ?? '-'}
                                </span>
                              </>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="typo-caption-normal text-text-3 mt-1 line-clamp-2">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          <section className="border-line-2 min-h-0 overflow-y-auto border-l pl-6">
            <div className="border-line-2 border-b pb-4">
              <p className="typo-caption-heading text-text-4 mb-1">RUN DETAILS</p>
              <h3 className="typo-h3-heading text-text-1">실행 설정</h3>
              <p className="typo-body2-normal text-text-3 mt-1">
                선택한 마일스톤을 기준으로 실행 이름과 기록 목적을 정리합니다.
              </p>
            </div>

            <div className="border-line-2 mt-4 border-b pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="typo-caption-heading text-text-4">선택 범위</p>
                  <p className="typo-body1-heading text-text-1 mt-1 truncate">
                    {selectedMilestone?.title ?? '마일스톤 미선택'}
                  </p>
                  <p className="typo-caption-normal text-text-3 mt-1">
                    {selectedMilestone
                      ? '이 마일스톤에 연결된 스위트와 케이스로 실행을 생성합니다.'
                      : '왼쪽 목록에서 마일스톤을 선택하세요.'}
                  </p>
                </div>
                {selectedMilestone && (
                  <span className="typo-caption-heading border-primary/30 bg-primary/10 text-primary shrink-0 border px-2 py-0.5">
                    {progressStatusLabel[selectedMilestone.progressStatus] ?? '계획'}
                  </span>
                )}
              </div>
            </div>

            <div className="border-line-2 divide-line-2 mt-2 divide-y border-y">
              <div className="grid gap-3 py-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <label htmlFor="run-name" className="typo-body2-heading text-text-1">
                    실행 이름 <span className="text-system-red">*</span>
                  </label>
                  <p className="typo-caption-normal text-text-4 mt-1">
                    목록과 리포트에 표시됩니다.
                  </p>
                </div>
                <div className="min-w-0">
                  <input
                    id="run-name"
                    type="text"
                    placeholder="예: 2026-06-30 정기 배포 회귀 테스트"
                    className={`typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 w-full border px-3 py-2.5 transition-colors outline-none focus:ring-1 ${
                      errors.runName
                        ? 'border-system-red focus:border-system-red focus:ring-system-red'
                        : 'border-line-2 focus:border-primary focus:ring-primary'
                    }`}
                    disabled={isPending}
                    {...register('runName', {
                      required: '실행 이름을 입력해주세요.',
                      minLength: { value: 2, message: '실행 이름은 최소 2자 이상이어야 합니다.' },
                      maxLength: { value: 100, message: '실행 이름은 100자를 초과할 수 없습니다.' },
                    })}
                  />
                  {errors.runName && (
                    <p className="typo-caption-normal text-system-red mt-1">
                      {errors.runName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 py-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <label htmlFor="run-desc" className="typo-body2-heading text-text-1">
                    실행 노트
                  </label>
                  <p className="typo-caption-normal text-text-4 mt-1">
                    목적, 환경, 제외 범위를 남깁니다.
                  </p>
                </div>
                <textarea
                  id="run-desc"
                  rows={7}
                  placeholder="예: staging 환경에서 결제/권한 회귀 범위를 우선 확인. 외부 결제 승인 단계는 수동 확인으로 제외."
                  className="typo-body2-normal border-line-2 bg-bg-1 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary w-full resize-none border px-3 py-2.5 transition-colors outline-none focus:ring-1"
                  disabled={isPending}
                  {...register('description')}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Info className="text-text-4 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="typo-caption-normal text-text-3">
                실행을 생성하면 케이스 상태는 모두 미실행으로 시작하고, 상세 화면에서 결과를
                기록합니다.
              </p>
            </div>
          </section>

          <div className="border-line-2 col-span-full flex items-center justify-end gap-2 border-t pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="typo-body2-heading text-text-3 hover:text-text-1 inline-flex h-9 items-center justify-center px-3 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedMilestoneId}
              className="typo-body2-heading bg-primary hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 px-4 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {isPending ? '생성 중...' : '실행 생성'}
            </button>
          </div>
        </form>
      )}
    </MainContainer>
  );
};
