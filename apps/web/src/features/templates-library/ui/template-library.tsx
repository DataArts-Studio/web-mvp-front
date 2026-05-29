'use client';
import React, { useMemo, useState } from 'react';

import type { TestCaseTemplate } from '@/entities/test-case-template';
import { templatesQueryOptions } from '@/entities/test-case-template/api';
import { TemplateCreateModal } from '@/features/templates-create';
import { TemplateEditModal } from '@/features/templates-edit';
import { useDeleteTemplate } from '@/features/templates-edit';
import { DSButton, DsInput, LoadingSpinner } from '@/shared';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { TemplateCard } from './template-card';
import { TemplatePreview } from './template-preview';

type TabType = 'all' | 'builtin' | 'custom';

interface TemplateLibraryProps {
  projectId: string;
  onApply: (template: TestCaseTemplate) => void;
  onClose: () => void;
}

export const TemplateLibrary = ({ projectId, onApply, onClose }: TemplateLibraryProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TestCaseTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestCaseTemplate | null>(null);

  const { data, isLoading } = useQuery(templatesQueryOptions(projectId));
  const templates = useMemo(() => (data?.success ? data.data : []), [data]);

  const { mutate: deleteMutate } = useDeleteTemplate();

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (activeTab === 'builtin') {
      filtered = filtered.filter((t) => t.category === 'BUILTIN');
    } else if (activeTab === 'custom') {
      filtered = filtered.filter((t) => t.category === 'CUSTOM');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, activeTab, searchQuery]);

  const handleDelete = (template: TestCaseTemplate) => {
    if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) return;
    deleteMutate(template.id, {
      onSuccess: () => {
        toast.success('템플릿이 삭제되었습니다.');
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      },
      onError: () => {
        toast.error('템플릿 삭제에 실패했습니다.');
      },
    });
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'builtin', label: '빌트인' },
    { key: 'custom', label: '커스텀' },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <section
          className="bg-bg-2 border-line-2 rounded-5 shadow-4 relative flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden border"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-text-1 typo-h2-heading">템플릿 라이브러리</h2>
              <p className="text-text-3 typo-caption-normal mt-0.5">
                템플릿을 선택하여 테스트 케이스를 빠르게 작성하세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DSButton
                variant="ghost"
                size="small"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />새 템플릿
              </DSButton>
              <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
                <X className="h-5 w-5" />
              </DSButton>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: List */}
            <div className="border-line-2 flex w-[360px] shrink-0 flex-col border-r">
              {/* Tabs */}
              <div className="border-line-2 flex border-b px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-primary border-primary'
                        : 'text-text-3 hover:text-text-1 border-transparent'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="p-3">
                <div className="relative">
                  <Search className="text-text-3 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <DsInput
                    className="pl-9"
                    placeholder="템플릿 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Card list */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" text="로딩 중..." />
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <p className="text-text-3 py-8 text-center text-sm">
                    {searchQuery ? '검색 결과가 없습니다.' : '템플릿이 없습니다.'}
                  </p>
                ) : (
                  filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplate?.id === template.id}
                      onSelect={setSelectedTemplate}
                      onEdit={setEditingTemplate}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTemplate ? (
                <TemplatePreview template={selectedTemplate} onApply={onApply} />
              ) : (
                <div className="text-text-3 flex h-full items-center justify-center text-sm">
                  템플릿을 선택하면 미리보기가 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isCreateOpen && (
        <TemplateCreateModal projectId={projectId} onClose={() => setIsCreateOpen(false)} />
      )}

      {editingTemplate && (
        <TemplateEditModal template={editingTemplate} onClose={() => setEditingTemplate(null)} />
      )}
    </>
  );
};
