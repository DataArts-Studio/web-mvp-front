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
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  suffix?: string;
  isEmpty?: boolean;
};

const KPICard = ({ label, value, icon, variant = 'default', suffix, isEmpty }: KPICardProps) => {
  const variantStyles = {
    default: 'text-text-1',
    success: 'text-primary',
    danger: 'text-system-red',
    warning: 'text-[#F5A623]',
    muted: 'text-text-3',
  };

  const iconBgStyles = {
    default: 'bg-bg-3 text-text-3',
    success: 'bg-primary/10 text-primary',
    danger: 'bg-system-red/10 text-system-red',
    warning: 'bg-[#F5A623]/10 text-[#F5A623]',
    muted: 'bg-bg-3 text-text-3',
  };

  return (
    <div className={`rounded-3 border-line-2 bg-bg-2 border p-4 flex flex-col gap-3 ${isEmpty ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="typo-caption text-text-3">{label}</span>
        <div className={`rounded-2 p-2 ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`typo-h1-heading ${variantStyles[variant]}`}>
          {value}
        </span>
        {suffix && (
          <span className="typo-body2-normal text-text-3">{suffix}</span>
        )}
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
    <div className="grid grid-cols-5 gap-4">
      {/* Total Cases */}
      <KPICard
        label="Total Cases"
        value={data.totalCases}
        icon={<FileText className="h-4 w-4" />}
        variant={hasData ? 'default' : 'muted'}
        isEmpty={!hasData}
      />

      {/* Test Suites */}
      <KPICard
        label="Test Suites"
        value={data.testSuites}
        icon={<FolderOpen className="h-4 w-4" />}
        variant={data.testSuites > 0 ? 'default' : 'muted'}
        isEmpty={data.testSuites === 0}
      />

      {/* Pass Rate */}
      <KPICard
        label="Pass Rate"
        value={passRate !== null ? passRate : '-'}
        suffix={passRate !== null ? '%' : undefined}
        icon={<CheckCircle className="h-4 w-4" />}
        variant={getPassRateVariant()}
        isEmpty={passRate === null}
      />

      {/* Critical (Fail + Blocked) */}
      <KPICard
        label="Critical"
        value={critical}
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={!hasData ? 'muted' : critical > 0 ? 'danger' : 'success'}
        isEmpty={!hasData}
      />

      {/* Untested */}
      <KPICard
        label="Untested"
        value={data.untested}
        icon={<Clock className="h-4 w-4" />}
        variant={!hasData ? 'muted' : data.untested > 0 ? 'warning' : 'success'}
        isEmpty={!hasData}
      />
    </div>
  );
};
