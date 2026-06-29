'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import {
  CATEGORY_LABEL,
  CHALLENGES,
  DIFFICULTY_LABEL,
  TRACK_LABEL,
} from '@/shared/challenges/registry';
import { ArrowRight, Search } from 'lucide-react';

import { DashboardShell } from './dashboard-shell';

type ProblemRow = {
  slug: string;
  title: string;
  summary: string;
  difficulty: keyof typeof DIFFICULTY_LABEL;
  category: keyof typeof CATEGORY_LABEL;
  track: keyof typeof TRACK_LABEL;
  activityYear: string;
  status: '완료' | '실패';
  score: string;
  lastActivity: string;
};

const YEARS = ['전체', '2026', '2025', '2024'] as const;

const solvedChallenge = CHALLENGES.find((challenge) => challenge.slug === 'login-basic');
const rows: ProblemRow[] = solvedChallenge
  ? [
      {
        slug: solvedChallenge.slug,
        title: solvedChallenge.title,
        summary: solvedChallenge.summary,
        difficulty: solvedChallenge.difficulty,
        category: solvedChallenge.category,
        track: solvedChallenge.track,
        activityYear: '2026',
        status: '완료',
        score: '4/4',
        lastActivity: '오늘 10:12',
      },
    ]
  : [];

function statusClass(status: ProblemRow['status']) {
  if (status === '완료') return 'border-primary/40 bg-primary/10 text-primary';
  return 'border-red-400/40 bg-red-400/10 text-red-300';
}

export function PracticeDashboardView() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<(typeof YEARS)[number]>('전체');

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesYear = year === '전체' || row.activityYear === year;
      const matchesKeyword =
        keyword.length === 0 ||
        row.title.toLowerCase().includes(keyword) ||
        row.summary.toLowerCase().includes(keyword) ||
        TRACK_LABEL[row.track].toLowerCase().includes(keyword);

      return matchesYear && matchesKeyword;
    });
  }, [query, year]);

  return (
    <DashboardShell
      active="practice"
      nextPath="/dashboard/practice"
      eyebrow="문제 풀이"
      title="내 문제풀이"
      description="실제로 제출한 문제만 검색하고, 연도별 풀이 기록을 빠르게 훑어봅니다."
      actions={
        <Link
          href="/challenges"
          className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center gap-2 px-5 text-sm font-semibold text-white transition-colors"
        >
          전체 문제 보기
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      }
    >
      <section className="border-line-2 bg-bg-2 rounded-lg border p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
          <label className="border-line-2 bg-bg-1 focus-within:border-primary/60 flex h-11 items-center gap-3 rounded-md border px-3 transition-colors">
            <Search className="text-text-3" size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제출한 문제 검색"
              className="placeholder:text-text-3 text-text-1 h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>

          <label className="border-line-2 bg-bg-1 flex h-11 items-center justify-between gap-3 rounded-md border px-3">
            <span className="text-text-3 text-xs">연도</span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value as (typeof YEARS)[number])}
              className="text-text-1 h-full flex-1 bg-transparent text-right text-sm outline-none"
            >
              {YEARS.map((item) => (
                <option key={item} value={item} className="bg-bg-2 text-text-1">
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="text-text-3 mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>{filteredRows.length}개 풀이 기록</span>
          <span>제출 이력 저장 API 연동 전까지는 예시 기록 1건만 표시합니다.</span>
        </div>
      </section>

      <section className="border-line-2 bg-bg-2 mt-4 overflow-hidden rounded-lg border">
        <div className="border-line-2 text-text-3 hidden grid-cols-[88px_minmax(0,1.45fr)_96px_112px_104px_112px] border-b px-4 py-3 text-xs font-medium lg:grid">
          <span>상태</span>
          <span>문제</span>
          <span>난이도</span>
          <span>카테고리</span>
          <span>트랙</span>
          <span className="text-right">최근 활동</span>
        </div>

        <ul className="divide-line-2 divide-y">
          {filteredRows.map((row) => (
            <li key={row.slug}>
              <Link
                href={`/challenges/${row.slug}`}
                className="hover:bg-bg-3/45 grid gap-3 px-4 py-4 transition-colors lg:grid-cols-[88px_minmax(0,1.45fr)_96px_112px_104px_112px] lg:items-center"
              >
                <span
                  className={`w-fit rounded-full border px-2.5 py-1 text-xs ${statusClass(row.status)}`}
                >
                  {row.status}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.title}</span>
                  <span className="text-text-3 mt-1 line-clamp-1 block text-xs">{row.summary}</span>
                </span>

                <span className="text-sm">{DIFFICULTY_LABEL[row.difficulty]}</span>
                <span className="text-text-2 text-sm">{CATEGORY_LABEL[row.category]}</span>
                <span className="text-text-2 text-sm">{TRACK_LABEL[row.track]}</span>
                <span className="text-text-3 text-sm lg:text-right">{row.lastActivity}</span>
              </Link>
            </li>
          ))}
        </ul>

        {filteredRows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium">풀이 기록이 없습니다.</p>
            <p className="text-text-3 mt-2 text-xs">
              검색어를 줄이거나 연도 필터를 전체로 바꿔보세요.
            </p>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
