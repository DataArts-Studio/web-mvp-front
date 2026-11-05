import React from 'react';

import { type TestCaseRunDetail } from '@/features/runs';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  PlayCircle,
  XCircle,
} from 'lucide-react';

export type StatusFilter = 'all' | 'untested' | 'pass' | 'fail' | 'blocked';
export type TestCaseRunStatus = 'untested' | 'pass' | 'fail' | 'blocked';

export interface GroupedCases {
  groupKey: string;
  suiteId: string | null;
  suiteName: string;
  cases: TestCaseRunDetail[];
}

export const STATUS_CONFIG: Record<
  TestCaseRunStatus,
  {
    label: string;
    style: string;
    bgStyle: string;
    icon: React.ReactNode;
    shortcut: string;
  }
> = {
  untested: {
    label: 'Untested',
    style: 'text-slate-400',
    bgStyle: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30',
    icon: React.createElement(Circle, { className: 'h-4 w-4' }),
    shortcut: 'U',
  },
  pass: {
    label: 'Pass',
    style: 'text-green-400',
    bgStyle: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
    icon: React.createElement(CheckCircle2, { className: 'h-4 w-4' }),
    shortcut: 'P',
  },
  fail: {
    label: 'Fail',
    style: 'text-red-400',
    bgStyle: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
    icon: React.createElement(XCircle, { className: 'h-4 w-4' }),
    shortcut: 'F',
  },
  blocked: {
    label: 'Blocked',
    style: 'text-amber-400',
    bgStyle: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    icon: React.createElement(AlertTriangle, { className: 'h-4 w-4' }),
    shortcut: 'B',
  },
};

/** 리뉴얼 v2 결과 표기. 칩·아이콘 대신 색 글자와 행 배경으로 보여 준다. */
export const RESULT_META: Record<
  TestCaseRunStatus,
  { label: string; text: string; rowBg: string; active: string; shortcut: string }
> = {
  pass: {
    label: '통과',
    text: 'text-result-pass',
    rowBg: 'bg-result-pass/[0.06]',
    active: 'border-result-pass/80 bg-result-pass/10 text-result-pass font-bold',
    shortcut: 'P',
  },
  fail: {
    label: '실패',
    text: 'text-result-fail',
    rowBg: 'bg-result-fail/[0.09]',
    active: 'border-result-fail/80 bg-result-fail/10 text-result-fail font-bold',
    shortcut: 'F',
  },
  blocked: {
    label: '차단',
    text: 'text-result-blocked',
    rowBg: 'bg-result-blocked/[0.09]',
    active: 'border-result-blocked/80 bg-result-blocked/10 text-result-blocked font-bold',
    shortcut: 'B',
  },
  untested: {
    label: '미실행',
    text: 'text-white/45',
    rowBg: '',
    active: 'border-white/50 bg-white/5 text-white/90 font-bold',
    shortcut: 'U',
  },
};

/** 결과 버튼·일괄 변경 순서 */
export const RESULT_ORDER: TestCaseRunStatus[] = ['pass', 'fail', 'blocked', 'untested'];

export const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  SUITE: {
    label: '\uC2A4\uC704\uD2B8',
    icon: React.createElement(ListTodo, { className: 'h-4 w-4' }),
  },
  MILESTONE: {
    label: '\uB9C8\uC77C\uC2A4\uD1A4',
    icon: React.createElement(Clock, { className: 'h-4 w-4' }),
  },
  ADHOC: {
    label: '\uC9C1\uC811 \uC120\uD0DD',
    icon: React.createElement(PlayCircle, { className: 'h-4 w-4' }),
  },
};
