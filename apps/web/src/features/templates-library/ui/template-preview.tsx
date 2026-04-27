'use client';
import React from 'react';

import type { TestCaseTemplate } from '@/entities/test-case-template';
import { getTestTypeLabel } from '@/entities/test-case';
import { DSButton } from '@/shared';
import { ListChecks, Tag, TestTube2 } from 'lucide-react';

interface TemplatePreviewProps {
  template: TestCaseTemplate;
  onApply: (template: TestCaseTemplate) => void;
}

export const TemplatePreview = ({ template, onApply }: TemplatePreviewProps) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-text-1 typo-h2-heading">{template.name}</h3>
        <DSButton variant="solid" size="small" onClick={() => onApply(template)}>
          이 템플릿으로 시작
        </DSButton>
      </div>

      {template.description && (
        <p className="text-text-3 text-sm">{template.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {template.testType && (
          <span className="flex items-center gap-1 rounded-full bg-bg-3 px-2.5 py-1 text-xs text-text-2">
            <TestTube2 className="h-3 w-3" />
            {getTestTypeLabel(template.testType)}
          </span>
        )}
        {template.defaultTags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-bg-3 px-2.5 py-1 text-xs text-text-2">
            <Tag className="h-3 w-3" />
            {tag}
          </span>
        ))}
      </div>

      <div className="border-t border-line-2" />

      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {template.preCondition && (
          <div className="flex flex-col gap-1">
            <h4 className="flex items-center gap-1 text-text-3 text-sm font-medium">
              <ListChecks className="h-3.5 w-3.5" />
              사전 조건
            </h4>
            <div className="bg-bg-3 rounded-4 p-3">
              <p className="text-sm whitespace-pre-wrap">{template.preCondition}</p>
            </div>
          </div>
        )}

        {template.testSteps && (
          <div className="flex flex-col gap-1">
            <h4 className="flex items-center gap-1 text-text-3 text-sm font-medium">
              <ListChecks className="h-3.5 w-3.5" />
              테스트 단계
            </h4>
            <div className="bg-bg-3 rounded-4 p-3">
              <p className="text-sm whitespace-pre-wrap">{template.testSteps}</p>
            </div>
          </div>
        )}

        {template.expectedResult && (
          <div className="flex flex-col gap-1">
            <h4 className="flex items-center gap-1 text-text-3 text-sm font-medium">
              <ListChecks className="h-3.5 w-3.5" />
              기대 결과
            </h4>
            <div className="bg-bg-3 rounded-4 p-3">
              <p className="text-sm whitespace-pre-wrap">{template.expectedResult}</p>
            </div>
          </div>
        )}

        {!template.preCondition && !template.testSteps && !template.expectedResult && (
          <p className="text-text-3 text-sm text-center py-4">기본 내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
};
