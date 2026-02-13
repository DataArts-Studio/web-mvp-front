'use client';
import React, { useState } from 'react';

import type { TestCase } from '@/entities/test-case';
import { updateTestCase } from '@/entities/test-case/api';
import { SelectionModal } from '@/shared';
import { useSelectionSet } from '@/shared/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
    <SelectionModal.Root onClose={onClose} isPending={isPending}>
      <SelectionModal.Loading text="케이스를 추가하고 있어요" />
      <SelectionModal.Header
        title="테스트 케이스 추가"
        subtitle={<><span className="text-primary font-medium">{suiteName}</span> 스위트에 추가할 케이스를 선택하세요.</>}
      />
      <SelectionModal.Search value={searchQuery} onChange={setSearchQuery} placeholder="케이스 이름, 키, 태그로 검색..." />
      <SelectionModal.Body>
        {filteredCases.length === 0 ? (
          <SelectionModal.Empty
            text={availableCases.length === 0 ? '추가할 수 있는 테스트 케이스가 없습니다.' : '검색 결과가 없습니다.'}
          />
        ) : (
          <>
            <SelectionModal.SelectAll
              checked={selection.isAllSelected(filteredCases)}
              onCheckedChange={() => selection.toggleAll(filteredCases)}
              selectedCount={selection.count}
              totalCount={filteredCases.length}
            />
            <SelectionModal.ItemList>
              {filteredCases.map((tc) => (
                <SelectionModal.Item key={tc.id} checked={selection.has(tc.id)} onToggle={() => selection.toggle(tc.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-primary shrink-0 font-mono text-sm">{tc.caseKey}</span>
                    <span className="text-text-1 truncate">{tc.title}</span>
                  </div>
                  {tc.tags && tc.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {tc.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </SelectionModal.Item>
              ))}
            </SelectionModal.ItemList>
          </>
        )}
      </SelectionModal.Body>
      <SelectionModal.Footer selectedCount={selection.count} submitLabel={`${selection.count}개 케이스 추가`} onSubmit={handleSubmit} />
    </SelectionModal.Root>
  );
};
