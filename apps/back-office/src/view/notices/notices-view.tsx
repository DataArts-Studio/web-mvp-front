'use client';

import { useMemo, useState, useTransition } from 'react';

import Link from 'next/link';

import { deleteNoticeAction, toggleNoticeAction } from '@/features/notices/api/actions';
import { Select } from '@/shared/ui';
import type { AdminAnnouncement, AnnouncementStatus } from '@testea/db';
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from 'lucide-react';

// 라이트 테마 Select 오버라이드(디자인 시스템 v4 후행 important).
const selectTrigger =
  'border-border! bg-white! text-text-primary! hover:border-[#155DFC]! focus-visible:outline-[#155DFC]! data-[state=open]:border-[#155DFC]! data-[state=open]:outline-[#155DFC]! [&>svg]:text-text-secondary!';
const selectContent = 'border-border! bg-white! text-text-primary!';
const selectItem =
  'text-text-primary! data-[highlighted]:bg-[#155DFC]/10! data-[highlighted]:text-text-primary! data-[state=checked]:text-[#155DFC]!';
const selectValue = 'text-text-primary! data-[state=empty]:text-text-secondary!';

type DerivedType = '배너' | '팝업' | '점검' | '공지';

/** announcements 필드 조합으로 디자인의 '타입'을 파생한다(단일 type 컬럼 부재). */
function deriveType(n: AdminAnnouncement): DerivedType {
  if (n.showAsPopup) return '팝업';
  if (n.category === 'maintenance') return '점검';
  if (n.severity === 'critical') return '배너';
  return '공지';
}

const SEVERITY_BADGE: Record<AdminAnnouncement['severity'], { label: string; cls: string }> = {
  critical: { label: '긴급', cls: 'bg-red-100 text-red-700' },
  warning: { label: '주의', cls: 'bg-orange-100 text-orange-700' },
  info: { label: '안내', cls: 'bg-blue-100 text-blue-700' },
};

const STATUS_BADGE: Record<AnnouncementStatus, { label: string; cls: string }> = {
  active: { label: '활성', cls: 'bg-green-100 text-green-700' },
  scheduled: { label: '예약', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: '비활성', cls: 'bg-gray-100 text-gray-500' },
};

