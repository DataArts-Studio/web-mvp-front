'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { Select } from '@testea/ui';
import { cn } from '@testea/util';
import { ChevronDown } from 'lucide-react';

const splitDateOnly = (value: string | null | undefined) => {
  const [y, m, d] = (value ?? '').split('-');
  if (!y || !m || !d) return { y: '', m: '', d: '' };
  return { y: String(Number(y)), m: String(Number(m)), d: String(Number(d)) };
};

const pad = (n: string) => n.padStart(2, '0');

interface DateDropdownSelectProps {
  /** 'YYYY-MM-DD' */
  value: string | null | undefined;
  onChange: (date: string | null) => void;
  disabled?: boolean;
  /** 연·월·일 콤보박스 이름 앞에 붙는 필드 이름 (예: 시작일) */
  label: string;
}

export const DateDropdownSelect = ({
  value,
  onChange,
  disabled,
  label,
}: DateDropdownSelectProps) => {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const [year, setYear] = useState<string>(splitDateOnly(value).y);
  const [month, setMonth] = useState<string>(splitDateOnly(value).m);
  const [day, setDay] = useState<string>(splitDateOnly(value).d);

  useEffect(() => {
    const next = splitDateOnly(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing controlled prop with internal state
    setYear(next.y);
    setMonth(next.m);
    setDay(next.d);
  }, [value]);

  const years = useMemo(
    () => Array.from({ length: 7 }, (_, i) => (currentYear - 1 + i).toString()),
    [currentYear]
  );

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), []);

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  }, [year, month]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
    [daysInMonth]
  );

  // 고른 연·월·일을 그대로 'YYYY-MM-DD' 로 만든다. Date 를 거치지 않아 시간대 영향이 없다 (#381).
  const buildDate = (y: string, m: string, d: string): string | null => {
    if (!y || !m || !d) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  };

  const handleYearChange = (y: string) => {
    setYear(y);
    const maxDay = month ? new Date(Number(y), Number(month), 0).getDate() : 31;
    const adjustedDay = day ? Math.min(Number(day), maxDay).toString() : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    onChange(buildDate(y, month, adjustedDay));
  };

  const handleMonthChange = (m: string) => {
    setMonth(m);
    const y = year || currentYear.toString();
    if (!year) setYear(y);
    const maxDay = new Date(Number(y), Number(m), 0).getDate();
    const adjustedDay = day ? Math.min(Number(day), maxDay).toString() : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    onChange(buildDate(y, m, adjustedDay));
  };

  const handleDayChange = (d: string) => {
    setDay(d);
    const y = year || currentYear.toString();
    if (!year) setYear(y);
    onChange(buildDate(y, month, d));
  };

  const triggerClass = cn(
    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
    'border-line-2 bg-bg-1 text-text-1',
    'hover:border-primary/50',
    'data-[state=open]:border-primary',
    disabled && 'cursor-not-allowed opacity-50'
  );

  const contentClass = cn(
    'absolute top-full left-0 z-50 mt-1 max-h-[200px] w-full overflow-y-auto',
    'rounded-lg border border-line-2 bg-bg-1 shadow-lg'
  );

  const itemClass = cn(
    'cursor-pointer px-3 py-1.5 text-sm text-text-1 transition-colors',
    'hover:bg-bg-3 data-[state=checked]:text-primary data-[state=checked]:font-medium',
    'data-[highlighted]:bg-bg-3'
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select.Root
        value={year}
        onValueChange={handleYearChange}
        disabled={disabled}
        className="relative"
      >
        <Select.Trigger className={triggerClass} aria-label={`${label} 연도`}>
          <span className={cn(!year && 'text-text-3')}>{year ? `${year}년` : '년도'}</span>
          <ChevronDown className="text-text-3 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Select.Trigger>
        <Select.Content className={contentClass}>
          {years.map((y) => (
            <Select.Item key={y} value={y} className={itemClass}>
              {y}년
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={month}
        onValueChange={handleMonthChange}
        disabled={disabled}
        className="relative"
      >
        <Select.Trigger className={triggerClass} aria-label={`${label} 월`}>
          <span className={cn(!month && 'text-text-3')}>{month ? `${month}월` : '월'}</span>
          <ChevronDown className="text-text-3 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Select.Trigger>
        <Select.Content className={contentClass}>
          {months.map((m) => (
            <Select.Item key={m} value={m} className={itemClass}>
              {m}월
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={day}
        onValueChange={handleDayChange}
        disabled={disabled}
        className="relative"
      >
        <Select.Trigger className={triggerClass} aria-label={`${label} 일`}>
          <span className={cn(!day && 'text-text-3')}>{day ? `${day}일` : '일'}</span>
          <ChevronDown className="text-text-3 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Select.Trigger>
        <Select.Content className={contentClass}>
          {days.map((d) => (
            <Select.Item key={d} value={d} className={itemClass}>
              {d}일
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </div>
  );
};
