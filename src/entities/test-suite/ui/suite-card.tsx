import React, { useMemo } from 'react';

import { TestSuiteCard } from '@/entities/test-suite';
import { AlertCircle, FileText, FolderTree, Layers, PlayCircle } from 'lucide-react';

import { Edit } from 'lucide-react';
import { DSButton } from '@/shared';
import { formatDate } from '@/shared/utils/date-format';

interface SuiteCardProps {
  suite: TestSuiteCard;
  onEdit: () => void;
}

const tagToneText = (tone: TestSuiteCard['tag']['tone']) => {
  switch (tone) {
    case 'info':
      return '정보';
    case 'success':
      return '성공';
    case 'warning':
      return '경고';
    case 'danger':
      return '위험';
    default:
      return '기본';
  }
};

export const SuiteCard = ({ suite, onEdit }: SuiteCardProps) => {
  const titleId = React.useId();
  const descId = React.useId();

  const primaryPath = suite.includedPaths?.[0] ?? '-';
  const milestoneText = suite.linkedMilestone
    ? `${suite.linkedMilestone.versionLabel} ${suite.linkedMilestone.title}`
    : '없음';

  const lastRunDateText = suite.lastRun ? formatDate(suite.lastRun.runAt) : '없음';

  const failed = suite.lastRun?.counts.failed ?? 0;
  const blocked = suite.lastRun?.counts.blocked ?? 0;

  const hasIssue = failed > 0 || blocked > 0;
  const issueText = suite.lastRun
    ? hasIssue
      ? `실패 ${failed}개 · Blocked ${blocked}개`
      : '이슈 없음'
    : '최근 실행 없음';

  const issueIconClass = suite.lastRun
    ? hasIssue
      ? 'text-system-red'
      : 'text-system-green'
    : 'text-text-3';

  const tagToneClass = (() => {
    switch (suite.tag.tone) {
      case 'info':
      case 'success':
      case 'warning':
      case 'danger':
      default:
        return 'bg-bg-3 text-text-2';
    }
  })();

  const descriptionText = suite.description ?? '설명 없음';

  const srSummary = useMemo(() => {
    return [
      `테스트 스위트 ${suite.title}`,
      `태그 ${suite.tag.label}`,
      `태그 중요도 ${tagToneText}`,
      `포함 경로 ${primaryPath}`,
      `테스트 케이스 ${suite.caseCount}개`,
      `마일스톤 ${milestoneText}`,
      `최근 실행 ${lastRunDateText}`,
      `최근 실행 결과 ${issueText}`,
      `실행 히스토리 ${suite.executionHistoryCount}회`,
    ].join('. ');
  }, [
    suite.title,
    suite.tag.label,
    tagToneText,
    primaryPath,
    suite.caseCount,
    milestoneText,
    lastRunDateText,
    issueText,
    suite.executionHistoryCount,
  ]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit();
  };

  return (
    <div
      className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <p className="sr-only">{srSummary}</p>
      <div className="flex w-full flex-col gap-2 md:w-[40%]">
        <div className="flex items-center gap-3">
          <h2 id={titleId} className="typo-h2-heading">
            {suite.title}
          </h2>
          <span
            className={`typo-label-heading rounded-full px-3 py-1 ${tagToneClass}`}
            aria-label={`태그 ${suite.tag.label}. 중요도 ${tagToneText(suite.tag.tone)}`}
          >
            {suite.tag.label}
          </span>
          <DSButton variant="ghost" size="icon" onClick={handleEditClick}>
            <Edit className="h-4 w-4" />
          </DSButton>
        </div>
        <p id={descId} className="typo-body2-normal text-text-2">
          {descriptionText}
        </p>
      </div>
      <dl className="text-label-normal text-text-3 flex w-full flex-col gap-2 md:w-[30%]">
        <div className="flex items-center gap-1.5">
          <FolderTree aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">포함 경로</dt>
          <dd>포함 경로: {primaryPath}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">테스트 케이스</dt>
          <dd>테스트 케이스 {suite.caseCount}개</dd>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">연결된 마일스톤</dt>
          <dd>연결된 마일스톤: {milestoneText}</dd>
        </div>
      </dl>
      <dl className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
        <div className="flex items-center gap-1.5 md:justify-end">
          <PlayCircle aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">최근 실행 날짜</dt>
          <dd>최근 실행: {lastRunDateText}</dd>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <AlertCircle
            className={`${issueIconClass} h-4 w-4`}
            strokeWidth={1.5}
            aria-label={
              suite.lastRun
                ? hasIssue
                  ? '실패 또는 블록 이슈 존재'
                  : '이슈 없음'
                : '최근 실행 없음'
            }
          />
          <dt className="sr-only">최근 실행 결과</dt>
          <dd>{issueText}</dd>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <FileText aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">실행 히스토리</dt>
          <dd>실행 히스토리 {suite.executionHistoryCount}회</dd>
        </div>
      </dl>
    </div>
  );
};
