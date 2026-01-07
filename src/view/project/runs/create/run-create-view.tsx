'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';

import { useCreateRun, type CreateRunInput } from '@/features/runs-create';
import { dashboardStatsQueryOptions } from '@/features/dashboard';
import { Container, DSButton, MainContainer } from '@/shared';
import { Aside } from '@/widgets';
import { useQuery } from '@tanstack/react-query';

interface RunFormData {
  runName: string;
  description: string;
}

export const RunCreateView = () => {
  const router = useRouter();
  const params = useParams();
  const { mutate, isPending } = useCreateRun();

  const { data: dashboardData } = useQuery(
    dashboardStatsQueryOptions(params.slug as string)
  );

  const projectId = dashboardData?.success ? dashboardData.data.project.id : '';

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
      alert('프로젝트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const input: CreateRunInput = {
      projectId,
      runName: data.runName,
      description: data.description || undefined,
      sourceType: 'ADHOC',
    };

    mutate(input, {
      onSuccess: () => {
        router.push(`/projects/${params.slug}/runs`);
      },
      onError: (error) => {
        alert(error.message || '테스트 실행 생성에 실패했습니다.');
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="col-span-full flex flex-col gap-1 border-b border-line-2 pb-6">
          <h2 className="typo-h1-heading text-text-1">테스트 실행 생성</h2>
          <p className="typo-body2-normal text-text-2">
            선택한 기준을 바탕으로 새로운 테스트 실행(Test Run)을 생성합니다.
          </p>
        </header>

        {/* 실행 기준 요약 (읽기 전용) */}
        <section className="col-span-full rounded-4 border border-line-2 bg-bg-2 p-6 shadow-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="typo-caption-heading inline-flex w-fit items-center rounded-1 bg-primary/10 px-2 py-1 text-primary">
                ADHOC 실행
              </span>
              <h3 className="typo-h2-heading mt-1 text-text-1">
                직접 선택한 테스트 케이스
              </h3>
              <p className="typo-caption-normal text-text-3">
                개별적으로 선택한 케이스들로 테스트를 실행합니다.
              </p>
            </div>

            {/* 포함된 케이스 카운트 */}
            <div className="flex flex-col items-end gap-1 border-l border-line-2 pl-8">
              <span className="typo-caption-heading text-text-3">대상 케이스</span>
              <div className="flex items-baseline gap-1">
                <span className="typo-title-heading text-primary">-</span>
                <span className="typo-body2-normal text-text-3">건</span>
              </div>
            </div>
          </div>
        </section>

        {/* 실행 정보 입력 폼 */}
        <form
          className="col-span-full flex flex-col gap-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {/* 실행 이름 필드 */}
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
                minLength: {
                  value: 2,
                  message: '실행 이름은 최소 2자 이상이어야 합니다.',
                },
                maxLength: {
                  value: 100,
                  message: '실행 이름은 100자를 초과할 수 없습니다.',
                },
              })}
            />
            {errors.runName ? (
              <p className="typo-caption-normal text-system-red">{errors.runName.message}</p>
            ) : (
              <p className="typo-caption-normal text-text-3">
                프로젝트 내에서 식별하기 쉬운 이름을 입력해주세요.
              </p>
            )}
          </div>

          {/* 실행 설명 필드 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="run-desc" className="typo-body2-heading text-text-1">
              실행 설명 <span className="typo-caption-normal font-normal text-text-3">(선택)</span>
            </label>
            <textarea
              id="run-desc"
              rows={5}
              placeholder="이번 실행의 목적, 테스트 환경, 특이사항 등을 기록하세요."
              className="typo-body2-normal w-full resize-none rounded-2 border border-line-2 bg-bg-2 px-4 py-2.5 text-text-1 placeholder:text-text-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isPending}
              {...register('description')}
            />
          </div>

          {/* Actions: 버튼 영역 */}
          <div className="col-span-full mt-4 flex items-center justify-end gap-3 border-t border-line-2 pt-6">
            <DSButton
              type="button"
              variant="ghost"
              className="px-5 py-2.5"
              disabled={isPending}
              onClick={handleCancel}
            >
              취소
            </DSButton>
            <DSButton
              type="submit"
              variant="solid"
              className="px-5 py-2.5"
              disabled={isPending}
            >
              {isPending ? '생성 중...' : '실행 생성하기'}
            </DSButton>
          </div>
        </form>
      </MainContainer>
    </Container>
  );
};
