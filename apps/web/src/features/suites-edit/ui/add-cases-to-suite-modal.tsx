'use client';
import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import type { TestCase } from '@/entities/test-case';
import { updateTestCase } from '@/entities/test-case/api';
import { SelectionModal } from '@/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelectionSet } from '@testea/lib';

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
  const t = useTranslations('suites');
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
      <SelectionModal.Loading text={t('ui.addCasesLoading')} />
      <SelectionModal.Header
        title={t('ui.addTestCase')}
        subtitle={t.rich('ui.addCasesSubtitle', {
          name: suiteName,
          highlight: (chunks) => <span className="text-primary font-medium">{chunks}</span>,
        })}
      />
      <SelectionModal.Search
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t('ui.addCaseSearchPlaceholder')}
      />
      <SelectionModal.Body>
        {filteredCases.length === 0 ? (
          <SelectionModal.Empty
            text={availableCases.length === 0 ? t('ui.noAvailableCases') : t('ui.noResults')}
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
                <SelectionModal.Item
                  key={tc.id}
                  checked={selection.has(tc.id)}
                  onToggle={() => selection.toggle(tc.id)}
                >
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
                </SelectionModal.Item>
              ))}
            </SelectionModal.ItemList>
          </>
        )}
      </SelectionModal.Body>
      <SelectionModal.Footer
        selectedCount={selection.count}
        submitLabel={t('count.addCases', { count: selection.count })}
        onSubmit={handleSubmit}
      />
    </SelectionModal.Root>
  );
};
