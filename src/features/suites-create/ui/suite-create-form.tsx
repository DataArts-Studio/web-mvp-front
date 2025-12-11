'use client';
import React from 'react';

import { DSButton, FormField } from '@/shared';

export const SuiteCreateForm = () => {
  return (
    <section
      id="create-suite"
      className="bg-bg-2 absolute top-1/2 left-[calc(50%+0.5px)] z-50 box-border flex w-[46.25rem] translate-x-[-50%] translate-y-[-50%] flex-col content-stretch items-center gap-[48px] overflow-clip rounded-[36px] px-32 py-16"
    >
      <form>
        <div>
          <h2 className="text-primary">테스트 스위트를 만들어 볼까요?</h2>
          <p className="mt-2 text-base text-neutral-400">필요한 테스트들을 한 곳에 모아 관리해요</p>
        </div>
        <FormField.Root>
          <FormField.Label>name</FormField.Label>
          <FormField.Control placeholder="테스트 스위트 이름 입력" />
        </FormField.Root>
        <div>
            프로젝트 생성 시작
          <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={()=> alert('취소 클릭')}>
            취소
          </DSButton>
          <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={()=> alert('생성 클릭')}>
            생성
          </DSButton>
        </div>
      </form>
    </section>
  );
};
