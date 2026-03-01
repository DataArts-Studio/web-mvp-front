'use client';
import React, { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { TestCase, parseSteps } from '@/entities/test-case';
import type { TestCaseListItem } from '@/entities/test-case/model/types';
import { testCaseByIdQueryOptions } from '@/features/cases-list';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { TestCaseEditForm } from '@/features/cases-edit';
// import { SaveAsTemplateModal } from '@/features/templates-save-from-case'; // 템플릿 기능 펜딩
import { testSuitesQueryOptions } from '@/widgets';
import { DSButton } from '@/shared';
import { formatDateKR, formatRelativeTime } from '@/shared/utils/date-format';
import { useVersionsList } from '@/features/version-timeline';
import { Calendar, Clock, Copy, Edit2, Flag, FolderOpen, History, Maximize2, Play, Tag, X } from 'lucide-react';













interface TestCaseSideViewProps {
  testCase?: TestCaseListItem;
  onClose: () => void;
}

export const TestCaseSideView = ({ testCase: listItem, onClose }: TestCaseSideViewProps) => {
  // 목록 데이터에서 빠진 상세 필드(steps, preCondition, expectedResult)를 별도 조회
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    ...testCaseByIdQueryOptions(listItem?.id ?? ''),
    enabled: !!listItem?.id,
  });
  const testCase = detailData?.success
    ? detailData.data
    : listItem
      ? { ...listItem, preCondition: '', testSteps: '', expectedResult: '' } as TestCase
      : undefined;
  // 상세 데이터 로딩 중인지 여부 (fallback 빈 데이터와 실제 빈 데이터를 구분)
  const isStepsLoading = !!listItem?.id && isDetailLoading;
  const router = useRouter();
  const params = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);
  // const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false); // 템플릿 기능 펜딩

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(testCase?.projectId || ''),
    enabled: !!testCase?.projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];
  const currentSuite = suites.find(s => s.id === testCase?.testSuiteId);

  const { data: versionsData } = useVersionsList(testCase?.id || '');
  const versions = versionsData?.success ? versionsData.data.versions : [];
  const latestVersion = versions[0];
  const versionCount = versionsData?.success ? versionsData.data.total : 0;

  const handleRunTest = () => {
    router.push(`/projects/${params.slug}/runs/create`);
  };

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
  };

  return (
    <>
    {/* 배경 오버레이 - 클릭 시 사이드뷰 닫힘 */}
    <motion.div
      className="fixed inset-0 z-40 bg-black/50"
      onClick={onClose}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
    <motion.section
      className="bg-bg-1 border-bg-4 fixed top-0 right-0 z-50 h-full w-[600px] overflow-y-auto border-l p-4"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between">
            <DSButton size="small" variant="ghost" className="px-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </DSButton>
            <div className="flex gap-1">
              <DSButton
                size="small"
                variant="ghost"
                className="px-2"
                onClick={() => {
                  if (testCase) {
                    router.push(`/projects/${params.slug}/cases/${testCase.id}`);
                  }
                }}
                disabled={!testCase}
                title="상세 페이지로 이동"
              >
                <Maximize2 className="h-4 w-4" />
              </DSButton>
              <DSButton size="small" variant="ghost" className="flex items-center gap-1 px-2" onClick={handleEdit} disabled={!testCase || isStepsLoading}>
                <Edit2 className="h-4 w-4" />
                <span>수정</span>
              </DSButton>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl font-semibold">{testCase?.caseKey || 'TC-0000'}</span>
            <span className="flex items-center gap-1">
              <Flag className="h-4 w-4" />
              {testCase?.testType || '-'}
            </span>
          </div>
          <h2 className="text-xl">{testCase?.title || '테스트 케이스'}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <div className="text-text-3 flex items-center gap-1 text-sm">
              <FolderOpen className="h-4 w-4" />
              <span>{currentSuite?.title || '스위트 없음'}</span>
            </div>
            <div className="text-text-3 flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatDateKR(testCase?.createdAt)}</span>
            </div>
            {latestVersion && (
              <div className="text-text-3 flex items-center gap-1 text-sm">
                <History className="h-4 w-4" />
                <span>최근 수정: {formatRelativeTime(latestVersion.createdAt)}</span>
                {versionCount > 0 && (
                  <span className="bg-primary/10 text-primary ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium">
                    v{latestVersion.versionNumber}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>
        {/* 태그 */}
        <div className="flex flex-wrap gap-2">
          <h3 className="text-text-3 flex items-center gap-1">
            <Tag className="h-4 w-4" />
            Tags
          </h3>
          {testCase?.tags && testCase.tags.length > 0 ? (
            testCase.tags.map((tag, index) => (
              <span key={index} className="bg-bg-3 rounded-2 px-2 py-1 text-sm">{tag}</span>
            ))
          ) : (
            <span className="text-text-3 text-sm">태그 없음</span>
          )}
        </div>
        {/* 사이드뷰 본문 */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">전제 조건</h3>
            <SideStepsList steps={testCase?.preCondition} emptyText="전제 조건이 없습니다." isLoading={isStepsLoading} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">테스트 단계</h3>
            <SideStepsList steps={testCase?.testSteps} emptyText="테스트 단계가 없습니다." isLoading={isStepsLoading} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">예상 결과</h3>
            <SideStepsList steps={testCase?.expectedResult} emptyText="예상 결과가 없습니다." isLoading={isStepsLoading} />
          </div>
        </div>
        {/* 테스트 정보 */}
        <div className="flex gap-2">
          <div className="bg-bg-2 border-line-2 rounded-4 flex-1 border p-4">
            <h3 className="text-text-3 mb-1">테스트 유형</h3>
            <p>{testCase?.testType || '-'}</p>
          </div>
          <div className="bg-bg-2 border-line-2 rounded-4 flex-1 border p-4">
            <h3 className="text-text-3 mb-1">예상 소요 시간</h3>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>-</span>
            </div>
          </div>
        </div>
        {/* 테스트 실행 */}
        <div className="flex gap-2">
          <DSButton className="flex flex-1 items-center gap-2" onClick={handleRunTest}>
            <Play className="h-4 w-4" />
            테스트 실행
          </DSButton>
          <DSButton variant="ghost" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </DSButton>
          {/* 템플릿 기능 펜딩 */}
          {testCase && <ArchiveButton targetType='case' targetId={testCase.id} btnType='icon' onSuccess={onClose}/>}
        </div>
      </div>
    </motion.section>
    {isEditOpen && detailData?.success && (
      <TestCaseEditForm
        testCase={detailData.data}
        onClose={handleEditClose}
        onSuccess={handleEditClose}
      />
    )}
    {/* 템플릿 기능 펜딩 */}
    </>
  );
};

function SideStepsList({ steps, emptyText = '항목이 없습니다.', isLoading = false }: { steps?: string; emptyText?: string; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
        <div className="flex flex-col gap-2">
          <div className="bg-bg-3 h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-bg-3 h-4 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!steps?.trim()) {
    return (
      <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
        <p className="whitespace-pre-wrap">{emptyText}</p>
      </div>
    );
  }

  const parsed = parseSteps(steps);
  const hasContent = parsed.some((s) => s.trim());

  if (!hasContent) {
    return (
      <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
        <p className="whitespace-pre-wrap">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-2 border-line-2 rounded-4 overflow-hidden border">
      <ol className="divide-y divide-line-2">
        {parsed.map((step, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {i + 1}
            </span>
            <p className="text-sm text-text-1 whitespace-pre-wrap">{step || '-'}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
