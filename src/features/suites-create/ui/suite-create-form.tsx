'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { createSuiteMock } from '@/features/suites-create';
import { DSButton, FormField } from '@/shared';

interface IFormInput {
  name: string;
  description?: string;
}

export const SuiteCreateForm = ({ onClose }: { onClose?: () => void }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IFormInput>();

  const onSubmit = async (data: IFormInput) => {
    const payload = {
      name: data.name.trim(),
      description: data.description || '',
    };

    const result = await createSuiteMock(payload);
    if (!result.success) {
      console.error('서버 에러 발생:', JSON.stringify(result.errors, null, 2));
      return;
    }
    alert('생성 클릭\n' + JSON.stringify(data, null, 2));
  };

  return (
    <section
      id="create-suite"
      className="bg-bg-2/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[4px]"
    >
      <div className="bg-bg-2 shadow-4 w-[600px] overflow-hidden rounded-xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          {/* Header */}
          <div className="border-line-1 border-b pb-6">
            <h2 className="text-primary text-3xl">테스트 스위트를 만들어 볼까요?</h2>
            <p className="mt-2 text-base text-neutral-400">
              필요한 테스트들을 한 곳에 모아 관리해요
            </p>
          </div>
          {/* Body */}
          <div className="flex flex-col gap-6">
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">
                스위트 이름 <span className="text-system-red">*</span>
              </FormField.Label>
              <FormField.Control
                placeholder="스위트 이름을 입력해 주세요."
                type="text"
                disabled={isSubmitting} // 로딩 중 수정 불가
                {...register('name', {
                  required: '유효한 이름을 입력해주세요.',
                  minLength: {
                    value: 5,
                    message: '스위트 이름은 최소 5자 이상이어야 합니다.',
                  },
                  maxLength: {
                    value: 50,
                    message: '스위트 이름은 50자를 초과할 수 없습니다.',
                  },
                  validate: (value) => !!value.trim() || '공백만으로는 이름을 생성할 수 없습니다.',
                  pattern: {
                    // 특수문자 입력 제한 (-, _, ., 공백, 한글, 영문, 숫자만 허용)
                    value: /^[a-zA-Z0-9가-힣\s._-]+$/,
                    message: '특수문자는 사용할 수 없습니다. (-, _, ., 공백만 허용)',
                  },
                })}
                className={errors.name ? 'border-system-red focus:border-system-red' : ''}
              />
              {/* 에러 메시지 출력 */}
              {errors.name && (
                <span className="text-system-red mt-1 text-sm">{errors.name.message}</span>
              )}
            </FormField.Root>
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">설명 (선택)</FormField.Label>
              <FormField.Control
                placeholder="이 스위트에 대한 간략한 설명을 입력해주세요."
                type="text"
                disabled={isSubmitting}
                {...register('description')}
              />
            </FormField.Root>
          </div>
          <div className="border-line-1 flex gap-3 border-t pt-6">
            <DSButton
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => {
                if (onClose) onClose();
                else alert('취소 클릭');
              }}
            >
              취소
            </DSButton>
            <DSButton
              type="submit"
              variant="solid"
              className="w-full"
              disabled={isSubmitting} // 로딩 중 클릭 방지
            >
              {isSubmitting ? '생성 중...' : '생성'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
