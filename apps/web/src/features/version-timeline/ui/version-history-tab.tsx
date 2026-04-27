'use client';

import React, { useState } from 'react';
import { VersionTimeline } from './version-timeline';
import { VersionDetailPanel } from '@/features/version-detail/ui/version-detail-panel';
import { VersionCompareView } from '@/features/version-compare/ui/version-compare-view';
import { DSButton } from '@/shared/ui';
import { ArrowLeft } from 'lucide-react';

type Mode = 'timeline' | 'detail' | 'compare';

interface VersionHistoryTabProps {
  testCaseId: string;
}

export const VersionHistoryTab = ({ testCaseId }: VersionHistoryTabProps) => {
  const [mode, setMode] = useState<Mode>('timeline');
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [compareOldVersion, setCompareOldVersion] = useState<number>(0);
  const [compareNewVersion, setCompareNewVersion] = useState<number>(0);

  const handleViewDetail = (versionNumber: number) => {
    setSelectedVersion(versionNumber);
    setMode('detail');
  };

  const handleCompare = (versionNumber: number) => {
    setCompareOldVersion(versionNumber - 1);
    setCompareNewVersion(versionNumber);
    setMode('compare');
  };

  const handleCompareFromDetail = (oldV: number, newV: number) => {
    setCompareOldVersion(oldV);
    setCompareNewVersion(newV);
    setMode('compare');
  };

  const handleBack = () => {
    setMode('timeline');
  };

  return (
    <div className="col-span-6">
      {mode !== 'timeline' && (
        <DSButton
          variant="ghost"
          size="small"
          className="mb-4 flex items-center gap-1 text-sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          타임라인으로 돌아가기
        </DSButton>
      )}

      {mode === 'timeline' && (
        <VersionTimeline
          testCaseId={testCaseId}
          onViewDetail={handleViewDetail}
          onCompare={handleCompare}
        />
      )}

      {mode === 'detail' && (
        <VersionDetailPanel
          testCaseId={testCaseId}
          versionNumber={selectedVersion}
          onCompare={handleCompareFromDetail}
          onBack={handleBack}
        />
      )}

      {mode === 'compare' && (
        <VersionCompareView
          testCaseId={testCaseId}
          initialOldVersion={compareOldVersion}
          initialNewVersion={compareNewVersion}
        />
      )}
    </div>
  );
};
