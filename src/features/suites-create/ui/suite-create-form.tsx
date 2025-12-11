'use client';
import React from 'react';

import { DSButton, FormField } from '@/shared';
import { useForm } from 'react-hook-form';

export const SuiteCreateForm = () => {
  const { register, handleSubmit } = useForm();
  const onSubmit = (data: any) => {
    alert('생성 클릭\n' + JSON.stringify(data, null, 2));
  };
  return (
    <section
      id="create-suite"
      className="bg-bg-2 absolute top-1/2 left-[calc(50%+0.5px)] z-50 box-border flex w-[46.25rem] translate-x-[-50%] translate-y-[-50%] flex-col content-stretch items-center gap-[48px] overflow-clip rounded-[36px] px-32 py-16"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <h2 className="text-primary text-3xl">테스트 스위트를 만들어 볼까요?</h2>
          <p className="mt-2 text-base text-neutral-400">필요한 테스트들을 한 곳에 모아 관리해요</p>
        </div>
        <FormField.Root className='flex flex-col gap-2'>
          <FormField.Label>name</FormField.Label>
          <FormField.Control placeholder="테스트 스위트 이름 입력" type='text' {...register('name', {required: true})}/>
        </FormField.Root>
        <div className='flex gap-2'>
          <DSButton type="button" variant="ghost" className="mt-2 w-full" onClick={()=> alert('취소 클릭')}>
            취소
          </DSButton>
          <DSButton type="submit" variant="solid" className="mt-2 w-full">
            생성
          </DSButton>
        </div>
      </form>
    </section>
  );
};
