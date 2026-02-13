'use client';
import React, { useState } from 'react';

import type { TestSuite } from '@/entities/test-suite';
import { addTestSuitesToMilestone } from '@/entities/milestone/api';
import { DSButton, DsCheckbox, LoadingSpinner } from '@/shared';
import { useSelectionSet } from '@/shared/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Search, X } from 'lucide-react';

interface AddSuitesToMilestoneModalProps {
  milestoneId: string;
  milestoneName: string;
  availableSuites: TestSuite[];
  onClose: () => void;
}

export const AddSuitesToMilestoneModal = ({
  milestoneId,
  milestoneName,
  availableSuites,
  onClose,
}: AddSuitesToMilestoneModalProps) => {
  const selection = useSelectionSet();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (suiteIds: string[]) => {
      return addTestSuitesToMilestone(milestoneId, suiteIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone', milestoneId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['milestones'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['testSuites'], refetchType: 'all' });
      onClose();
    },
  });

  const filteredSuites = availableSuites.filter((suite) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      suite.title.toLowerCase().includes(search) ||
      suite.description?.toLowerCase().includes(search)
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
            <LoadingSpinner size="md" text="스위트를 추가하고 있어요" />
          </div>
        )}

        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-text-1 text-lg font-bold">테스트 스위트 추가</h2>
            <p className="text-text-3 mt-1 text-sm">
              <span className="text-primary font-medium">{milestoneName}</span> 마일스톤에 추가할 스위트를 선택하세요.
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
              placeholder="스위트 이름, 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Suite List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSuites.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <FolderOpen className="text-text-3 h-8 w-8" />
              <p className="text-text-3 text-sm">
                {availableSuites.length === 0
                  ? '추가할 수 있는 테스트 스위트가 없습니다.'
                  : '검색 결과가 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="border-line-2 bg-bg-2 sticky top-0 flex items-center gap-3 border-b px-6 py-2">
                <DsCheckbox
                  checked={selection.isAllSelected(filteredSuites)}
                  onCheckedChange={() => selection.toggleAll(filteredSuites)}
                  className="h-5 w-5 border-line-2 bg-bg-3"
                />
                <span className="text-text-2 text-sm">
                  전체 선택 ({selection.count}/{filteredSuites.length})
                </span>
              </div>

              {/* Suites */}
              <div className="divide-line-2 divide-y">
                {filteredSuites.map((suite) => (
                  <div
                    key={suite.id}
                    onClick={() => selection.toggle(suite.id)}
                    className="hover:bg-bg-2 flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors"
                  >
                    <DsCheckbox
                      checked={selection.has(suite.id)}
                      className="h-5 w-5 shrink-0 border-line-2 bg-bg-3"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="text-primary h-4 w-4 shrink-0" />
                        <span className="text-text-1 truncate">{suite.title}</span>
                      </div>
                      {suite.description && (
                        <p className="text-text-3 mt-1 truncate text-sm">
                          {suite.description}
                        </p>
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
              {isPending ? '추가 중...' : `${selection.count}개 스위트 추가`}
            </DSButton>
          </div>
        </div>
      </section>
    </div>
  );
};
