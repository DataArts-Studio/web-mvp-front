'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DsInput, DSButton } from '@/shared/ui';
import { SearchKeywordSchema } from '../model/schema';
import type { SearchKeyword } from '../model/types';

interface ProjectSearchFormProps {
  onSearch: (keyword: string) => Promise<void>;
  isSearching: boolean;
}

export const ProjectSearchForm = ({ onSearch, isSearching }: ProjectSearchFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchKeyword>({
    resolver: zodResolver(SearchKeywordSchema),
    defaultValues: {
      keyword: '',
    },
  });

  const onSubmit = async (data: SearchKeyword) => {
    await onSearch(data.keyword.trim());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <p className="text-body2 text-text-2">프로젝트명으로 검색하세요</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <DsInput
            {...register('keyword')}
            placeholder="프로젝트명 입력..."
            variant={errors.keyword ? 'error' : 'default'}
            disabled={isSearching}
            autoComplete="off"
          />
        </div>
        <DSButton
          type="submit"
          variant="solid"
          size="medium"
          disabled={isSearching}
          className="shrink-0 px-6"
        >
          {isSearching ? '검색 중...' : '검색'}
        </DSButton>
      </div>
      {errors.keyword && (
        <p className="text-body3 text-system-red">{errors.keyword.message}</p>
      )}
    </form>
  );
};