const PAGE_SIZE = 8;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hour = d.getHours();
  const ampm = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${String(h12).padStart(2, '0')}:${mm}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function ToggleSwitch({
  on,
  disabled,
  onToggle,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? 'bg-[#2563eb]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function NoticeRow({ item }: { item: AdminAnnouncement }) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isActive = item.status === 'active';
  const severity = SEVERITY_BADGE[item.severity];
  const status = STATUS_BADGE[item.status];

  return (
    <tr className="border-border border-b last:border-0">
      <td className="px-4 py-4">
        <span className="text-text-primary font-medium">{item.title}</span>
      </td>
      <td className="text-text-secondary px-4 py-4 text-sm">{deriveType(item)}</td>
      <td className="px-4 py-4">
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${severity.cls}`}>
          {severity.label}
        </span>
      </td>
      <td className="text-text-secondary px-4 py-4 text-sm">전체</td>
      <td className="px-4 py-4">
        <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${status.cls}`}>
          {status.label}
        </span>
      </td>
      <td className="text-text-secondary px-4 py-4 text-sm whitespace-nowrap">
        {formatDateTime(item.publishedAt)}
        {item.expiresAt ? (
          <>
            <br />~ {formatDateTime(item.expiresAt)}
          </>
        ) : null}
      </td>
      <td className="text-text-secondary px-4 py-4 text-sm whitespace-nowrap">
        {formatDate(item.createdAt)}
      </td>
      <td className="px-4 py-4">
        <ToggleSwitch
          on={isActive}
          disabled={pending}
          label={isActive ? '비활성화' : '활성화'}
          onToggle={() => startTransition(() => toggleNoticeAction(item.id, !isActive))}
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          <Link
            href={`/notices/${item.id}/edit`}
            aria-label="편집"
            className="text-text-secondary flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 hover:text-[#155DFC]"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {confirmingDelete ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteNoticeAction(item.id))}
              className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              삭제 확인
            </button>
          ) : (
            <button
              type="button"
              aria-label="삭제"
              onClick={() => setConfirmingDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function NoticesView({ items }: { items: AdminAnnouncement[] }) {
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((n) => {
      if (kw && !`${n.title} ${n.body}`.toLowerCase().includes(kw)) return false;
      if (typeFilter !== 'all' && deriveType(n) !== typeFilter) return false;
      if (severityFilter !== 'all' && n.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, typeFilter, severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col">
      <header className="border-border border-b bg-white px-8 py-6">
        <h1 className="text-text-primary text-2xl font-bold">공지 및 배너 관리</h1>
        <p className="text-text-secondary mt-1 text-sm">
          사용자에게 노출되는 배너, 팝업, 점검 안내를 관리합니다
        </p>
      </header>

      <div className="flex flex-col gap-5 px-8 py-6">
        {/* 툴바: 메인터넌스 모드(준비 중) + 신규 공지 */}
        <div className="flex items-center justify-between rounded-lg bg-[#eff6ff] px-5 py-3">
          <div className="text-text-secondary flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-5 w-5 text-[#155DFC]" />
            <span>메인터넌스 모드</span>
            <ToggleSwitch
              on={false}
              disabled
              label="메인터넌스 모드 (준비 중)"
              onToggle={() => {}}
            />
            <span className="text-text-secondary text-xs">준비 중</span>
          </div>
          <Link
            href="/notices/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" />
            신규 공지
          </Link>
        </div>

        {/* 필터: 검색 + 타입/심각도/상태 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-text-secondary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              value={keyword}
              onChange={(e) => resetPage(setKeyword)(e.target.value)}
              placeholder="제목 또는 본문 검색..."
              className="border-border text-text-primary placeholder:text-text-secondary w-full rounded-lg border bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#155DFC]"
            />
          </div>
          <FilterSelect
            label="타입"
            value={typeFilter}
            onChange={resetPage(setTypeFilter)}
            options={[
              { value: 'all', label: '전체' },
              { value: '배너', label: '배너' },
              { value: '팝업', label: '팝업' },
              { value: '점검', label: '점검' },
              { value: '공지', label: '공지' },
            ]}
          />
          <FilterSelect
            label="심각도"
            value={severityFilter}
            onChange={resetPage(setSeverityFilter)}
            options={[
              { value: 'all', label: '전체' },
              { value: 'critical', label: '긴급' },
              { value: 'warning', label: '주의' },
              { value: 'info', label: '안내' },
            ]}
          />
          <FilterSelect
            label="상태"
            value={statusFilter}
            onChange={resetPage(setStatusFilter)}
            options={[
              { value: 'all', label: '전체' },
              { value: 'active', label: '활성' },
              { value: 'scheduled', label: '예약' },
              { value: 'expired', label: '비활성' },
            ]}
          />
        </div>

        {/* 테이블 */}
        <div className="border-border overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[900px] text-left">
            <caption className="sr-only">운영 공지 목록</caption>
            <thead className="border-border text-text-secondary border-b bg-[#f9fafb] text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">제목</th>
                <th className="px-4 py-3 font-semibold">타입</th>
                <th className="px-4 py-3 font-semibold">심각도</th>
                <th className="px-4 py-3 font-semibold">대상</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">기간</th>
                <th className="px-4 py-3 font-semibold">생성일</th>
                <th className="px-4 py-3 font-semibold">활성</th>
                <th className="px-4 py-3 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <NoticeRow key={item.id} item={item} />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-text-secondary px-4 py-16 text-center text-sm">
                    조건에 맞는 공지가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-text-secondary flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40"
              aria-label="이전 페이지"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                  p === currentPage
                    ? 'bg-[#2563eb] text-white'
                    : 'text-text-secondary hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-text-secondary flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40"
              aria-label="다음 페이지"
            >
              ›
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="w-full sm:w-40">
      <Select.Root value={value} onValueChange={onChange} size="md">
        <Select.Trigger aria-label={`${label} 필터`} className={selectTrigger}>
          <Select.Value placeholder="전체" className={selectValue}>
            {selected?.label}
          </Select.Value>
        </Select.Trigger>
        <Select.Content className={selectContent}>
          {options.map((o) => (
            <Select.Item key={o.value} value={o.value} className={selectItem}>
              {o.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </div>
  );
}
