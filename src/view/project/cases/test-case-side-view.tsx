'use client';
import React, { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { TestCase } from '@/entities/test-case';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { TestCaseEditForm } from '@/features/cases-edit';
import { testSuitesQueryOptions } from '@/widgets';
import { DSButton } from '@/shared';
import { formatDateKR } from '@/shared/utils/date-format';
import { Calendar, Clock, Copy, Edit2, Flag, FolderOpen, Maximize2, Play, Tag, X } from 'lucide-react';













interface TestCaseSideViewProps {
  testCase?: TestCase;
  onClose: () => void;
}

export const TestCaseSideView = ({ testCase, onClose }: TestCaseSideViewProps) => {
  const router = useRouter();
  const params = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(testCase?.projectId || ''),
    enabled: !!testCase?.projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];
  const currentSuite = suites.find(s => s.id === testCase?.testSuiteId);

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
              <DSButton size="small" variant="ghost" className="flex items-center gap-1 px-2" onClick={handleEdit} disabled={!testCase}>
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
          <div className="flex gap-2">
            <div className="text-text-3 flex items-center gap-1 text-sm">
              <FolderOpen className="h-4 w-4" />
              <span>{currentSuite?.title || '스위트 없음'}</span>
            </div>
            <div className="text-text-3 flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatDateKR(testCase?.createdAt)}</span>
            </div>
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
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <p className="whitespace-pre-wrap">{testCase?.preCondition || '전제 조건이 없습니다.'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">테스트 단계</h3>
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <p className="whitespace-pre-wrap">{testCase?.testSteps || '테스트 단계가 없습니다.'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">예상 결과</h3>
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <p className="whitespace-pre-wrap">{testCase?.expectedResult || '예상 결과가 없습니다.'}</p>
            </div>
          </div>
        </div>
        {/* 테스트 정보 */}
        <div className="flex gap-2">
          <div className="bg-bg-2 border-line-2 rounded-4 flex-1 border p-4">
            <h3 className="text-text-3 mb-1">테스트 상태</h3>
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
          {testCase && <ArchiveButton targetType='case' targetId={testCase.id} btnType='icon' onSuccess={onClose}/>}
        </div>
      </div>
    </motion.section>
    {isEditOpen && testCase && (
      <TestCaseEditForm
        testCase={testCase}
        onClose={handleEditClose}
        onSuccess={handleEditClose}
      />
    )}
    </>
  );
};
