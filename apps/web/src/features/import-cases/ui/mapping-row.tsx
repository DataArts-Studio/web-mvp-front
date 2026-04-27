'use client';

import { cn } from '@/shared/utils';
import type { ColumnMapping } from '../model/schema';

interface MappingRowProps {
  field: {
    key: keyof ColumnMapping;
    label: string;
    required: boolean;
  };
  value: string;
  options: Array<{ value: string; label: string }>;
  sampleRows: Record<string, string>[];
  onChange: (value: string) => void;
}

export function MappingRow({
  field,
  value,
  options,
  sampleRows,
  onChange,
}: MappingRowProps) {
  const samples = value
    ? sampleRows.map((row) => row[value] ?? '').filter(Boolean)
    : [];

  return (
    <div className="border-line-2 flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 md:grid md:grid-cols-12 md:items-center md:gap-4">
      {/* Testea Field */}
      <div className="flex items-center gap-2 md:col-span-3">
        <span className="typo-caption1 md:typo-body2-normal text-text-1">
          {field.label}
        </span>
        {field.required && (
          <span className="text-xs text-red-400">*</span>
        )}
      </div>

      {/* Arrow - desktop only */}
      <div className="col-span-1 hidden justify-center md:flex">
        <span className="text-text-3">←</span>
      </div>

      {/* Source Column Dropdown */}
      <div className="md:col-span-3">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'rounded-2 border-line-2 bg-bg-2 text-text-1 typo-body2-normal w-full border px-3 py-2',
            !value && 'text-text-3',
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Data - hidden on mobile when no value mapped */}
      {samples.length > 0 && (
        <div className="flex flex-col gap-0.5 md:col-span-5">
          {samples.map((sample, i) => (
            <p
              key={i}
              className="typo-caption1 text-text-3 truncate"
              title={sample}
            >
              {sample}
            </p>
          ))}
        </div>
      )}
      {samples.length === 0 && (
        <div className="hidden md:col-span-5 md:block">
          <p className="typo-caption1 text-text-3">—</p>
        </div>
      )}
    </div>
  );
}
