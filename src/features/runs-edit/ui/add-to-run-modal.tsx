'use client';

import React, { useState, useMemo } from 'react';
import type { TestSuite } from '@/entities/test-suite';
import type { Milestone } from '@/entities/milestone';
import type { TestCase } from '@/entities/test-case';
import { DSButton, LoadingSpinner, cn } from '@/shared';
import {
  useAddSuitesToRun,
  useAddMilestonesToRun,
  useAddCasesToRun,
} from '../hooks/use-add-to-run';
import { Check, ListChecks, Search, X, FileText, ListTodo, Clock } from 'lucide-react';

type TabType = 'case' | 'suite' | 'milestone';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'case', label: '케이스', icon: <FileText className="h-4 w-4" /> },
  { key: 'suite', label: '스위트', icon: <ListTodo className="h-4 w-4" /> },
  { key: 'milestone', label: '마일스톤', icon: <Clock className="h-4 w-4" /> },
];

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const addSuites = useAddSuitesToRun(runId);
  const addMilestones = useAddMilestonesToRun(runId);
  const addCases = useAddCasesToRun(runId);

  const isPending = addSuites.isPending || addMilestones.isPending || addCases.isPending;

  // Reset selection & search when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  // Filtered items per tab
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

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map((item) => item.id)));
    }
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const onSuccess = (result: { success: boolean }) => {
      if (result.success) onClose();
    };

    if (activeTab === 'case') addCases.mutate(ids, { onSuccess });
    else if (activeTab === 'suite') addSuites.mutate(ids, { onSuccess });
    else addMilestones.mutate(ids, { onSuccess });
  };

  const searchPlaceholder =
    activeTab === 'case'
      ? '케이스 이름, 키, 태그로 검색...'
      : activeTab === 'suite'
        ? '스위트 이름으로 검색...'
        : '마일스톤 이름으로 검색...';

  const loadingText =
    activeTab === 'case'
      ? '케이스를 추가하고 있어요'
      : activeTab === 'suite'
        ? '스위트를 추가하고 있어요'
        : '마일스톤을 추가하고 있어요';

  const emptyText =
    activeTab === 'case'
      ? '추가할 수 있는 테스트 케이스가 없습니다.'
      : activeTab === 'suite'
        ? '추가할 수 있는 스위트가 없습니다.'
        : '추가할 수 있는 마일스톤이 없습니다.';

  const submitLabel =
    activeTab === 'case'
      ? `${selectedIds.size}개 케이스 추가`
      : activeTab === 'suite'
        ? `${selectedIds.size}개 스위트 추가`
        : `${selectedIds.size}개 마일스톤 추가`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <section className="bg-bg-1 rounded-4 relative flex max-h-[80vh] w-full max-w-[600px] flex-col overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4 bg-bg-1/80 backdrop-blur-sm">
            <LoadingSpinner size="md" text={loadingText} />
          </div>
        )}

        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-text-1 text-lg font-bold">테스트 추가하기</h2>
            <p className="text-text-3 mt-1 text-sm">
              실행에 추가할 항목을 선택하세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

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

        {/* Search */}
        <div className="border-line-2 border-b px-6 py-3">
          <div className="bg-bg-2 border-line-2 flex items-center gap-2 rounded-lg border px-3 py-2">
            <Search className="text-text-3 h-4 w-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <ListChecks className="text-text-3 h-8 w-8" />
              <p className="text-text-3 text-sm">
                {allItems.length === 0 ? emptyText : '검색 결과가 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="border-line-2 bg-bg-2 sticky top-0 flex items-center gap-3 border-b px-6 py-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                    selectedIds.size === currentItems.length
                      ? 'border-primary bg-primary text-white'
                      : 'border-line-2 bg-bg-3'
                  )}
                >
                  {selectedIds.size === currentItems.length && <Check className="h-3 w-3" />}
                </button>
                <span className="text-text-2 text-sm">
                  전체 선택 ({selectedIds.size}/{currentItems.length})
                </span>
              </div>

              {/* Items */}
              <div className="divide-line-2 divide-y">
                {activeTab === 'case' &&
                  filteredCases.map((tc) => (
                    <div
                      key={tc.id}
                      onClick={() => toggleSelect(tc.id)}
                      className="hover:bg-bg-2 flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors"
                    >
                      <CheckboxButton checked={selectedIds.has(tc.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-primary shrink-0 font-mono text-sm">{tc.caseKey}</span>
                          <span className="text-text-1 truncate">{tc.title}</span>
                        </div>
                        {tc.tags && tc.tags.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {tc.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                {activeTab === 'suite' &&
                  filteredSuites.map((suite) => (
                    <div
                      key={suite.id}
                      onClick={() => toggleSelect(suite.id)}
                      className="hover:bg-bg-2 flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors"
                    >
                      <CheckboxButton checked={selectedIds.has(suite.id)} />
                      <div className="min-w-0 flex-1">
                        <span className="text-text-1 truncate">{suite.title}</span>
                        {suite.description && (
                          <p className="text-text-3 mt-0.5 truncate text-xs">{suite.description}</p>
                        )}
                      </div>
                    </div>
                  ))}

                {activeTab === 'milestone' &&
                  filteredMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      onClick={() => toggleSelect(milestone.id)}
                      className="hover:bg-bg-2 flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors"
                    >
                      <CheckboxButton checked={selectedIds.has(milestone.id)} />
                      <div className="min-w-0 flex-1">
                        <span className="text-text-1 truncate">{milestone.title}</span>
                        {milestone.description && (
                          <p className="text-text-3 mt-0.5 truncate text-xs">{milestone.description}</p>
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
          <span className="text-text-3 text-sm">{selectedIds.size}개 선택됨</span>
          <div className="flex gap-3">
            <DSButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </DSButton>
            <DSButton
              type="button"
              variant="solid"
              onClick={handleSubmit}
              disabled={isPending || selectedIds.size === 0}
            >
              {isPending ? '추가 중...' : submitLabel}
            </DSButton>
          </div>
        </div>
      </section>
    </div>
  );
};

const CheckboxButton = ({ checked }: { checked: boolean }) => (
  <button
    type="button"
    className={cn(
      'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
      checked ? 'border-primary bg-primary text-white' : 'border-line-2 bg-bg-3'
    )}
  >
    {checked && <Check className="h-3 w-3" />}
  </button>
);
