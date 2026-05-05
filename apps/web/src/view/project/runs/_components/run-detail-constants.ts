import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  ListTodo,
  Clock,
  PlayCircle,
} from 'lucide-react';

import { type TestCaseRunDetail } from '@/features/runs';

export type StatusFilter = 'all' | 'untested' | 'pass' | 'fail' | 'blocked';
export type TestCaseRunStatus = 'untested' | 'pass' | 'fail' | 'blocked';

export interface GroupedCases {
  groupKey: string;
  suiteId: string | null;
  suiteName: string;
  cases: TestCaseRunDetail[];
}

export const STATUS_CONFIG: Record<TestCaseRunStatus, {
  label: string;
  style: string;
  bgStyle: string;
  icon: React.ReactNode;
  shortcut: string;
}> = {
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

export const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  SUITE: { label: '\uC2A4\uC704\uD2B8', icon: React.createElement(ListTodo, { className: 'h-4 w-4' }) },
  MILESTONE: { label: '\uB9C8\uC77C\uC2A4\uD1A4', icon: React.createElement(Clock, { className: 'h-4 w-4' }) },
  ADHOC: { label: '\uC9C1\uC811 \uC120\uD0DD', icon: React.createElement(PlayCircle, { className: 'h-4 w-4' }) },
};
