'use client'
import React from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { MilestoneWithStats } from '@/entities/milestone';
import { DSButton } from '@/shared';
import { Calendar, CheckCircle, Edit2, ExternalLink, ListChecks, PlayCircle, Trash2, X } from 'lucide-react';
import { cn } from '@/shared';

interface MilestoneSideViewProps {
  milestone: MilestoneWithStats;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  inProgress: {
    label: '진행 중',
    style: 'bg-amber-500/20 text-amber-300',
  },
  done: {
    label: '완료',
    style: 'bg-green-500/20 text-green-300',
  },
  planned: {
    label: '예정',
    style: 'bg-slate-500/20 text-slate-300',
  },
};

const formatDate = (date: Date | null) => {
  if (!date) return '-';
  return date.toISOString().split('T')[0];
};

export const MilestoneSideView = ({
  milestone,
  onClose,
  onEdit,
  onDelete,
}: MilestoneSideViewProps) => {
  const params = useParams();
  const statusInfo = STATUS_CONFIG[milestone.progressStatus] || {
    label: milestone.progressStatus,
    style: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <>
    {/* 배경 오버레이 - 클릭 시 사이드뷰 닫힘 */}
    <div
      className="fixed inset-0 z-40 bg-black/50"
      onClick={onClose}
      aria-hidden="true"
    />
    <section className="bg-bg-1 border-bg-4 fixed top-0 right-0 z-50 h-full w-[600px] translate-x-0 overflow-y-auto border-l p-4 transition-transform duration-300 ease-in-out">
      <div className="flex flex-col gap-6">
        {/* 헤더 */}
        <header className="flex flex-col gap-3">
          <div className="flex justify-between">
            <DSButton size="small" variant="ghost" className="px-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </DSButton>
            <DSButton size="small" variant="ghost" className="flex items-center gap-1 px-2" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
              <span>수정</span>
            </DSButton>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{milestone.title}</h2>
            <span className={cn('rounded-full px-3 py-1 text-sm font-medium', statusInfo.style)}>
              {statusInfo.label}
            </span>
          </div>

          <div className="text-text-3 flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
            <span>
              {formatDate(milestone.startDate)} ~ {formatDate(milestone.endDate)}
            </span>
          </div>
        </header>

        {/* 설명 */}
        <div className="flex flex-col gap-2">
          <h3 className="text-text-3 text-lg font-semibold">설명</h3>
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2">{milestone.description || '설명이 없습니다.'}</p>
          </div>
        </div>

        {/* 진행률 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-text-3 text-lg font-semibold">진행률</h3>
            <span className="text-primary text-xl font-bold">{milestone.progressRate}%</span>
          </div>
          <div className="bg-bg-3 h-2 w-full rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${milestone.progressRate}%` }}
            />
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-xl font-bold">{milestone.totalCases}개</span>
          </div>

          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>완료</span>
            </div>
            <span className="text-green-400 text-xl font-bold">{milestone.completedCases}개</span>
          </div>

          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>실행 횟수</span>
            </div>
            <span className="text-text-1 text-xl font-bold">{milestone.runCount}회</span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-auto flex justify-between border-t border-line-2 pt-4">
          <DSButton variant="ghost" className="flex items-center gap-2 text-red-400" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            삭제
          </DSButton>
          <Link href={`/projects/${params.slug}/milestones/${milestone.id}`}>
            <DSButton variant="solid" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              상세 보기
            </DSButton>
          </Link>
        </div>
      </div>
    </section>
    </>
  );
};
