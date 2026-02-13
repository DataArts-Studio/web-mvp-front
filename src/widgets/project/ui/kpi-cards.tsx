'use client';

import React from 'react';
import { FileText, FolderOpen, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export type KPIData = {
  totalCases: number;
  testSuites: number;
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
};

type KPICardsProps = {
  data: KPIData;
};

type KPICardProps = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  decorativeIcon: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  suffix?: string;
  isEmpty?: boolean;
  isHighlighted?: boolean;
};

const KPICard = ({
  label,
  value,
  decorativeIcon,
  variant = 'default',
  suffix,
  isEmpty,
  isHighlighted,
}: KPICardProps) => {
  const variantStyles = {
    default: 'text-text-1',
    success: 'text-primary',
    danger: 'text-system-red',
    warning: 'text-[#F5A623]',
    muted: 'text-text-3',
  };

  const bgClass = isHighlighted
    ? 'bg-gradient-to-b from-[#007351] to-[rgba(0,115,81,0.2)]'
    : 'bg-bg-2';

  const labelClass = isHighlighted ? 'text-white/70' : 'text-text-3';
  const valueClass = isHighlighted ? 'text-white' : variantStyles[variant];

  return (
    <div
      className={`relative h-[205px] overflow-hidden rounded-3 p-5 flex flex-col flex-1 ${bgClass} ${isEmpty ? 'opacity-60' : ''}`}
    >
      <span className={`typo-caption-normal ${labelClass}`}>{label}</span>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`typo-title-heading ${valueClass}`}>{value}</span>
        {suffix && (
          <span className={`typo-title-heading ${isHighlighted ? 'text-white/70' : 'text-text-3'}`}>
            {suffix}
          </span>
        )}
      </div>
      <div
        className={`absolute bottom-[-20px] left-[-10px] ${isHighlighted ? 'text-white/[0.15]' : 'text-text-1/[0.07]'}`}
      >
        {decorativeIcon}
      </div>
    </div>
  );
};

export const KPICards = ({ data }: KPICardsProps) => {
  const total = data.totalCases;
  const hasData = total > 0;

  // Pass Rate 계산: (Pass / (Pass + Fail + Blocked)) * 100
  // 완료된 테스트가 없으면 N/A 표시
  const completed = data.pass + data.fail + data.blocked;
  const passRate = completed > 0 ? Math.round((data.pass / completed) * 100) : null;

  // Critical: Fail + Blocked
  const critical = data.fail + data.blocked;

  // Pass Rate variant 계산
  const getPassRateVariant = (): 'success' | 'warning' | 'danger' | 'muted' => {
    if (passRate === null) return 'muted';
    if (passRate >= 80) return 'success';
    if (passRate >= 50) return 'warning';
    return 'danger';
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="typo-body2-normal text-text-3">
        전체 <strong className="text-text-1">{total}건</strong>의 테스트 케이스가 있어요.
      </p>
      <div className="flex gap-2">
        {/* Total Cases */}
        <KPICard
          label="Total Cases"
          value={data.totalCases}
          icon={<FileText className="h-4 w-4" />}
          decorativeIcon={<FileText className="h-[135px] w-[135px]" strokeWidth={1} />}
          variant={hasData ? 'default' : 'muted'}
          isEmpty={!hasData}
          isHighlighted
        />

        {/* Test Suites */}
        <KPICard
          label="Test Suites"
          value={data.testSuites}
          icon={<FolderOpen className="h-4 w-4" />}
          decorativeIcon={<FolderOpen className="h-[140px] w-[140px]" strokeWidth={1} />}
          variant={data.testSuites > 0 ? 'default' : 'muted'}
          isEmpty={data.testSuites === 0}
        />

        {/* Pass Rate */}
        <KPICard
          label="Pass Rate"
          value={passRate !== null ? passRate : '-'}
          suffix={passRate !== null ? '%' : undefined}
          icon={<CheckCircle className="h-4 w-4" />}
          decorativeIcon={<CheckCircle className="h-[145px] w-[145px]" strokeWidth={1} />}
          variant={getPassRateVariant()}
          isEmpty={passRate === null}
        />

        {/* Critical (Fail + Blocked) */}
        <KPICard
          label="Critical"
          value={critical}
          icon={<AlertTriangle className="h-4 w-4" />}
          decorativeIcon={<AlertTriangle className="h-[150px] w-[150px]" strokeWidth={1} />}
          variant={!hasData ? 'muted' : critical > 0 ? 'danger' : 'success'}
          isEmpty={!hasData}
        />

        {/* Untested */}
        <KPICard
          label="Untested"
          value={data.untested}
          icon={<Clock className="h-4 w-4" />}
          decorativeIcon={<Clock className="h-[160px] w-[160px]" strokeWidth={1} />}
          variant={!hasData ? 'muted' : data.untested > 0 ? 'warning' : 'success'}
          isEmpty={!hasData}
        />
      </div>
    </div>
  );
};
