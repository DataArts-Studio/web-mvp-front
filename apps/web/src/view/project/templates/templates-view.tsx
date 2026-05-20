'use client';
import React, { useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { getTestTypeLabel } from '@/entities/test-case';
import type { TestCaseTemplate } from '@/entities/test-case-template';
import { templatesQueryOptions } from '@/entities/test-case-template/api';
import { dashboardQueryOptions } from '@/features/dashboard';
import { TemplateCreateModal } from '@/features/templates-create';
import { TemplateEditModal, useDeleteTemplate } from '@/features/templates-edit';
import { TEMPLATE_EVENTS, track } from '@/shared/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import { MainContainer } from '@testea/ui';
import { DSButton, EmptyState, LoadingSpinner } from '@testea/ui';
import { cn } from '@testea/util';
import {
  Edit2,
  Eye,
  Inbox,
  LayoutTemplate,
  ListChecks,
  MoreVertical,
  Plus,
  Search,
  Tag,
  TestTube2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'all' | 'builtin' | 'custom';

export const TemplatesView = () => {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TestCaseTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestCaseTemplate | null>(null);

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(params.slug as string)
  );

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    ...templatesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const templates = useMemo(
    () => (templatesData?.success ? templatesData.data : []),
    [templatesData]
  );

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

  const builtinCount = templates.filter((t) => t.category === 'BUILTIN').length;
  const customCount = templates.filter((t) => t.category === 'CUSTOM').length;

  const handleDelete = (template: TestCaseTemplate) => {
    if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) return;
    deleteMutate(template.id, {
      onSuccess: () => {
        toast.success('템플릿이 삭제되었습니다.');
        track(TEMPLATE_EVENTS.DELETE, { template_id: template.id });
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      },
      onError: () => {
        toast.error('템플릿 삭제에 실패했습니다.');
      },
    });
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: templates.length },
    { key: 'builtin', label: '빌트인', count: builtinCount },
    { key: 'custom', label: '커스텀', count: customCount },
  ];

  if (isLoadingProject || isLoadingTemplates) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
      </MainContainer>
    );
  }

  if (!dashboardData?.success) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
      </MainContainer>
    );
  }

  return (
    <>
      <MainContainer className="flex min-h-screen w-full flex-1">
        <div className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
          {/* Header */}
          <header className="border-line-2 col-span-6 flex items-end justify-between border-b pb-6">
            <div className="flex flex-col gap-1">
              <h2 className="typo-h1-heading text-text-1">템플릿 관리</h2>
              <p className="typo-body2-normal text-text-2">
                자주 사용하는 테스트 케이스 구조를 템플릿으로 저장하고 재사용하세요.
              </p>
            </div>
            <DSButton
              variant="solid"
              size="small"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />새 템플릿
            </DSButton>
          </header>

          {/* Tabs & Search */}
          <div className="col-span-6 flex items-center justify-between gap-4">
            <div className="border-line-2 flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={cn(
                    'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                    activeTab === tab.key
                      ? 'text-primary border-primary'
                      : 'text-text-3 hover:text-text-1 border-transparent'
                  )}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="text-text-3 ml-1.5 text-xs">({tab.count})</span>
                </button>
              ))}
            </div>
            <div className="relative w-72">
              <Search className="text-text-3 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                className="rounded-4 border-line-2 bg-bg-2 text-text-1 placeholder:text-text-3 focus:border-primary w-full border py-2 pr-3 pl-9 text-sm outline-none"
                placeholder="템플릿 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Content - 2 column layout */}
          <div className="col-span-6 flex gap-6">
            {/* Left: Card grid */}
            <div className="flex-1">
              {filteredTemplates.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-10 w-10" />}
                  title={searchQuery ? '검색 결과가 없습니다.' : '템플릿이 없습니다.'}
                  action={
                    !searchQuery && activeTab !== 'builtin' ? (
                      <DSButton
                        variant="ghost"
                        size="small"
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />새 템플릿 만들기
                      </DSButton>
                    ) : undefined
                  }
                  className="rounded-4 border-line-2 bg-bg-2 border py-16"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => {
                    const isCustom = template.category === 'CUSTOM';
                    const isSelected = selectedTemplate?.id === template.id;

                    return (
                      <TemplateCardItem
                        key={template.id}
                        template={template}
                        isSelected={isSelected}
                        onSelect={setSelectedTemplate}
                        onEdit={isCustom ? setEditingTemplate : undefined}
                        onDelete={isCustom ? handleDelete : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="w-[360px] shrink-0">
              {selectedTemplate ? (
                <div className="rounded-4 border-line-2 bg-bg-2 sticky top-8 border p-5">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-text-1 text-lg font-semibold">
                          {selectedTemplate.name}
                        </h3>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            selectedTemplate.category === 'CUSTOM'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          )}
                        >
                          {selectedTemplate.category === 'CUSTOM' ? '커스텀' : '빌트인'}
                        </span>
                      </div>
                      {selectedTemplate.description && (
                        <p className="text-text-3 text-sm">{selectedTemplate.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.testType && (
                        <span className="bg-bg-3 text-text-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs">
                          <TestTube2 className="h-3 w-3" />
                          {getTestTypeLabel(selectedTemplate.testType)}
                        </span>
                      )}
                      {selectedTemplate.defaultTags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-bg-3 text-text-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="border-line-2 border-t" />

                    {selectedTemplate.preCondition && (
                      <div className="flex flex-col gap-1">
                        <h4 className="text-text-3 flex items-center gap-1 text-xs font-medium tracking-wider uppercase">
                          <ListChecks className="h-3.5 w-3.5" />
                          사전 조건
                        </h4>
                        <div className="bg-bg-3 rounded-4 p-3">
                          <p className="text-text-2 text-sm whitespace-pre-wrap">
                            {selectedTemplate.preCondition}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedTemplate.testSteps && (
                      <div className="flex flex-col gap-1">
                        <h4 className="text-text-3 flex items-center gap-1 text-xs font-medium tracking-wider uppercase">
                          <ListChecks className="h-3.5 w-3.5" />
                          테스트 단계
                        </h4>
                        <div className="bg-bg-3 rounded-4 p-3">
                          <p className="text-text-2 text-sm whitespace-pre-wrap">
                            {selectedTemplate.testSteps}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedTemplate.expectedResult && (
                      <div className="flex flex-col gap-1">
                        <h4 className="text-text-3 flex items-center gap-1 text-xs font-medium tracking-wider uppercase">
                          <ListChecks className="h-3.5 w-3.5" />
                          기대 결과
                        </h4>
                        <div className="bg-bg-3 rounded-4 p-3">
                          <p className="text-text-2 text-sm whitespace-pre-wrap">
                            {selectedTemplate.expectedResult}
                          </p>
                        </div>
                      </div>
                    )}

                    {!selectedTemplate.preCondition &&
                      !selectedTemplate.testSteps &&
                      !selectedTemplate.expectedResult && (
                        <p className="text-text-3 py-4 text-center text-sm">
                          기본 내용이 없습니다.
                        </p>
                      )}
                  </div>
                </div>
              ) : (
                <div className="rounded-4 border-line-2 bg-bg-2 sticky top-8 flex flex-col items-center justify-center gap-2 border py-16">
                  <Eye className="text-text-3 h-8 w-8" />
                  <p className="text-text-3 text-sm">템플릿을 선택하면 미리보기가 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainContainer>

      {isCreateOpen && projectId && (
        <TemplateCreateModal projectId={projectId} onClose={() => setIsCreateOpen(false)} />
      )}

      {editingTemplate && (
        <TemplateEditModal template={editingTemplate} onClose={() => setEditingTemplate(null)} />
      )}
    </>
  );
};

// ── Card sub-component ──

interface TemplateCardItemProps {
  template: TestCaseTemplate;
  isSelected: boolean;
  onSelect: (template: TestCaseTemplate) => void;
  onEdit?: (template: TestCaseTemplate) => void;
  onDelete?: (template: TestCaseTemplate) => void;
}

const TemplateCardItem = ({
  template,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: TemplateCardItemProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCustom = template.category === 'CUSTOM';

  return (
    <div
      className={cn(
        'bg-bg-2 rounded-4 hover:border-primary cursor-pointer border p-4 transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'border-line-2'
      )}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <LayoutTemplate className="text-text-3 h-4 w-4 shrink-0" />
            <h4 className="text-text-1 truncate font-medium">{template.name}</h4>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                isCustom
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              {isCustom ? '커스텀' : '빌트인'}
            </span>
          </div>
          <p className="text-text-3 ml-6 line-clamp-2 text-sm">
            {template.description || '설명 없음'}
          </p>
          <div className="text-text-3 mt-2 ml-6 flex items-center gap-3 text-xs">
            {template.testType && <span>{getTestTypeLabel(template.testType)}</span>}
            {isCustom && template.usageCount > 0 && <span>사용 {template.usageCount}회</span>}
            {template.defaultTags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {template.defaultTags.length}개 태그
              </span>
            )}
          </div>
        </div>

        {isCustom && (onEdit || onDelete) && (
          <div className="relative shrink-0">
            <DSButton
              variant="ghost"
              size="small"
              className="p-1"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </DSButton>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="rounded-4 border-line-2 bg-bg-2 shadow-4 absolute top-full right-0 z-20 mt-1 w-32 border py-1">
                  {onEdit && (
                    <button
                      className="text-text-1 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(template);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      수정
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="text-system-red hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(template);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
