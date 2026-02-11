'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCreateRun, type CreateRunInput } from '@/features/runs-create';
import { dashboardQueryOptions } from '@/features/dashboard';
import { milestonesQueryOptions, getMilestones } from '@/entities/milestone';
import { Container, DSButton, MainContainer, LoadingSpinner } from '@/shared';
import { Aside } from '@/widgets';
import { Checkbox } from '@/shared/ui/checkbox'; // Assuming a checkbox component exists
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';

interface RunFormData {
  runName: string;
  description: string;
}

export const RunCreateView = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectSlug = params.slug as string;
  const preselectedMilestoneId = searchParams.get('milestoneId');
  const { mutate, isPending } = useCreateRun();

  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>(preselectedMilestoneId ? [preselectedMilestoneId] : []);

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(projectSlug)
  );
  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: milestonesData, isLoading: isLoadingMilestones } = useQuery({
    ...milestonesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const milestones = milestonesData?.success ? milestonesData.data : [];

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

  const handleMilestoneSelect = (milestoneId: string) => {
    setSelectedMilestoneIds(prev =>
      prev.includes(milestoneId) ? prev.filter(id => id !== milestoneId) : [...prev, milestoneId]
    );
  };

  const hasSelection = selectedMilestoneIds.length > 0;

  const onSubmit = (data: RunFormData) => {
    if (!projectId) {
      alert('프로젝트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!hasSelection) {
      alert('최소 하나의 마일스톤을 선택해주세요.');
      return;
    }

    const input: CreateRunInput = {
      project_id: projectId,
      name: data.runName,
      description: data.description || undefined,
      milestone_ids: selectedMilestoneIds,
    };

    mutate(input, {
      onSuccess: () => {
        track(TESTRUN_EVENTS.CREATE_COMPLETE, { project_id: projectId });
        router.push(`/projects/${projectSlug}/runs`);
      },
      onError: (error) => {
        alert(error.message || '테스트 실행 생성에 실패했습니다.');
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  const isLoading = isLoadingProject || isLoadingMilestones;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
      <Aside />
      <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8 max-w-[1200px] mx-auto">
        <header className="col-span-full flex flex-col gap-1 border-b border-line-2 pb-6">
          <h2 className="typo-h1-heading text-text-1">테스트 실행 생성</h2>
          <p className="typo-body2-normal text-text-2">
            새로운 테스트 실행(Test Run)을 생성합니다.
          </p>
        </header>

        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <form
            className="col-span-full flex flex-col gap-8"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* 기본 정보 */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="run-name" className="typo-body2-heading text-text-1">
                  실행 이름 <span className="text-system-red">*</span>
                </label>
                <input
                  id="run-name"
                  type="text"
                  placeholder="예: 2024-05-20 정기 배포 회귀 테스트"
                  className={`typo-body2-normal w-full rounded-2 border bg-bg-2 px-4 py-2.5 text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-1 ${
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
                  <p className="typo-caption-normal text-system-red">{errors.runName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="run-desc" className="typo-body2-heading text-text-1">
                  실행 설명 <span className="typo-caption-normal font-normal text-text-3">(선택)</span>
                </label>
                <textarea
                  id="run-desc"
                  rows={4}
                  placeholder="이번 실행의 목적, 테스트 환경, 특이사항 등을 기록하세요."
                  className="typo-body2-normal w-full resize-none rounded-2 border border-line-2 bg-bg-2 px-4 py-2.5 text-text-1 placeholder:text-text-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={isPending}
                  {...register('description')}
                />
              </div>
            </div>

            {/* 마일스톤 선택 */}
            <div className="flex flex-col gap-3">
              <h3 className="typo-h3-heading border-b border-line-2 pb-2">마일스톤 선택 <span className="text-system-red">*</span></h3>
              <div className="grid grid-cols-3 gap-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-2 rounded-2 bg-bg-2 p-3">
                    <Checkbox
                      id={`milestone-${milestone.id}`}
                      checked={selectedMilestoneIds.includes(milestone.id)}
                      onCheckedChange={() => handleMilestoneSelect(milestone.id)}
                    />
                    <label htmlFor={`milestone-${milestone.id}`} className="flex-1 cursor-pointer typo-body2-normal">
                      {milestone.title}
                    </label>
                  </div>
                ))}
              </div>
              {milestones.length === 0 && <p className="typo-body2-normal text-text-3">선택할 마일스톤이 없습니다.</p>}
            </div>

            <div className="col-span-full mt-4 flex items-center justify-end gap-3 border-t border-line-2 pt-6">
              <DSButton type="button" variant="ghost" className="px-5 py-2.5" disabled={isPending} onClick={handleCancel}>
                취소
              </DSButton>
              <DSButton type="submit" variant="solid" className="px-5 py-2.5" disabled={isPending || !hasSelection}>
                {isPending ? '생성 중...' : '실행 생성하기'}
              </DSButton>
            </div>
          </form>
        )}
      </MainContainer>
    </Container>
  );
};
