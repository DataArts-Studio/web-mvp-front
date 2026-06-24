'use client';

import { useMemo, useState } from 'react';

interface Row {
  id: number;
  name: string;
  role: string;
}

const DATA: Row[] = [
  { id: 1, name: 'Alice Kim', role: 'QA Engineer' },
  { id: 2, name: 'Bob Lee', role: 'Developer' },
  { id: 3, name: 'Charlie Park', role: 'Designer' },
  { id: 4, name: 'Diana Choi', role: 'QA Lead' },
  { id: 5, name: 'Ethan Jung', role: 'Developer' },
  { id: 6, name: 'Fiona Han', role: 'PM' },
  { id: 7, name: 'George Yoon', role: 'QA Engineer' },
  { id: 8, name: 'Hana Seo', role: 'Designer' },
  { id: 9, name: 'Ian Cho', role: 'Developer' },
  { id: 10, name: 'Jane Lim', role: 'QA Engineer' },
  { id: 11, name: 'Kevin Oh', role: 'Developer' },
  { id: 12, name: 'Lucy Shin', role: 'PM' },
];

const PAGE_SIZE = 5;

/**
 * 데이터 테이블 샌드박스 (테스트 대상).
 * - 이름 검색, 이름 컬럼 정렬(asc/desc 토글), 페이지네이션(5개씩).
 */
export const DataTableSandbox = () => {
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q ? DATA.filter((r) => r.name.toLowerCase().includes(q)) : DATA.slice();
    rows.sort((a, b) => (sortAsc ? 1 : -1) * a.name.localeCompare(b.name));
    return rows;
  }, [search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-2xl rounded-2xl border p-6 sm:p-8">
        <h1 className="mb-5 text-xl font-bold">사용자 목록</h1>

        <input
          data-testid="table-search"
          type="text"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="이름 검색"
          className="border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md mb-4 w-full border px-3 text-sm transition-colors outline-none"
        />

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line-2 text-text-3 border-b text-xs">
              <th className="py-2 pr-4">
                <button
                  data-testid="sort-name"
                  type="button"
                  onClick={() => setSortAsc((v) => !v)}
                  className="hover:text-text-1 inline-flex items-center gap-1 transition-colors"
                >
                  이름 {sortAsc ? '▲' : '▼'}
                </button>
              </th>
              <th className="py-2">역할</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr
                key={r.id}
                data-testid="table-row"
                className="border-line-2 border-b last:border-b-0"
              >
                <td className="text-text-1 py-3 pr-4">{r.name}</td>
                <td className="text-text-2 py-3">{r.role}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={2} className="text-text-3 py-6 text-center text-sm">
                  결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-5 flex items-center justify-between">
          <button
            data-testid="page-prev"
            type="button"
            disabled={current <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-line-3 rounded-button text-text-1 hover:bg-bg-3 h-9 border px-4 text-sm transition-colors disabled:opacity-40"
          >
            이전
          </button>
          <span data-testid="page-indicator" className="text-text-2 text-sm">
            {current} / {totalPages}
          </span>
          <button
            data-testid="page-next"
            type="button"
            disabled={current >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border-line-3 rounded-button text-text-1 hover:bg-bg-3 h-9 border px-4 text-sm transition-colors disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </main>
  );
};
