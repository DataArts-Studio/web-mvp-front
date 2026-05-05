import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, FileText, FolderOpen, Plus } from 'lucide-react';
import { DSButton } from '@testea/ui';
import { DashboardEmptyState } from './dashboard-empty-state';
import { formatDateKR } from '@testea/util';
import type { TestCaseListItem } from '@/entities/test-case';

type TestSuite = {
  id: string;
  name: string;
  description: string | null;
  case_count: number;
};

type TestCasesSectionProps = {
  slug: string;
  testCases: TestCaseListItem[];
  totalCount: number;
  onCreateCase: () => void;
};

export const TestCasesSection = ({ slug, testCases, totalCount, onCreateCase }: TestCasesSectionProps) => (
  <>
    <div className="flex items-center justify-between">
      <Link href={`/projects/${slug}/cases`} className="flex items-center gap-2 group">
        <h2 className="typo-h2-heading text-text-1">테스트 케이스</h2>
        <span className="typo-body2-normal text-text-3">({totalCount})</span>
        <ChevronRight className="text-text-3 group-hover:text-text-1 h-5 w-5 transition-colors" />
      </Link>
      {totalCount > 0 && (
        <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={onCreateCase}>
          <Plus className="h-4 w-4" />
          <span>추가</span>
        </DSButton>
      )}
    </div>

    {totalCount === 0 ? (
      <DashboardEmptyState
        icon={null}
        image={
          <Image
            src="/teacup/tea-cup-not-found.svg"
            width={200}
            height={255}
            alt="테스트 케이스 없음"
            loading="lazy"
            priority={false}
          />
        }
        title="테스트 케이스를 생성해보세요!"
        description={<>아직 생성된 테스트 케이스가 없습니다.<br />테스트 케이스를 만들면 여기에서 빠르게 확인할 수 있어요.</>}
        buttonLabel="테스트 케이스 만들기"
        onAction={onCreateCase}
      />
    ) : (
      <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
        {testCases.slice(0, 5).map((tc) => (
          <Link key={tc.id} href={`/projects/${slug}/cases`} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-3 transition-colors">
            <div className="bg-primary/10 text-primary rounded-2 flex h-10 w-10 items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="typo-caption text-text-3">{tc.caseKey}</span>
              <span className="typo-body2-heading text-text-1 truncate">{tc.title}</span>
            </div>
            <span className="typo-caption text-text-3 shrink-0">{formatDateKR(tc.createdAt)}</span>
          </Link>
        ))}
        {totalCount > 5 && (
          <Link href={`/projects/${slug}/cases`} className="flex items-center justify-center gap-2 px-5 py-3 text-primary hover:bg-bg-3 transition-colors">
            <span className="typo-body2-heading">전체 보기 ({totalCount}개)</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    )}
  </>
);

type TestSuitesSectionProps = {
  slug: string;
  testSuites: TestSuite[];
  onCreateSuite: () => void;
};

export const TestSuitesSection = ({ slug, testSuites, onCreateSuite }: TestSuitesSectionProps) => (
  <>
    <div className="flex items-center justify-between">
      <Link href={`/projects/${slug}/suites`} className="flex items-center gap-2 group">
        <h2 className="typo-h2-heading text-text-1">테스트 스위트</h2>
        <span className="typo-body2-normal text-text-3">({testSuites.length})</span>
        <ChevronRight className="text-text-3 group-hover:text-text-1 h-5 w-5 transition-colors" />
      </Link>
      {testSuites.length > 0 && (
        <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={onCreateSuite}>
          <Plus className="h-4 w-4" />
          <span>추가</span>
        </DSButton>
      )}
    </div>

    {testSuites.length === 0 ? (
      <DashboardEmptyState
        icon={<FolderOpen className="h-6 w-6" strokeWidth={1.5} />}
        title="테스트 스위트를 생성해보세요!"
        description={<>아직 생성된 테스트 스위트가 없습니다.<br />테스트 스위트로, 테스트 케이스를 더 쉽게 관리해보세요!</>}
        buttonLabel="테스트 스위트 만들기"
        onAction={onCreateSuite}
      />
    ) : (
      <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
        {testSuites.slice(0, 5).map((suite) => (
          <Link key={suite.id} href={`/projects/${slug}/suites/${suite.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-3 transition-colors">
            <div className="bg-system-blue/10 text-system-blue rounded-2 flex h-10 w-10 items-center justify-center shrink-0">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="typo-body2-heading text-text-1 truncate">{suite.name}</span>
              <span className="typo-caption text-text-3">{suite.description || '설명 없음'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="typo-caption text-text-3 bg-bg-3 px-2 py-1 rounded-1">케이스 {suite.case_count}개</span>
            </div>
          </Link>
        ))}
        {testSuites.length > 5 && (
          <Link href={`/projects/${slug}/suites`} className="flex items-center justify-center gap-2 px-5 py-3 text-primary hover:bg-bg-3 transition-colors">
            <span className="typo-body2-heading">전체 보기 ({testSuites.length}개)</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    )}
  </>
);
