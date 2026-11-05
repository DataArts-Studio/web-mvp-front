'use client';

import React, { useMemo, useState } from 'react';

import type { TestCase } from '@/entities/test-case';
import type { TestSuite } from '@/entities/test-suite';
import { SelectionModal, cn } from '@/shared';
import { useSelectionSet } from '@testea/lib';
import { FileText, ListTodo } from 'lucide-react';
import { toast } from 'sonner';

import { useAddCasesToRun, useAddSuitesToRun } from '../hooks/use-add-to-run';

// 마일스톤 추가는 실행의 마일스톤 자체를 바꾸므로 여기서는 케이스·스위트만 다룬다.
type TabType = 'case' | 'suite';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'case', label: '케이스', icon: <FileText className="h-4 w-4" /> },
  { key: 'suite', label: '스위트', icon: <ListTodo className="h-4 w-4" /> },
];

const TAB_CONFIG: Record<
  TabType,
  { placeholder: string; loadingText: string; emptyText: string; submitUnit: string }
> = {
  case: {
    placeholder: '케이스 이름, 키, 태그로 검색...',
    loadingText: '케이스를 추가하고 있어요',
    emptyText: '추가할 수 있는 테스트 케이스가 없습니다.',
    submitUnit: '케이스',
  },
  suite: {
    placeholder: '스위트 이름으로 검색...',
    loadingText: '스위트를 추가하고 있어요',
    emptyText: '추가할 수 있는 스위트가 없습니다.',
    submitUnit: '스위트',
  },
};

interface AddToRunModalProps {
  runId: string;
  availableCases: TestCase[];
  availableSuites: TestSuite[];
  onClose: () => void;
}

export const AddToRunModal = ({
  runId,
  availableCases,
  availableSuites,
  onClose,
}: AddToRunModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('case');
  const selection = useSelectionSet();
  const [searchQuery, setSearchQuery] = useState('');

  const addSuites = useAddSuitesToRun(runId);
  const addCases = useAddCasesToRun(runId);

  const isPending = addSuites.isPending || addCases.isPending;
  const config = TAB_CONFIG[activeTab];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    selection.clear();
    setSearchQuery('');
  };

  const filteredCases = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return availableCases;
    return availableCases.filter(
      (tc) =>
        tc.title.toLowerCase().includes(search) ||
        tc.caseKey.toLowerCase().includes(search) ||
        tc.tags?.some((tag) => tag.toLowerCase().includes(search))
    );
  }, [availableCases, searchQuery]);

  const filteredSuites = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return availableSuites;
    return availableSuites.filter(
      (s) =>
        s.title.toLowerCase().includes(search) ||
        (s.description?.toLowerCase().includes(search) ?? false)
    );
  }, [availableSuites, searchQuery]);

  const currentItems = activeTab === 'case' ? filteredCases : filteredSuites;
  const allItems = activeTab === 'case' ? availableCases : availableSuites;

  const handleSubmit = () => {
    if (selection.count === 0) return;
    const ids = selection.toArray();
    const handlers = {
      onSuccess: (
        result: { success: true; addedCount: number } | { success: false; error: string }
      ) => {
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(
          result.addedCount > 0
            ? `${result.addedCount}개 케이스를 실행에 추가했습니다.`
            : '이미 실행에 들어 있는 항목입니다.'
        );
        onClose();
      },
      onError: () =>
        toast.error(`${config.submitUnit} 추가에 실패했습니다. 잠시 후 다시 시도해주세요.`),
    };

    if (activeTab === 'case') addCases.mutate(ids, handlers);
    else addSuites.mutate(ids, handlers);
  };

  return (
    <SelectionModal.Root onClose={onClose} isPending={isPending}>
      <SelectionModal.Loading text={config.loadingText} />
      <SelectionModal.Header title="테스트 추가하기" subtitle="실행에 추가할 항목을 선택하세요." />

      {/* Tabs */}
      <div className="border-line-2 flex border-b px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'text-text-3 hover:text-text-1 border-transparent'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <SelectionModal.Search
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={config.placeholder}
      />
      <SelectionModal.Body>
        {currentItems.length === 0 ? (
          <SelectionModal.Empty
            text={allItems.length === 0 ? config.emptyText : '검색 결과가 없습니다.'}
          />
        ) : (
          <>
            <SelectionModal.SelectAll
              checked={selection.isAllSelected(currentItems)}
              onCheckedChange={() => selection.toggleAll(currentItems)}
              selectedCount={selection.count}
              totalCount={currentItems.length}
            />
            <SelectionModal.ItemList>
              {activeTab === 'case' &&
                filteredCases.map((tc) => (
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

              {activeTab === 'suite' &&
                filteredSuites.map((suite) => (
                  <SelectionModal.Item
                    key={suite.id}
                    checked={selection.has(suite.id)}
                    onToggle={() => selection.toggle(suite.id)}
                  >
                    <span className="text-text-1 truncate">{suite.title}</span>
                    {suite.description && (
                      <p className="text-text-3 mt-0.5 truncate text-xs">{suite.description}</p>
                    )}
                  </SelectionModal.Item>
                ))}
            </SelectionModal.ItemList>
          </>
        )}
      </SelectionModal.Body>
      <SelectionModal.Footer
        selectedCount={selection.count}
        submitLabel={`${selection.count}개 ${config.submitUnit} 추가`}
        onSubmit={handleSubmit}
      />
    </SelectionModal.Root>
  );
};
