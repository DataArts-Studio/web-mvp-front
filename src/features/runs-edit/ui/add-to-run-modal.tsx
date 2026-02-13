'use client';

import React, { useState, useMemo } from 'react';
import type { TestSuite } from '@/entities/test-suite';
import type { Milestone } from '@/entities/milestone';
import type { TestCase } from '@/entities/test-case';
import { SelectionModal, cn } from '@/shared';
import { useSelectionSet } from '@/shared/hooks';
import {
  useAddSuitesToRun,
  useAddMilestonesToRun,
  useAddCasesToRun,
} from '../hooks/use-add-to-run';
import { FileText, ListTodo, Clock } from 'lucide-react';

type TabType = 'case' | 'suite' | 'milestone';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'case', label: '케이스', icon: <FileText className="h-4 w-4" /> },
  { key: 'suite', label: '스위트', icon: <ListTodo className="h-4 w-4" /> },
  { key: 'milestone', label: '마일스톤', icon: <Clock className="h-4 w-4" /> },
];

const TAB_CONFIG: Record<TabType, { placeholder: string; loadingText: string; emptyText: string; submitUnit: string }> = {
  case: { placeholder: '케이스 이름, 키, 태그로 검색...', loadingText: '케이스를 추가하고 있어요', emptyText: '추가할 수 있는 테스트 케이스가 없습니다.', submitUnit: '케이스' },
  suite: { placeholder: '스위트 이름으로 검색...', loadingText: '스위트를 추가하고 있어요', emptyText: '추가할 수 있는 스위트가 없습니다.', submitUnit: '스위트' },
  milestone: { placeholder: '마일스톤 이름으로 검색...', loadingText: '마일스톤을 추가하고 있어요', emptyText: '추가할 수 있는 마일스톤이 없습니다.', submitUnit: '마일스톤' },
};

interface AddToRunModalProps {
  runId: string;
  availableCases: TestCase[];
  availableSuites: TestSuite[];
  availableMilestones: Milestone[];
  onClose: () => void;
}

export const AddToRunModal = ({
  runId,
  availableCases,
  availableSuites,
  availableMilestones,
  onClose,
}: AddToRunModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('case');
  const selection = useSelectionSet();
  const [searchQuery, setSearchQuery] = useState('');

  const addSuites = useAddSuitesToRun(runId);
  const addMilestones = useAddMilestonesToRun(runId);
  const addCases = useAddCasesToRun(runId);

  const isPending = addSuites.isPending || addMilestones.isPending || addCases.isPending;
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

  const filteredMilestones = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return availableMilestones;
    return availableMilestones.filter(
      (m) =>
        m.title.toLowerCase().includes(search) ||
        (m.description?.toLowerCase().includes(search) ?? false)
    );
  }, [availableMilestones, searchQuery]);

  const currentItems = activeTab === 'case' ? filteredCases : activeTab === 'suite' ? filteredSuites : filteredMilestones;
  const allItems = activeTab === 'case' ? availableCases : activeTab === 'suite' ? availableSuites : availableMilestones;

  const handleSubmit = () => {
    if (selection.count === 0) return;
    const ids = selection.toArray();
    const onSuccess = (result: { success: boolean }) => {
      if (result.success) onClose();
    };

    if (activeTab === 'case') addCases.mutate(ids, { onSuccess });
    else if (activeTab === 'suite') addSuites.mutate(ids, { onSuccess });
    else addMilestones.mutate(ids, { onSuccess });
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
                : 'border-transparent text-text-3 hover:text-text-1'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <SelectionModal.Search value={searchQuery} onChange={setSearchQuery} placeholder={config.placeholder} />
      <SelectionModal.Body>
        {currentItems.length === 0 ? (
          <SelectionModal.Empty text={allItems.length === 0 ? config.emptyText : '검색 결과가 없습니다.'} />
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

              {activeTab === 'suite' &&
                filteredSuites.map((suite) => (
                  <SelectionModal.Item key={suite.id} checked={selection.has(suite.id)} onToggle={() => selection.toggle(suite.id)}>
                    <span className="text-text-1 truncate">{suite.title}</span>
                    {suite.description && (
                      <p className="text-text-3 mt-0.5 truncate text-xs">{suite.description}</p>
                    )}
                  </SelectionModal.Item>
                ))}

              {activeTab === 'milestone' &&
                filteredMilestones.map((milestone) => (
                  <SelectionModal.Item key={milestone.id} checked={selection.has(milestone.id)} onToggle={() => selection.toggle(milestone.id)}>
                    <span className="text-text-1 truncate">{milestone.title}</span>
                    {milestone.description && (
                      <p className="text-text-3 mt-0.5 truncate text-xs">{milestone.description}</p>
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
