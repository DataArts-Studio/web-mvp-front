'use client';
import React, { useState } from 'react';

import type { TestSuite } from '@/entities/test-suite';
import { addTestSuitesToMilestone } from '@/entities/milestone/api';
import { SelectionModal } from '@/shared';
import { useSelectionSet } from '@/shared/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';

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
    <SelectionModal.Root onClose={onClose} isPending={isPending}>
      <SelectionModal.Loading text="스위트를 추가하고 있어요" />
      <SelectionModal.Header
        title="테스트 스위트 추가"
        subtitle={<><span className="text-primary font-medium">{milestoneName}</span> 마일스톤에 추가할 스위트를 선택하세요.</>}
      />
      <SelectionModal.Search value={searchQuery} onChange={setSearchQuery} placeholder="스위트 이름, 설명으로 검색..." />
      <SelectionModal.Body>
        {filteredSuites.length === 0 ? (
          <SelectionModal.Empty
            icon={FolderOpen}
            text={availableSuites.length === 0 ? '추가할 수 있는 테스트 스위트가 없습니다.' : '검색 결과가 없습니다.'}
          />
        ) : (
          <>
            <SelectionModal.SelectAll
              checked={selection.isAllSelected(filteredSuites)}
              onCheckedChange={() => selection.toggleAll(filteredSuites)}
              selectedCount={selection.count}
              totalCount={filteredSuites.length}
            />
            <SelectionModal.ItemList>
              {filteredSuites.map((suite) => (
                <SelectionModal.Item key={suite.id} checked={selection.has(suite.id)} onToggle={() => selection.toggle(suite.id)}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="text-primary h-4 w-4 shrink-0" />
                    <span className="text-text-1 truncate">{suite.title}</span>
                  </div>
                  {suite.description && (
                    <p className="text-text-3 mt-1 truncate text-sm">{suite.description}</p>
                  )}
                </SelectionModal.Item>
              ))}
            </SelectionModal.ItemList>
          </>
        )}
      </SelectionModal.Body>
      <SelectionModal.Footer selectedCount={selection.count} submitLabel={`${selection.count}개 스위트 추가`} onSubmit={handleSubmit} />
    </SelectionModal.Root>
  );
};
