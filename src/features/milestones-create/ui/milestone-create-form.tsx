'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { createSuiteMock } from '@/features/suites-create';
import { DSButton, FormField } from '@/shared';

interface IFormInput {
  name: string;
  description: string;
  priority: string;
  startDate: string;
  endDate: string;
}

export const MilestoneCreateForm = () => {
  const { register, handleSubmit } = useForm<IFormInput>();
  const onSubmit = async (data: IFormInput) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('priority', data.priority);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);

    const result = await createSuiteMock(formData);
    if (!result.success) {
      console.error('서버 에러 발생:', JSON.stringify(result.errors, null, 2));
      return;
    }
    alert('마일스톤이 생성되었습니다.\n' + JSON.stringify(data, null, 2));
  };
  return (
    <section
      id="create-milestone"
      className="bg-bg-2/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[4px]"
    >
      <div className="bg-bg-2 max-h-[80vh] w-[700px] overflow-y-hidden rounded-xl p-10">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          <div className="border-line-1 border-b py-4">
            <h2 className="text-primary text-3xl">마일스톤을 만들어 볼까요?</h2>
            <p className="mt-2 text-base text-neutral-400">
              프로젝트의 중요한 목표 지점을 설정하고 한곳에서 관리해요.
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label>마일스톤 이름</FormField.Label>
              <FormField.Control
                placeholder="마일스톤 이름을 입력해 주세요."
                type="text"
                {...register('name', { required: true })}
              />
            </FormField.Root>
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label>설명</FormField.Label>
              <FormField.Control
                placeholder="이 마일스톤의 상세 내용을 적어주세요."
                type="text"
                {...register('description', { required: true })}
              />
            </FormField.Root>
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label>우선순위</FormField.Label>
              <FormField.Control
                placeholder="High, Normal(셀렉트로 바꿀예정)"
                type="text"
                {...register('priority', { required: true })}
              />
            </FormField.Root>
            <div className="grid grid-cols-2 gap-4">
              <FormField.Root className="col-span-1 flex flex-col gap-2">
                <FormField.Label>시작일</FormField.Label>
                <FormField.Control type="date" {...register('startDate', { required: true })} />
              </FormField.Root>
              <FormField.Root className="col-span-1 flex flex-col gap-2">
                <FormField.Label>종료일</FormField.Label>
                <FormField.Control type="date" {...register('endDate', { required: true })} />
              </FormField.Root>
            </div>
          </div>
          <div className="border-line-1 border-t py-4 flex gap-2">
            <DSButton
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => alert('취소 클릭')}
            >
              취소
            </DSButton>
            <DSButton type="submit" variant="solid" className="mt-2 w-full">
              생성
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
