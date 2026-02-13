'use client';
import React, { useState } from 'react';

import type { TestCase } from '@/entities/test-case';
import { updateTestCase } from '@/entities/test-case/api';
import { DSButton, LoadingSpinner, cn } from '@/shared';
import { useSelectionSet } from '@/shared/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ListChecks, Search, X } from 'lucide-react';

interface AddCasesToSuiteModalProps {
  suiteId: string;
  suiteName: string;
  availableCases: TestCase[];
  onClose: () => void;
}

export const AddCasesToSuiteModal = ({
  suiteId,
  suiteName,
  availableCases,
  onClose,
}: AddCasesToSuiteModalProps) => {
  const selection = useSelectionSet();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (caseIds: string[]) => {
      const results = await Promise.all(
        caseIds.map((id) => updateTestCase({ id, testSuiteId: suiteId }))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      queryClient.invalidateQueries({ queryKey: ['testSuites'] });
      onClose();
    },
  });

  const filteredCases = availableCases.filter((tc) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      tc.title.toLowerCase().includes(search) ||
      tc.caseKey.toLowerCase().includes(search) ||
      tc.tags?.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  const handleSubmit = () => {
    if (selection.count === 0) return;
    mutate(selection.toArray());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <section className="bg-bg-1 rounded-4 relative flex max-h-[80vh] w-full max-w-[600px] flex-col overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4 bg-bg-1/80 backdrop-blur-sm">
            <LoadingSpinner size="md" text="케이스를 추가하고 있어요" />
          </div>
        )}

        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-text-1 text-lg font-bold">테스트 케이스 추가</h2>
            <p className="text-text-3 mt-1 text-sm">
              <span className="text-primary font-medium">{suiteName}</span> 스위트에 추가할 케이스를 선택하세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        {/* Search */}
        <div className="border-line-2 border-b px-6 py-3">
          <div className="bg-bg-2 border-line-2 flex items-center gap-2 rounded-lg border px-3 py-2">
            <Search className="text-text-3 h-4 w-4" />
            <input
              type="text"
              placeholder="케이스 이름, 키, 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <ListChecks className="text-text-3 h-8 w-8" />
              <p className="text-text-3 text-sm">
                {availableCases.length === 0
                  ? '추가할 수 있는 테스트 케이스가 없습니다.'
                  : '검색 결과가 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="border-line-2 bg-bg-2 sticky top-0 flex items-center gap-3 border-b px-6 py-2">
                <button
                  type="button"
                  onClick={() => selection.toggleAll(filteredCases)}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                    selection.isAllSelected(filteredCases)
                      ? 'border-primary bg-primary text-white'
                      : 'border-line-2 bg-bg-3'
                  )}
                >
                  {selection.isAllSelected(filteredCases) && <Check className="h-3 w-3" />}
                </button>
                <span className="text-text-2 text-sm">
                  전체 선택 ({selection.count}/{filteredCases.length})
                </span>
              </div>

              {/* Cases */}
              <div className="divide-line-2 divide-y">
                {filteredCases.map((tc) => (
                  <div
                    key={tc.id}
                    onClick={() => selection.toggle(tc.id)}
                    className="hover:bg-bg-2 flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors"
                  >
                    <button
                      type="button"
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        selection.has(tc.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-line-2 bg-bg-3'
                      )}
                    >
                      {selection.has(tc.id) && <Check className="h-3 w-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-primary shrink-0 font-mono text-sm">{tc.caseKey}</span>
                        <span className="text-text-1 truncate">{tc.title}</span>
                      </div>
                      {tc.tags && tc.tags.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {tc.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-line-2 flex items-center justify-between border-t px-6 py-4">
          <span className="text-text-3 text-sm">
            {selection.count}개 선택됨
          </span>
          <div className="flex gap-3">
            <DSButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </DSButton>
            <DSButton
              type="button"
              variant="solid"
              onClick={handleSubmit}
              disabled={isPending || selection.count === 0}
            >
              {isPending ? '추가 중...' : `${selection.count}개 케이스 추가`}
            </DSButton>
          </div>
        </div>
      </section>
    </div>
  );
};
