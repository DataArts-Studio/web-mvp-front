'use client';

import { useMemo, useState } from 'react';

/**
 * 게시판/Posts 샌드박스 (테스트 대상).
 *
 * - 검색: 제목 부분 일치 필터. 결과 수 갱신.
 * - 카테고리 필터: 전체 / 공지 / 질문 / 자유.
 * - 페이지네이션: 페이지당 5개, 이전/다음, "현재/전체" 표시.
 * - 글 작성: 제목+카테고리 입력 후 작성 → 목록 맨 위에 추가.
 * - 검색·필터·작성이 페이지네이션과 함께 동작.
 */

type Category = '공지' | '질문' | '자유';
interface Post {
  id: number;
  title: string;
  category: Category;
  author: string;
}

const CATEGORIES: Category[] = ['공지', '질문', '자유'];
const PER_PAGE = 5;

const SEED: Post[] = [
  '서비스 점검 안내',
  'Playwright 설치 오류 질문',
  '테스트 자동화 스터디 모집',
  '로그인 안 되는 버그 제보',
  'API 키 발급 방법',
  '주간 회고 공유',
  '셀렉터 전략 토론',
  'CI 파이프라인 느림 질문',
  '신규 기능 베타 신청',
  '결제 테스트 카드 번호',
  '모바일 반응형 깨짐 제보',
  '리포트 내보내기 요청',
].map((title, i) => ({
  id: 100 - i,
  title,
  category: CATEGORIES[i % 3],
  author: `user${(i % 5) + 1}`,
}));

let seq = 200;

export const PostBoardSandbox = () => {
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<'전체' | Category>('전체');
  const [page, setPage] = useState(1);
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState<Category>('질문');

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (cat === '전체' || p.category === cat) &&
          p.title.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [posts, search, cat]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const reset = () => setPage(1);

  const create = () => {
    const title = newTitle.trim();
    if (!title) return;
    setPosts((ps) => [{ id: (seq += 1), title, category: newCat, author: 'me' }, ...ps]);
    setNewTitle('');
    setCat('전체');
    setSearch('');
    setPage(1);
  };

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm outline-none';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-2xl rounded-2xl border p-8">
        <h1 className="mb-5 text-xl font-bold">게시판</h1>

        {/* 글 작성 */}
        <div className="border-line-2 bg-bg-1 mb-5 flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <input
            data-testid="post-title-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="새 글 제목"
            className={`min-w-0 flex-1 ${fieldClass}`}
          />
          <select
            data-testid="post-category"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value as Category)}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-bg-2">
                {c}
              </option>
            ))}
          </select>
          <button
            data-testid="post-submit"
            type="button"
            onClick={create}
            className="bg-primary rounded-button h-button-md hover:bg-primary/90 px-4 text-sm font-medium text-white transition-colors"
          >
            작성
          </button>
        </div>

        {/* 검색·필터 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            data-testid="post-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              reset();
            }}
            placeholder="제목 검색"
            className={`min-w-0 flex-1 ${fieldClass}`}
          />
          <select
            data-testid="category-filter"
            value={cat}
            onChange={(e) => {
              setCat(e.target.value as '전체' | Category);
              reset();
            }}
            className={fieldClass}
          >
            {['전체', ...CATEGORIES].map((c) => (
              <option key={c} value={c} className="bg-bg-2">
                {c}
              </option>
            ))}
          </select>
        </div>

        <p data-testid="result-count" className="text-text-3 mb-2 text-xs">
          총 {filtered.length}개
        </p>

        <ul className="border-line-2 divide-line-2 mb-4 divide-y rounded-xl border">
          {pageItems.map((p) => (
            <li
              key={p.id}
              data-testid="post-item"
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="bg-bg-3 text-text-3 shrink-0 rounded-full px-2 py-0.5 text-xs">
                  {p.category}
                </span>
                <span data-testid="post-title" className="truncate text-sm">
                  {p.title}
                </span>
              </span>
              <span className="text-text-3 shrink-0 text-xs">{p.author}</span>
            </li>
          ))}
          {pageItems.length === 0 && (
            <li data-testid="empty-state" className="text-text-3 px-4 py-8 text-center text-sm">
              검색 결과가 없습니다.
            </li>
          )}
        </ul>

        <div className="flex items-center justify-center gap-3">
          <button
            data-testid="page-prev"
            type="button"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="border-line-3 rounded-button h-9 border px-3 text-sm transition-colors disabled:opacity-30"
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
            onClick={() => setPage(current + 1)}
            className="border-line-3 rounded-button h-9 border px-3 text-sm transition-colors disabled:opacity-30"
          >
            다음
          </button>
        </div>
      </div>
    </main>
  );
};
